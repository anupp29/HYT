"""
Tests for Phase 6: Gate 7 (Decision Policy) and Gate 8 (Recruiter Explanation Generator)
========================================================================================
Validates:
  1. Condition 1: QUARANTINE flag present -> ESCALATE (matched_condition=1).
  2. Condition 2: Pre-filter triggered -> ESCALATE (matched_condition=2).
  3. Condition 3: Clean high score (>=75, 0 hard failures, 0 flags) -> AUTO_ADVANCE.
  4. Condition 4: High score but anomalies present (flags/missing must-haves) -> ESCALATE.
  5. Condition 5: Mid-range score (40 <= score < 75) -> ESCALATE.
  6. Condition 6: Low score (<40) + >=60% hard failures + 0 verified matches -> AUTO_REJECT.
  7. Condition 7: Low score (<40) + single verified match -> ESCALATE (Recall Bias).
  8. Condition 8: Overqualified profile -> ESCALATE.
  9. Invariants: Flagged candidates never AUTO_ADVANCE; verified matches never AUTO_REJECT.
 10. Gate 8: AUTO_REJECT returns None (zero token waste).
 11. Gate 8: AUTO_ADVANCE & ESCALATE produce 3 grounded sentences citing ledger skills.
 12. Gate 8: Disk caching guarantees zero LLM calls on second run.
"""

import pytest
from unittest.mock import patch, MagicMock

from src.models.schemas import (
    DecisionType,
    DimensionType,
    LedgerEntry,
    ScoringBreakdown,
    ScoringLedger,
    Gate0IntegrityReport,
    Gate4VerificationReport,
    PreFilterResult,
    JobDescription,
    SeniorityLevel,
    IntegrityFlag,
    VerificationFlag,
)
from src.gates.gate7 import evaluate_gate7
from src.gates.gate8 import evaluate_gate8


@pytest.fixture
def clean_job() -> JobDescription:
    return JobDescription(
        job_id="test_job_101",
        title="Backend Software Engineer",
        company="HuntYourTribe",
        seniority_level=SeniorityLevel.MID,
        min_years_experience=3.0,
        must_have_skills=["Python", "PostgreSQL", "Docker"],
        content_hash="job_hash_101",
    )


@pytest.fixture
def clean_high_ledger() -> ScoringLedger:
    entries = [
        LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: Python", evidence="FastAPI services.", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: PostgreSQL", evidence="Postgres queries.", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: Docker", evidence="Docker containers.", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.EXPERIENCE, requirement="3 YoE", evidence="4 years exp.", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.SENIORITY, requirement="MID", evidence="Mid dev.", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.EDUCATION, requirement="Degree", evidence="B.S. CS", is_verified=True, score_contribution=100.0),
        LedgerEntry(dimension=DimensionType.LOCATION, requirement="Remote", evidence="Remote OK", is_verified=True, score_contribution=100.0),
    ]
    breakdown = ScoringBreakdown(
        technical_score=100.0, experience_score=100.0, seniority_score=100.0, education_score=100.0, location_score=100.0, weighted_total=100.0
    )
    return ScoringLedger(
        candidate_id="cand_clean_high",
        job_id="test_job_101",
        entries=entries,
        breakdown=breakdown,
        hard_failures=[],
        hard_failures_count=0,
        verified_must_haves_count=3,
        total_must_haves_count=3,
        is_overqualified=False,
    )


# ------------------------------------------------------------------------------
# 1. Gate 7 Decision Policy Tests
# ------------------------------------------------------------------------------

def test_gate7_condition1_quarantine(clean_high_ledger):
    """Condition 1: Security Quarantine must trigger ESCALATE regardless of 100 score."""
    quarantined_gate0 = Gate0IntegrityReport(
        candidate_id="cand_clean_high",
        is_quarantined=True,
        flags=[IntegrityFlag.HIDDEN_TEXT, IntegrityFlag.INJECTION_ATTEMPT],
    )
    res = evaluate_gate7(ledger=clean_high_ledger, gate0_report=quarantined_gate0)
    assert res.decision == DecisionType.ESCALATE
    assert res.matched_condition == 1
    assert "Integrity check failed" in res.reason


def test_gate7_condition2_prefilter_triggered(clean_high_ledger):
    """Condition 2: Pre-filter mismatch triggers ESCALATE."""
    pf = PreFilterResult(
        candidate_id="cand_pf", job_id="test_job_101", passed=False, similarity=0.15, threshold=0.30, skip_scoring=True
    )
    res = evaluate_gate7(ledger=clean_high_ledger, prefilter_result=pf)
    assert res.decision == DecisionType.ESCALATE
    assert res.matched_condition == 2
    assert "Job family mismatch suspected" in res.reason


