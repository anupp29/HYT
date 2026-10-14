"""
Unit and Integration Tests for Phase 7 (Pipeline Integration, Gate 9 Output, Gate 10 Ranking, Overrides)
======================================================================================================
"""

import json
import pytest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.models.schemas import (
    CandidateRecord,
    DecisionType,
    DimensionType,
    ScoringBreakdown,
    LedgerEntry,
    RecruiterExplanation,
)
from src.utils.output import format_candidate_record
from src.gates.gate10 import rank_candidates, format_ranking_table, BUCKET_ORDER
from src.utils.override import log_decision_override
from src.pipeline import process_candidate, process_batch

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def sample_candidate_record():
    """Provides a realistic CandidateRecord for output and ranking tests."""
    breakdown = ScoringBreakdown(
        technical_score=85.0,
        experience_score=90.0,
        seniority_score=80.0,
        education_score=100.0,
        location_score=100.0,
        weighted_total=86.0,
    )
    entries = [
        LedgerEntry(
            dimension=DimensionType.TECHNICAL,
            requirement="Must-Have: Python",
            evidence="Built RESTful APIs with Python and FastAPI",
            is_verified=True,
            score_contribution=25.0,
        ),
        LedgerEntry(
            dimension=DimensionType.TECHNICAL,
            requirement="Must-Have: Kubernetes",
            gap="Kubernetes not evidenced in production experience",
            is_verified=False,
            score_contribution=0.0,
        ),
        LedgerEntry(
            dimension=DimensionType.EXPERIENCE,
            requirement="Minimum 3 years experience",
            evidence="Total verified experience: 4.2 years",
            is_verified=True,
            score_contribution=30.0,
        ),
    ]
    explanation = RecruiterExplanation(
        strengths_sentence="Candidate demonstrates strong backend Python and API architectural capabilities.",
        gaps_sentence="Candidate lacks hands-on production Kubernetes orchestration experience.",
        interview_focus_sentence="Evaluate readiness to rapidly adapt to containerized deployment environments.",
        full_explanation="Candidate demonstrates strong backend Python and API architectural capabilities. Candidate lacks hands-on production Kubernetes orchestration experience. Evaluate readiness to rapidly adapt to containerized deployment environments.",
    )
    return CandidateRecord(
        candidate_id="cand_test_01",
        job_id="2234533717",
        job_title="Senior Backend Engineer",
        final_score=86.0,
        decision=DecisionType.AUTO_ADVANCE,
        decision_reason="Strong fit across technical and experience dimensions with zero integrity flags.",
        scoring_breakdown=breakdown,
        ledger=entries,
        top_strengths=["Python", "FastAPI"],
        critical_gaps=["Kubernetes"],
        integrity_flags=[],
        verification_flags=[],
        is_quarantined=False,
        is_overqualified=False,
        explanation=explanation,
        processed_at="2026-10-14T20:00:00",
    )


# ==========================================
# 1. Output Formatter Tests (Gate 9)
# ==========================================

def test_format_candidate_record_contains_all_core_fields(sample_candidate_record):
    """Test that all required fields from master.md Gate 9 appear in formatted output."""
    output = format_candidate_record(sample_candidate_record, include_full_ledger=True)

    assert "CANDIDATE EVALUATION AUDIT REPORT" in output
    assert "cand_test_01".upper() in output
    assert "Senior Backend Engineer" in output
    assert "[AUTO_ADVANCE]" in output
    assert "86.00 / 100" in output
    assert "Technical Alignment (40%):   85.00 / 100" in output
    assert "Experience Depth    (30%):   90.00 / 100" in output
    assert "Seniority Fit       (20%):   80.00 / 100" in output
    assert "Education Baseline  ( 5%):  100.00 / 100" in output
    assert "Location & Remote   ( 5%):  100.00 / 100" in output
    assert "GROUNDED RECRUITER ASSESSMENT" in output
    assert sample_candidate_record.explanation.strengths_sentence in output
    assert sample_candidate_record.explanation.gaps_sentence in output
    assert sample_candidate_record.explanation.interview_focus_sentence in output
    assert "Built RESTful APIs with Python and FastAPI" in output
    assert "Kubernetes not evidenced in production experience" in output


def test_format_candidate_record_auto_reject_omits_explanation_gracefully(sample_candidate_record):
    """Test that auto-rejected candidates cleanly state explanation omission per Rule 8."""
    sample_candidate_record.decision = DecisionType.AUTO_REJECT
    sample_candidate_record.explanation = None

    output = format_candidate_record(sample_candidate_record)
    assert "No explanation generated per Rule 8" in output
    assert "None" not in output


# ==========================================
# 2. Candidate Ranking Tests (Gate 10)
# ==========================================

def test_rank_candidates_strictly_enforces_bucket_hierarchy():
    """Verify primary ranking order: AUTO_ADVANCE -> ESCALATE -> AUTO_REJECT."""
    breakdown = ScoringBreakdown(
        technical_score=50, experience_score=50, seniority_score=50, education_score=50, location_score=50, weighted_total=50
    )

    c_reject_high = CandidateRecord(
        candidate_id="reject_high", job_id="jd1", job_title="Dev", final_score=95.0,
        decision=DecisionType.AUTO_REJECT, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )
    c_escalate_mid = CandidateRecord(
        candidate_id="escalate_mid", job_id="jd1", job_title="Dev", final_score=65.0,
        decision=DecisionType.ESCALATE, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )
    c_advance_low = CandidateRecord(
        candidate_id="advance_low", job_id="jd1", job_title="Dev", final_score=78.0,
        decision=DecisionType.AUTO_ADVANCE, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )

    result = rank_candidates([c_reject_high, c_escalate_mid, c_advance_low])
    ranked_list = result["ranked_list"]

    # Must be: advance_low (#1) -> escalate_mid (#2) -> reject_high (#3)
    assert ranked_list[0][1].candidate_id == "advance_low"
    assert ranked_list[1][1].candidate_id == "escalate_mid"
    assert ranked_list[2][1].candidate_id == "reject_high"


