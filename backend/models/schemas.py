"""Domain models and schemas for CityLab Diagnostics Rules Engine and LLM Explanation Layer."""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ClassificationStatus(str, Enum):
    """Authoritative classification statuses."""
    NORMAL = "NORMAL"
    LOW = "LOW"
    HIGH = "HIGH"
    URGENT = "URGENT"
    CANNOT_BE_CLASSIFIED = "CANNOT BE CLASSIFIED FROM THE FILES"
    NEEDS_INFO = "NEEDS_INFO"


class DemographicData(BaseModel):
    """Patient demographics extracted from Section I."""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    recorded_age: Optional[int] = None
    biological_sex: Optional[str] = None
    mrn: Optional[str] = None
    date_of_issuance: Optional[str] = None
    raw_age_text: Optional[str] = None
    raw_sex_text: Optional[str] = None


class TestResultInput(BaseModel):
    """Raw test line from patient report or API input."""
    __test__ = False  # Prevent pytest from treating this model as a test suite
    test_name: str
    value: Union[float, int, str]
    unit: Optional[str] = None


class PatientReportInput(BaseModel):
    """Structured report payload for analysis."""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    age: Optional[Union[int, str]] = None
    biological_sex: Optional[str] = None
    mrn: Optional[str] = None
    date_of_issuance: Optional[str] = None
    results: List[TestResultInput] = Field(default_factory=list)
    raw_text: Optional[str] = None


class RangeUsed(BaseModel):
    """Metadata describing the reference interval used for evaluation."""
    low: Optional[float] = None
    high: Optional[float] = None
    unit: Optional[str] = None
    qualitative_normal: Optional[str] = None
    source_file: str
    row_ref: str
    age_bracket: str = "18-100 yrs"
    sex_bracket: str = "All"


class UrgentInfo(BaseModel):
    """Information regarding a triggered critical limit."""
    is_urgent: bool = True
    threshold_trigger: str
    threshold_value: float
    threshold_unit: str
    severe_warning: str = "see a doctor today"
    source_file: str = "3_dangerous_urgent_values.md"


class ClassificationResult(BaseModel):
    """Evaluation result for an individual lab test."""
    test_canonical: str
    test_as_reported: str
    value: Union[float, int, str]
    unit_reported: Optional[str] = None
    converted_value: Optional[Union[float, int, str]] = None
    converted_unit: Optional[str] = None
    conversion_steps: Optional[str] = None
    conversion_source: Optional[str] = None
    range_used: Optional[RangeUsed] = None
    status: ClassificationStatus
    reason_code: str
    boundary_note: Optional[str] = None
    urgent_info: Optional[UrgentInfo] = None
    source_refs: List[str] = Field(default_factory=list)
    missing_fields: Optional[List[str]] = None


class ReportSummary(BaseModel):
    """Aggregated analysis report for a patient encounter."""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    demographics: Optional[DemographicData] = None
    total_tests: int = 0
    counts_by_status: Dict[str, int] = Field(default_factory=dict)
    abnormal_tests: List[str] = Field(default_factory=list)
    urgent_flags: List[str] = Field(default_factory=list)
    missing_info_flags: List[str] = Field(default_factory=list)
    results: List[ClassificationResult] = Field(default_factory=list)
    severe_warning: Optional[str] = None


class PrivacyRefusal(BaseModel):
    """Context-lock refusal response required by Lab Safety Directive 1."""
    refusal: bool = True
    reason: str
    rule_quoted: str
    source_file: str = "1_lab_safety_rules.md"
    directive: str = "1. PRIVACY AND DATA PROTECTION"


class QueryRequest(BaseModel):
    """Session-bound query request."""
    patient_id: str
    query: str


# =====================================================================
# LLM Explanation Layer Schemas
# =====================================================================

class TestExplanationItem(BaseModel):
    """Plain-language explanation for an individual test."""
    test_canonical: str
    what_it_measures: str
    what_low_or_high_can_mean: str
    simple_summary: str


class ExplanationResponse(BaseModel):
    """Response payload for POST /api/patients/{id}/explain."""
    patient_id: str
    patient_name: Optional[str] = None
    provider_used: str
    cached: bool = False
    latency_ms: float = 0.0
    explanations: List[TestExplanationItem] = Field(default_factory=list)
    disclaimer: str = (
        "This explanation is for informational purposes only. It does not diagnose any disease. "
        "Only a licensed medical doctor can diagnose conditions."
    )


class DoctorQuestionsResponse(BaseModel):
    """Response payload for POST /api/patients/{id}/doctor-questions."""
    patient_id: str
    patient_name: Optional[str] = None
    provider_used: str
    cached: bool = False
    latency_ms: float = 0.0
    questions: List[str] = Field(default_factory=list)
    is_general: bool = False
    urgent_warning: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat input payload for POST /api/patients/{id}/chat."""
    message: str


class ChatResponse(BaseModel):
    """Chat response payload for POST /api/patients/{id}/chat."""
    patient_id: str
    intent: str
    response: str
    provider_used: str
    cached: bool = False
    latency_ms: float = 0.0
    safety_refusal: Optional[PrivacyRefusal] = None
