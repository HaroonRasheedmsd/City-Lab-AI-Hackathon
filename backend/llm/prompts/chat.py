"""Chat prompt for patient-locked conversational questions."""

import json
from typing import Any, Dict, List

CHAT_PROMPT_VERSION = "v1.0.0"


def build_chat_prompt(
    patient_demographics: Dict[str, Any],
    classification_results: List[Dict[str, Any]],
    glossary_excerpts: Dict[str, str],
    user_query: str,
) -> str:
    """Build context-locked prompt for interactive patient Q&A."""
    demo_str = json.dumps(patient_demographics, indent=2, default=str)
    results_str = json.dumps(classification_results, indent=2, default=str)
    glossary_str = json.dumps(glossary_excerpts, indent=2)

    prompt = f"""You are answering a question for the specific patient whose report data is provided below.

ACTIVE PATIENT DEMOGRAPHICS:
{demo_str}

ACTIVE PATIENT TEST RESULTS:
{results_str}

GLOSSARY & CLINICAL DEFINITIONS:
{glossary_str}

USER QUESTION:
"{user_query}"

DIRECTIVES:
1. STRICT CONTEXT-LOCK: Answer ONLY using this patient's test results.
2. NO DIAGNOSIS: Never diagnose any disease or tell the patient what medical condition they have.
3. If the user asks about something not covered in these results or glossary, respond: "This is not covered in the lab's files."
4. If the user asks about other people or another patient, refuse immediately citing Directive 1.
5. Keep explanations short, clear, and reassuring at an 8th-grade reading level.
"""
    return prompt.strip()
