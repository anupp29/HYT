"""
HYT ATS - Phase 3 Verification Test Suite (Gates 1, 2, and 3)
============================================================
Verifies:
1. Gate 1: Layout-aware text extraction and multi-column ordering
2. Gate 2: Contact PII redaction (email, phone, URLs, name) & GitHub extraction
3. Gate 3: Structured resume extraction adhering to ResumeStructured schema
4. Verified vs unverified skill separation (context sentence requirement)
5. Date overlap detection triggering DATE_SUSPICIOUS flag
6. Disk caching: second run of identical resume makes ZERO LLM calls
"""

import os
import sys
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.gates.gate1 import extract_clean_text, _extract_page_layout_aware
from src.gates.gate2 import mask_pii, PIIMaskResult
from src.gates.gate3 import (
    extract_structured_resume,
    _has_suspicious_date_overlap,
    ExperienceEntry,
    Skill,
)
from src.models.schemas import ResumeStructured, SeniorityLevel, VerificationFlag
from src.utils.cache import get_cache_manager


SAMPLE_DIR = PROJECT_ROOT / "data" / "sample"


def test_gate1_layout_extraction():
    """Verify Gate 1 extracts non-empty text preserving reading flow from real PDFs."""
    sample_pdfs = list(SAMPLE_DIR.glob("*.pdf"))[:3]
    assert len(sample_pdfs) >= 3

    for pdf in sample_pdfs:
        text = extract_clean_text(str(pdf))
        assert len(text) > 100
        assert not text.startswith("PDF-")  # Clean text, not raw bytes
        assert "\n" in text  # Preserves structure


def test_gate2_pii_redaction_and_github_extraction():
    """Verify that Gate 2 redacts contact PII while preserving and extracting GitHub."""
    sample_text = (
        "JOHNATHAN DOE\n"
        "Senior Backend Engineer\n"
        "Contact: john.doe@example.com | +1 (555) 234-5678 | (415) 987-6543\n"
        "GitHub: https://github.com/johndoe-dev\n"
        "LinkedIn: https://linkedin.com/in/johndoe-profile\n"
        "Portfolio: https://myportfolio.io/projects\n\n"
        "EXPERIENCE\n"
        "Staff Engineer at Acme Corp (2020 - Present)\n"
        "- Built distributed services in Python and Go.\n"
    )

    res = mask_pii(sample_text, candidate_id="test_cand_01")
    assert isinstance(res, PIIMaskResult)

    # 1. GitHub Profile Extracted
    assert res.github_handle == "johndoe-dev"
    assert res.github_url == "https://github.com/johndoe-dev"

    # 2. Contact PII Redacted
    assert "john.doe@example.com" not in res.masked_clean_text
    assert "[EMAIL]" in res.masked_clean_text
    assert "555" not in res.masked_clean_text
    assert "[PHONE]" in res.masked_clean_text
    assert "linkedin.com/in" not in res.masked_clean_text
    assert "[LINKEDIN]" in res.masked_clean_text
    assert "myportfolio.io" not in res.masked_clean_text
    assert "[URL]" in res.masked_clean_text

    # 3. Name Redacted on Header Line
    assert "JOHNATHAN DOE" not in res.masked_clean_text
    assert "[CANDIDATE]" in res.masked_clean_text


def test_gate3_verified_vs_unverified_skills():
    """Verify skills with context are marked verified; listed-only skills are unverified."""
    mock_llm_json = {
        "estimated_years_experience": 5.0,
        "seniority_level": "senior",
        "skills": [
            {
                "name": "Python",
                "context": "Built high-throughput microservices in Python handling 10k RPS.",
                "is_verified": True,
                "years_experience": 5.0,
            },
            {
                "name": "Kubernetes",
                "context": None,
                "is_verified": False,
                "years_experience": 2.0,
            },
        ],
        "experience": [
            {
                "title": "Senior Engineer",
                "company": "Tech Corp",
                "start_date": "2019",
                "end_date": "Present",
                "years": 5.0,
                "bullets": ["Built high-throughput microservices in Python handling 10k RPS."],
                "skills_demonstrated": ["Python"],
            }
        ],
        "education": [],
        "current_location": "San Francisco, CA",
    }

    with patch("src.utils.llm_client.LLMClient.complete", return_value=json.dumps(mock_llm_json)):
        structured = extract_structured_resume("clean resume text", candidate_id="test_cand_skills", use_cache=False)
        assert isinstance(structured, ResumeStructured)
        assert len(structured.verified_skills) == 1
        assert structured.verified_skills[0].name == "Python"
        assert len(structured.unverified_skills) == 1
        assert structured.unverified_skills[0].name == "Kubernetes"


