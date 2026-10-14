"""
Tests for Phase 4: Gate 4 Verification Layer
=============================================
Validates:
  1. Skill Depth Audit (triggers SHALLOW_PROFILE when unverified ratio exceeds threshold).
  2. Verified Skill Depth (no flag when sufficient context exists).
  3. Graceful Null GitHub handling (neutral recruiter note, zero flags, zero penalty).
  4. GitHub Top Languages & Stats extraction from proxy.
  5. Language Stack Mismatch detection (GITHUB_MISMATCH).
  6. GitHub Inactivity detection (GITHUB_INACTIVE).
  7. GitHub 404 user not found handling (GITHUB_NOT_FOUND).
  8. Resilience to network failure / timeouts (pipeline never crashes).
  9. Disk caching of GitHub lookups across runs.
"""

import time
import pytest
from unittest.mock import patch, MagicMock

from src.models.schemas import (
    ResumeStructured,
    Skill,
    ExperienceEntry,
    EducationEntry,
    SeniorityLevel,
    VerificationFlag,
    Gate4VerificationReport,
)
from src.gates.gate4 import (
    audit_skill_depth,
    fetch_github_profile_data,
    cross_check_github,
    evaluate_gate4,
)
from src.utils.cache import get_cache_manager


@pytest.fixture
def mock_clean_resume() -> ResumeStructured:
    """Creates a resume with verified skills and sufficient depth."""
    return ResumeStructured(
        candidate_id="cand_clean_001",
        content_hash="clean_hash_123456",
        estimated_years_experience=4.0,
        seniority_level=SeniorityLevel.MID,
        skills=[
            Skill(name="Python", context="Built scalable microservices using FastAPI and Celery.", is_verified=True),
            Skill(name="PostgreSQL", context="Optimized complex SQL queries reducing latency by 45%.", is_verified=True),
            Skill(name="Docker", context="Containerized backend services and configured Docker Compose.", is_verified=True),
            Skill(name="AWS", context="Deployed ECS clusters and configured S3 lifecycle policies.", is_verified=True),
            Skill(name="Redis", context=None, is_verified=False),
        ],
        experience=[
            ExperienceEntry(
                title="Backend Engineer",
                company="Tech Corp",
                start_date="2022-01",
                end_date="2024-01",
                years=2.0,
                bullets=["Built scalable microservices using FastAPI and Celery."],
                skills_demonstrated=["Python", "PostgreSQL", "Docker", "AWS"],
            )
        ],
        education=[
            EducationEntry(
                institution="State University",
                degree="B.S.",
                field_of_study="Computer Science",
                graduation_year=2021,
            )
        ],
        current_location="San Francisco, CA",
    )


@pytest.fixture
def mock_shallow_resume() -> ResumeStructured:
    """Creates a resume where 80% of skills have no demonstrated context (shallow)."""
    return ResumeStructured(
        candidate_id="cand_shallow_002",
        content_hash="shallow_hash_789012",
        estimated_years_experience=2.0,
        seniority_level=SeniorityLevel.JUNIOR,
        skills=[
            Skill(name="Python", context="Built basic web scrapers using requests.", is_verified=True),
            Skill(name="Kubernetes", context=None, is_verified=False),
            Skill(name="Rust", context=None, is_verified=False),
            Skill(name="Go", context=None, is_verified=False),
            Skill(name="Kafka", context=None, is_verified=False),
        ],
        experience=[],
        education=[],
        current_location="Remote",
    )


# ------------------------------------------------------------------------------
# 1. Skill Depth Audit Tests
# ------------------------------------------------------------------------------

def test_skill_depth_shallow_profile_flag(mock_shallow_resume):
    """Resume with 80% unverified skills must trigger SHALLOW_PROFILE flag."""
    is_shallow, ratio, total, unv_count, note = audit_skill_depth(
        mock_shallow_resume.skills,
        threshold=0.60,
    )
    assert is_shallow is True
    assert ratio == 0.80
    assert total == 5
    assert unv_count == 4
    assert "SHALLOW PROFILE" in note


def test_skill_depth_verified_profile(mock_clean_resume):
    """Resume with 80% verified skills must NOT trigger SHALLOW_PROFILE."""
    is_shallow, ratio, total, unv_count, note = audit_skill_depth(
        mock_clean_resume.skills,
        threshold=0.60,
    )
    assert is_shallow is False
    assert ratio == 0.20
    assert total == 5
    assert unv_count == 1
    assert "Skill Depth Verified" in note


# ------------------------------------------------------------------------------
# 2. Graceful Null GitHub Handling (Zero Penalty Principle)
# ------------------------------------------------------------------------------

def test_null_github_url_produces_no_penalty(mock_clean_resume):
    """Missing GitHub URL produces neutral observation, 0 flags, and 0 penalties."""
    report = evaluate_gate4(
        resume=mock_clean_resume,
        github_url=None,
        github_handle=None,
        candidate_id="cand_no_gh",
    )
    assert len(report.flags) == 0
    assert report.is_verified is True
    assert any("No GitHub profile URL provided" in n for n in report.ledger_notes)


# ------------------------------------------------------------------------------
# 3. GitHub Proxy Parsing & Stats
# ------------------------------------------------------------------------------

