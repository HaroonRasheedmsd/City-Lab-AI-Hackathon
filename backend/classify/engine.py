"""Deterministic classification engine implementing all CityLab clinical and safety rules."""

import logging
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from backend.ingestion.loader import CorpusDatabase, get_corpus_db
from backend.models.schemas import (
    ClassificationResult,
    ClassificationStatus,
    DemographicData,
    RangeUsed,
    TestResultInput,
    UrgentInfo,
)
from backend.normalize.names import resolve_test_name
from backend.normalize.units import convert_value_and_unit
from backend.ranges.selector import select_reference_range

logger = logging.getLogger(__name__)


def evaluate_urgent_threshold(
    analyte_canonical: str,
    numeric_value: float,
    unit: str,
    urgent_rules: List[Dict[str, Any]],
) -> Optional[UrgentInfo]:
    """Check whether a test value hits or passes dangerous urgent thresholds."""
    for rule in urgent_rules:
        r_analyte = rule.get("analyte")
        if r_analyte != analyte_canonical:
            continue
        trigger = rule.get("trigger", "").lower()
        threshold = float(rule.get("threshold", 0.0))
        t_unit = rule.get("unit", "")

        is_hit = False
        # "hit or pass these specific thresholds"
        if "less" in trigger:
            if numeric_value <= threshold:
                is_hit = True
        elif "greater" in trigger:
            if numeric_value >= threshold:
                is_hit = True

        if is_hit:
            return UrgentInfo(
                is_urgent=True,
                threshold_trigger=rule.get("trigger", ""),
                threshold_value=threshold,
                threshold_unit=t_unit,
                severe_warning="see a doctor today",
                source_file=rule.get("source_file", "3_dangerous_urgent_values.md"),
            )
    return None


def parse_inequality(val_str: str) -> Tuple[Optional[str], Optional[float]]:
    """Parse strings like '<0.5', '>200', '<= 7.0'."""
    m = re.match(r"^\s*([<>]=?)\s*([0-9.]+)\s*$", val_str)
    if m:
        return m.group(1), float(m.group(2))
    return None, None


