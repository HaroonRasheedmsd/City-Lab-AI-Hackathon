"""Domain models and schemas for CityLab Diagnostics Rules Engine."""

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
