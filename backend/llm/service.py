"""Orchestration service coordinating cache, LLM fallback chain, validator, and templates."""

import logging
import time
from typing import Any, Dict, List, Optional
from backend.ingestion.loader import get_corpus_db
from backend.llm.cache import llm_cache
from backend.llm.client import LLMClient
from backend.llm.defense.intent import ChatIntent, classify_chat_intent
from backend.llm.defense.sanitizer import sanitize_input_text
from backend.llm.prompts import (
    CHAT_PROMPT_VERSION,
    DOCTOR_QUESTIONS_PROMPT_VERSION,
    EXPLANATION_PROMPT_VERSION,
    SYSTEM_PROMPT,
    build_chat_prompt,
    build_doctor_questions_prompt,
    build_explanation_prompt,
)
from backend.llm.templates.fallback_templates import (
    build_template_doctor_questions,
    build_template_explanation,
)
from backend.llm.validator.output_validator import (
    validate_chat_response,
    validate_doctor_questions_json,
    validate_explanation_json,
)
from backend.models.schemas import (
    ChatResponse,
    ClassificationResult,
    ClassificationStatus,
    DemographicData,
    DoctorQuestionsResponse,
    ExplanationResponse,
    TestExplanationItem,
)

logger = logging.getLogger(__name__)


