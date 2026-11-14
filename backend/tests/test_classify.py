"""Tests for the deterministic classification engine and boundary rules."""

import pytest
from backend.classify.engine import classify_test
from backend.ingestion.loader import get_corpus_db
from backend.models.schemas import ClassificationStatus, DemographicData, TestResultInput

db = get_corpus_db()


def test_value_exactly_on_lower_limit():
    # Male ALT lower limit is 7 U/L -> Exactly 7 must be NORMAL
    patient = DemographicData(recorded_age=30, biological_sex="Male")
    inp = TestResultInput(test_name="ALT", value=7, unit="U/L")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.NORMAL
    assert res.reason_code == "BOUNDARY_NORMAL"
    assert "sits exactly on reference limit" in res.boundary_note


def test_value_exactly_on_upper_limit():
    # Bob Jones P002: Female ALT upper limit is 45 U/L -> Exactly 45 must be NORMAL
    patient = DemographicData(recorded_age=35, biological_sex="Female")
    inp = TestResultInput(test_name="SGPT", value=45, unit="U/L")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.NORMAL
    assert res.reason_code == "BOUNDARY_NORMAL"
    assert res.test_canonical == "ALT"

    # Julia Child P010: Cholesterol upper limit is 200 mg/dL -> Exactly 200 must be NORMAL
    inp_chol = TestResultInput(test_name="Cholesterol", value=200, unit="mg/dL")
    res_chol = classify_test(inp_chol, patient=patient, db=db)
    assert res_chol.status == ClassificationStatus.NORMAL
    assert res_chol.reason_code == "BOUNDARY_NORMAL"


def test_value_strictly_below_lower_limit():
    patient = DemographicData(recorded_age=25, biological_sex="Female")
    # Female Hemoglobin normal is 12.1 - 15.1 g/dL. Value 10.5 is LOW (not urgent since > 7.0)
    inp = TestResultInput(test_name="Hemoglobin", value=10.5, unit="g/dL")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.LOW
    assert res.reason_code == "VALUE_BELOW_RANGE"


def test_value_strictly_above_upper_limit():
    patient = DemographicData(recorded_age=48, biological_sex="Male")
    # Male ALT normal is 7 - 55 U/L. Value 85 is HIGH
    inp = TestResultInput(test_name="ALT", value=85, unit="U/L")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.HIGH
    assert res.reason_code == "VALUE_ABOVE_RANGE"


def test_urgent_overrides_low_hemoglobin():
    # Diana Prince P004: Hemoglobin 6.5 g/dL (< 7.0 urgent threshold)
    patient = DemographicData(recorded_age=42, biological_sex="Female")
    inp = TestResultInput(test_name="Hemoglobin", value=6.5, unit="g/dL")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.URGENT
    assert res.urgent_info is not None
    assert res.urgent_info.severe_warning == "see a doctor today"
    assert res.reason_code == "CRITICAL_VALUE_BREACH"


def test_urgent_overrides_high_fasting_sugar():
    # Michael Scott P013: Fasting Blood Sugar 350 mg/dL (> 300 urgent threshold)
    patient = DemographicData(recorded_age=45, biological_sex="Male")
    inp = TestResultInput(test_name="Fasting Blood Sugar", value=350, unit="mg/dL")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.URGENT
    assert res.urgent_info is not None
    assert res.urgent_info.severe_warning == "see a doctor today"


def test_urgent_platelet_count():
    # Platelets < 50000 cells/mcL
    patient = DemographicData(recorded_age=30, biological_sex="Male")
    inp = TestResultInput(test_name="Platelet Count", value=35000, unit="cells/mcL")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.URGENT
    assert res.urgent_info.threshold_value == 50000


def test_urgent_alt_above_1000():
    # ALT > 1000 U/L
    patient = DemographicData(recorded_age=40, biological_sex="Female")
    inp = TestResultInput(test_name="ALT", value=1250, unit="U/L")
    res = classify_test(inp, patient=patient, db=db)
    assert res.status == ClassificationStatus.URGENT
    assert res.urgent_info.threshold_value == 1000


def test_qualitative_urine_protein():
    patient = DemographicData(recorded_age=19, biological_sex="Female")

    # Haley Dunphy P008: Urine Protein Negative -> NORMAL
    inp_neg = TestResultInput(test_name="Protein", value="Negative")
    res_neg = classify_test(inp_neg, patient=patient, db=db)
    assert res_neg.status == ClassificationStatus.NORMAL

    # Positive or Trace -> HIGH
    inp_pos = TestResultInput(test_name="Protein", value="Positive")
    res_pos = classify_test(inp_pos, patient=patient, db=db)
    assert res_pos.status == ClassificationStatus.HIGH

    inp_trace = TestResultInput(test_name="Urine Protein", value="Trace")
    res_trace = classify_test(inp_trace, patient=patient, db=db)
    assert res_trace.status == ClassificationStatus.HIGH


def test_inequality_values():
    patient = DemographicData(recorded_age=55, biological_sex="Female")

    # Value strictly exceeding upper limit
    inp_high = TestResultInput(test_name="Cholesterol", value=">200", unit="mg/dL")
    res_high = classify_test(inp_high, patient=patient, db=db)
    assert res_high.status == ClassificationStatus.HIGH

    # Value strictly below lower limit
    inp_low = TestResultInput(test_name="Fasting Blood Sugar", value="<50", unit="mg/dL")
    res_low = classify_test(inp_low, patient=patient, db=db)
    assert res_low.status == ClassificationStatus.LOW

    # Ambiguous inequality within range cannot be decided
    inp_ambig = TestResultInput(test_name="TSH", value="<0.5", unit="mIU/L")
    res_ambig = classify_test(inp_ambig, patient=patient, db=db)
    assert res_ambig.status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert res_ambig.reason_code == "AMBIGUOUS_INEQUALITY"


def test_injection_like_text_safe_handling():
    patient = DemographicData(recorded_age=30, biological_sex="Male")
    
    # SQL injection string in test name
    inp_sql = TestResultInput(test_name="'; DROP TABLE reports; --", value=100)
    res_sql = classify_test(inp_sql, patient=patient, db=db)
    assert res_sql.status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert res_sql.reason_code == "UNRECOGNIZED_TEST_NAME"

    # XSS injection string in value
    inp_xss = TestResultInput(test_name="Hemoglobin", value="<script>alert(1)</script>", unit="g/dL")
    res_xss = classify_test(inp_xss, patient=patient, db=db)
    assert res_xss.status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert res_xss.reason_code in ["UNSUPPORTED_UNIT", "NON_NUMERIC_VALUE"]
