"""
HYT ATS - Gate 10: Candidate Ranking Engine
===========================================
Sorts and ranks candidates within decision buckets per master.md Section 3 Gate 10.
Guarantees:
  1. Primary sorting bucket hierarchy: AUTO_ADVANCE -> ESCALATE -> AUTO_REJECT.
  2. Within each bucket, candidates are sorted strictly by final_score descending.
  3. Stable, deterministic tie-breaking by candidate_id.
  4. Formats clean terminal leaderboard with positions, scores, top strength, and top gap.
"""

from typing import List, Dict, Any, Tuple
from src.models.schemas import CandidateRecord, DecisionType
from src.utils.logger import get_logger

logger = get_logger("GATE_10_RANKING_ENGINE")

BUCKET_ORDER = [
    DecisionType.AUTO_ADVANCE,
    DecisionType.ESCALATE,
    DecisionType.AUTO_REJECT,
]


def rank_candidates(records: List[CandidateRecord]) -> Dict[str, Any]:
    """
    Ranks a list of candidate records for a target job.
    
    Args:
        records: List of CandidateRecord models.
        
    Returns:
        Structured dictionary containing ranked lists per bucket and an overall ranked list.
    """
    if not records:
        return {
            "total_candidates": 0,
            "buckets": {b.value: [] for b in BUCKET_ORDER},
            "ranked_list": [],
        }

    # Group records by decision bucket
    buckets: Dict[DecisionType, List[CandidateRecord]] = {
        DecisionType.AUTO_ADVANCE: [],
        DecisionType.ESCALATE: [],
        DecisionType.AUTO_REJECT: [],
    }

    for r in records:
        if r.decision in buckets:
            buckets[r.decision].append(r)
        else:
            buckets[DecisionType.ESCALATE].append(r)

    # Sort each bucket: score descending, then candidate_id ascending for deterministic tie-break
    for dec in BUCKET_ORDER:
        buckets[dec].sort(key=lambda rec: (-rec.final_score, rec.candidate_id))

    # Compile overall ranked list
    overall: List[Tuple[int, CandidateRecord]] = []
    current_pos = 1
    for dec in BUCKET_ORDER:
        for rec in buckets[dec]:
            overall.append((current_pos, rec))
            current_pos += 1

    logger.info(
        f"Ranked {len(records)} candidates: {len(buckets[DecisionType.AUTO_ADVANCE])} advance, "
        f"{len(buckets[DecisionType.ESCALATE])} escalate, {len(buckets[DecisionType.AUTO_REJECT])} reject.",
        gate="GATE_10",
    )

    return {
        "total_candidates": len(records),
        "job_id": records[0].job_id if records else "",
        "job_title": records[0].job_title if records else "",
        "buckets": {b.value: buckets[b] for b in BUCKET_ORDER},
        "ranked_list": overall,
    }


def format_ranking_table(ranked_result: Dict[str, Any]) -> str:
    """
    Renders an ASCII leaderboard table for recruiter review.
    """
    total = ranked_result.get("total_candidates", 0)
    job_title = ranked_result.get("job_title", "Software Engineering")
    job_id = ranked_result.get("job_id", "")

    lines: List[str] = []
    sep = "=" * 90
    sub_sep = "-" * 90

    lines.append(sep)
    lines.append(f"CANDIDATE LEADERBOARD & RECRUITER RANKING — {job_title.upper()} (Job ID: {job_id})")
    lines.append(f"Total Applicants Processed: {total}")
    lines.append(sep)

    buckets = ranked_result.get("buckets", {})
    global_rank = 1

    for dec in BUCKET_ORDER:
        group = buckets.get(dec.value, [])
        lines.append(f"\n>>> DECISION BUCKET: [{dec.value}] ({len(group)} candidates)")
        lines.append(sub_sep)
        header = f"{'Rank':<5} | {'Candidate ID':<15} | {'Score':<7} | {'Top Strength':<28} | {'Critical Gap':<26}"
        lines.append(header)
        lines.append(sub_sep)

        if not group:
            lines.append("  (No candidates in this tier)")
            continue

        for rec in group:
            strength = rec.top_strengths[0] if rec.top_strengths else "Foundational"
            if len(strength) > 28:
                strength = strength[:25] + "..."

            gap = rec.critical_gaps[0] if rec.critical_gaps else "None"
            if len(gap) > 26:
                gap = gap[:23] + "..."

            row = f"#{global_rank:<4} | {rec.candidate_id:<15} | {rec.final_score:5.1f}   | {strength:<28} | {gap:<26}"
            lines.append(row)
            global_rank += 1

    lines.append("\n" + sep + "\n")
    return "\n".join(lines)
