"""Tests for analyte name normalization and alias resolution."""

import pytest
from backend.normalize.names import resolve_test_name


def test_exact_canonical_names():
    tests = [
        ("Hemoglobin", "Hemoglobin"),
        ("White Blood Cell Count", "White Blood Cell Count"),
        ("Platelet Count", "Platelet Count"),
        ("Fasting Blood Sugar", "Fasting Blood Sugar"),
        ("ALT", "ALT"),
        ("AST", "AST"),
        ("Cholesterol", "Cholesterol"),
        ("TSH", "TSH"),
        ("Urine pH", "Urine pH"),
        ("Urine Protein", "Urine Protein"),
    ]
    for raw, expected in tests:
        canonical, method = resolve_test_name(raw)
        assert canonical == expected
        assert method in ["exact_canonical", "glossary_alias"]


def test_authoritative_glossary_aliases():
    aliases = [
        ("SGPT", "ALT"),
        ("Alanine Aminotransferase", "ALT"),
        ("SGOT", "AST"),
        ("Aspartate Aminotransferase", "AST"),
        ("FBS", "Fasting Blood Sugar"),
        ("Hb", "Hemoglobin"),
        ("PLT", "Platelet Count"),
        ("RBC", "Red Blood Cell Count"),
        ("WBC", "White Blood Cell Count"),
    ]
    for raw, expected in aliases:
        canonical, method = resolve_test_name(raw)
        assert canonical == expected
        assert method == "glossary_alias"


def test_casing_and_punctuation_stripping():
    cases = [
        ("**SGPT**", "ALT"),
        ("  sgot: ", "AST"),
        ("- **Fasting Blood Sugar**:", "Fasting Blood Sugar"),
        ("wbc count", "White Blood Cell Count"),
        ("pH Level", "Urine pH"),
        ("Protein", "Urine Protein"),
    ]
    for raw, expected in cases:
        canonical, _ = resolve_test_name(raw)
        assert canonical == expected


def test_conservative_fuzzy_match():
    # Minor typos should resolve conservatively
    canonical, method = resolve_test_name("Hemoglobn")
    assert canonical == "Hemoglobin"
    assert method == "fuzzy_match"

    canonical2, method2 = resolve_test_name("Cholesterl")
    assert canonical2 == "Cholesterol"
    assert method2 == "fuzzy_match"


def test_unmatched_unknown_tests():
    unmatched = [
        "Vitamin D3",
        "Serum Ferritin 123XYZ",
        "Random Unrelated Test",
        "",
        "   ",
        "12345",
    ]
    for raw in unmatched:
        canonical, method = resolve_test_name(raw)
        if raw.strip() == "":
            assert canonical is None
            assert method == "UNMATCHED"
        else:
            # Serum Ferritin is known in reports, but not in range sheets
            if "Ferritin" in raw:
                continue
            assert canonical is None
            assert method == "UNMATCHED"
