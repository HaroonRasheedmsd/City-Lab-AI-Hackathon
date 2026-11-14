"""Analyte name normalization and alias resolution."""

import difflib
import re
from typing import Dict, Optional, Tuple

# Canonical test names defined across range sheets and reports
CANONICAL_TESTS = {
    "Hemoglobin",
    "White Blood Cell Count",
    "Platelet Count",
    "Red Blood Cell Count",
    "Fasting Blood Sugar",
    "ALT",
    "AST",
    "Cholesterol",
    "TSH",
    "Urine pH",
    "Urine Protein",
    "Serum Ferritin",
}

# Base alias mapping built directly from 2_medical_glossary.md and reports
BASE_ALIASES: Dict[str, str] = {
    "sgpt": "ALT",
    "alanine aminotransferase": "ALT",
    "sgot": "AST",
    "aspartate aminotransferase": "AST",
    "fbs": "Fasting Blood Sugar",
    "fasting blood sugar": "Fasting Blood Sugar",
    "fasting blood glucose": "Fasting Blood Sugar",
    "blood sugar": "Fasting Blood Sugar",
    "fasting sugar": "Fasting Blood Sugar",
    "glucose": "Fasting Blood Sugar",
    "hb": "Hemoglobin",
    "hemoglobin": "Hemoglobin",
    "plt": "Platelet Count",
    "platelet count": "Platelet Count",
    "platelets": "Platelet Count",
    "rbc": "Red Blood Cell Count",
    "red blood cell count": "Red Blood Cell Count",
    "wbc": "White Blood Cell Count",
    "white blood cell count": "White Blood Cell Count",
    "wbc count": "White Blood Cell Count",
    "alt": "ALT",
    "ast": "AST",
    "cholesterol": "Cholesterol",
    "total cholesterol": "Cholesterol",
    "tsh": "TSH",
    "thyroid stimulating hormone": "TSH",
    "urine ph": "Urine pH",
    "ph level": "Urine pH",
    "ph": "Urine pH",
    "urine protein": "Urine Protein",
    "protein": "Urine Protein",
    "serum ferritin": "Serum Ferritin",
    "ferritin": "Serum Ferritin",
}


def clean_test_string(text: str) -> str:
    """Normalize whitespace, lower-case, and strip non-alphanumeric punctuation."""
    if not text:
        return ""
    # Strip markdown formatting bold/italics
    cleaned = text.replace("**", "").replace("*", "").replace("`", "")
    # Remove leading hyphens or list markers
    cleaned = re.sub(r"^[-*•\s]+", "", cleaned)
    # Strip trailing punctuation like colons
    cleaned = cleaned.strip().rstrip(":")
    # Replace dashes/underscores with spaces
    cleaned = re.sub(r"[-_]+", " ", cleaned)
    # Collapse multiple spaces and lowercase
    cleaned = " ".join(cleaned.lower().split())
    return cleaned


def resolve_test_name(
    raw_name: str,
    extra_glossary: Optional[Dict[str, str]] = None,
    fuzzy_threshold: float = 0.86
) -> Tuple[Optional[str], str]:
    """
    Resolve a test name to its canonical name.
    
    Returns:
        (canonical_name or None, resolution_method)
        resolution_method is one of: "exact_canonical", "glossary_alias", "fuzzy_match", "UNMATCHED"
    """
    if not raw_name or not raw_name.strip():
        return None, "UNMATCHED"

    cleaned = clean_test_string(raw_name)

    # 1. Check exact canonical match (case-insensitive)
    for c in CANONICAL_TESTS:
        if clean_test_string(c) == cleaned:
            return c, "exact_canonical"

    # 2. Check extra glossary (from 2_medical_glossary.md)
    if extra_glossary:
        for k, v in extra_glossary.items():
            if clean_test_string(k) == cleaned:
                return v, "glossary_alias"

    # 3. Check base alias dictionary
    if cleaned in BASE_ALIASES:
        return BASE_ALIASES[cleaned], "glossary_alias"

    # 4. Conservative fuzzy match against known aliases and canonical tests
    candidates = list(BASE_ALIASES.keys())
    matches = difflib.get_close_matches(cleaned, candidates, n=2, cutoff=fuzzy_threshold)

    if matches:
        best_match = matches[0]
        # Ambiguity check: if 2 matches are extremely close in score, return UNMATCHED
        score1 = difflib.SequenceMatcher(None, cleaned, best_match).ratio()
        if len(matches) > 1:
            score2 = difflib.SequenceMatcher(None, cleaned, matches[1]).ratio()
            if abs(score1 - score2) < 0.05:
                return None, "UNMATCHED"
        return BASE_ALIASES[best_match], "fuzzy_match"

    return None, "UNMATCHED"
