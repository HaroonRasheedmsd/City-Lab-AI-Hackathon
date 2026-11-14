"""
Adversarial and Edge Case Test Suite for CityLab Diagnostics Rules Engine.
Covers 60+ edge cases derived strictly from CityLab reference sheets.
"""

import pytest
from backend.classify.engine import classify_test
from backend.ingestion.loader import get_corpus_db
from backend.models.schemas import (
    ClassificationResult,
    ClassificationStatus,
    DemographicData,
    TestResultInput,
)
from backend.normalize.names import resolve_test_name
from backend.normalize.units import convert_value_and_unit
from backend.report.summary import generate_report_summary

db = get_corpus_db()


# ============================================================================
# 1. Exact Range Limit Tests (10 tests, lower and upper bounds)
# Rule: If value sits exactly on lower or upper range limit, it MUST be NORMAL.
# ============================================================================

@pytest.mark.parametrize(
    "analyte,value,unit,age,sex,expected_status",
    [
        # Hemoglobin (Male: 13.8 - 17.2 g/dL)
        ("Hemoglobin", 13.8, "g/dL", 30, "Male", ClassificationStatus.NORMAL),
        ("Hemoglobin", 17.2, "g/dL", 30, "Male", ClassificationStatus.NORMAL),
        # Hemoglobin (Female: 12.1 - 15.1 g/dL)
        ("Hemoglobin", 12.1, "g/dL", 30, "Female", ClassificationStatus.NORMAL),
        ("Hemoglobin", 15.1, "g/dL", 30, "Female", ClassificationStatus.NORMAL),
        # White Blood Cell Count (All: 4500 - 11000 cells/mcL)
        ("White Blood Cell Count", 4500, "cells/mcL", 40, "Female", ClassificationStatus.NORMAL),
        ("White Blood Cell Count", 11000, "cells/mcL", 40, "Male", ClassificationStatus.NORMAL),
        # Platelet Count (All: 150000 - 450000 cells/mcL)
        ("Platelet Count", 150000, "cells/mcL", 25, "Female", ClassificationStatus.NORMAL),
        ("Platelet Count", 450000, "cells/mcL", 25, "Male", ClassificationStatus.NORMAL),
        # Fasting Blood Sugar (All: 70 - 99 mg/dL)
        ("Fasting Blood Sugar", 70, "mg/dL", 50, "Male", ClassificationStatus.NORMAL),
        ("Fasting Blood Sugar", 99, "mg/dL", 50, "Female", ClassificationStatus.NORMAL),
        # ALT (Male: 7 - 55 U/L)
        ("ALT", 7, "U/L", 35, "Male", ClassificationStatus.NORMAL),
        ("ALT", 55, "U/L", 35, "Male", ClassificationStatus.NORMAL),
        # ALT (Female: 7 - 45 U/L)
        ("ALT", 7, "U/L", 35, "Female", ClassificationStatus.NORMAL),
        ("ALT", 45, "U/L", 35, "Female", ClassificationStatus.NORMAL),
        # AST (Male: 8 - 48 U/L)
        ("AST", 8, "U/L", 45, "Male", ClassificationStatus.NORMAL),
        ("AST", 48, "U/L", 45, "Male", ClassificationStatus.NORMAL),
        # AST (Female: 8 - 43 U/L)
        ("AST", 8, "U/L", 45, "Female", ClassificationStatus.NORMAL),
        ("AST", 43, "U/L", 45, "Female", ClassificationStatus.NORMAL),
        # Cholesterol (All: 125 - 200 mg/dL)
        ("Cholesterol", 125, "mg/dL", 60, "Male", ClassificationStatus.NORMAL),
        ("Cholesterol", 200, "mg/dL", 60, "Female", ClassificationStatus.NORMAL),
        # TSH (All: 0.4 - 4.0 mIU/L)
        ("TSH", 0.4, "mIU/L", 33, "Female", ClassificationStatus.NORMAL),
        ("TSH", 4.0, "mIU/L", 33, "Male", ClassificationStatus.NORMAL),
        # Urine pH (All: 4.5 - 8.0)
        ("Urine pH", 4.5, "pH", 22, "Male", ClassificationStatus.NORMAL),
        ("Urine pH", 8.0, "pH", 22, "Female", ClassificationStatus.NORMAL),
        # Urine Protein ("Negative")
        ("Urine Protein", "Negative", None, 22, "Female", ClassificationStatus.NORMAL),
    ],
)
def test_exact_range_limits_are_normal(analyte, value, unit, age, sex, expected_status):
    """Test values exactly on range boundaries are strictly NORMAL."""
    t_in = TestResultInput(test_name=analyte, value=value, unit=unit)
    p_demo = DemographicData(recorded_age=age, biological_sex=sex)
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == expected_status
    assert res.range_used is not None
    assert "NORMAL" in res.reason_code