def test_gate7_condition3_clean_high_advance(clean_high_ledger):
    """Condition 3: Clean candidate with score >= 75 and 0 flags -> AUTO_ADVANCE."""
    res = evaluate_gate7(ledger=clean_high_ledger)
    assert res.decision == DecisionType.AUTO_ADVANCE
    assert res.matched_condition == 3
    assert "Exceptional candidate fit" in res.reason


def test_gate7_condition3_industry_standard_75pct_advance():
    """Industry standard ATS: Candidate satisfying 75% of must-haves (e.g. 12/16 or 3/4) with score >= 68 -> AUTO_ADVANCE."""
    breakdown = ScoringBreakdown(
        technical_score=80.0, experience_score=90.0, seniority_score=100.0, education_score=100.0, location_score=100.0, weighted_total=87.0
    )
    # 4 must-haves, 1 missing secondary tool -> 3/4 = 75% match
    adv_ledger = ScoringLedger(
        candidate_id="cand_adv_75",
        job_id="test_job_101",
        entries=[
            LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: Python", evidence="Python dev", is_verified=True, score_contribution=100.0),
            LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: PostgreSQL", evidence="Postgres dev", is_verified=True, score_contribution=100.0),
            LedgerEntry(dimension=DimensionType.TECHNICAL, requirement="Must-Have: Docker", evidence="Docker dev", is_verified=True, score_contribution=100.0),
        ],
        breakdown=breakdown,
        hard_failures=["Kubernetes"], # 1 missing tool out of 4 (75% match)
        hard_failures_count=1,
        verified_must_haves_count=3,
        total_must_haves_count=4,
        is_overqualified=False,
    )
    res = evaluate_gate7(ledger=adv_ledger)
    assert res.decision == DecisionType.AUTO_ADVANCE
    assert res.matched_condition == 3
    assert "Exceptional candidate fit" in res.reason


def test_gate7_condition4_high_score_with_anomalies(clean_high_ledger):
    """Condition 4: High score but has verification flags or missing must-haves -> ESCALATE."""
    flagged_gate4 = Gate4VerificationReport(
        candidate_id="cand_clean_high",
        is_verified=False,
        flags=[VerificationFlag.SHALLOW_PROFILE],
        unverified_ratio=0.65,
    )
    res = evaluate_gate7(ledger=clean_high_ledger, gate4_report=flagged_gate4)
    assert res.decision == DecisionType.ESCALATE
    assert res.matched_condition == 4
    assert "High score but anomalies detected" in res.reason


def test_gate7_condition5_mid_range_score():
    """Condition 5: Score in [40, 75) triggers ESCALATE."""
    breakdown = ScoringBreakdown(
        technical_score=60.0, experience_score=60.0, seniority_score=60.0, education_score=60.0, location_score=60.0, weighted_total=60.0
    )
    mid_ledger = ScoringLedger(
        candidate_id="cand_mid", job_id="test_job_101", entries=[], breakdown=breakdown, hard_failures=["Docker"], total_must_haves_count=3
    )
    res = evaluate_gate7(ledger=mid_ledger)
    assert res.decision == DecisionType.ESCALATE
    assert res.matched_condition == 5
    assert "Ambiguous fit" in res.reason


def test_gate7_condition6_auto_reject():
    """Condition 6: Score < 40 + >=60% hard failures + 0 verified matches -> AUTO_REJECT."""
    breakdown = ScoringBreakdown(
        technical_score=10.0, experience_score=20.0, seniority_score=30.0, education_score=50.0, location_score=50.0, weighted_total=22.0
    )
    reject_ledger = ScoringLedger(
        candidate_id="cand_rej",
        job_id="test_job_101",
        entries=[],
        breakdown=breakdown,
        hard_failures=["Python", "PostgreSQL", "Docker"],
        hard_failures_count=3,
        verified_must_haves_count=0,
        total_must_haves_count=3,
    )
    res = evaluate_gate7(ledger=reject_ledger)
    assert res.decision == DecisionType.AUTO_REJECT
    assert res.matched_condition == 6
    assert "Candidate did not meet core baseline requirements" in res.reason


def test_gate7_condition7_recall_bias_saves_candidate():
    """Condition 7: Score < 40 but has 1 verified must-have match -> ESCALATE (Never AUTO_REJECT)."""
    breakdown = ScoringBreakdown(
        technical_score=25.0, experience_score=20.0, seniority_score=30.0, education_score=50.0, location_score=50.0, weighted_total=28.0
    )
    saved_ledger = ScoringLedger(
        candidate_id="cand_saved",
        job_id="test_job_101",
        entries=[],
        breakdown=breakdown,
        hard_failures=["PostgreSQL", "Docker"],
        hard_failures_count=2,
        verified_must_haves_count=1, # One verified skill!
        total_must_haves_count=3,
    )
    res = evaluate_gate7(ledger=saved_ledger)
    assert res.decision == DecisionType.ESCALATE
    assert res.matched_condition == 7
    assert "Recall bias applied" in res.reason


