"""Tests for unit parsing, normalization, and deterministic conversion."""

import pytest
from backend.normalize.units import convert_value_and_unit, normalize_unit_string


def test_standard_units_without_conversion():
    tests = [
        ("Hemoglobin", 14.5, "g/dL", "g/dL"),
        ("White Blood Cell Count", 6000, "cells/mcL", "cells/mcL"),
        ("Platelet Count", 250000, "cells/mcL", "cells/mcL"),
        ("ALT", 35, "U/L", "U/L"),
        ("TSH", 2.5, "mIU/L", "mIU/L"),
    ]
    for analyte, val, unit_in, unit_target in tests:
        ok, conv_val, final_unit, steps, source, err = convert_value_and_unit(
            analyte, val, unit_in, target_unit=unit_target
        )
        assert ok is True
        assert conv_val == val
        assert final_unit == unit_target
        assert steps is None
        assert err is None


def test_unit_synonym_normalization():
    assert normalize_unit_string("cells/uL") == "cells/mcL"
    assert normalize_unit_string("cells/mcl") == "cells/mcL"
    assert normalize_unit_string("g/dl") == "g/dL"
    assert normalize_unit_string("mg/dl") == "mg/dL"
    assert normalize_unit_string("mmol/l") == "mmol/L"
    assert normalize_unit_string("u/l") == "U/L"


def test_glucose_unit_conversion_with_steps():
    # Ethan Hunt P005: 6.0 mmol/L -> mg/dL
    ok, conv_val, final_unit, steps, source, err = convert_value_and_unit(
        "Fasting Blood Sugar", 6.0, "mmol/L", target_unit="mg/dL"
    )
    assert ok is True
    # 6.0 * 18.0182 = 108.1092
    assert pytest.approx(conv_val, 0.01) == 108.11
    assert final_unit == "mg/dL"
    assert steps is not None
    assert "6.0 mmol/L x 18.0182 = 108.1092 mg/dL" in steps
    assert "source: standard" in steps
    assert source == "standard"
    assert err is None


def test_unsupported_unit():
    # Unsupported unit for Hemoglobin
    ok, conv_val, final_unit, steps, source, err = convert_value_and_unit(
        "Hemoglobin", 14.0, "psi", target_unit="g/dL"
    )
    assert ok is False
    assert conv_val is None
    assert err == "unit not covered by the range sheet"


def test_qualitative_unit_handling():
    ok, conv_val, final_unit, steps, source, err = convert_value_and_unit(
        "Urine Protein", "Negative", "", target_unit="qualitative"
    )
    assert ok is True
    assert conv_val == "Negative"
    assert final_unit == "qualitative"