class ExplanationService:
    """Service providing plain-language explanations with full resilience and guardrails."""

    def __init__(self, client: Optional[LLMClient] = None):
        self.client = client or LLMClient()
        self.db = get_corpus_db()

    def get_glossary_excerpts(self, results: List[ClassificationResult]) -> Dict[str, str]:
        """Extract glossary entries relevant to the active tests."""
        needed_names = {r.test_canonical for r in results}
        excerpts: Dict[str, str] = {}
        for alias, target in self.db.glossary.items():
            if target in needed_names or alias in needed_names:
                excerpts[alias] = target
        return excerpts

    def explain_patient_results(
        self,
        patient_id: str,
        results: List[ClassificationResult],
        demographics: Optional[DemographicData] = None,
    ) -> ExplanationResponse:
        """Generate structured per-test explanations using LLM with deterministic fallback."""
        start_t = time.time()
        pname = demographics.patient_name if demographics else None
        results_dump = [r.model_dump() for r in results]

        # 1. Check cache
        cache_key = llm_cache.compute_key(
            patient_id=patient_id,
            results_data=results_dump,
            prompt_version=EXPLANATION_PROMPT_VERSION,
            task="explain",
        )
        cached_val = llm_cache.get(cache_key)
        if cached_val:
            logger.info("Cache HIT for explain patient_id=%s", patient_id)
            items = [TestExplanationItem(**i) for i in cached_val.get("explanations", [])]
            return ExplanationResponse(
                patient_id=patient_id,
                patient_name=pname,
                provider_used=cached_val.get("provider_used", "cache"),
                cached=True,
                latency_ms=0.5,
                explanations=items,
            )

        # 2. Build prompt
        glossary_excerpts = self.get_glossary_excerpts(results)
        prompt = build_explanation_prompt(results_dump, glossary_excerpts)

        # 3. Call LLM with fallback chain
        provider, raw_text, latency = self.client.generate(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
            patient_id=patient_id,
        )

        explanations: Optional[List[TestExplanationItem]] = None

        # 4. Validate output
        if raw_text and provider != "fallback_template":
            val_res = validate_explanation_json(raw_text, active_patient_id=patient_id)
            if val_res.is_valid and isinstance(val_res.parsed_data, list):
                explanations = val_res.parsed_data
                logger.info("Output validator APPROVED explanation from provider=%s", provider)
            else:
                logger.warning(
                    "Output validator REJECTED explanation from provider=%s for patient_id=%s: %s",
                    provider,
                    patient_id,
                    val_res.reason,
                )
                # Attempt regeneration once if possible
                provider2, raw_text2, _ = self.client.generate(
                    system_prompt=SYSTEM_PROMPT,
                    user_prompt=prompt + f"\n\nCRITICAL FIX: Your previous response violated safety: {val_res.reason}. Fix it.",
                    patient_id=patient_id,
                )
                if raw_text2 and provider2 != "fallback_template":
                    val_res2 = validate_explanation_json(raw_text2, active_patient_id=patient_id)
                    if val_res2.is_valid and isinstance(val_res2.parsed_data, list):
                        explanations = val_res2.parsed_data
                        provider = provider2
                        logger.info("Output validator APPROVED regenerated explanation from provider=%s", provider2)

        # 5. Fallback template degradation if LLM failed or was rejected
        if not explanations:
            logger.info("Using deterministic fallback explanation template for patient_id=%s", patient_id)
            explanations = build_template_explanation(results)
            provider = "deterministic_template"

        total_latency = round((time.time() - start_t) * 1000, 2)
        resp_payload = {
            "patient_id": patient_id,
            "patient_name": pname,
            "provider_used": provider,
            "cached": False,
            "latency_ms": total_latency,
            "explanations": [e.model_dump() for e in explanations],
        }

        # Cache valid response
        llm_cache.set(cache_key, resp_payload)

        return ExplanationResponse(
            patient_id=patient_id,
            patient_name=pname,
            provider_used=provider,
            cached=False,
            latency_ms=total_latency,
            explanations=explanations,
        )

    def generate_doctor_questions(
        self,
        patient_id: str,
        results: List[ClassificationResult],
        demographics: Optional[DemographicData] = None,
    ) -> DoctorQuestionsResponse:
        """Generate targeted doctor questions focused on non-normal findings."""
        start_t = time.time()
        pname = demographics.patient_name if demographics else None
        results_dump = [r.model_dump() for r in results]

        # 1. Check cache
        cache_key = llm_cache.compute_key(
            patient_id=patient_id,
            results_data=results_dump,
            prompt_version=DOCTOR_QUESTIONS_PROMPT_VERSION,
            task="doctor_questions",
        )
        cached_val = llm_cache.get(cache_key)
        if cached_val:
            logger.info("Cache HIT for doctor_questions patient_id=%s", patient_id)
            return DoctorQuestionsResponse(
                patient_id=patient_id,
                patient_name=pname,
                provider_used=cached_val.get("provider_used", "cache"),
                cached=True,
                latency_ms=0.5,
                questions=cached_val.get("questions", []),
                is_general=cached_val.get("is_general", False),
                urgent_warning=cached_val.get("urgent_warning"),
            )

        # 2. Check for abnormal and urgent tests
        abnormals = [r for r in results if r.status in [ClassificationStatus.LOW, ClassificationStatus.HIGH, ClassificationStatus.URGENT]]
        urgents = [r for r in results if r.status == ClassificationStatus.URGENT]
        all_normal = len(abnormals) == 0
        urgent_warning = "see a doctor today" if urgents else None

        # 3. Build prompt
        prompt = build_doctor_questions_prompt(
            abnormal_tests=[r.model_dump() for r in abnormals],
            all_normal=all_normal,
            urgent_warning=urgent_warning,
        )

        # 4. Call LLM
        provider, raw_text, latency = self.client.generate(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
            patient_id=patient_id,
        )

        questions: Optional[List[str]] = None
        is_general_flag = all_normal

        # 5. Validate output
        if raw_text and provider != "fallback_template":
            val_res = validate_doctor_questions_json(raw_text, active_patient_id=patient_id)
            if val_res.is_valid and isinstance(val_res.parsed_data, dict):
                questions = val_res.parsed_data.get("questions", [])
                is_general_flag = val_res.parsed_data.get("is_general", all_normal)
                logger.info("Output validator APPROVED doctor questions from provider=%s", provider)
            else:
                logger.warning(
                    "Output validator REJECTED doctor questions from provider=%s for patient_id=%s: %s",
                    provider,
                    patient_id,
                    val_res.reason,
                )

        # 6. Fallback template if needed
        if not questions or len(questions) < 1:
            logger.info("Using deterministic fallback doctor questions for patient_id=%s", patient_id)
            questions = build_template_doctor_questions(results, severe_warning=urgent_warning)
            provider = "deterministic_template"

        total_latency = round((time.time() - start_t) * 1000, 2)
        resp_payload = {
            "patient_id": patient_id,
            "patient_name": pname,
            "provider_used": provider,
            "cached": False,
            "latency_ms": total_latency,
            "questions": questions,
            "is_general": is_general_flag,
            "urgent_warning": urgent_warning,
        }

        llm_cache.set(cache_key, resp_payload)

        return DoctorQuestionsResponse(
            patient_id=patient_id,
            patient_name=pname,
            provider_used=provider,
            cached=False,
            latency_ms=total_latency,
            questions=questions,
            is_general=is_general_flag,
            urgent_warning=urgent_warning,
        )

    def chat_with_patient(
        self,
        patient_id: str,
        user_message: str,
        results: List[ClassificationResult],
        demographics: Optional[DemographicData] = None,
    ) -> ChatResponse:
        """Handle patient-locked conversational Q&A with strict safety and intent classification."""
        start_t = time.time()
        pname = demographics.patient_name if demographics else None

        # 1. Sanitize user input (prompt-injection defense)
        sanitized_msg = sanitize_input_text(user_message)

        # 2. Intent routing & pre-filtering
        intent, refusal, routing_msg = classify_chat_intent(
            query_text=sanitized_msg,
            active_patient_id=patient_id,
            active_patient_name=pname,
        )

        if intent != ChatIntent.ALLOWED_QA:
            logger.info("Chat message routed to intent=%s for patient_id=%s", intent, patient_id)
            return ChatResponse(
                patient_id=patient_id,
                intent=intent.value,
                response=routing_msg or "Request could not be processed.",
                provider_used="safety_intent_router",
                cached=False,
                latency_ms=round((time.time() - start_t) * 1000, 2),
                safety_refusal=refusal,
            )

        if routing_msg:
            # Direct authoritative file-based answer (e.g. dangerous threshold queries)
            return ChatResponse(
                patient_id=patient_id,
                intent=ChatIntent.ALLOWED_QA.value,
                response=routing_msg,
                provider_used="deterministic_file_thresholds",
                cached=False,
                latency_ms=round((time.time() - start_t) * 1000, 2),
            )

        # 3. Check cache
        cache_key = llm_cache.compute_key(
            patient_id=patient_id,
            results_data={"query": sanitized_msg, "results": [r.model_dump() for r in results]},
            prompt_version=CHAT_PROMPT_VERSION,
            task="chat",
        )
        cached_val = llm_cache.get(cache_key)
        if cached_val:
            logger.info("Cache HIT for chat patient_id=%s", patient_id)
            return ChatResponse(
                patient_id=patient_id,
                intent=ChatIntent.ALLOWED_QA.value,
                response=cached_val.get("response", ""),
                provider_used=cached_val.get("provider_used", "cache"),
                cached=True,
                latency_ms=0.5,
            )

        # 4. Build prompt
        glossary_excerpts = self.get_glossary_excerpts(results)
        prompt = build_chat_prompt(
            patient_demographics=demographics.model_dump() if demographics else {},
            classification_results=[r.model_dump() for r in results],
            glossary_excerpts=glossary_excerpts,
            user_query=sanitized_msg,
        )

        # 5. Call LLM
        provider, raw_text, latency = self.client.generate(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
            patient_id=patient_id,
        )

        final_response: Optional[str] = None

        # 6. Validate output
        if raw_text and provider != "fallback_template":
            val_res = validate_chat_response(raw_text, active_patient_id=patient_id)
            if val_res.is_valid and isinstance(val_res.parsed_data, str):
                final_response = val_res.parsed_data
                logger.info("Output validator APPROVED chat response from provider=%s", provider)
            else:
                logger.warning(
                    "Output validator REJECTED chat response from provider=%s for patient_id=%s: %s",
                    provider,
                    patient_id,
                    val_res.reason,
                )

        # 7. Fallback template if needed
        if not final_response:
            logger.info("Using deterministic fallback chat response for patient_id=%s", patient_id)
            summary_lines = [
                f"Your {r.test_canonical} was recorded at {r.value} {r.unit_reported or ''} (Status: {r.status.value})."
                for r in results
            ]
            final_response = (
                f"Based on your report for {pname or patient_id}:\n"
                + "\n".join(summary_lines)
                + "\n\nPlease note that only your physician can diagnose medical conditions or suggest treatments."
            )
            provider = "deterministic_template"

        total_latency = round((time.time() - start_t) * 1000, 2)
        resp_payload = {
            "patient_id": patient_id,
            "response": final_response,
            "provider_used": provider,
        }
        llm_cache.set(cache_key, resp_payload)

        return ChatResponse(
            patient_id=patient_id,
            intent=ChatIntent.ALLOWED_QA.value,
            response=final_response,
            provider_used=provider,
            cached=False,
            latency_ms=total_latency,
        )


# Global singleton service
explanation_service = ExplanationService()