def classify_test(
    test_input: TestResultInput,
    patient: Optional[DemographicData] = None,
    db: Optional[CorpusDatabase] = None,
) -> ClassificationResult:
    """
    Deterministically classify a single lab test for a patient.
    
    Order of operations:
    1. Name matching & alias resolution
    2. Unit parsing & conversion
    3. Reference range selection & demographic validation
    4. Urgent threshold evaluation
    5. Normal / Low / High evaluation with exact boundary rules
    """
    if db is None:
        db = get_corpus_db()

    raw_test_name = test_input.test_name
    raw_val = test_input.value
    raw_unit = test_input.unit

    patient_age = patient.recorded_age if patient else None
    patient_sex = patient.biological_sex if patient else None

    source_refs = []

    # -------------------------------------------------------------
    # 1. Name Match
    # -------------------------------------------------------------
    canonical_name, name_method = resolve_test_name(raw_test_name, extra_glossary=db.glossary)
    source_refs.append("2_medical_glossary.md")

    if not canonical_name or name_method == "UNMATCHED":
        return ClassificationResult(
            test_canonical=raw_test_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
            reason_code="UNRECOGNIZED_TEST_NAME",
            boundary_note="Test name could not be resolved from glossary or range sheets.",
            source_refs=source_refs + ["1_lab_safety_rules.md"],
        )

    # -------------------------------------------------------------
    # 2. Reference Range Selection & Demographic Verification
    # -------------------------------------------------------------
    range_ok, range_obj, range_status, missing_fields, range_msg = select_reference_range(
        canonical_name, patient_age, patient_sex, db.reference_ranges
    )

    if not range_ok:
        if range_status == ClassificationStatus.NEEDS_INFO:
            return ClassificationResult(
                test_canonical=canonical_name,
                test_as_reported=raw_test_name,
                value=raw_val,
                unit_reported=raw_unit,
                status=ClassificationStatus.NEEDS_INFO,
                reason_code="MISSING_DEMOGRAPHICS",
                boundary_note=range_msg,
                missing_fields=missing_fields,
                source_refs=source_refs + ["1_lab_safety_rules.md"],
            )
        else:
            return ClassificationResult(
                test_canonical=canonical_name,
                test_as_reported=raw_test_name,
                value=raw_val,
                unit_reported=raw_unit,
                status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
                reason_code="TEST_NOT_COVERED_IN_RANGES",
                boundary_note=range_msg,
                source_refs=source_refs + ["1_lab_safety_rules.md"],
            )

    assert range_obj is not None
    source_refs.append(range_obj.source_file)

    # -------------------------------------------------------------
    # 3. Unit Parsing & Conversion
    # -------------------------------------------------------------
    target_unit = range_obj.unit
    conv_ok, conv_val, final_unit, conv_steps, conv_source, conv_err = convert_value_and_unit(
        canonical_name, raw_val, raw_unit, target_unit=target_unit
    )

    if not conv_ok:
        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            range_used=range_obj,
            status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
            reason_code="UNSUPPORTED_UNIT",
            boundary_note=conv_err or "unit not covered by the range sheet",
            source_refs=source_refs + ["1_lab_safety_rules.md"],
        )

    # -------------------------------------------------------------
    # 4. Handle Non-Numeric or Inequality Values
    # -------------------------------------------------------------
    if isinstance(raw_val, str) and not isinstance(conv_val, (int, float)):
        val_clean = str(conv_val).strip()
        # Urinalysis qualitative protein
        if range_obj.qualitative_normal:
            if val_clean.lower() == range_obj.qualitative_normal.lower():
                return ClassificationResult(
                    test_canonical=canonical_name,
                    test_as_reported=raw_test_name,
                    value=raw_val,
                    unit_reported=raw_unit,
                    converted_value=conv_val,
                    converted_unit=final_unit,
                    range_used=range_obj,
                    status=ClassificationStatus.NORMAL,
                    reason_code="NORMAL_QUALITATIVE",
                    boundary_note=f"Result '{val_clean}' matches expected normal '{range_obj.qualitative_normal}'.",
                    source_refs=source_refs,
                )
            elif val_clean.lower() in ["positive", "trace", "1+", "2+", "3+", "4+"]:
                return ClassificationResult(
                    test_canonical=canonical_name,
                    test_as_reported=raw_test_name,
                    value=raw_val,
                    unit_reported=raw_unit,
                    converted_value=conv_val,
                    converted_unit=final_unit,
                    range_used=range_obj,
                    status=ClassificationStatus.HIGH,
                    reason_code="ABNORMAL_QUALITATIVE",
                    boundary_note=f"Result '{val_clean}' is abnormal (expected normal: '{range_obj.qualitative_normal}').",
                    source_refs=source_refs,
                )
            else:
                return ClassificationResult(
                    test_canonical=canonical_name,
                    test_as_reported=raw_test_name,
                    value=raw_val,
                    unit_reported=raw_unit,
                    range_used=range_obj,
                    status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
                    reason_code="UNKNOWN_QUALITATIVE_VALUE",
                    boundary_note=f"Result value '{val_clean}' is not recognized in reference range sheet.",
                    source_refs=source_refs + ["1_lab_safety_rules.md"],
                )

        # Inequality parsing (e.g. '<0.5', '>200')
        op, bound_val = parse_inequality(val_clean)
        if op and bound_val is not None:
            # Check if inequality clearly falls outside or inside range
            low = range_obj.low
            high = range_obj.high
            if op == ">" and high is not None and bound_val >= high:
                # Definitely HIGH
                return ClassificationResult(
                    test_canonical=canonical_name,
                    test_as_reported=raw_test_name,
                    value=raw_val,
                    unit_reported=raw_unit,
                    converted_value=conv_val,
                    converted_unit=final_unit,
                    range_used=range_obj,
                    status=ClassificationStatus.HIGH,
                    reason_code="INEQUALITY_HIGH",
                    boundary_note=f"Value '{val_clean}' strictly exceeds upper limit {high}.",
                    source_refs=source_refs,
                )
            if op == "<" and low is not None and bound_val <= low:
                # Definitely LOW
                return ClassificationResult(
                    test_canonical=canonical_name,
                    test_as_reported=raw_test_name,
                    value=raw_val,
                    unit_reported=raw_unit,
                    converted_value=conv_val,
                    converted_unit=final_unit,
                    range_used=range_obj,
                    status=ClassificationStatus.LOW,
                    reason_code="INEQUALITY_LOW",
                    boundary_note=f"Value '{val_clean}' strictly falls below lower limit {low}.",
                    source_refs=source_refs,
                )
            # If bound_val is inside range, '<0.5' could be low or normal
            return ClassificationResult(
                test_canonical=canonical_name,
                test_as_reported=raw_test_name,
                value=raw_val,
                unit_reported=raw_unit,
                range_used=range_obj,
                status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
                reason_code="AMBIGUOUS_INEQUALITY",
                boundary_note=f"Inequality '{val_clean}' is ambiguous relative to range [{low}, {high}].",
                source_refs=source_refs + ["1_lab_safety_rules.md"],
            )

        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            range_used=range_obj,
            status=ClassificationStatus.CANNOT_BE_CLASSIFIED,
            reason_code="NON_NUMERIC_VALUE",
            boundary_note=f"Value '{raw_val}' cannot be classified mathematically from the files.",
            source_refs=source_refs + ["1_lab_safety_rules.md"],
        )

    # -------------------------------------------------------------
    # 5. Urgent Check (Overrides Normal/Low/High)
    # -------------------------------------------------------------
    numeric_value = float(conv_val)
    urgent_info = evaluate_urgent_threshold(
        canonical_name, numeric_value, final_unit or "", db.urgent_thresholds
    )

    if urgent_info:
        source_refs.append("3_dangerous_urgent_values.md")
        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            converted_value=numeric_value,
            converted_unit=final_unit,
            conversion_steps=conv_steps,
            conversion_source=conv_source,
            range_used=range_obj,
            status=ClassificationStatus.URGENT,
            reason_code="CRITICAL_VALUE_BREACH",
            boundary_note=f"Critical threshold trigger: {urgent_info.threshold_trigger} {urgent_info.threshold_value} {urgent_info.threshold_unit}.",
            urgent_info=urgent_info,
            source_refs=source_refs,
        )

    # -------------------------------------------------------------
    # 6. Low / High / Normal Evaluation with Edge Case Boundary Rule
    # -------------------------------------------------------------
    low_lim = range_obj.low
    high_lim = range_obj.high

    # Edge Case Rule: If a patient's analytical value sits exactly on a lower or upper range limit,
    # the algorithmic classification MUST mark it as NORMAL.
    if (low_lim is not None and numeric_value == low_lim) or (high_lim is not None and numeric_value == high_lim):
        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            converted_value=numeric_value,
            converted_unit=final_unit,
            conversion_steps=conv_steps,
            conversion_source=conv_source,
            range_used=range_obj,
            status=ClassificationStatus.NORMAL,
            reason_code="BOUNDARY_NORMAL",
            boundary_note=f"Value {numeric_value} sits exactly on reference limit [{low_lim}, {high_lim}]; classified NORMAL per Edge Case Rule.",
            source_refs=source_refs,
        )

    if low_lim is not None and numeric_value < low_lim:
        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            converted_value=numeric_value,
            converted_unit=final_unit,
            conversion_steps=conv_steps,
            conversion_source=conv_source,
            range_used=range_obj,
            status=ClassificationStatus.LOW,
            reason_code="VALUE_BELOW_RANGE",
            boundary_note=f"Value {numeric_value} is below lower reference limit {low_lim}.",
            source_refs=source_refs,
        )

    if high_lim is not None and numeric_value > high_lim:
        return ClassificationResult(
            test_canonical=canonical_name,
            test_as_reported=raw_test_name,
            value=raw_val,
            unit_reported=raw_unit,
            converted_value=numeric_value,
            converted_unit=final_unit,
            conversion_steps=conv_steps,
            conversion_source=conv_source,
            range_used=range_obj,
            status=ClassificationStatus.HIGH,
            reason_code="VALUE_ABOVE_RANGE",
            boundary_note=f"Value {numeric_value} exceeds upper reference limit {high_lim}.",
            source_refs=source_refs,
        )

    return ClassificationResult(
        test_canonical=canonical_name,
        test_as_reported=raw_test_name,
        value=raw_val,
        unit_reported=raw_unit,
        converted_value=numeric_value,
        converted_unit=final_unit,
        conversion_steps=conv_steps,
        conversion_source=conv_source,
        range_used=range_obj,
        status=ClassificationStatus.NORMAL,
        reason_code="VALUE_IN_RANGE",
        boundary_note=f"Value {numeric_value} is within normal reference interval [{low_lim}, {high_lim}].",
        source_refs=source_refs,
    )
