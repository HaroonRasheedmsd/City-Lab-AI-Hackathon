"""Prompt injection defense and input sanitization."""

import re

INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior)\s+commands\b",
    r"(?i)\byou\s+are\s+now\s+(?:a|an)?\b",
    r"(?i)\bpretend\s+you\s+are\b",
    r"(?i)\bact\s+as\s+(?:a|an)?\b",
    r"(?i)\bjailbreak\b",
    r"(?i)\bdan\s+mode\b",
    r"(?i)\boverride\s+(?:system\s+)?rules\b",
    r"(?i)\bforget\s+(?:everything|all)\s+prior\b",
    r"(?i)<\s*\|\s*im_start\s*\|\s*>",
    r"(?i)<\s*\|\s*im_end\s*\|\s*>",
    r"(?i)<\s*\|\s*endoftext\s*\|\s*>",
    r"(?i)###\s*(?:system|assistant|instruction):?",
    r"(?i)system\s*:",
]


def sanitize_input_text(text: str) -> str:
    """Sanitize free-text inputs from reports and chat to neutralize prompt injection attempts."""
    if not text:
        return ""

    sanitized = text
    for pattern in INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[UNTRUSTED_CONTENT_FILTERED]", sanitized)

    # Strip dangerous HTML/script tags
    sanitized = re.sub(r"(?i)<\s*script[^>]*>.*?<\s*/\s*script\s*>", "[SCRIPT_REMOVED]", sanitized)

    # Normalize excessive control characters
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", sanitized)

    return sanitized.strip()