def test_date_overlap_detection():
    """Verify that concurrent overlapping full-time roles trigger DATE_SUSPICIOUS flag."""
    overlapping_roles = [
        ExperienceEntry(
            title="Senior Engineer",
            company="Company A",
            start_date="Jan 2021",
            end_date="Dec 2023",
            years=3.0,
        ),
        ExperienceEntry(
            title="Lead Engineer",
            company="Company B",
            start_date="Mar 2022",
            end_date="Present",
            years=2.0,
        ),
    ]

    # Concurrent overlap from March 2022 to December 2023 (> 1.5 years) between distinct companies
    assert _has_suspicious_date_overlap(overlapping_roles) is True

    # Sequential non-overlapping roles
    sequential_roles = [
        ExperienceEntry(
            title="Junior Engineer",
            company="Company A",
            start_date="Jan 2018",
            end_date="Dec 2020",
            years=3.0,
        ),
        ExperienceEntry(
            title="Senior Engineer",
            company="Company B",
            start_date="Jan 2021",
            end_date="Present",
            years=3.0,
        ),
    ]
    assert _has_suspicious_date_overlap(sequential_roles) is False


def test_gate3_disk_caching():
    """Verify that a second extraction of identical resume makes zero LLM calls."""
    import time
    cache = get_cache_manager()
    test_text = f"Sample masked candidate resume with unique timestamp {time.time()} for disk caching."
    cid = "test_cache_cand"

    mock_llm_json = {
        "estimated_years_experience": 4.0,
        "seniority_level": "mid",
        "skills": [{"name": "Java", "context": "Developed Spring services", "is_verified": True}],
        "experience": [],
        "education": [],
    }

    with patch("src.utils.llm_client.LLMClient.complete", return_value=json.dumps(mock_llm_json)) as mock_call:
        # Run 1: Miss & Populate
        res1 = extract_structured_resume(test_text, candidate_id=cid, use_cache=True)
        assert mock_call.call_count == 1
        assert cache.has("resumes", res1.content_hash) is True

        # Run 2: Guaranteed Cache Hit (mock must NOT be called again)
        res2 = extract_structured_resume(test_text, candidate_id=cid, use_cache=True)
        assert mock_call.call_count == 1  # Still 1, zero additional calls!
        assert res1.content_hash == res2.content_hash
        assert res1.estimated_years_experience == res2.estimated_years_experience


def test_gate3_extraction_failure_escalation():
    """Verify that unrecoverable LLM failures trigger truthful grounded fallback and escalation flags."""
    raw_text = """
    Software Engineer with experience in Python and PostgreSQL.
    Worked from 2019 to 2023 developing backend data pipelines.
    Bachelor of Science in Computer Science.
    """
    with patch("src.utils.llm_client.LLMClient.complete", side_effect=ValueError("Corrupted JSON output")):
        res = extract_structured_resume(raw_text, candidate_id="cand_fail_escalate", use_cache=False)
        assert isinstance(res, ResumeStructured)
        # Must flag extraction failure for recruiter review
        assert VerificationFlag.EXTRACTION_FAILED.value in res.verification_flags
        assert VerificationFlag.PARSING_ERROR.value in res.verification_flags
        # Grounded experience: 2023 - 2019 = 4.0 years
        assert res.estimated_years_experience == 4.0
        # Truthful skill extraction without fake companies
        skill_names = [s.name.lower() for s in res.skills]
        assert "python" in skill_names
        assert "postgresql" in skill_names

