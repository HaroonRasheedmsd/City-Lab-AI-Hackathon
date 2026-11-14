"""Report aggregation and summary generator."""

from typing import List, Optional
from backend.models.schemas import ClassificationResult, ClassificationStatus, DemographicData, ReportSummary


def generate_report_summary(
    results: List[ClassificationResult],
    demographics: Optional[DemographicData] = None,
) -> ReportSummary:
    """Aggregate individual test classification results into a clinical summary."""
    counts = {
        ClassificationStatus.NORMAL.value: 0,
        ClassificationStatus.LOW.value: 0,
        ClassificationStatus.HIGH.value: 0,
        ClassificationStatus.URGENT.value: 0,
        ClassificationStatus.CANNOT_BE_CLASSIFIED.value: 0,
        ClassificationStatus.NEEDS_INFO.value: 0,
    }

    abnormal: List[str] = []
    urgent: List[str] = []
    missing_info: List[str] = []
    severe_warning: Optional[str] = None

    for r in results:
        status_val = r.status.value if hasattr(r.status, "value") else str(r.status)
        counts[status_val] = counts.get(status_val, 0) + 1

        if r.status in [ClassificationStatus.LOW, ClassificationStatus.HIGH, ClassificationStatus.URGENT]:
            abnormal.append(f"{r.test_canonical} ({status_val})")

        if r.status == ClassificationStatus.URGENT:
            urgent.append(f"{r.test_canonical}: {r.value} {r.unit_reported or ''}".strip())
            severe_warning = "see a doctor today"

        if r.status == ClassificationStatus.NEEDS_INFO:
            missing_info.append(r.test_canonical)

    pid = demographics.patient_id if demographics else None
    pname = demographics.patient_name if demographics else None

    return ReportSummary(
        patient_id=pid,
        patient_name=pname,
        demographics=demographics,
        total_tests=len(results),
        counts_by_status=counts,
        abnormal_tests=abnormal,
        urgent_flags=urgent,
        missing_info_flags=missing_info,
        results=results,
        severe_warning=severe_warning,
    )
