"""Unit parsing, normalization, and deterministic conversion."""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)

# Canonical standard units per test as dictated by range sheets
STANDARD_UNITS = {
    "Hemoglobin": "g/dL",
    "White Blood Cell Count": "cells/mcL",
    "Platelet Count": "cells/mcL",
    "Red Blood Cell Count": "cells/mcL",
    "Fasting Blood Sugar": "mg/dL",
    "ALT": "U/L",
    "AST": "U/L",
    "Cholesterol": "mg/dL",
    "TSH": "mIU/L",
    "Urine pH": "pH",
    "Urine Protein": "qualitative",
}

# Synonyms for unit strings
UNIT_SYNONYMS = {
    "g/dl": "g/dL",
    "g/dL": "g/dL",
    "cells/mcl": "cells/mcL",
    "cells/mcL": "cells/mcL",
    "cells/ul": "cells/mcL",
    "cells/uL": "cells/mcL",
    "/mcl": "cells/mcL",
    "/ul": "cells/mcL",
    "mg/dl": "mg/dL",
    "mg/dL": "mg/dL",
    "mmol/l": "mmol/L",
    "mmol/L": "mmol/L",
    "u/l": "U/L",
    "U/L": "U/L",
    "iu/l": "U/L",
    "IU/L": "U/L",
    "miu/l": "mIU/L",
    "mIU/L": "mIU/L",
    "ng/ml": "ng/mL",
    "ng/mL": "ng/mL",
    "": "unitless",
    "unitless": "unitless",
    "ph": "pH",
    "pH": "pH",
}


def load_conversion_config(config_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Load standard conversion factors from config/conversions.json."""
    if not config_path:
        config_path = os.path.join(os.path.dirname(__file__), "..", "config", "conversions.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("conversions", [])
        except Exception as err:
            logger.warning("Failed to load conversions from %s: %s", config_path, err)
    return []


_CONVERSION_REGISTRY = load_conversion_config()


def normalize_unit_string(unit: Optional[str]) -> str:
    """Normalize casing and format of unit string."""
    if not unit:
        return "unitless"
    u_clean = unit.strip()
    return UNIT_SYNONYMS.get(u_clean.lower(), u_clean)


def convert_value_and_unit(
    analyte_canonical: str,
    value: Union[float, int, str],
    unit_reported: Optional[str],
    target_unit: Optional[str] = None,
) -> Tuple[bool, Optional[Union[float, int, str]], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Deterministically convert reported value to the target standard unit.
    Preserves inequalities (e.g. '>200', '<0.5') and non-numeric qualitative strings.
    
    Returns:
        (success, converted_value, standard_unit, conversion_steps, conversion_source, error_reason)
    """
    if target_unit is None:
        target_unit = STANDARD_UNITS.get(analyte_canonical)

    norm_reported = normalize_unit_string(unit_reported)
    norm_target = normalize_unit_string(target_unit)

    # 1. Non-numeric qualitative values (e.g., 'Negative', 'Positive', 'Trace')
    if isinstance(value, str) and not re_is_number_or_inequality(value):
        return True, value, norm_target or norm_reported, None, None, None

    # 2. Extract prefix inequality if present (e.g. '<0.5', '>200')
    prefix = ""
    val_to_parse = value
    if isinstance(value, str):
        m_ineq = re.match(r"^\s*([<>]=?)\s*([0-9.]+)\s*$", value)
        if m_ineq:
            prefix = m_ineq.group(1)
            val_to_parse = m_ineq.group(2)

    try:
        numeric_val = float(val_to_parse)
    except (ValueError, TypeError):
        return False, None, None, None, None, "value is not a valid numeric measurement"

    # 3. If units already match or target is unspecified
    if not norm_target or norm_reported.lower() == norm_target.lower() or (norm_target == "pH" and norm_reported == "unitless"):
        res_val = f"{prefix}{numeric_val}" if prefix else numeric_val
        return True, res_val, norm_target or norm_reported, None, None, None

    # 4. Lookup conversion rule
    for conv in _CONVERSION_REGISTRY:
        if (
            conv.get("analyte") == analyte_canonical
            and normalize_unit_string(conv.get("from_unit")).lower() == norm_reported.lower()
            and normalize_unit_string(conv.get("to_unit")).lower() == norm_target.lower()
        ):
            factor = float(conv.get("factor", 1.0))
            source = conv.get("source", "standard")
            op = conv.get("operation", "multiply")

            if op == "multiply":
                converted_num = round(numeric_val * factor, 4)
                converted = f"{prefix}{converted_num}" if prefix else converted_num
                step_str = f"{value} {norm_reported} x {factor} = {converted} {norm_target} (factor from config/conversions.json [source: {source}])"
            elif op == "divide":
                converted_num = round(numeric_val / factor, 4)
                converted = f"{prefix}{converted_num}" if prefix else converted_num
                step_str = f"{value} {norm_reported} / {factor} = {converted} {norm_target} (factor from config/conversions.json [source: {source}])"
            else:
                converted = f"{prefix}{numeric_val}" if prefix else numeric_val
                step_str = f"Direct conversion {value} {norm_reported} to {norm_target}"

            return True, converted, norm_target, step_str, source, None

    # 5. If neither works, unit is not covered
    return False, None, None, None, None, "unit not covered by the range sheet"


def re_is_number_or_inequality(s: str) -> bool:
    """Helper to check if string can be parsed as float, with or without inequality."""
    clean = s.strip().lstrip("<>=").strip()
    try:
        float(clean)
        return True
    except ValueError:
        return False
