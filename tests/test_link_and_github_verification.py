"""
Tests for Gate 1 Hyperlink Extraction and Gate 4 Project Repository & Live URL Verification.
"""

import pytest
from src.gates.gate2 import mask_pii
from src.gates.gate4 import fetch_repo_pin, verify_live_url, evaluate_gate4
from src.models.schemas import (
    ResumeStructured,
    Skill,
    ExperienceEntry,
    EducationEntry,
    SeniorityLevel,
    CandidateRecord,
    ScoringBreakdown,
    DecisionType,
)
from src.utils.output import format_candidate_record


def test_gate2_link_and_repo_extraction():
    sample_text = """
    Anup Patil
    anuppatil.asp29@gmail.com | +91 9876543210
    [linkedin.com/in/anuppatil29](https://linkedin.com/in/anuppatil29) | [github.com/anupp29](https://github.com/anupp29)
    
    PROJECTS
    ATLAS – AIOps Platform | [GitHub](https://github.com/anupp29/atlas) | [Live](https://atlas-dhe.vercel.app)
    Udyami-AI – AI ERP | [GitHub](https://github.com/harshgit8/Udyami-AI/) | [Live](https://udyami.co.in)
    Guard – Cyber Threat Detection | [GitHub](https://github.com/anupp29/guard)
    """
    
    res = mask_pii(sample_text, candidate_id="test_candidate")
    
    assert res.github_handle == "anupp29"
    assert "anupp29/atlas" in res.project_repos
    assert "harshgit8/Udyami-AI" in res.project_repos
    assert "anupp29/guard" in res.project_repos
    assert "https://atlas-dhe.vercel.app" in res.live_urls
    assert "https://udyami.co.in" in res.live_urls
    assert res.redacted_email_count >= 1
    assert res.redacted_phone_count >= 1


def test_verify_live_url_mock():
    # Test valid URL probe
    res = verify_live_url("https://httpbin.org/status/200", timeout=5)
    # Even if offline, verify schema keys exist
    assert "url" in res
    assert "is_live" in res
    assert "status_code" in res


def test_gate4_evaluation_with_projects():
    resume = ResumeStructured(
        candidate_id="cand_123",
        estimated_years_experience=3.0,
        seniority_level=SeniorityLevel.MID,
        skills=[
            Skill(name="Python", is_verified=True, context="Built ATLAS backend"),
            Skill(name="FastAPI", is_verified=True, context="Developed REST APIs"),
            Skill(name="TypeScript", is_verified=False),
        ],
        experience=[
            ExperienceEntry(
                title="Full Stack Engineer",
                company="Tech Corp",
                bullets=["Built microservices in Python and FastAPI"],
                skills_demonstrated=["Python", "FastAPI"],
            )
        ],
        education=[EducationEntry(institution="IITM", degree="BS")],
        github_handle="anupp29",
        content_hash="dummy_hash",
    )
    
    report = evaluate_gate4(
        resume=resume,
        github_url="https://github.com/anupp29",
        github_handle="anupp29",
        candidate_id="cand_123",
        use_cache=True,
        project_repos=["anupp29/atlas"],
        live_urls=["https://atlas-dhe.vercel.app"],
    )
    
    assert report.candidate_id == "cand_123"
    assert report.github_handle == "anupp29"
    assert isinstance(report.project_repos, list)
    assert isinstance(report.live_urls, list)


def test_output_formatting_with_github_card():
    breakdown = ScoringBreakdown(
        technical_score=85.0,
        experience_score=80.0,
        seniority_score=75.0,
        education_score=85.0,
        location_score=100.0,
        weighted_total=82.5,
    )
    
    record = CandidateRecord(
        candidate_id="anuppatil",
        job_id="2234533717",
        job_title="Senior Python Backend Engineer",
        final_score=82.5,
        decision=DecisionType.AUTO_ADVANCE,
        decision_reason="Strong Python background and verified open-source projects",
        scoring_breakdown=breakdown,
        ledger=[],
        top_strengths=["Python", "FastAPI"],
        critical_gaps=[],
        github_stats={
            "handle": "anupp29",
            "rank": "B-",
            "commits": 356,
            "prs": 11,
            "stars": "3",
            "contribs": "2",
            "languages": ["Python", "TypeScript"],
        },
        project_repos=[
            {"repo": "anupp29/atlas", "primary_language": "Python", "stars": "1", "forks": "1"},
        ],
        live_urls=[
            {"url": "https://atlas-dhe.vercel.app", "status_code": 200, "is_live": True},
        ],
        processed_at="2026-10-16T15:00:00",
    )
    
    formatted = format_candidate_record(record)
    assert "GITHUB & FLAGSHIP PROJECT AUDIT" in formatted
    assert "@anupp29" in formatted
    assert "anupp29/atlas" in formatted
    assert "https://atlas-dhe.vercel.app" in formatted
    assert "HTTP 200 (ONLINE)" in formatted