def test_rank_candidates_sorts_by_score_descending_within_bucket():
    """Verify that within a bucket, candidates are sorted by final_score descending."""
    breakdown = ScoringBreakdown(
        technical_score=50, experience_score=50, seniority_score=50, education_score=50, location_score=50, weighted_total=50
    )

    c1 = CandidateRecord(
        candidate_id="c1", job_id="jd1", job_title="Dev", final_score=82.0,
        decision=DecisionType.AUTO_ADVANCE, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )
    c2 = CandidateRecord(
        candidate_id="c2", job_id="jd1", job_title="Dev", final_score=94.5,
        decision=DecisionType.AUTO_ADVANCE, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )
    c3 = CandidateRecord(
        candidate_id="c3", job_id="jd1", job_title="Dev", final_score=88.0,
        decision=DecisionType.AUTO_ADVANCE, decision_reason="Test", scoring_breakdown=breakdown,
        ledger=[], top_strengths=[], critical_gaps=[], integrity_flags=[], verification_flags=[],
        is_quarantined=False, is_overqualified=False, explanation=None, processed_at="now"
    )

    result = rank_candidates([c1, c2, c3])
    ranked_ids = [rec.candidate_id for pos, rec in result["ranked_list"]]
    assert ranked_ids == ["c2", "c3", "c1"]


def test_format_ranking_table_renders_leaderboard(sample_candidate_record):
    """Verify ASCII table renders valid headers and candidate rows."""
    ranked = rank_candidates([sample_candidate_record])
    table = format_ranking_table(ranked)

    assert "CANDIDATE LEADERBOARD & RECRUITER RANKING" in table
    assert "DECISION BUCKET: [AUTO_ADVANCE]" in table
    assert "#1" in table
    assert "cand_test_01" in table
    assert "86.0" in table
    assert "Python" in table


# ==========================================
# 3. Decision Override Audit Tests
# ==========================================

def test_log_decision_override_creates_immutable_jsonl():
    """Verify override audit logger appends valid JSONL record."""
    with TemporaryDirectory() as tmpdir:
        override_file = Path(tmpdir) / "overrides.jsonl"

        entry1 = log_decision_override(
            candidate_id="cand_123",
            new_decision=DecisionType.AUTO_ADVANCE,
            reason="Strong portfolio of open source projects outweighs missing framework",
            original_decision=DecisionType.ESCALATE,
            job_id="2234533717",
            recruiter_id="lead_recruiter_alice",
            overrides_file=override_file,
        )

        entry2 = log_decision_override(
            candidate_id="cand_456",
            new_decision=DecisionType.AUTO_REJECT,
            reason="Confirmed graduation year past maximum limit during phone screen",
            original_decision=DecisionType.ESCALATE,
            job_id="2234533717",
            recruiter_id="lead_recruiter_bob",
            overrides_file=override_file,
        )

        assert override_file.exists()
        lines = override_file.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 2

        parsed1 = json.loads(lines[0])
        assert parsed1["candidate_id"] == "cand_123"
        assert parsed1["new_decision"] == "AUTO_ADVANCE"
        assert parsed1["original_decision"] == "ESCALATE"
        assert parsed1["recruiter_id"] == "lead_recruiter_alice"

        parsed2 = json.loads(lines[1])
        assert parsed2["candidate_id"] == "cand_456"
        assert parsed2["new_decision"] == "AUTO_REJECT"


# ==========================================
# 4. Pipeline Integration Tests
# ==========================================

def test_process_candidate_end_to_end():
    """Executes full pipeline for a real sample candidate using cache."""
    sample_pdf = PROJECT_ROOT / "data" / "sample" / "10089434.pdf"
    jd_file = PROJECT_ROOT / "data" / "jds" / "jd_2234533717.json"

    if not sample_pdf.exists() or not jd_file.exists():
        pytest.skip("Sample candidate or JD file not found")

    record = process_candidate(
        resume_path=sample_pdf,
        jd=jd_file,
        use_cache=True,
    )

    assert isinstance(record, CandidateRecord)
    assert record.candidate_id == "10089434"
    assert 0.0 <= record.final_score <= 100.0
    assert record.decision in [DecisionType.AUTO_ADVANCE, DecisionType.ESCALATE, DecisionType.AUTO_REJECT]
    assert len(record.ledger) > 0
    assert record.scoring_breakdown is not None
    assert record.job_id == "2234533717"


def test_process_batch_end_to_end():
    """Executes batch pipeline for multiple resumes and ranks results."""
    sample_dir = PROJECT_ROOT / "data" / "sample"
    jd_file = PROJECT_ROOT / "data" / "jds" / "jd_2234533717.json"

    if not sample_dir.exists() or not jd_file.exists():
        pytest.skip("Sample directory or JD file not found")

    pdfs = sorted(sample_dir.glob("*.pdf"))[:3]
    if len(pdfs) < 2:
        pytest.skip("Not enough sample PDFs for batch test")

    records = process_batch(resume_paths=pdfs, jd=jd_file, use_cache=True)
    assert len(records) == len(pdfs)

    ranked = rank_candidates(records)
    assert ranked["total_candidates"] == len(pdfs)
    assert len(ranked["ranked_list"]) == len(pdfs)