@patch("src.gates.gate4.requests.get")
def test_github_proxy_extraction(mock_get, mock_clean_resume):
    """Mocks github-readme-stats SVG responses and validates metric parsing."""
    # Top Langs SVG mock
    lang_svg = """
    <svg><g>
        <text data-testid="lang-name">Python 65.40%</text>
        <text data-testid="lang-name">JavaScript 24.60%</text>
        <text data-testid="lang-name">Docker 10.00%</text>
    </g></svg>
    """
    # Stats SVG mock
    stats_svg = """
    <svg><g>
        <text data-testid="commits">142</text>
        <text data-testid="prs">12</text>
        <text data-testid="level-rank-icon">A</text>
    </g></svg>
    """

    def side_effect(url, headers, timeout):
        resp = MagicMock()
        resp.status_code = 200
        if "top-langs" in url:
            resp.text = lang_svg
        else:
            resp.text = stats_svg
        return resp

    mock_get.side_effect = side_effect

    data = fetch_github_profile_data(
        github_handle=f"test_dev_{int(time.time() * 1000)}",
        use_cache=False,
    )
    assert "Python" in data["languages"]
    assert data["languages"]["Python"] == 65.40
    assert data["recent_commits"] == 142
    assert data["total_prs"] == 12
    assert data["rank"] == "A"


# ------------------------------------------------------------------------------
# 4. GitHub Stack Alignment Mismatch Test
# ------------------------------------------------------------------------------

@patch("src.gates.gate4.fetch_github_profile_data")
def test_github_stack_mismatch_detected(mock_fetch, mock_clean_resume):
    """Candidate claiming Python & Docker whose GitHub is 100% PHP/Ruby triggers GITHUB_MISMATCH."""
    mock_fetch.return_value = {
        "handle": "php_fan",
        "languages": {"PHP": 85.0, "Ruby": 15.0},
        "recent_commits": 50,
        "active_in_lookback": True,
    }

    # Candidate claims Python and PostgreSQL (no overlap with PHP/Ruby)
    report = evaluate_gate4(
        resume=mock_clean_resume,
        github_handle="php_fan",
        candidate_id="cand_mismatch",
        use_cache=False,
    )
    assert VerificationFlag.GITHUB_MISMATCH in report.flags
    assert VerificationFlag.GITHUB_LANGUAGE_MISMATCH in report.flags
    assert any("GITHUB STACK MISMATCH" in n for n in report.ledger_notes)


# ------------------------------------------------------------------------------
# 5. GitHub Inactivity Test
# ------------------------------------------------------------------------------

@patch("src.gates.gate4.fetch_github_profile_data")
def test_github_inactivity_detected(mock_fetch, mock_clean_resume):
    """Candidate with inactive profile triggers GITHUB_INACTIVE flag."""
    mock_fetch.return_value = {
        "handle": "inactive_coder",
        "languages": {"Python": 100.0},
        "recent_commits": 0,
        "active_in_lookback": False,
    }

    report = evaluate_gate4(
        resume=mock_clean_resume,
        github_handle="inactive_coder",
        candidate_id="cand_inactive",
        use_cache=False,
    )
    assert VerificationFlag.GITHUB_INACTIVE in report.flags
    assert any("GITHUB INACTIVE" in n for n in report.ledger_notes)
    assert "Python" in report.inactive_skills


# ------------------------------------------------------------------------------
# 6. GitHub 404 User Not Found Test
# ------------------------------------------------------------------------------

@patch("src.gates.gate4.fetch_github_profile_data")
def test_github_404_not_found_handling(mock_fetch, mock_clean_resume):
    """Non-existent GitHub user triggers GITHUB_NOT_FOUND flag."""
    mock_fetch.return_value = {
        "handle": "ghost_user_12345",
        "not_found": True,
        "languages": {},
        "recent_commits": 0,
    }

    report = evaluate_gate4(
        resume=mock_clean_resume,
        github_handle="ghost_user_12345",
        candidate_id="cand_ghost",
        use_cache=False,
    )
    assert VerificationFlag.GITHUB_NOT_FOUND in report.flags
    assert any("GITHUB NOT FOUND" in n for n in report.ledger_notes)


# ------------------------------------------------------------------------------
# 7. Fault-Tolerant Network Resilience (Pipeline Never Crashes)
# ------------------------------------------------------------------------------

@patch("src.gates.gate4.requests.get")
def test_github_network_outage_resilience(mock_get, mock_clean_resume):
    """Network connection timeout or DNS error must be handled without failing pipeline."""
    import requests
    mock_get.side_effect = requests.exceptions.ConnectTimeout("Connection timed out to GitHub proxy")

    # Should not raise exception
    report = evaluate_gate4(
        resume=mock_clean_resume,
        github_handle=f"offline_dev_{int(time.time() * 1000)}",
        candidate_id="cand_offline",
        use_cache=False,
    )
    assert report is not None
    # No penalty or negative flags should be added for infrastructure outages
    assert VerificationFlag.GITHUB_MISMATCH not in report.flags
    assert any("GitHub service unavailable" in n for n in report.ledger_notes)


# ------------------------------------------------------------------------------
# 8. GitHub Disk Caching Test
# ------------------------------------------------------------------------------

@patch("src.gates.gate4._fetch_from_github_readme_stats")
def test_github_disk_caching(mock_proxy, mock_clean_resume):
    """Second lookup for the same GitHub handle must hit cache with 0 network calls."""
    unique_user = f"cached_user_{int(time.time() * 1000)}"
    mock_proxy.return_value = {
        "handle": unique_user,
        "languages": {"Python": 100.0},
        "recent_commits": 25,
        "active_in_lookback": True,
        "source": "github-readme-stats",
    }

    # Call 1: Miss
    res1 = fetch_github_profile_data(unique_user, use_cache=True)
    assert mock_proxy.call_count == 1
    assert res1["handle"] == unique_user

    # Call 2: Hit
    res2 = fetch_github_profile_data(unique_user, use_cache=True)
    assert mock_proxy.call_count == 1  # Still 1! Cache hit!
    assert res2["languages"] == {"Python": 100.0}
