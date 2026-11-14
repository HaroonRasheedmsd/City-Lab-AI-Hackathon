"""Templates package."""
from backend.llm.templates.fallback_templates import (
    CLINICAL_TEST_DESCRIPTIONS,
    build_template_explanation,
    build_template_doctor_questions,
)

__all__ = [
    "CLINICAL_TEST_DESCRIPTIONS",
    "build_template_explanation",
    "build_template_doctor_questions",
]
