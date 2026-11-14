"""Explanation prompt for converting deterministic classification into plain language."""

import json
from typing import Any, Dict, List

EXPLANATION_PROMPT_VERSION = "v1.0.0"


def build_explanation_prompt(
    computed_results: List[Dict[str, Any]],
    glossary_excerpts: Dict[str, str],
) -> str:
    """Build user prompt for generating per-test plain language explanations."""
    facts_str = json.dumps(computed_results, indent=2, default=str)
    glossary_str = json.dumps(glossary_excerpts, indent=2)

    prompt = f"""You are provided with pre-computed laboratory results for a patient, along with relevant glossary definitions.

GLOSSARY DEFINITIONS:
{glossary_str}

PRE-COMPUTED CLINICAL RESULTS:
{facts_str}

TASK:
Write a plain-language explanation for EACH test in the clinical results.
Keep your language at a class-8 reading level (short sentences, simple words).
Do NOT diagnose any disease (never write "you have <disease>").
Use safe phrases: "can be associated with" or "may suggest the doctor should check".

OUTPUT FORMAT:
Return a valid JSON array of objects. Do not include markdown code fences or conversational filler.
Each object must have the following exact keys:
[
  {{
    "test_canonical": "<Canonical Test Name>",
    "what_it_measures": "<1-2 short sentences explaining what this test checks in the body>",
    "what_low_or_high_can_mean": "<1-2 short sentences explaining what a low, high, or normal value can be associated with, without diagnosing>",
    "simple_summary": "<1 sentence summarizing the patient's result and status calmly>"
  }}
]
"""
    return prompt.strip()
