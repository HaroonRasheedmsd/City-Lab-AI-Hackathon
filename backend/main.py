"""FastAPI REST application exposing the deterministic clinical rules engine and explanation layer."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from backend.classify.engine import classify_test
from backend.ingestion.loader import get_corpus_db
from backend.ingestion.parser import parse_patient_report
from backend.llm.service import explanation_service
from backend.models.schemas import (
    ChatRequest,
    ChatResponse,
    DemographicData,
    DoctorQuestionsResponse,
    ExplanationResponse,
    PatientReportInput,
    PrivacyRefusal,
    QueryRequest,
    ReportSummary,
    TestResultInput,
)
from backend.privacy.guard import check_privacy_context_lock
from backend.report.summary import generate_report_summary

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("citylab-backend")

app = FastAPI(
    title="CityLab Diagnostics - Explainer & Classification Engine",
    description="Problem B Medical Lab Report Explainer backend rules engine and explanation layer.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database at startup
db = get_corpus_db()


@app.get("/api/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """Service health and database status endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "engine": "deterministic_rules_engine",
        "explanation_layer": "resilient_llm_with_fallback",
        "patients_loaded": len(db.patients),
        "reference_ranges_loaded": len(db.reference_ranges),
        "urgent_rules_loaded": len(db.urgent_thresholds),
    }


@app.get("/api/patients", tags=["Patients"])
def list_patients() -> List[Dict[str, Any]]:
    """List all ingested patients in the simulated clinical corpus."""
    result = []
    for pid, (demo, tests) in db.patients.items():
        result.append({
            "patient_id": pid,
            "patient_name": demo.patient_name,
            "recorded_age": demo.recorded_age,
            "biological_sex": demo.biological_sex,
            "mrn": demo.mrn,
            "test_count": len(tests),
            "source_file": db.patient_files.get(pid, ""),
        })
    return sorted(result, key=lambda x: x["patient_id"])


@app.get("/api/patients/{patient_id}", response_model=ReportSummary, tags=["Patients"])
def get_patient_report(patient_id: str) -> ReportSummary:
    """Retrieve summarized analysis for an ingested patient report."""
    norm_id = patient_id.strip().upper()
    if norm_id not in db.patients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found in corpus.",
        )

    demo, tests = db.patients[norm_id]
    classifications = [classify_test(t, patient=demo, db=db) for t in tests]
    return generate_report_summary(classifications, demographics=demo)


@app.get("/api/patients/{patient_id}/analysis", response_model=ReportSummary, tags=["Patients"])
def get_patient_analysis(patient_id: str) -> ReportSummary:
    """Retrieve full clinical evaluation and classification results for a patient."""
    return get_patient_report(patient_id)


@app.post("/api/analyze", response_model=ReportSummary, tags=["Classification"])
def analyze_report(payload: PatientReportInput) -> ReportSummary:
    """
    Classify a clinical report from structured JSON or raw report text.
    Handles missing or corrupted demographics gracefully.
    """
    tests_to_run: List[TestResultInput] = []
    demo = DemographicData(
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        recorded_age=int(payload.age) if payload.age and str(payload.age).isdigit() else None,
        biological_sex=payload.biological_sex,
        mrn=payload.mrn,
        date_of_issuance=payload.date_of_issuance,
    )

    if payload.raw_text:
        parsed_demo, parsed_tests = parse_patient_report(payload.raw_text)
        if not demo.patient_name:
            demo.patient_name = parsed_demo.patient_name
        if demo.recorded_age is None:
            demo.recorded_age = parsed_demo.recorded_age
        if not demo.biological_sex:
            demo.biological_sex = parsed_demo.biological_sex
        if not demo.mrn:
            demo.mrn = parsed_demo.mrn
        if not demo.patient_id:
            demo.patient_id = parsed_demo.patient_id
        tests_to_run.extend(parsed_tests)

    if payload.results:
        tests_to_run.extend(payload.results)

    if not tests_to_run:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No test results found in input payload or raw text.",
        )

    classifications = [classify_test(t, patient=demo, db=db) for t in tests_to_run]
    return generate_report_summary(classifications, demographics=demo)


@app.post("/api/query", tags=["Privacy"])
def query_patient_data(req: QueryRequest) -> Dict[str, Any]:
    """
    Enforce patient context-lock privacy guard before answering questions.
    Rejects inquiries regarding other patients per Directive 1.
    """
    norm_id = req.patient_id.strip().upper()
    if norm_id not in db.patients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{req.patient_id}' not found.",
        )

    demo, _ = db.patients[norm_id]
    allowed, refusal = check_privacy_context_lock(
        query_text=req.query,
        active_patient_id=norm_id,
        active_patient_name=demo.patient_name,
    )

    if not allowed and refusal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=refusal.model_dump(),
        )

    return {
        "status": "authorized",
        "active_patient_id": norm_id,
        "active_patient_name": demo.patient_name,
        "query": req.query,
    }


# =====================================================================
# LLM Explanation Layer Endpoints
# =====================================================================

@app.post("/api/patients/{patient_id}/explain", response_model=ExplanationResponse, tags=["Explanation"])
def explain_patient_report(patient_id: str) -> ExplanationResponse:
    """
    Generate plain-language class-8 explanations for computed test results.
    Never diagnoses; gracefully degrades to templates if LLM providers fail.
    """
    norm_id = patient_id.strip().upper()
    if norm_id not in db.patients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found.",
        )

    demo, tests = db.patients[norm_id]
    classifications = [classify_test(t, patient=demo, db=db) for t in tests]
    return explanation_service.explain_patient_results(norm_id, classifications, demo)


@app.post("/api/patients/{patient_id}/doctor-questions", response_model=DoctorQuestionsResponse, tags=["Explanation"])
def get_doctor_questions(patient_id: str) -> DoctorQuestionsResponse:
    """
    Generate 3 to 5 targeted questions for the physician based on non-normal results.
    Includes urgent warning if any critical limits are breached.
    """
    norm_id = patient_id.strip().upper()
    if norm_id not in db.patients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found.",
        )

    demo, tests = db.patients[norm_id]
    classifications = [classify_test(t, patient=demo, db=db) for t in tests]
    return explanation_service.generate_doctor_questions(norm_id, classifications, demo)


@app.post("/api/patients/{patient_id}/chat", response_model=ChatResponse, tags=["Explanation"])
def chat_patient_endpoint(patient_id: str, req: ChatRequest) -> ChatResponse:
    """
    Patient-locked conversational Q&A endpoint.
    Protected by code-based prompt injection sanitizer and intent router.
    """
    norm_id = patient_id.strip().upper()
    if norm_id not in db.patients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found.",
        )

    demo, tests = db.patients[norm_id]
    classifications = [classify_test(t, patient=demo, db=db) for t in tests]
    return explanation_service.chat_with_patient(norm_id, req.message, classifications, demo)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
