"""Tests for demographic-based reference range selection and boundary rules."""

import pytest
from backend.ingestion.loader import get_corpus_db
from backend.models.schemas import ClassificationStatus
from backend.ranges.selector import select_reference_range

db = get_corpus_db()


def test_exact_age_boundaries_inclusive():
    # 18 is lower age bound
    ok_18, r_18, status_18, _, _ = select_reference_range("Fasting Blood Sugar", 18, "Male", db.reference_ranges)
    assert ok_18 is True
    assert r_18.low == 70
    assert r_18.high == 99

    # 100 is upper age bound (inclusive of upper bound per Edge Case Rule)
    ok_100, r_100, status_100, _, _ = select_reference_range("Fasting Blood Sugar", 100, "Male", db.reference_ranges)
    assert ok_100 is True
    assert r_100.low == 70
    assert r_100.high == 99


def test_age_out_of_bounds():
    # Pediatric < 18 has no coverage in range sheets
    ok_17, _, status_17, _, msg_17 = select_reference_range("Hemoglobin", 17, "Male", db.reference_ranges)
    assert ok_17 is False
    assert status_17 == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert "outside the reference range sheets coverage" in msg_17

    # Super-geriatric > 100 has no coverage
    ok_101, _, status_101, _, msg_101 = select_reference_range("Hemoglobin", 101, "Female", db.reference_ranges)
    assert ok_101 is False
    assert status_101 == ClassificationStatus.CANNOT_BE_CLASSIFIED


def test_missing_age_demographic():
    # Missing age returns NEEDS_INFO
    ok, r, status, missing, msg = select_reference_range("Fasting Blood Sugar", None, "Male", db.reference_ranges)
    assert ok is False
    assert status == ClassificationStatus.NEEDS_INFO
    assert "age" in missing
    assert "age is missing" in msg.lower()


def test_sex_dependent_analytes_differ_by_sex():
    # Male ALT: 7 - 55 U/L
    ok_m, r_m, _, _, _ = select_reference_range("ALT", 35, "Male", db.reference_ranges)
    assert ok_m is True
    assert r_m.low == 7
    assert r_m.high == 55

    # Female ALT: 7 - 45 U/L
    ok_f, r_f, _, _, _ = select_reference_range("ALT", 35, "Female", db.reference_ranges)
    assert ok_f is True
    assert r_f.low == 7
    assert r_f.high == 45

    # Male AST: 8 - 48 U/L
    ok_ast_m, r_ast_m, _, _, _ = select_reference_range("AST", 32, "Male", db.reference_ranges)
    assert ok_ast_m is True
    assert r_ast_m.low == 8
    assert r_ast_m.high == 48

    # Female AST: 8 - 43 U/L
    ok_ast_f, r_ast_f, _, _, _ = select_reference_range("AST", 32, "Female", db.reference_ranges)
    assert ok_ast_f is True
    assert r_ast_f.low == 8
    assert r_ast_f.high == 43


def test_missing_sex_for_sex_dependent_test():
    # Laura Croft P012: AST with missing sex -> NEEDS_INFO
    ok, r, status, missing, msg = select_reference_range("AST", 32, None, db.reference_ranges)
    assert ok is False
    assert status == ClassificationStatus.NEEDS_INFO
    assert "biological_sex" in missing
    assert "biological sex is missing" in msg.lower()


def test_missing_sex_for_sex_independent_test():
    # Fasting Blood Sugar applies to All sexes: missing sex is fine as long as age is present
    ok, r, status, missing, msg = select_reference_range("Fasting Blood Sugar", 45, None, db.reference_ranges)
    assert ok is True
    assert r.low == 70
    assert r.high == 99


def test_unlisted_test_not_in_range_sheets():
    # Fiona Gallagher P006: Serum Ferritin has no range sheet
    ok, r, status, missing, msg = select_reference_range("Serum Ferritin", 22, "Female", db.reference_ranges)
    assert ok is False
    assert status == ClassificationStatus.CANNOT_BE_CLASSIFIED
    assert msg == "test not present in reference range sheets"
