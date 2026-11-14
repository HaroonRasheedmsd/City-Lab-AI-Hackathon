"""Doctor questions prompt generating targeted questions for abnormal findings."""

import json
from typing import Any, Dict, List, Optional

DOCTOR_QUESTIONS_PROMPT_VERSION = "v1.0.0"


def build_doctor_questions_prompt(
    abnormal_tests: List[Dict[str, Any]],
    all_normal: bool,
    urgent_warning: Optional[str] = None,
) -> str:
    """Build user prompt for generating questions the patient can ask their doctor."""
    if all_normal:
        condition_instructions = """All test results for this patient are NORMAL.
Generate exactly 3 general, proactive health questions the patient can ask their physician during a routine visit."""
    else:
        abnormal_json = json.dumps(abnormal_tests, indent=2, default=str)
        condition_instructions = f"""The following tests are NOT normal (LOW, HIGH, or URGENT):
{abnormal_json}

Generate between 3 and 5 clear, helpful questions focused specifically on these non-normal results.
The patient can take these questions directly to their medical doctor."""

    warning_note = ""
    if urgent_warning:
        warning_note = f"\nURGENT WARNING REQUIRED: The results include critical values. You must acknowledge the urgent warning: '{urgent_warning}'."

    prompt = f"""You are helping a patient prepare questions for their doctor visit based on their lab results.

{condition_instructions}
{warning_note}

RULES:
1. Do not diagnose any disease.
2. Questions should be respectful, simple, and easy for an 8th-grade patient to ask.
3. Focus on what tests or lifestyle checks the doctor might recommend next.

OUTPUT FORMAT:
Return a valid JSON object matching this schema:
{{
  "is_general": {str(all_normal).lower()},
  "questions": [
    "<Question 1>",
    "<Question 2>",
    "<Question 3>"
  ]
}}
"""
    return prompt.strip()
