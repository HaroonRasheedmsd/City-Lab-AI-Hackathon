"""Ingestion module for loading and caching CityLab corpus."""
from backend.ingestion.parser import (
    strip_appendices,
    parse_safety_rules,
    parse_medical_glossary,
    parse_urgent_values,
    parse_hematology_ranges,
    parse_biochemistry_ranges,
    parse_thyroid_urine_ranges,
    parse_patient_report,
)
from backend.ingestion.loader import CorpusDatabase, get_corpus_db

__all__ = [
    "strip_appendices",
    "parse_safety_rules",
    "parse_medical_glossary",
    "parse_urgent_values",
    "parse_hematology_ranges",
    "parse_biochemistry_ranges",
    "parse_thyroid_urine_ranges",
    "parse_patient_report",
    "CorpusDatabase",
    "get_corpus_db",
]
