"""Tests for report summary and clinical aggregation."""

import pytest
from backend.classify.engine import classify_test
from backend.ingestion.loader import get_corpus_db
from backend.models.schemas import ClassificationStatus, DemographicData, TestResultInput
from backend.report.summary import generate_report_summary

db = get_corpus_db()


def test_summary_status_counts():
    demo = DemographicData(patient_id="P001", recorded_age=28, biological_sex="Female")
    t1 = classify_test(TestResultInput(test_name="Hemoglobin", value=13.5, unit="g/dL"), patient=demo, db=db)
    t2 = classify_test(TestResultInput(test_name="WBC", value=6000, unit="cells/mcL"), patient=demo, db=db)

    summary = generate_report_summary([t1, t2], demographics=demo)
    assert summary.total_tests == 2
    assert summary.counts_by_status[ClassificationStatus.NORMAL.value] == 2
    assert len(summary.abnormal_tests) == 0
    assert len(summary.urgent_flags) == 0
    assert summary.severe_warning is None


def test_summary_abnormal_and_urgent_flags():
    demo = DemographicData(patient_id="P004", recorded_age=42, biological_sex="Female")
    # Hemoglobin 6.5 is URGENT, Platelet 120000 is LOW
    t_urg = classify_test(TestResultInput(test_name="Hemoglobin", value=6.5, unit="g/dL"), patient=demo, db=db)
    t_low = classify_test(TestResultInput(test_name="Platelet Count", value=120000, unit="cells/mcL"), patient=demo, db=db)

    summary = generate_report_summary([t_urg, t_low], demographics=demo)
    assert summary.total_tests == 2
    assert summary.counts_by_status[ClassificationStatus.URGENT.value] == 1
    assert summary.counts_by_status[ClassificationStatus.LOW.value] == 1
    assert len(summary.abnormal_tests) == 2
    assert len(summary.urgent_flags) == 1
    assert "Hemoglobin" in summary.urgent_flags[0]
    assert summary.severe_warning == "see a doctor today"


def test_summary_missing_info_flags():
    demo = DemographicData(patient_id="P003", recorded_age=None, biological_sex=None)
    t_fbs = classify_test(TestResultInput(test_name="Fasting Blood Sugar", value=110, unit="mg/dL"), patient=demo, db=db)

    summary = generate_report_summary([t_fbs], demographics=demo)
    assert summary.counts_by_status[ClassificationStatus.NEEDS_INFO.value] == 1
    assert "Fasting Blood Sugar" in summary.missing_info_flags
