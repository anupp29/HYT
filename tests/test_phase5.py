"""
Tests for Phase 5: Gate 5 (Pre-Filter) and Gate 6 (Deterministic Scoring Engine)
================================================================================
Validates:
  1. Gate 5 pre-filter correctly passes valid SWE candidate.
  2. Gate 5 pre-filter escalates obvious domain mismatch (e.g. nurse/healthcare resume).
  3. Gate 6 hard gate correctly identifies missing must-haves among verified skills.
  4. Unverified skills contribute partial credit only (0.45 weight vs 1.0 full weight).
  5. Deterministic scoring: identical inputs always yield identical floating point scores.
  6. Seniority alignment and overqualification detection.
  7. Non-fatal policy: Education and Location alone NEVER produce 0.0.
  8. Mandatory Evidence Ledger completeness assertions.
  9. Final score is strictly bounded in [0.0, 100.0].
"""

import math
import pytest
from unittest.mock import patch, MagicMock

from src.models.schemas import (
    ResumeStructured,
    Skill,
    ExperienceEntry,
    EducationEntry,
    SeniorityLevel,
    JobDescription,
    DimensionType,
    DecisionType,
    ScoringLedger,
)
from src.gates.gate5 import evaluate_gate5
from src.gates.gate6 import evaluate_gate6, _assert_ledger_completeness


@pytest.fixture
def sample_swe_jd() -> JobDescription:
    """Standard Backend SWE Job Description."""
    return JobDescription(
        job_id="test_jd_backend",
        title="Senior Backend Engineer",
        company="HuntYourTribe",
        seniority_level=SeniorityLevel.SENIOR,
        min_years_experience=5.0,
        must_have_skills=["Python", "PostgreSQL", "Docker", "Kubernetes"],
        nice_to_have_skills=["AWS", "Redis", "Kafka"],
        education_requirement="Bachelor's degree in Computer Science or related field",
        location="San Francisco, CA",
        remote_policy="Hybrid",
        domain_context="Distributed backend systems and microservices",
        content_hash="hash_jd_backend_12345",
    )


@pytest.fixture
def sample_swe_resume() -> ResumeStructured:
    """Strong matching Senior SWE Resume."""
    return ResumeStructured(
        candidate_id="cand_senior_swe",
        content_hash="hash_cand_swe_999",
        estimated_years_experience=6.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[
            Skill(name="Python", context="Developed asynchronous REST APIs using FastAPI and Python 3.11.", is_verified=True),
            Skill(name="PostgreSQL", context="Designed partitioned PostgreSQL databases handling 50M records.", is_verified=True),
            Skill(name="Docker", context="Containerized backend services with multi-stage Dockerfiles.", is_verified=True),
            Skill(name="Kubernetes", context="Deployed Helm charts to production EKS Kubernetes clusters.", is_verified=True),
            Skill(name="AWS", context="Provisioned S3, SQS, and RDS instances via Terraform.", is_verified=True),
            Skill(name="Redis", context=None, is_verified=False),
        ],
        experience=[
            ExperienceEntry(
                title="Senior Software Engineer",
                company="Tech Cloud Inc",
                start_date="2020-01",
                end_date="Present",
                years=4.0,
                bullets=["Developed asynchronous REST APIs using FastAPI and Python 3.11."],
                skills_demonstrated=["Python", "PostgreSQL", "Docker", "Kubernetes"],
            ),
            ExperienceEntry(
                title="Software Engineer",
                company="Data Startup",
                start_date="2018-01",
                end_date="2020-01",
                years=2.0,
                bullets=["Maintained PostgreSQL database."],
                skills_demonstrated=["Python", "PostgreSQL"],
            ),
        ],
        education=[
            EducationEntry(
                institution="UC Berkeley",
                degree="B.S.",
                field_of_study="Computer Science",
                graduation_year=2018,
            )
        ],
        current_location="San Francisco, CA",
    )


@pytest.fixture
def sample_nurse_resume() -> ResumeStructured:
    """Healthcare / Nursing resume for domain mismatch testing."""
    return ResumeStructured(
        candidate_id="cand_nurse_mismatch",
        content_hash="hash_cand_nurse_111",
        estimated_years_experience=5.0,
        seniority_level=SeniorityLevel.MID,
        skills=[
            Skill(name="Patient Care", context="Monitored vital signs and assisted in patient triage.", is_verified=True),
            Skill(name="Phlebotomy", context="Performed blood draws and IV placement.", is_verified=True),
            Skill(name="Medication Administration", context="Administered medications per physician orders.", is_verified=True),
            Skill(name="Electronic Health Records", context="Maintained Epic EHR records.", is_verified=True),
        ],
        experience=[
            ExperienceEntry(
                title="Registered Nurse",
                company="General Hospital",
                start_date="2019-01",
                end_date="Present",
                years=5.0,
                bullets=["Monitored vital signs and assisted in patient triage."],
                skills_demonstrated=["Patient Care", "Phlebotomy"],
            )
        ],
        education=[
            EducationEntry(
                institution="Nursing College",
                degree="B.S. Nursing",
                field_of_study="Nursing",
                graduation_year=2019,
            )
        ],
        current_location="San Francisco, CA",
    )


