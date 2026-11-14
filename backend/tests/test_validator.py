"""Tests for the output validator and medical guardrail enforcement."""

import json
import pytest
from backend.llm.validator.output_validator import (
    check_cross_patient_leakage,
    check_forbidden_medical_language,
    validate_chat_response,
    validate_doctor_questions_json,
    validate_explanation_json,
)


def test_validator_catches_diagnosis_language():
    forbidden_samples = [
        "Based on this fasting blood sugar, you have diabetes.",
        "Your low hemoglobin shows you are suffering from anemia.",
        "You have been diagnosed with hepatitis.",
        "Your diagnosis is chronic kidney failure.",
        "This definitely proves you have liver disease.",
    ]
    for sample in forbidden_samples:
        err = check_forbidden_medical_language(sample)
        assert err is not None, f"Validator should have rejected: '{sample}'"
        assert "forbidden diagnosis phrase" in err


def test_validator_catches_medication_advice():
    med_samples = [
        "You should take 500mg ibuprofen twice a day.",
        "Start taking insulin 10 units before meals.",
        "Take 20mg of aspirin daily.",
    ]
    for sample in med_samples:
        err = check_forbidden_medical_language(sample)
        assert err is not None, f"Validator should have caught medication advice: '{sample}'"
        assert "medication/dosage advice" in err


def test_validator_catches_other_patient_leakage():
    # Active patient is P001 (Alice Smith)
    leakage_samples = [
        "In comparison to patient P002, your results are higher.",
        "Just like Bob Jones, your ALT is elevated.",
        "Record CLD-P003-9942 showed normal sugar.",
    ]
    for sample in leakage_samples:
        err = check_cross_patient_leakage(sample, active_patient_id="P001")
        assert err is not None, f"Validator should have caught privacy leakage: '{sample}'"
        assert "other patient" in err


def test_validator_valid_explanation_json():
    valid_json = json.dumps([
        {
            "test_canonical": "Hemoglobin",
            "what_it_measures": "Measures oxygen-carrying protein in red blood cells.",
            "what_low_or_high_can_mean": "A low level can be associated with tiredness.",
            "simple_summary": "Your hemoglobin level is slightly low."
        }
    ])
    res = validate_explanation_json(valid_json, active_patient_id="P001")
    assert res.is_valid is True
    assert len(res.parsed_data) == 1
    assert res.parsed_data[0].test_canonical == "Hemoglobin"


def test_validator_rejects_malformed_json_and_markdown_fences():
    # Enclosed in markdown code fence - should parse successfully
    fenced_json = """```json
[
  {
    "test_canonical": "ALT",
    "what_it_measures": "Measures liver enzyme.",
    "what_low_or_high_can_mean": "Higher levels can suggest liver cell stress.",
    "simple_summary": "Your ALT is within range."
  }
]
```"""
    res = validate_explanation_json(fenced_json, active_patient_id="P001")
    assert res.is_valid is True
    assert res.parsed_data[0].test_canonical == "ALT"

    # Corrupted JSON
    bad_json = "This is not JSON at all."
    res_bad = validate_explanation_json(bad_json, active_patient_id="P001")
    assert res_bad.is_valid is False
    assert "Invalid JSON syntax" in res_bad.reason
