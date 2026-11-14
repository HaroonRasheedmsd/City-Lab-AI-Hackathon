"""End-to-end API tests for FastAPI application and all 14 simulated patient reports."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["patients_loaded"] == 14
    assert data["reference_ranges_loaded"] > 0


def test_list_patients():
    res = client.get("/api/patients")
    assert res.status_code == 200
    patients = res.json()
    assert len(patients) == 14
    pids = [p["patient_id"] for p in patients]
    assert "P001" in pids
    assert "P014" in pids


def test_patient_p001_alice_smith_cbc():
    res = client.get("/api/patients/P001/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["patient_name"] == "Alice Smith"
    assert data["total_tests"] == 2
    for r in data["results"]:
        assert r["status"] == "NORMAL"


def test_patient_p002_bob_jones_boundary():
    # Female ALT 7 - 45 U/L. Value is exactly 45 -> must be NORMAL per edge case rule
    res = client.get("/api/patients/P002/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["demographics"]["biological_sex"] == "Female"
    assert len(data["results"]) == 1
    sgpt = data["results"][0]
    assert sgpt["test_canonical"] == "ALT"
    assert sgpt["status"] == "NORMAL"
    assert sgpt["reason_code"] == "BOUNDARY_NORMAL"


def test_patient_p003_charlie_brown_corrupted_demographics():
    # Demographics corrupted -> must return NEEDS_INFO
    res = client.get("/api/patients/P003/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["demographics"]["recorded_age"] is None
    assert len(data["results"]) == 1
    fbs = data["results"][0]
    assert fbs["status"] == "NEEDS_INFO"
    assert "age" in fbs["missing_fields"]


def test_patient_p004_diana_prince_urgent_hemoglobin():
    # Hemoglobin 6.5 < 7.0 is URGENT
    res = client.get("/api/patients/P004/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["severe_warning"] == "see a doctor today"
    hem = next(r for r in data["results"] if r["test_canonical"] == "Hemoglobin")
    assert hem["status"] == "URGENT"
    plt = next(r for r in data["results"] if r["test_canonical"] == "Platelet Count")
    assert plt["status"] == "LOW"


def test_patient_p005_ethan_hunt_unit_conversion():
    # Fasting Blood Sugar 6.0 mmol/L -> 108.11 mg/dL is HIGH (>99)
    res = client.get("/api/patients/P005/analysis")
    assert res.status_code == 200
    data = res.json()
    fbs = data["results"][0]
    assert fbs["test_canonical"] == "Fasting Blood Sugar"
    assert fbs["status"] == "HIGH"
    assert fbs["converted_unit"] == "mg/dL"
    assert "6.0 mmol/L x 18.0182" in fbs["conversion_steps"]


def test_patient_p006_fiona_unknown_test():
    # Serum Ferritin is not in range sheets
    res = client.get("/api/patients/P006/analysis")
    assert res.status_code == 200
    data = res.json()
    ferr = data["results"][0]
    assert ferr["status"] == "CANNOT BE CLASSIFIED FROM THE FILES"
    assert ferr["reason_code"] == "TEST_NOT_COVERED_IN_RANGES"


def test_patient_p007_george_thyroid():
    res = client.get("/api/patients/P007/analysis")
    assert res.status_code == 200
    data = res.json()
    tsh = data["results"][0]
    assert tsh["test_canonical"] == "TSH"
    assert tsh["status"] == "NORMAL"


def test_patient_p008_haley_urine_qualitative():
    res = client.get("/api/patients/P008/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["total_tests"] == 2
    prot = next(r for r in data["results"] if r["test_canonical"] == "Urine Protein")
    assert prot["status"] == "NORMAL"
    ph = next(r for r in data["results"] if r["test_canonical"] == "Urine pH")
    assert ph["status"] == "NORMAL"


def test_patient_p009_ian_liver_high():
    res = client.get("/api/patients/P009/analysis")
    assert res.status_code == 200
    data = res.json()
    assert len(data["abnormal_tests"]) == 2
    for r in data["results"]:
        assert r["status"] == "HIGH"


def test_patient_p010_julia_cholesterol_boundary():
    # Cholesterol 200 mg/dL is on upper bound (125 - 200) -> NORMAL
    res = client.get("/api/patients/P010/analysis")
    assert res.status_code == 200
    data = res.json()
    chol = data["results"][0]
    assert chol["status"] == "NORMAL"
    assert chol["reason_code"] == "BOUNDARY_NORMAL"


def test_patient_p011_kevin_multiple_abnormal():
    res = client.get("/api/patients/P011/analysis")
    assert res.status_code == 200
    data = res.json()
    wbc = next(r for r in data["results"] if r["test_canonical"] == "White Blood Cell Count")
    assert wbc["status"] == "HIGH"
    plt = next(r for r in data["results"] if r["test_canonical"] == "Platelet Count")
    assert plt["status"] == "LOW"


def test_patient_p012_laura_missing_sex_dependent_test():
    # AST requires biological sex -> returns NEEDS_INFO
    res = client.get("/api/patients/P012/analysis")
    assert res.status_code == 200
    data = res.json()
    ast = data["results"][0]
    assert ast["status"] == "NEEDS_INFO"
    assert "biological_sex" in ast["missing_fields"]


def test_patient_p013_michael_urgent_sugar():
    # Sugar 350 > 300 is URGENT
    res = client.get("/api/patients/P013/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["severe_warning"] == "see a doctor today"
    fbs = data["results"][0]
    assert fbs["status"] == "URGENT"


def test_patient_p014_nancy_multiple_aliases():
    res = client.get("/api/patients/P014/analysis")
    assert res.status_code == 200
    data = res.json()
    fbs = next(r for r in data["results"] if r["test_canonical"] == "Fasting Blood Sugar")
    assert fbs["status"] == "NORMAL"
    ast = next(r for r in data["results"] if r["test_canonical"] == "AST")
    assert ast["status"] == "NORMAL"


def test_post_analyze_structured_json():
    payload = {
        "patient_id": "TEST_01",
        "patient_name": "Test User",
        "age": 30,
        "biological_sex": "Male",
        "results": [
            {"test_name": "ALT", "value": 30, "unit": "U/L"},
            {"test_name": "FBS", "value": 320, "unit": "mg/dL"},
        ],
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_tests"] == 2
    assert data["severe_warning"] == "see a doctor today"


def test_post_analyze_raw_markdown_text():
    raw_markdown = """
# CITYLAB DIAGNOSTICS - REPORT
* **Patient Full Name**: John Doe
* **Recorded Age**: 45
* **Biological Sex**: Male
## SECTION III: ANALYTICAL RESULTS
- Hemoglobin: 15.0 g/dL
- Fasting Blood Sugar: 90 mg/dL
"""
    res = client.post("/api/analyze", json={"raw_text": raw_markdown})
    assert res.status_code == 200
    data = res.json()
    assert data["total_tests"] == 2
    assert data["patient_name"] == "John Doe"
    for r in data["results"]:
        assert r["status"] == "NORMAL"


def test_privacy_query_endpoint():
    # Query for own patient is authorized
    res_ok = client.post("/api/query", json={"patient_id": "P001", "query": "What are my hemoglobin results?"})
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "authorized"

    # Query for another patient is refused with 403
    res_forbidden = client.post("/api/query", json={"patient_id": "P001", "query": "What are Bob Jones's results?"})
    assert res_forbidden.status_code == 403
    err_detail = res_forbidden.json()["detail"]
    assert err_detail["refusal"] is True
    assert "Never disclose another patient's records" in err_detail["rule_quoted"]