# ------------------------------------------------------------------------------
# 1. Gate 5 Pre-Filter Funnel Tests
# ------------------------------------------------------------------------------

def test_gate5_prefilter_passes_swe_resume(sample_swe_resume, sample_swe_jd):
    """Strong SWE candidate must pass Gate 5 pre-filter with high cosine similarity."""
    result = evaluate_gate5(sample_swe_resume, sample_swe_jd)
    assert result.passed is True
    assert result.skip_scoring is False
    assert result.similarity >= result.threshold
    assert result.decision is None


def test_gate5_prefilter_escalates_non_swe_resume(sample_nurse_resume, sample_swe_jd):
    """Non-SWE candidate (e.g. nurse) must trigger Gate 5 ESCALATE (skip_scoring=True)."""
    result = evaluate_gate5(sample_nurse_resume, sample_swe_jd)
    assert result.passed is False
    assert result.skip_scoring is True
    assert result.decision == DecisionType.ESCALATE
    assert "Job family mismatch suspected" in result.reason


# ------------------------------------------------------------------------------
# 2. Gate 6 Hard Gate Tests
# ------------------------------------------------------------------------------

def test_gate6_hard_gate_detects_missing_must_haves(sample_swe_jd):
    """If a candidate is missing a must-have skill, it must be recorded in hard_failures."""
    # Candidate missing Kubernetes
    resume_no_k8s = ResumeStructured(
        candidate_id="cand_no_k8s",
        content_hash="hash_no_k8s",
        estimated_years_experience=5.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[
            Skill(name="Python", context="Python development.", is_verified=True),
            Skill(name="PostgreSQL", context="SQL queries.", is_verified=True),
            Skill(name="Docker", context="Docker containers.", is_verified=True),
            # Kubernetes is NOT in skills
        ],
        experience=[],
        education=[],
        current_location="San Francisco, CA",
    )

    ledger = evaluate_gate6(resume_no_k8s, sample_swe_jd)
    assert "Kubernetes" in ledger.hard_failures
    assert ledger.hard_failures_count >= 1


# ------------------------------------------------------------------------------
# 3. Partial Credit for Unverified Skills
# ------------------------------------------------------------------------------

def test_gate6_unverified_skill_partial_credit(sample_swe_jd):
    """Unverified / listed-only skills must contribute partial credit, not full weight."""
    # Candidate A: Kubernetes is verified with evidence
    resume_verified = ResumeStructured(
        candidate_id="cand_verified",
        content_hash="hash_ver_1",
        estimated_years_experience=5.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[
            Skill(name="Python", context="Python coding.", is_verified=True),
            Skill(name="PostgreSQL", context="Postgres queries.", is_verified=True),
            Skill(name="Docker", context="Docker containers.", is_verified=True),
            Skill(name="Kubernetes", context="Kubernetes cluster orchestration in production.", is_verified=True),
        ],
        experience=[],
        education=[],
        current_location="San Francisco, CA",
    )

    # Candidate B: Kubernetes is listed only (unverified)
    resume_unverified = ResumeStructured(
        candidate_id="cand_unverified",
        content_hash="hash_unver_1",
        estimated_years_experience=5.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[
            Skill(name="Python", context="Python coding.", is_verified=True),
            Skill(name="PostgreSQL", context="Postgres queries.", is_verified=True),
            Skill(name="Docker", context="Docker containers.", is_verified=True),
            Skill(name="Kubernetes", context=None, is_verified=False),
        ],
        experience=[],
        education=[],
        current_location="San Francisco, CA",
    )

    ledger_ver = evaluate_gate6(resume_verified, sample_swe_jd)
    ledger_unver = evaluate_gate6(resume_unverified, sample_swe_jd)

    # Verified score must be strictly higher than unverified score
    assert ledger_ver.breakdown.technical_score > ledger_unver.breakdown.technical_score
    assert ledger_ver.breakdown.weighted_total > ledger_unver.breakdown.weighted_total


# ------------------------------------------------------------------------------
# 4. Strict Determinism Check
# ------------------------------------------------------------------------------

