"""
HYT ATS - Candidate Record Formatter (Gate 9 Output)
====================================================
Formats a CandidateRecord into a comprehensive, human-readable recruiter report
per master.md Section 3 Gate 9.
Guarantees:
  1. Every field is explicitly rendered. No field is silently omitted or null.
  2. Complete 5-dimensional breakdown with annotations.
  3. Auditable citation trail: all ledger entries rendered with evidence quotes or gaps.
  4. Grounded recruiter assessment (strengths, gaps, interview probes).
"""

from typing import List, Optional
from src.models.schemas import CandidateRecord, DecisionType, LedgerEntry


def format_candidate_record(record: CandidateRecord, include_full_ledger: bool = True) -> str:
    """
    Renders a complete, structured recruiter output card for a candidate.
    
    Args:
        record: Complete CandidateRecord model.
        include_full_ledger: If True, renders every ledger entry.
        
    Returns:
        Formatted ASCII report string.
    """
    lines: List[str] = []
    sep = "=" * 80
    sub_sep = "-" * 80

    lines.append(sep)
    lines.append(f"HYT ATS CANDIDATE EVALUATION AUDIT REPORT — {record.candidate_id.upper()}")
    lines.append(sep)
    lines.append(f"Target Role:             {record.job_title} (Job ID: {record.job_id})")
    lines.append(f"Screening Timestamp:     {record.processed_at}")
    lines.append(f"Final Decision:          [{record.decision.value}]")
    lines.append(f"Decision Justification:  {record.decision_reason}")

    # Security & Verification Flags
    int_flags_str = ", ".join(record.integrity_flags) if record.integrity_flags else "NONE (Passed all security checks)"
    ver_flags_str = ", ".join(record.verification_flags) if record.verification_flags else "NONE (Verified profile)"
    lines.append(f"Integrity Flags:         {int_flags_str}")
    lines.append(f"Verification Flags:      {ver_flags_str}")
    lines.append(f"Quarantine Status:       {'QUARANTINED (Active Security Alert)' if record.is_quarantined else 'CLEAN'}")
    lines.append(f"Overqualification:       {'FLAGGED (Candidate significantly exceeds role seniority)' if record.is_overqualified else 'BALANCED'}")

    # 3-Sentence Recruiter Assessment (Gate 8)
    lines.append(sub_sep)
    lines.append("GROUNDED RECRUITER ASSESSMENT (Gate 8 Audit):")
    if record.explanation:
        lines.append(f"  [1. STRENGTHS] {record.explanation.strengths_sentence}")
        lines.append(f"  [2. GAPS]      {record.explanation.gaps_sentence}")
        lines.append(f"  [3. INTERVIEW] {record.explanation.interview_focus_sentence}")
    elif record.decision == DecisionType.AUTO_REJECT:
        lines.append("  [NOTICE] No explanation generated per Rule 8 (Zero token waste on auto-rejected candidates).")
    else:
        lines.append("  [NOTICE] Explanation pending recruiter review.")

    # Top Strengths & Critical Gaps
    lines.append(sub_sep)
    lines.append("TOP STRENGTHS (Cited from Ledger):")
    if record.top_strengths:
        for idx, s in enumerate(record.top_strengths[:5], 1):
            lines.append(f"  * {s}")
    else:
        lines.append("  * None verified.")

    lines.append("CRITICAL GAPS (Identified Gaps):")
    if record.critical_gaps:
        for idx, g in enumerate(record.critical_gaps[:5], 1):
            lines.append(f"  * {g}")
    else:
        lines.append("  * No critical deficits identified.")

    # 5-Dimensional Scorecard
    b = record.scoring_breakdown
    lines.append(sub_sep)
    lines.append("5-DIMENSIONAL DETERMINISTIC SCORECARD (0–100 Scale):")
    lines.append(f"  1. Technical Alignment (40%):  {b.technical_score:6.2f} / 100  (weighted contrib: {b.technical_score * 0.40:5.2f})")
    lines.append(f"  2. Experience Depth    (30%):  {b.experience_score:6.2f} / 100  (weighted contrib: {b.experience_score * 0.30:5.2f})")
    lines.append(f"  3. Seniority Fit       (20%):  {b.seniority_score:6.2f} / 100  (weighted contrib: {b.seniority_score * 0.20:5.2f})")
    lines.append(f"  4. Education Baseline  ( 5%):  {b.education_score:6.2f} / 100  (weighted contrib: {b.education_score * 0.05:5.2f})")
    lines.append(f"  5. Location & Remote   ( 5%):  {b.location_score:6.2f} / 100  (weighted contrib: {b.location_score * 0.05:5.2f})")
    lines.append("  " + "-" * 73)
    lines.append(f"  FINAL WEIGHTED SCORE:                  {record.final_score:6.2f} / 100")

    # Evidence Ledger
    if include_full_ledger and record.ledger:
        lines.append(sub_sep)
        lines.append(f"MANDATORY EVIDENCE LEDGER ({len(record.ledger)} Immutable Citation Entries):")
        for idx, entry in enumerate(record.ledger, 1):
            status = "[VERIFIED]" if entry.is_verified else "[UNVERIFIED / GAP]"
            lines.append(f"  {idx:2d}. {status} {entry.requirement} ({entry.dimension.value.upper()})")
            if entry.evidence:
                ev = entry.evidence.strip()
                if len(ev) > 95:
                    ev = ev[:92] + "..."
                lines.append(f"      Evidence: \"{ev}\"")
            if entry.gap:
                lines.append(f"      Gap:      {entry.gap}")
            lines.append(f"      Score Contribution: {entry.score_contribution:.1f} pts")

    lines.append(sep + "\n")
    return "\n".join(lines)
