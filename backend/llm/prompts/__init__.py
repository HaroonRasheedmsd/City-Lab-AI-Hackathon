"""Prompts package."""
from backend.llm.prompts.system import SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION
from backend.llm.prompts.explanation import build_explanation_prompt, EXPLANATION_PROMPT_VERSION
from backend.llm.prompts.doctor_questions import build_doctor_questions_prompt, DOCTOR_QUESTIONS_PROMPT_VERSION
from backend.llm.prompts.chat import build_chat_prompt, CHAT_PROMPT_VERSION

__all__ = [
    "SYSTEM_PROMPT",
    "SYSTEM_PROMPT_VERSION",
    "build_explanation_prompt",
    "EXPLANATION_PROMPT_VERSION",
    "build_doctor_questions_prompt",
    "DOCTOR_QUESTIONS_PROMPT_VERSION",
    "build_chat_prompt",
    "CHAT_PROMPT_VERSION",
]
