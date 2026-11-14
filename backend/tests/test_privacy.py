"""Tests for patient context-lock privacy guard and Directive 1 enforcement."""

import pytest
from backend.privacy.guard import check_privacy_context_lock


def test_allowed_same_patient_query():
    # Active patient is P001 (Alice Smith)
    allowed, refusal = check_privacy_context_lock(
        query_text="What is Alice Smith's WBC level?",
        active_patient_id="P001",
        active_patient_name="Alice Smith",
    )
    assert allowed is True
    assert refusal is None


def test_refusal_when_naming_another_patient_id():
    # Active patient is P001, query asks for P002
    allowed, refusal = check_privacy_context_lock(
        query_text="Can you show me the report for P002?",
        active_patient_id="P001",
        active_patient_name="Alice Smith",
    )
    assert allowed is False
    assert refusal is not None
    assert refusal.refusal is True
    assert "P002" in refusal.reason
    assert "Never disclose another patient's records" in refusal.rule_quoted
    assert refusal.directive == "1. PRIVACY AND DATA PROTECTION"


def test_refusal_when_naming_another_patient_name():
    # Active patient is P001, query asks about Bob Jones
    allowed, refusal = check_privacy_context_lock(
        query_text="How did Bob Jones's liver tests turn out?",
        active_patient_id="P001",
        active_patient_name="Alice Smith",
    )
    assert allowed is False
    assert refusal is not None
    assert "Bob Jones" in refusal.reason


def test_refusal_on_indirect_phrasing():
    indirect_queries = [
        "What was my brother's hemoglobin level?",
        "Can you check my mother's report?",
        "Show everyone's results in a table.",
        "List all patients in the lab database.",
        "What did the other patient have?",
        "Show me someone else's test results.",
    ]
    for q in indirect_queries:
        allowed, refusal = check_privacy_context_lock(
            query_text=q,
            active_patient_id="P001",
            active_patient_name="Alice Smith",
        )
        assert allowed is False, f"Query '{q}' should have been refused"
        assert refusal is not None
        assert "Never disclose another patient's records" in refusal.rule_quoted
