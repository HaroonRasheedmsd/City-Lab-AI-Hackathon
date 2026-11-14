"""Privacy guard enforcing patient context-lock and Directive 1."""

import re
from typing import Dict, List, Optional, Tuple
from backend.models.schemas import PrivacyRefusal

# Direct quote from 1_lab_safety_rules.md Directive 1
DIRECTIVE_1_QUOTE = (
    "1. PRIVACY AND DATA PROTECTION: Never disclose another patient's records. "
    "You must operate under a strict context-lock. Only answer questions regarding "
    "the specific patient report currently under discussion. If a user asks about "
    "another patient, you must definitively refuse the request."
)

# Known patients in the CityLab simulated corpus
KNOWN_PATIENT_NAMES: Dict[str, str] = {
    "P001": "Alice Smith",
    "P002": "Bob Jones",
    "P003": "Charlie Brown",
    "P004": "Diana Prince",
    "P005": "Ethan Hunt",
    "P006": "Fiona Gallagher",
    "P007": "George Costanza",
    "P008": "Haley Dunphy",
    "P009": "Ian Malcolm",
    "P010": "Julia Child",
    "P011": "Kevin Hart",
    "P012": "Laura Croft",
    "P013": "Michael Scott",
    "P014": "Nancy Drew",
}

# Indirect cross-patient query patterns
INDIRECT_PHRASES = [
    r"\bmy\s+brother(?:'s)?\b",
    r"\bmy\s+sister(?:'s)?\b",
    r"\bmy\s+mother(?:'s)?\b",
    r"\bmy\s+father(?:'s)?\b",
    r"\bmy\s+friend(?:'s)?\b",
    r"\bmy\s+wife(?:'s)?\b",
    r"\bmy\s+husband(?:'s)?\b",
    r"\bmy\s+son(?:'s)?\b",
    r"\bmy\s+daughter(?:'s)?\b",
    r"\bother\s+patient(?:'s)?\b",
    r"\banother\s+patient(?:'s)?\b",
    r"\bsomeone\s+else(?:'s)?\b",
    r"\beveryone(?:'s)?\b",
    r"\ball\s+patients?\b",
    r"\ball\s+records?\b",
    r"\ball\s+results?\b",
    r"\bshow\s+everyone\b",
    r"\blist\s+all\b",
    r"\bnext\s+patient\b",
    r"\bprevious\s+patient\b",
    r"\bother\s+records?\b",
]


def check_privacy_context_lock(
    query_text: str,
    active_patient_id: str,
    active_patient_name: Optional[str] = None,
) -> Tuple[bool, Optional[PrivacyRefusal]]:
    """
    Check if a query respects the patient context lock.
    
    Returns:
        (is_allowed, refusal_object_if_violated)
    """
    if not query_text or not query_text.strip():
        return True, None

    q_lower = query_text.lower()
    norm_active_id = active_patient_id.strip().upper()

    # 1. Check for indirect cross-patient phrases
    for pattern in INDIRECT_PHRASES:
        if re.search(pattern, q_lower):
            return False, PrivacyRefusal(
                refusal=True,
                reason="Query attempts to access data for individuals or records outside the active patient lock.",
                rule_quoted=DIRECTIVE_1_QUOTE,
                source_file="1_lab_safety_rules.md",
                directive="1. PRIVACY AND DATA PROTECTION",
            )

    # 2. Check for other patient IDs in query (e.g. P002, CLD-P002-9942)
    id_matches = re.findall(r"\b(?:CLD-)?(P\d{3})(?:-\d+)?\b", query_text, re.IGNORECASE)
    for match in id_matches:
        found_id = match.upper()
        if found_id != norm_active_id:
            return False, PrivacyRefusal(
                refusal=True,
                reason=f"Query references patient ID '{found_id}', which conflicts with active patient session '{norm_active_id}'.",
                rule_quoted=DIRECTIVE_1_QUOTE,
                source_file="1_lab_safety_rules.md",
                directive="1. PRIVACY AND DATA PROTECTION",
            )

    # 3. Check for names of other known patients
    for pid, full_name in KNOWN_PATIENT_NAMES.items():
        if pid == norm_active_id:
            continue
        # Check full name
        if full_name.lower() in q_lower:
            return False, PrivacyRefusal(
                refusal=True,
                reason=f"Query explicitly mentions patient '{full_name}', which violates active context lock for '{norm_active_id}'.",
                rule_quoted=DIRECTIVE_1_QUOTE,
                source_file="1_lab_safety_rules.md",
                directive="1. PRIVACY AND DATA PROTECTION",
            )
        # Check first and last names individually (e.g. "Bob", "Diana", "Hart")
        parts = full_name.split()
        for p in parts:
            if len(p) >= 4 and re.search(r"\b" + re.escape(p.lower()) + r"\b", q_lower):
                # Ensure the name part does not match the active patient's name
                if active_patient_name and p.lower() in active_patient_name.lower():
                    continue
                return False, PrivacyRefusal(
                    refusal=True,
                    reason=f"Query mentions name '{p}' of another patient, violating context lock.",
                    rule_quoted=DIRECTIVE_1_QUOTE,
                    source_file="1_lab_safety_rules.md",
                    directive="1. PRIVACY AND DATA PROTECTION",
                )

    return True, None