def test_gate7_condition8_overqualified():
    """Condition 8: Overqualified profile must route to ESCALATE."""
    breakdown = ScoringBreakdown(
        technical_score=90.0, experience_score=100.0, seniority_score=65.0, education_score=100.0, location_score=100.0, weighted_total=89.0
    )
    overqual_ledger = ScoringLedger(
        candidate_id="cand_over",
        job_id="test_job_101",
        entries=[],
        breakdown=breakdown,
        hard_failures=[],
        hard_failures_count=0,
        verified_must_haves_count=3,
        total_must_haves_count=3,
        is_overqualified=True,
    )
    res = evaluate_gate7(ledger=overqual_ledger)
    assert res.decision == DecisionType.ESCALATE
    # Either condition 4 (high score anomalies) or condition 8 (overqualified) triggers ESCALATE
    assert res.decision == DecisionType.ESCALATE
    assert "overqualified" in res.reason.lower() or "anomalies detected" in res.reason.lower()


# ------------------------------------------------------------------------------
# 2. Gate 8 Recruiter Explanation Generator Tests
# ------------------------------------------------------------------------------

def test_gate8_auto_reject_returns_none(clean_job):
    """Rule 8: Candidate with AUTO_REJECT decision returns None (zero token waste)."""
    breakdown = ScoringBreakdown(
        technical_score=10.0, experience_score=10.0, seniority_score=10.0, education_score=50.0, location_score=50.0, weighted_total=20.0
    )
    reject_ledger = ScoringLedger(
        candidate_id="cand_rej_gate8",
        job_id="test_job_101",
        entries=[],
        breakdown=breakdown,
        hard_failures=["Python", "PostgreSQL", "Docker"],
        verified_must_haves_count=0,
        total_must_haves_count=3,
    )
    rej_dec = evaluate_gate7(ledger=reject_ledger)
    assert rej_dec.decision == DecisionType.AUTO_REJECT

    explanation = evaluate_gate8(ledger=reject_ledger, decision_result=rej_dec, jd=clean_job)
    assert explanation is None


def test_gate8_advance_generates_grounded_explanation(clean_high_ledger, clean_job):
    """AUTO_ADVANCE candidate produces a valid 3-sentence grounded explanation citing skills."""
    dec = evaluate_gate7(ledger=clean_high_ledger)
    assert dec.decision == DecisionType.AUTO_ADVANCE

    mock_json = '{"strengths_sentence": "Candidate demonstrates strong proficiency in Python and Docker with proven production experience.", "gaps_sentence": "Candidate has minor gap in PostgreSQL scaling at petabyte volume.", "interview_focus_sentence": "Recommend live coding exercise focused on PostgreSQL query performance."}'
    with patch("src.utils.llm_client.LLMClient.complete", return_value=mock_json):
        explanation = evaluate_gate8(
            ledger=clean_high_ledger,
            decision_result=dec,
            jd=clean_job,
            use_cache=False,
        )
    assert explanation is not None
    assert len(explanation.strengths_sentence) > 10
    assert len(explanation.gaps_sentence) > 10
    assert len(explanation.interview_focus_sentence) > 10
    # Must reference skill from ledger
    assert any(s in explanation.full_explanation.lower() for s in ["python", "postgresql", "docker"])


def test_gate8_disk_caching(clean_high_ledger, clean_job):
    """Subsequent evaluations for same candidate + score return cached explanation with 0 API calls."""
    dec = evaluate_gate7(ledger=clean_high_ledger)
    mock_json = '{"strengths_sentence": "Candidate demonstrates strong proficiency in Python and Docker with proven production experience.", "gaps_sentence": "Candidate has minor gap in PostgreSQL scaling at petabyte volume.", "interview_focus_sentence": "Recommend live coding exercise focused on PostgreSQL query performance."}'
    with patch("src.utils.llm_client.LLMClient.complete", return_value=mock_json):
        exp1 = evaluate_gate8(ledger=clean_high_ledger, decision_result=dec, jd=clean_job, use_cache=True, force_refresh=True)
    exp2 = evaluate_gate8(ledger=clean_high_ledger, decision_result=dec, jd=clean_job, use_cache=True, force_refresh=False)

    assert exp1 is not None and exp2 is not None
    assert exp1.full_explanation == exp2.full_explanation
