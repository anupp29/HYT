"""
HYT ATS - Gate 2: Privacy Shield (PII Redaction & GitHub Extraction)
=====================================================================
Strictly enforces Principle 8: PII is masked before any LLM call.
Extracts candidate GitHub URL and strips all contact PII (email, phone,
external non-GitHub URLs, candidate name) from the layout-extracted text.

Guarantees:
  1. GitHub profile link/handle is saved to candidate record prior to redaction.
  2. Emails, phone numbers, and portfolio links are redacted with standard tokens.
  3. Candidate name on top header is replaced with [CANDIDATE].
  4. Raw contact details never reach an external LLM API.
"""

import re
from typing import Tuple, Optional, Dict, Any, List
from pydantic import BaseModel

from src.utils.logger import get_logger

logger = get_logger("GATE_2_PII_MASKING")

# Regex Patterns for PII
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')

PHONE_REGEXES = [
    # US / Standard: +1 (555) 123-4567, 555-123-4567, 555.123.4567
    re.compile(r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),
    # International / 10-12 digits with optional country code (+91 9876543210, etc.)
    re.compile(r'(?:\+\d{1,3}[-.\s]?)?\b\d{5}[-.\s]?\d{5}\b'),
    re.compile(r'(?:\+\d{1,3}[-.\s]?)?\b\d{10}\b'),
]

GITHUB_REGEX = re.compile(
    r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/?',
    re.IGNORECASE,
)

LINKEDIN_REGEX = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_\-\.%]+/?', re.IGNORECASE)
GENERIC_URL_REGEX = re.compile(r'https?://(?!(?:www\.)?github\.com)[^\s<>"\'\)]+', re.IGNORECASE)
WWW_URL_REGEX = re.compile(r'\bwww\.(?!(?:www\.)?github\.com)[^\s<>"\'\)]+', re.IGNORECASE)

COMMON_HEADER_EXCLUSIONS = {
    "resume", "curriculum", "vitae", "cv", "summary", "experience", "profile",
    "education", "skills", "contact", "developer", "engineer", "software",
}


class PIIMaskResult(BaseModel):
    """Result of Gate 2 PII Redaction."""
    masked_clean_text: str
    github_url: Optional[str] = None
    github_handle: Optional[str] = None
    redacted_email_count: int = 0
    redacted_phone_count: int = 0
    redacted_url_count: int = 0
    name_masked: bool = False


def mask_pii(clean_text: str, candidate_id: Optional[str] = None) -> PIIMaskResult:
    """
    Extracts GitHub credentials and redacts contact PII from clean resume text.
    
    Args:
        clean_text: Layout-aware plain text from Gate 1.
        candidate_id: Optional candidate ID for logging.
        
    Returns:
        PIIMaskResult containing masked text and extracted GitHub details.
    """
    cid = candidate_id or "UNKNOWN"
    text = clean_text

    # 1. Extract GitHub URL and Handle (before any masking)
    github_url, github_handle = _extract_github_profile(text)
    if github_handle:
        logger.info(f"Extracted candidate GitHub handle: @{github_handle}", gate="GATE_2", candidate_id=cid)
    else:
        logger.info("No GitHub profile link detected in resume text.", gate="GATE_2", candidate_id=cid)

    # 2. Redact Emails
    email_matches = EMAIL_REGEX.findall(text)
    redacted_email_count = len(email_matches)
    text = EMAIL_REGEX.sub("[EMAIL]", text)

    # 3. Redact Phone Numbers
    redacted_phone_count = 0
    for p_regex in PHONE_REGEXES:
        p_matches = p_regex.findall(text)
        redacted_phone_count += len(p_matches)
        text = p_regex.sub("[PHONE]", text)

    # 4. Redact LinkedIn and Non-GitHub URLs
    linkedin_matches = LINKEDIN_REGEX.findall(text)
    text = LINKEDIN_REGEX.sub("[LINKEDIN]", text)

    generic_matches = GENERIC_URL_REGEX.findall(text)
    text = GENERIC_URL_REGEX.sub("[URL]", text)

    www_matches = WWW_URL_REGEX.findall(text)
    text = WWW_URL_REGEX.sub("[URL]", text)

    redacted_url_count = len(linkedin_matches) + len(generic_matches) + len(www_matches)

    # 5. Mask Candidate Name (First 1-3 lines header analysis)
    text, name_masked = _mask_candidate_name(text)

    logger.info(
        f"Redacted {redacted_email_count} emails, {redacted_phone_count} phones, "
        f"{redacted_url_count} URLs. Name masked: {name_masked}.",
        gate="GATE_2",
        candidate_id=cid,
    )

    return PIIMaskResult(
        masked_clean_text=text,
        github_url=github_url,
        github_handle=github_handle,
        redacted_email_count=redacted_email_count,
        redacted_phone_count=redacted_phone_count,
        redacted_url_count=redacted_url_count,
        name_masked=name_masked,
    )


def _extract_github_profile(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Identifies and normalizes GitHub URL and handle."""
    match = GITHUB_REGEX.search(text)
    if match:
        handle = match.group(1).strip()
        # Exclude reserved words or invalid handles
        if handle.lower() not in {"explore", "topics", "trending", "collections", "events", "features", "about"}:
            clean_url = f"https://github.com/{handle}"
            return clean_url, handle
    return None, None


def _mask_candidate_name(text: str) -> Tuple[str, bool]:
    """Identifies and replaces the candidate name on the header line with [CANDIDATE]."""
    lines = text.splitlines()
    name_masked = False

    for idx in range(min(4, len(lines))):
        line = lines[idx].strip()
        if not line or len(line) < 3 or len(line) > 50:
            continue

        # Check if line is purely words and not a known section header
        words = line.split()
        if 2 <= len(words) <= 4:
            is_header = any(w.lower() in COMMON_HEADER_EXCLUSIONS for w in words)
            is_alpha_name = all(re.match(r'^[A-Z][a-zA-Z\.\'-]*$', w) or w.isupper() for w in words)

            if is_alpha_name and not is_header:
                lines[idx] = "[CANDIDATE]"
                name_masked = True
                break

    return "\n".join(lines), name_masked