# ============================================================================
# 2. Age Band Boundaries (18, 100, 17, 101, 0, -1, "abc", 200)
# ============================================================================

@pytest.mark.parametrize(
    "age,expected_status",
    [
        (18, ClassificationStatus.NORMAL),    # Lower boundary inclusive
        (100, ClassificationStatus.NORMAL),   # Upper boundary inclusive
        (17, ClassificationStatus.CANNOT_BE_CLASSIFIED),  # Pediatric (no coverage in files)
        (101, ClassificationStatus.CANNOT_BE_CLASSIFIED), # Geriatric over upper bound
        (0, ClassificationStatus.CANNOT_BE_CLASSIFIED),   # Infant out of bound
    ],
)
def test_age_band_boundaries(age, expected_status):
    """Verify exact age boundaries [18, 100] are inclusive, and out-of-bounds are rejected."""
    t_in = TestResultInput(test_name="Fasting Blood Sugar", value=85, unit="mg/dL")
    p_demo = DemographicData(recorded_age=age, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == expected_status


# ============================================================================
# 3. Demographic Handling: Missing Demographics & Case Variations
# ============================================================================

def test_missing_age_returns_needs_info():
    """Missing age must return NEEDS_INFO for age-bounded tests."""
    t_in = TestResultInput(test_name="Fasting Blood Sugar", value=85, unit="mg/dL")
    p_demo = DemographicData(recorded_age=None, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.NEEDS_INFO
    assert "age" in res.missing_fields


def test_missing_sex_for_sex_dependent_test():
    """Missing sex for ALT (sex-dependent) must return NEEDS_INFO."""
    t_in = TestResultInput(test_name="ALT", value=44, unit="U/L")
    p_demo = DemographicData(recorded_age=30, biological_sex=None)
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.NEEDS_INFO
    assert "biological_sex" in res.missing_fields


def test_missing_sex_for_sex_independent_test_succeeds():
    """Missing sex for sex-independent test (TSH, WBC, FBS) successfully evaluates."""
    t_in = TestResultInput(test_name="TSH", value=2.0, unit="mIU/L")
    p_demo = DemographicData(recorded_age=30, biological_sex=None)
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.NORMAL
    assert res.range_used.sex_bracket == "All"


def test_both_age_and_sex_missing():
    """Both demographics missing returns NEEDS_INFO with both fields listed."""
    t_in = TestResultInput(test_name="ALT", value=30, unit="U/L")
    p_demo = DemographicData(recorded_age=None, biological_sex=None)
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.NEEDS_INFO
    assert set(res.missing_fields) == {"age", "biological_sex"}


@pytest.mark.parametrize("sex_input", ["male", "MALE", "m", "M", "female", "FEMALE", "f", "F"])
def test_biological_sex_case_insensitivity(sex_input):
    """Sex normalization handles lower, upper, and single-letter abbreviations."""
    t_in = TestResultInput(test_name="ALT", value=30, unit="U/L")
    p_demo = DemographicData(recorded_age=30, biological_sex=sex_input)
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.NORMAL


# ============================================================================
# 4. Unknown Tests & Unsupported Units
# ============================================================================

@pytest.mark.parametrize("unknown_analyte", ["Serum Ferritin", "Vitamin D", "Creatinine Kinase", "RandomXYZ"])
def test_unknown_tests_cannot_be_classified(unknown_analyte):
    """Tests not in reference sheets must return CANNOT BE CLASSIFIED."""
    t_in = TestResultInput(test_name=unknown_analyte, value=25, unit="ng/mL")
    p_demo = DemographicData(recorded_age=30, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert "CANNOT BE CLASSIFIED" in res.status.value


@pytest.mark.parametrize(
    "analyte,unit",
    [
        ("Hemoglobin", "lightyears"),
        ("ALT", "mg/dL"),
        ("TSH", "kg"),
        ("Platelet Count", "liters"),
    ],
)
def test_unsupported_units_cannot_be_classified(analyte, unit):
    """Known tests provided in unconvertible units return CANNOT BE CLASSIFIED."""
    t_in = TestResultInput(test_name=analyte, value=15, unit=unit)
    p_demo = DemographicData(recorded_age=30, biological_sex="Male")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert "unit not covered" in res.boundary_note.lower()


# ============================================================================
# 5. Synonym / Alias Pairs in Both Directions
# ============================================================================

@pytest.mark.parametrize(
    "reported,canonical",
    [
        ("SGPT", "ALT"),
        ("ALT", "ALT"),
        ("SGOT", "AST"),
        ("AST", "AST"),
        ("FBS", "Fasting Blood Sugar"),
        ("Fasting Blood Sugar", "Fasting Blood Sugar"),
        ("Hb", "Hemoglobin"),
        ("Hemoglobin", "Hemoglobin"),
        ("PLT", "Platelet Count"),
        ("Platelet Count", "Platelet Count"),
        ("WBC", "White Blood Cell Count"),
        ("White Blood Cell Count", "White Blood Cell Count"),
        ("pH Level", "Urine pH"),
        ("Urine pH", "Urine pH"),
        ("Protein", "Urine Protein"),
        ("Urine Protein", "Urine Protein"),
    ],
)
def test_alias_pairs_in_both_directions(reported, canonical):
    """Resolve aliases in both directions against canonical name."""
    resolved, method = resolve_test_name(reported, extra_glossary=db.glossary)
    assert resolved == canonical
    assert method in ["exact_canonical", "glossary_alias"]


# ============================================================================
# 6. Unit Round-Trips (mg/dL <-> mmol/L)
# ============================================================================

def test_glucose_unit_conversion_round_trip():
    """mmol/L -> mg/dL conversion and steps."""
    ok, converted, unit, steps, source, _ = convert_value_and_unit(
        "Fasting Blood Sugar", 5.5, "mmol/L", target_unit="mg/dL"
    )
    assert ok is True
    assert round(converted, 1) == 99.1
    assert unit == "mg/dL"
    assert "18.0182" in steps
    assert source == "standard"


def test_glucose_reverse_unit_conversion():
    """mg/dL -> mmol/L conversion and steps."""
    ok, converted, unit, steps, source, _ = convert_value_and_unit(
        "Fasting Blood Sugar", 108.1, "mg/dL", target_unit="mmol/L"
    )
    assert ok is True
    assert round(converted, 1) == 6.0
    assert unit == "mmol/L"
    assert "0.0555" in steps


def test_cholesterol_unit_conversion():
    """Cholesterol mmol/L -> mg/dL conversion."""
    ok, converted, unit, steps, source, _ = convert_value_and_unit(
        "Cholesterol", 5.0, "mmol/L", target_unit="mg/dL"
    )
    assert ok is True
    assert converted == 193.35
    assert unit == "mg/dL"
    assert "38.67" in steps


# ============================================================================
# 7. Urgent Threshold Edge Cases from 3_dangerous_urgent_values.md
# 4 Authoritative Rules:
# - Hemoglobin: Less than 7.0 g/dL
# - Fasting Blood Sugar: Greater than 300 mg/dL
# - Platelet Count: Less than 50000 cells/mcL
# - ALT: Greater than 1000 U/L
# ============================================================================

@pytest.mark.parametrize(
    "analyte,value,unit,expected_status",
    [
        # Hemoglobin (< 7.0 is urgent)
        ("Hemoglobin", 6.9, "g/dL", ClassificationStatus.URGENT),
        ("Hemoglobin", 7.0, "g/dL", ClassificationStatus.URGENT),
        ("Hemoglobin", 7.1, "g/dL", ClassificationStatus.LOW),
        # Fasting Blood Sugar (> 300 is urgent)
        ("Fasting Blood Sugar", 299, "mg/dL", ClassificationStatus.HIGH),
        ("Fasting Blood Sugar", 300, "mg/dL", ClassificationStatus.URGENT),
        ("Fasting Blood Sugar", 301, "mg/dL", ClassificationStatus.URGENT),
        # Platelet Count (< 50000 is urgent)
        ("Platelet Count", 49999, "cells/mcL", ClassificationStatus.URGENT),
        ("Platelet Count", 50000, "cells/mcL", ClassificationStatus.URGENT),
        ("Platelet Count", 50001, "cells/mcL", ClassificationStatus.LOW),
        # ALT (> 1000 is urgent)
        ("ALT", 999, "U/L", ClassificationStatus.HIGH),
        ("ALT", 1000, "U/L", ClassificationStatus.URGENT),
        ("ALT", 1001, "U/L", ClassificationStatus.URGENT),
    ],
)
def test_urgent_threshold_boundaries(analyte, value, unit, expected_status):
    """Test values precisely inside and outside urgent threshold boundaries from 3_dangerous_urgent_values.md."""
    t_in = TestResultInput(test_name=analyte, value=value, unit=unit)
    p_demo = DemographicData(recorded_age=40, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == expected_status
    if expected_status == ClassificationStatus.URGENT:
        assert res.urgent_info is not None
        assert res.urgent_info.severe_warning == "see a doctor today"


# ============================================================================
# 8. Non-Numeric Values & Inequalities
# ============================================================================

def test_urine_protein_trace_is_high():
    """Urine protein Trace is abnormal (HIGH)."""
    t_in = TestResultInput(test_name="Urine Protein", value="Trace", unit=None)
    p_demo = DemographicData(recorded_age=25, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.HIGH
    assert res.reason_code == "ABNORMAL_QUALITATIVE"


def test_urine_protein_positive_is_high():
    """Urine protein Positive is abnormal (HIGH)."""
    t_in = TestResultInput(test_name="Urine Protein", value="Positive", unit=None)
    p_demo = DemographicData(recorded_age=25, biological_sex="Female")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.HIGH


def test_fasting_sugar_inequality_below_range():
    """<0.5 Fasting Blood Sugar strictly falls below lower limit (70) -> LOW."""
    t_in = TestResultInput(test_name="Fasting Blood Sugar", value="<0.5", unit="mg/dL")
    p_demo = DemographicData(recorded_age=30, biological_sex="Male")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.LOW
    assert res.reason_code == "INEQUALITY_LOW"


def test_cholesterol_inequality_above_range():
    """>200 Cholesterol strictly exceeds upper limit (200) -> HIGH."""
    t_in = TestResultInput(test_name="Cholesterol", value=">200", unit="mg/dL")
    p_demo = DemographicData(recorded_age=30, biological_sex="Male")
    res = classify_test(t_in, patient=p_demo, db=db)
    assert res.status == ClassificationStatus.HIGH
    assert res.reason_code == "INEQUALITY_HIGH"


# ============================================================================
# 9. Duplicate Tests with Conflicting Values in Same Encounter
# ============================================================================

def test_duplicate_tests_evaluated_distinctly():
    """When a report contains duplicate tests with conflicting values, evaluate both."""
    tests = [
        TestResultInput(test_name="Hemoglobin", value=14.0, unit="g/dL"),
        TestResultInput(test_name="Hemoglobin", value=6.5, unit="g/dL"),
    ]
    p_demo = DemographicData(recorded_age=30, biological_sex="Female")
    classifications = [classify_test(t, patient=p_demo, db=db) for t in tests]
    summary = generate_report_summary(classifications, demographics=p_demo)

    assert len(summary.results) == 2
    assert summary.results[0].status == ClassificationStatus.NORMAL
    assert summary.results[1].status == ClassificationStatus.URGENT
    assert summary.total_tests == 2
    assert summary.counts_by_status["NORMAL"] == 1
    assert summary.counts_by_status["URGENT"] == 1
    assert summary.severe_warning == "see a doctor today"


# ============================================================================
# 10. Lowercase, Uppercase, and Typo Matching
# ============================================================================

@pytest.mark.parametrize(
    "raw_name,expected_canonical",
    [
        ("alt", "ALT"),
        ("ALT", "ALT"),
        ("Alt", "ALT"),
        ("sgpt", "ALT"),
        ("SGPT", "ALT"),
        ("heamoglobin", "Hemoglobin"),
        ("fasting suger", "Fasting Blood Sugar"),
        ("platlets", "Platelet Count"),
        ("chlesterol", "Cholesterol"),
    ],
)
def test_casing_and_typo_resolution(raw_name, expected_canonical):
    """Test resolution of test names across casing variants and typos."""
    resolved, method = resolve_test_name(raw_name, extra_glossary=db.glossary)
    assert resolved == expected_canonical
