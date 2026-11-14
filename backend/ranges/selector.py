"""Range selector implementing demographic matching and boundary rules."""

from typing import Any, Dict, List, Optional, Tuple
from backend.models.schemas import ClassificationStatus, RangeUsed

# Analytes that strictly depend on biological sex
SEX_DEPENDENT_ANALYTES = {"Hemoglobin", "ALT", "AST"}

# All analytes present in CityLab reference sheets
KNOWN_RANGE_ANALYTES = {
    "Hemoglobin",
    "White Blood Cell Count",
    "Platelet Count",
    "Fasting Blood Sugar",
    "ALT",
    "AST",
    "Cholesterol",
    "TSH",
    "Urine pH",
    "Urine Protein",
}


def select_reference_range(
    analyte_canonical: str,
    age: Optional[int],
    biological_sex: Optional[str],
    reference_ranges: List[Dict[str, Any]],
) -> Tuple[bool, Optional[RangeUsed], Optional[ClassificationStatus], Optional[List[str]], Optional[str]]:
    """
    Select the appropriate reference range row for patient demographics.
    
    Returns:
        (success, range_used, status, missing_fields, message_or_reason)
    """
    # 1. Check if test exists in reference range sheets
    if analyte_canonical not in KNOWN_RANGE_ANALYTES:
        return False, None, ClassificationStatus.CANNOT_BE_CLASSIFIED, None, "test not present in reference range sheets"

    # 2. Check for missing required demographics
    missing: List[str] = []
    
    # All range sheets in CityLab are valid strictly for 18-100 yrs.
    # Therefore, age is required for all tests to confirm adult range applies.
    if age is None:
        missing.append("age")

    # Sex check for sex-dependent analytes
    norm_sex = None
    if biological_sex:
        s_clean = biological_sex.strip().capitalize()
        if s_clean in ["Male", "Female"]:
            norm_sex = s_clean

    if analyte_canonical in SEX_DEPENDENT_ANALYTES:
        if not norm_sex:
            missing.append("biological_sex")

    if missing:
        missing_readable = [m.replace("_", " ") for m in missing]
        msg = f"Patient {' and '.join(missing_readable)} is missing; the right normal range cannot be chosen."
        return False, None, ClassificationStatus.NEEDS_INFO, missing, msg

    # 3. Check age boundaries: inclusive of upper bound [18, 100]
    assert age is not None
    if age < 18 or age > 100:
        msg = f"Patient age {age} is outside the reference range sheets coverage (18-100 yrs)."
        return False, None, ClassificationStatus.CANNOT_BE_CLASSIFIED, None, msg

    # 4. Search matching range row in reference_ranges
    for r in reference_ranges:
        if r.get("analyte") != analyte_canonical:
            continue
        r_sex = r.get("biological_sex", "All")
        # Match sex: either range applies to All, or matches patient's normalized sex
        if r_sex not in ["All", norm_sex]:
            continue
        age_min = r.get("age_min", 18)
        age_max = r.get("age_max", 100)
        # Age boundaries are inclusive of upper bound
        if age_min <= age <= age_max:
            range_obj = RangeUsed(
                low=r.get("low"),
                high=r.get("high"),
                unit=r.get("unit"),
                qualitative_normal=r.get("qualitative_normal"),
                source_file=r.get("source_file", ""),
                row_ref=r.get("row_ref", ""),
                age_bracket=f"{age_min}-{age_max} yrs",
                sex_bracket=r_sex,
            )
            return True, range_obj, None, None, None

    return False, None, ClassificationStatus.CANNOT_BE_CLASSIFIED, None, "no matching range row found for demographics"