def test_gate6_strict_determinism(sample_swe_resume, sample_swe_jd):
    """Running Gate 6 on identical inputs twice must produce identical float scores."""
    run1 = evaluate_gate6(sample_swe_resume, sample_swe_jd)
    run2 = evaluate_gate6(sample_swe_resume, sample_swe_jd)

    assert run1.breakdown.weighted_total == run2.breakdown.weighted_total
    assert run1.breakdown.technical_score == run2.breakdown.technical_score
    assert run1.breakdown.experience_score == run2.breakdown.experience_score
    assert run1.breakdown.seniority_score == run2.breakdown.seniority_score
    assert run1.breakdown.education_score == run2.breakdown.education_score
    assert run1.breakdown.location_score == run2.breakdown.location_score
    assert len(run1.entries) == len(run2.entries)


# ------------------------------------------------------------------------------
# 5. Seniority Scoring and Overqualification Detection
# ------------------------------------------------------------------------------

def test_gate6_overqualification_detection(sample_swe_jd):
    """Candidate with 20 years experience applying for Junior role triggers OVERQUALIFIED."""
    junior_jd = JobDescription(
        job_id="test_jd_junior",
        title="Junior Backend Developer",
        company="Startup",
        seniority_level=SeniorityLevel.JUNIOR,
        min_years_experience=1.0,
        must_have_skills=["Python"],
        content_hash="hash_jd_junior_123",
    )

    veteran_resume = ResumeStructured(
        candidate_id="cand_veteran",
        content_hash="hash_vet_001",
        estimated_years_experience=18.0,
        seniority_level=SeniorityLevel.PRINCIPAL,
        skills=[Skill(name="Python", context="20 years Python.", is_verified=True)],
        experience=[],
        education=[],
    )

    ledger = evaluate_gate6(veteran_resume, junior_jd)
    assert ledger.is_overqualified is True
    # Overqualified receives configured partial score (65.0), not 100.0
    assert ledger.breakdown.seniority_score == 65.0


# ------------------------------------------------------------------------------
# 6. Non-Fatal Baseline Policy (Education & Location Never 0.0)
# ------------------------------------------------------------------------------

def test_gate6_education_and_location_never_zero(sample_swe_jd):
    """Non-matching degree and location must be awarded partial credit, NEVER 0.0."""
    nomad_resume = ResumeStructured(
        candidate_id="cand_nomad",
        content_hash="hash_nomad_777",
        estimated_years_experience=5.0,
        seniority_level=SeniorityLevel.SENIOR,
        skills=[Skill(name="Python", context="Python developer.", is_verified=True)],
        experience=[],
        education=[EducationEntry(institution="Art School", degree="B.A. Fine Arts", field_of_study="Sculpture")],
        current_location="Tokyo, Japan", # Different country from JD (San Francisco, CA)
    )

    ledger = evaluate_gate6(nomad_resume, sample_swe_jd)
    assert ledger.breakdown.education_score > 0.0
    assert ledger.breakdown.education_score == 60.0 # Configured partial credit
    assert ledger.breakdown.location_score > 0.0
    assert ledger.breakdown.location_score == 50.0  # Configured partial credit


# ------------------------------------------------------------------------------
# 7. Mandatory Evidence Ledger Completeness
# ------------------------------------------------------------------------------

def test_gate6_ledger_completeness_enforced(sample_swe_resume, sample_swe_jd):
    """Every must-have requirement and scoring dimension must have a LedgerEntry."""
    ledger = evaluate_gate6(sample_swe_resume, sample_swe_jd)

    dimensions_in_ledger = set(e.dimension for e in ledger.entries)
    assert DimensionType.TECHNICAL in dimensions_in_ledger
    assert DimensionType.EXPERIENCE in dimensions_in_ledger
    assert DimensionType.SENIORITY in dimensions_in_ledger
    assert DimensionType.EDUCATION in dimensions_in_ledger
    assert DimensionType.LOCATION in dimensions_in_ledger

    # Assert completeness validation raises error if dimension is missing
    corrupted_entries = [e for e in ledger.entries if e.dimension != DimensionType.LOCATION]
    with pytest.raises(ValueError, match="Evidence Ledger incomplete: missing entries"):
        _assert_ledger_completeness(corrupted_entries, sample_swe_jd.must_have_skills)


# ------------------------------------------------------------------------------
# 8. Score Range Bounded in [0.0, 100.0]
# ------------------------------------------------------------------------------

def test_gate6_final_score_within_bounds(sample_swe_resume, sample_swe_jd):
    """Final score must always be strictly between 0.0 and 100.0."""
    ledger = evaluate_gate6(sample_swe_resume, sample_swe_jd)
    assert 0.0 <= ledger.breakdown.weighted_total <= 100.0
    assert 0.0 <= ledger.breakdown.technical_score <= 100.0
    assert 0.0 <= ledger.breakdown.experience_score <= 100.0
    assert 0.0 <= ledger.breakdown.seniority_score <= 100.0
    assert 0.0 <= ledger.breakdown.education_score <= 100.0
    assert 0.0 <= ledger.breakdown.location_score <= 100.0
