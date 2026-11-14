"""Deterministic chat intent classifier and safety router."""

from enum import Enum
import re
from typing import Optional, Tuple
from backend.models.schemas import PrivacyRefusal
from backend.privacy.guard import check_privacy_context_lock


class ChatIntent(str, Enum):
    """Routing categories for user chat messages."""
    ALLOWED_QA = "ALLOWED_QA"
    DIAGNOSIS_REQUEST = "DIAGNOSIS_REQUEST"
    OTHER_PATIENT_REQUEST = "OTHER_PATIENT_REQUEST"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    URGENT_SYMPTOM = "URGENT_SYMPTOM"


URGENT_SYMPTOM_PATTERNS = [
    r"(?i)\bchest\s+pain\b",
    r"(?i)\bcan(?:'t|not)\s+breathe\b",
    r"(?i)\bdifficulty\s+breathing\b",
    r"(?i)\bshortness\s+of\s+breath\b",
    r"(?i)\bsevere\s+bleeding\b",
    r"(?i)\bunconscious\b",
    r"(?i)\bpassed\s+out\b",
    r"(?i)\bheart\s+attack\b",
    r"(?i)\bstroke\b",
    r"(?i)\bcoughing\s+up\s+blood\b",
    r"(?i)\bseizure\b",
]

DIAGNOSIS_REQUEST_PATTERNS = [
    r"(?i)\bdo\s+i\s+have\s+(?:diabetes|cancer|hepatitis|anemia|disease|covid|a\s+condition)\b",
    r"(?i)\bwhat\s+disease\s+do\s+i\s+have\b",
    r"(?i)\bdiagnose\s+me\b",
    r"(?i)\bwhat\s+is\s+my\s+diagnosis\b",
    r"(?i)\bam\s+i\s+sick\b",
    r"(?i)\bdo\s+these\s+results\s+mean\s+i\s+have\b",
    r"(?i)\btell\s+me\s+if\s+i\s+have\b",
]

OUT_OF_SCOPE_PATTERNS = [
    r"(?i)\bprescribe\b",
    r"(?i)\b(?:dose|dosage)\b",
    r"(?i)\bshould\s+i\s+take\b",
    r"(?i)\b(?:ibuprofen|aspirin|tylenol|paracetamol|insulin|metformin|antibiotics?|advil)\b",
    r"(?i)\bwho\s+won\s+the\b",
    r"(?i)\bwrite\s+a\s+(?:poem|essay|code|script)\b",
    r"(?i)\bweather\b",
    r"(?i)\brecipe\b",
]


def classify_chat_intent(
    query_text: str,
    active_patient_id: str,
    active_patient_name: Optional[str] = None,
) -> Tuple[ChatIntent, Optional[PrivacyRefusal], Optional[str]]:
    """
    Classify the user's chat message using pure code-based rules.
    
    Returns:
        (intent, privacy_refusal_if_any, routing_message_if_any)
    """
    # 1. Other Patient Check (Strict Privacy Lock)
    allowed, refusal = check_privacy_context_lock(
        query_text=query_text,
        active_patient_id=active_patient_id,
        active_patient_name=active_patient_name,
    )
    if not allowed and refusal:
        return ChatIntent.OTHER_PATIENT_REQUEST, refusal, refusal.rule_quoted

    # 2. Urgent Emergency Symptoms
    for pattern in URGENT_SYMPTOM_PATTERNS:
        if re.search(pattern, query_text):
            msg = (
                "EMERGENCY WARNING: Your message mentions severe or urgent symptoms. "
                "This AI system cannot provide emergency medical care. Please call 911 or your local "
                "emergency services immediately, or go to the nearest emergency room."
            )
            return ChatIntent.URGENT_SYMPTOM, None, msg

    # 3. Diagnosis Request Refusal
    for pattern in DIAGNOSIS_REQUEST_PATTERNS:
        if re.search(pattern, query_text):
            msg = (
                "I cannot tell you whether you have a specific disease or diagnose any condition. "
                "Per CityLab safety rules, only a licensed medical doctor can diagnose medical conditions. "
                "I can explain what your numbers measure, and give you questions to ask your physician."
            )
            return ChatIntent.DIAGNOSIS_REQUEST, None, msg

    # 4. Out of Scope (Medication, Dosages, General Topics)
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, query_text):
            msg = "This is not covered in the lab's files. Please consult a licensed physician or pharmacist."
            return ChatIntent.OUT_OF_SCOPE, None, msg

    # 5. Allowed Q&A
    return ChatIntent.ALLOWED_QA, None, None
