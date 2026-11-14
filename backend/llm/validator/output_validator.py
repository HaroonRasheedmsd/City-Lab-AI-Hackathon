"""Output validator for mandatory post-processing of LLM responses."""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Type
from pydantic import BaseModel, ValidationError
from backend.models.schemas import TestExplanationItem
from backend.privacy.guard import KNOWN_PATIENT_NAMES

logger = logging.getLogger(__name__)

# Forbidden diagnostic phrases
DIAGNOSIS_FORBIDDEN_PATTERNS = [
    r"(?i)\byou\s+have\s+(?:diabetes|cancer|anemia|hepatitis|infection|disease|leukemia|cirrhosis|hypothyroidism|hyperthyroidism)\b",
    r"(?i)\byou\s+have\s+[a-z]+\s+disease\b",
    r"(?i)\byou\s+(?:are\s+suffering\s+from|suffer\s+from)\b",
    r"(?i)\bdiagnosed\s+with\b",
    r"(?i)\byou\s+definitely\s+have\b",
    r"(?i)\byour\s+diagnosis\s+is\b",
    r"(?i)\bthis\s+proves\s+you\s+have\b",
]

# Forbidden medication and dosage phrases
MEDICATION_FORBIDDEN_PATTERNS = [
    r"(?i)\b(?:take|prescribe|dosage|dose\s+of)\s+[0-9.]+\s*(?:mg|ml|tablets?|pills?|units?)\b",
    r"(?i)\b(?:you\s+should\s+take|start\s+taking)\s+(?:ibuprofen|aspirin|tylenol|insulin|metformin|antibiotics|statin)\b",
    r"(?i)\bprescribed\s+medication\b",
]


class ValidationResult:
    """Outcome of validating LLM output."""
    def __init__(self, is_valid: bool, reason: Optional[str] = None, parsed_data: Optional[Any] = None):
        self.is_valid = is_valid
        self.reason = reason
        self.parsed_data = parsed_data


def check_forbidden_medical_language(text: str) -> Optional[str]:
    """Check text for disallowed diagnosis or prescription language."""
    for pattern in DIAGNOSIS_FORBIDDEN_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return f"Contains forbidden diagnosis phrase: '{match.group(0)}'"

    for pattern in MEDICATION_FORBIDDEN_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return f"Contains forbidden medication/dosage advice: '{match.group(0)}'"

    return None


def check_cross_patient_leakage(text: str, active_patient_id: str) -> Optional[str]:
    """Ensure output never contains references to other patient IDs or names."""
    norm_active = active_patient_id.strip().upper()

    # Check for other patient IDs
    id_matches = re.findall(r"\b(?:CLD-)?(P\d{3})(?:-\d+)?\b", text, re.IGNORECASE)
    for m in id_matches:
        if m.upper() != norm_active:
            return f"Contains reference to other patient ID '{m.upper()}'"

    # Check for other patient names
    for pid, name in KNOWN_PATIENT_NAMES.items():
        if pid == norm_active:
            continue
        if name.lower() in text.lower():
            return f"Contains reference to other patient name '{name}'"

    return None


def check_reading_level(text: str, max_words_per_sentence: int = 35) -> Optional[str]:
    """Ensure sentences are not overly convoluted."""
    # Split sentences by punctuation
    sentences = re.split(r"[.!?]+", text)
    for s in sentences:
        words = s.strip().split()
        if len(words) > max_words_per_sentence:
            return f"Sentence exceeds class-8 readability limit ({len(words)} words): '{s[:50]}...'"
    return None


def validate_explanation_json(
    raw_output: str,
    active_patient_id: str,
    allowed_numbers: Optional[Set[str]] = None,
) -> ValidationResult:
    """Validate and enforce Pydantic schema for test explanations."""
    # Clean possible markdown fences
    cleaned = raw_output.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    # 1. Check forbidden medical & privacy language
    forb_err = check_forbidden_medical_language(cleaned)
    if forb_err:
        return ValidationResult(is_valid=False, reason=forb_err)

    priv_err = check_cross_patient_leakage(cleaned, active_patient_id)
    if priv_err:
        return ValidationResult(is_valid=False, reason=priv_err)

    read_err = check_reading_level(cleaned)
    if read_err:
        logger.warning("Readability warning in explanation: %s", read_err)

    # 2. JSON parse
    try:
        data = json.loads(cleaned)
    except Exception as err:
        return ValidationResult(is_valid=False, reason=f"Invalid JSON syntax: {err}")

    if not isinstance(data, list):
        return ValidationResult(is_valid=False, reason="Expected JSON array of test explanations")

    # 3. Pydantic validation
    parsed_items: List[TestExplanationItem] = []
    for idx, item in enumerate(data):
        try:
            parsed_items.append(TestExplanationItem(**item))
        except ValidationError as err:
            return ValidationResult(is_valid=False, reason=f"Item {idx} schema validation error: {err}")

    return ValidationResult(is_valid=True, parsed_data=parsed_items)


def validate_doctor_questions_json(
    raw_output: str,
    active_patient_id: str,
) -> ValidationResult:
    """Validate and enforce schema for doctor questions."""
    cleaned = raw_output.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    forb_err = check_forbidden_medical_language(cleaned)
    if forb_err:
        return ValidationResult(is_valid=False, reason=forb_err)

    priv_err = check_cross_patient_leakage(cleaned, active_patient_id)
    if priv_err:
        return ValidationResult(is_valid=False, reason=priv_err)

    try:
        data = json.loads(cleaned)
    except Exception as err:
        return ValidationResult(is_valid=False, reason=f"Invalid JSON syntax: {err}")

    if not isinstance(data, dict) or "questions" not in data or not isinstance(data["questions"], list):
        return ValidationResult(is_valid=False, reason="Expected JSON object with 'questions' list")

    questions = [str(q).strip() for q in data["questions"] if str(q).strip()]
    if len(questions) < 1:
        return ValidationResult(is_valid=False, reason="Empty questions list")

    return ValidationResult(is_valid=True, parsed_data={
        "is_general": bool(data.get("is_general", False)),
        "questions": questions[:5]
    })


def validate_chat_response(
    raw_output: str,
    active_patient_id: str,
) -> ValidationResult:
    """Validate raw text chat response from LLM."""
    forb_err = check_forbidden_medical_language(raw_output)
    if forb_err:
        return ValidationResult(is_valid=False, reason=forb_err)

    priv_err = check_cross_patient_leakage(raw_output, active_patient_id)
    if priv_err:
        return ValidationResult(is_valid=False, reason=priv_err)

    return ValidationResult(is_valid=True, parsed_data=raw_output.strip())
