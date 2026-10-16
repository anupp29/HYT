"""
HYT ATS - Gate 7: Decision Policy Engine (Structural Recall Bias)
================================================================
Implements pure deterministic conditional policy logic per master.md Section 3 Gate 7.
Guarantees:
  1. Pure conditional logic: Zero LLM, zero stochasticity, 100% auditable.
  2. First matching condition wins across the 8 priority rules.
  3. Structural Recall Bias: AUTO_REJECT requires near-impossible conditions by design.
     A single verified must-have match saves any candidate from rejection (routes to ESCALATE).
  4. Flag Immunity: Any candidate with security or verification flags is strictly barred
     from AUTO_ADVANCE.
"""

from typing import List, Optional, Any
from src.models.schemas import (
    DecisionType,
    Gate7DecisionResult,
    ScoringLedger,
    Gate0IntegrityReport,
    Gate4VerificationReport,
    PreFilterResult,
    DimensionType,
)
from src.utils.config import get_config
from src.utils.logger import get_logger

logger = get_logger("GATE_7_DECISION_ENGINE")


def evaluate_gate7(
    ledger: Optional[ScoringLedger] = None,
    gate0_report: Optional[Gate0IntegrityReport] = None,
    gate4_report: Optional[Gate4VerificationReport] = None,
    prefilter_result: Optional[PreFilterResult] = None,
    candidate_id: Optional[str] = None,
    job_id: Optional[str] = None,
) -> Gate7DecisionResult:
    """
    Evaluates the 8 deterministic decision policy rules in strict priority order.
    
    Args:
        ledger: ScoringLedger output from Gate 6 (may be None if prefilter failed).
        gate0_report: Gate0IntegrityReport from Gate 0.
        gate4_report: Gate4VerificationReport from Gate 4.
        prefilter_result: PreFilterResult from Gate 5.
        candidate_id: Candidate identifier.
        job_id: Job identifier.
        
    Returns:
        Validated Gate7DecisionResult with decision, reason, matched_condition, and escalation notes.
    """
    cfg = get_config()
    cid = candidate_id or (ledger.candidate_id if ledger else (prefilter_result.candidate_id if prefilter_result else "UNKNOWN"))
    jid = job_id or (ledger.job_id if ledger else (prefilter_result.job_id if prefilter_result else "UNKNOWN"))

    high_thresh = cfg.gate7.high_threshold
    low_thresh = cfg.gate7.low_threshold
    reject_prop = cfg.gate7.auto_reject_hard_failure_proportion

    # Extract flags
    integrity_flags = gate0_report.flags if gate0_report else []
    is_quarantined = gate0_report.is_quarantined if gate0_report else False
    verification_flags = gate4_report.flags if gate4_report else []

    score = ledger.breakdown.weighted_total if ledger else 0.0
    tech_score = ledger.breakdown.technical_score if (ledger and ledger.breakdown) else 0.0
    hard_failures = ledger.hard_failures if ledger else []
    total_must_haves = ledger.total_must_haves_count if ledger else 1
    verified_must_haves_count = ledger.verified_must_haves_count if ledger else 0
    is_overqualified = ledger.is_overqualified if ledger else False

    # --------------------------------------------------------------------------
    # Condition 1: QUARANTINE flag present
    # --------------------------------------------------------------------------
    if is_quarantined or "QUARANTINE" in [f.name if hasattr(f, "name") else str(f) for f in integrity_flags]:
        flag_names = [f.name if hasattr(f, "name") else str(f) for f in integrity_flags]
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="Integrity check failed. Human review required before any decision.",
            matched_condition=1,
            escalation_reason=f"Security quarantine active. Integrity flags detected: {', '.join(flag_names)}.",
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 1 triggered -> ESCALATE (QUARANTINE).", gate="GATE_7", candidate_id=cid)
        return res

    matched_must_haves_count = total_must_haves - len(hard_failures)
    must_have_match_ratio = matched_must_haves_count / max(total_must_haves, 1)
    min_match_ratio = getattr(cfg.gate7, "min_must_have_ratio", 0.45)
    min_verified = min(getattr(cfg.gate7, "min_verified_must_haves", 1), total_must_haves)
    failure_ratio = len(hard_failures) / max(total_must_haves, 1)

    # --------------------------------------------------------------------------
    # Condition 2.5: Non-Compensatory Technical Disqualification (Zero Technical Fit)
    # In enterprise technical recruitment, a candidate with literally 0.0% technical
    # alignment (fails all core requirements with zero verified technical skills)
    # cannot be considered for a software engineering position. Non-compensatory
    # recruitment principles dictate that high education or location scores cannot
    # override complete absence of technical competence.
    # --------------------------------------------------------------------------
    if (
        ledger is not None
        and ledger.breakdown.technical_score == 0.0
        and failure_ratio >= 0.70
        and verified_must_haves_count == 0
        and must_have_match_ratio < 0.15
    ):
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.AUTO_REJECT,
            reason=(
                f"Candidate did not meet baseline technical requirements: 0.0% technical alignment "
                f"across all {total_must_haves} core job competencies. Non-compensatory disqualifier applied."
            ),
            matched_condition=6,
            escalation_reason=None,
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Non-Compensatory Disqualification triggered -> AUTO_REJECT.", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 2: PRE_FILTER triggered (Domain mismatch)
    # Severe domain mismatch with 0 verified core skills -> AUTO_REJECT
    # Borderline domain mismatch -> ESCALATE to human recruiter
    # --------------------------------------------------------------------------
    if prefilter_result is not None and (not prefilter_result.passed or prefilter_result.skip_scoring):
        tech_score = ledger.breakdown.technical_score if (ledger and ledger.breakdown) else 0.0
        if verified_must_haves_count == 0 and tech_score < 30.0:
            res = Gate7DecisionResult(
                candidate_id=cid,
                job_id=jid,
                decision=DecisionType.AUTO_REJECT,
                reason=(
                    f"Severe domain mismatch: candidate failed domain pre-filter ({prefilter_result.similarity:.2f} < "
                    f"{prefilter_result.threshold:.2f}) with zero verified must-haves and negligible technical score ({tech_score:.1f})."
                ),
                matched_condition=2,
                escalation_reason=None,
            )
            _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
            logger.info(f"[{cid}] Gate 7 Condition 2 triggered -> AUTO_REJECT (Domain Mismatch).", gate="GATE_7", candidate_id=cid)
            return res

        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="Job family mismatch suspected. Human confirmation required.",
            matched_condition=2,
            escalation_reason=(
                f"Candidate domain pre-filter similarity ({prefilter_result.similarity:.2f}) fell below "
                f"conservative threshold ({prefilter_result.threshold:.2f})."
            ),
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 2 triggered -> ESCALATE (PRE_FILTER).", gate="GATE_7", candidate_id=cid)
        return res

    # Critical verification flags strictly block AUTO_ADVANCE
    critical_v_flags = [
        f for f in verification_flags
        if (getattr(f, "name", str(f)) in [
            "GITHUB_NOT_FOUND",
            "GITHUB_LANGUAGE_MISMATCH",
            "SHALLOW_PROFILE",
            "DATE_SUSPICIOUS",
        ])
    ]
    has_critical_v_flags = len(critical_v_flags) > 0
    has_integrity_flags = len(integrity_flags) > 0
    meets_skills = must_have_match_ratio >= min_match_ratio

    # --------------------------------------------------------------------------
    # Condition 8: OVERQUALIFIED check (P1 Fix: Intercepts BEFORE AUTO_ADVANCE)
    # Human recruiter review required to assess flight risk and salary alignment
    # --------------------------------------------------------------------------
    if is_overqualified:
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="Candidate appears overqualified. Human confirmation of role fit required.",
            matched_condition=8,
            escalation_reason="Candidate seniority level and experience exceed target job profile scope.",
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 8 triggered -> ESCALATE (OVERQUALIFIED).", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 3: score >= HIGH_THRESHOLD AND meets_skills AND tech_score >= 60 AND verified evidence AND zero critical flags
    # --------------------------------------------------------------------------
    if (
        score >= high_thresh
        and meets_skills
        and tech_score >= 60.0
        and verified_must_haves_count >= min_verified
        and not has_integrity_flags
        and not has_critical_v_flags
    ):
        top_strengths = _extract_top_strengths(ledger)
        strength_desc = f" Verified mastery: {', '.join(top_strengths[:3])}." if top_strengths else ""
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.AUTO_ADVANCE,
            reason=(
                f"Exceptional candidate fit: score {score:.2f} satisfies high threshold ({high_thresh:.1f}) "
                f"with {matched_must_haves_count}/{total_must_haves} must-haves ({must_have_match_ratio:.0%}) "
                f"({verified_must_haves_count} verified, tech score: {tech_score:.1f}) and zero integrity anomalies.{strength_desc}"
            ),
            matched_condition=3,
            escalation_reason=None,
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 3 triggered -> AUTO_ADVANCE.", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 4: score >= HIGH_THRESHOLD AND (not meets_skills OR low tech fit OR no verified skills OR security flags present)
    # --------------------------------------------------------------------------
    if score >= high_thresh and (
        not meets_skills
        or tech_score < 60.0
        or verified_must_haves_count < min_verified
        or has_integrity_flags
        or has_critical_v_flags
    ):
        anomalies = []
        if not meets_skills:
            anomalies.append(f"insufficient must-have match ({matched_must_haves_count}/{total_must_haves} = {must_have_match_ratio:.0%} < {min_match_ratio:.0%})")
        elif tech_score < 60.0:
            anomalies.append(f"technical alignment score below auto-advance baseline ({tech_score:.1f} < 60.0)")
        elif verified_must_haves_count < min_verified:
            anomalies.append(f"no verified core competencies with demonstrated work evidence ({verified_must_haves_count} < {min_verified})")
        elif len(hard_failures) > 0:
            anomalies.append(f"{len(hard_failures)} missing must-have(s): {', '.join(hard_failures[:3])}")
        if has_integrity_flags:
            anomalies.append(f"{len(integrity_flags)} security flag(s)")
        if has_critical_v_flags:
            anomalies.append(f"{len(critical_v_flags)} critical verification flag(s)")

        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="High score but anomalies detected. Human review required.",
            matched_condition=4,
            escalation_reason=f"Candidate achieved high score ({score:.2f}) but presented: {'; '.join(anomalies)}.",
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 4 triggered -> ESCALATE (High Score Anomalies).", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 5: score >= LOW_THRESHOLD AND score < HIGH_THRESHOLD
    # --------------------------------------------------------------------------
    if score >= low_thresh and score < high_thresh:
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="Ambiguous fit. Human judgment required.",
            matched_condition=5,
            escalation_reason=(
                f"Candidate score ({score:.2f}) lies in the mid-range evaluation band "
                f"[{low_thresh:.1f}, {high_thresh:.1f}]. Recruiter interview assessment required."
            ),
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 5 triggered -> ESCALATE (Mid-Range).", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 6: score < LOW_THRESHOLD AND hard_failures >= 70% AND 0 verified matches AND low match ratio (<35%)
    # --------------------------------------------------------------------------
    failure_ratio = len(hard_failures) / max(total_must_haves, 1)
    if score < low_thresh and failure_ratio >= reject_prop and verified_must_haves_count == 0 and must_have_match_ratio < 0.35:
        missing_preview = ", ".join(hard_failures[:4])
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.AUTO_REJECT,
            reason=(
                f"Candidate did not meet core baseline requirements (score: {score:.2f} < {low_thresh:.1f}). "
                f"Failed {len(hard_failures)} of {total_must_haves} essential must-haves ({missing_preview}) "
                f"with zero verified demonstrated technical competencies."
            ),
            matched_condition=6,
            escalation_reason=None,
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 6 triggered -> AUTO_REJECT.", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Condition 7: score < LOW_THRESHOLD AND any single verified must-have matched
    # (Structural Recall Bias: A single verified skill saves candidate from auto-rejection)
    # --------------------------------------------------------------------------
    if score < low_thresh and (verified_must_haves_count > 0 or must_have_match_ratio >= 0.35):
        res = Gate7DecisionResult(
            candidate_id=cid,
            job_id=jid,
            decision=DecisionType.ESCALATE,
            reason="Low overall score but demonstrated relevant skill found. Recall bias applied.",
            matched_condition=7,
            escalation_reason=(
                f"Overall score ({score:.2f}) fell below threshold ({low_thresh:.1f}), but candidate possesses "
                f"{verified_must_haves_count} verified must-have match(es) or {must_have_match_ratio:.0%} skill alignment."
            ),
        )
        _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
        logger.info(f"[{cid}] Gate 7 Condition 7 triggered -> ESCALATE (Recall Bias Protection).", gate="GATE_7", candidate_id=cid)
        return res

    # --------------------------------------------------------------------------
    # Default Safe Fallback (Principle 6: Any unhandled edge case routes to ESCALATE)
    # --------------------------------------------------------------------------
    res = Gate7DecisionResult(
        candidate_id=cid,
        job_id=jid,
        decision=DecisionType.ESCALATE,
        reason="Borderline profile requiring human review.",
        matched_condition=5,
        escalation_reason="Candidate did not meet strict auto-advance or auto-reject criteria.",
    )
    _validate_decision(res, verified_must_haves_count, integrity_flags, verification_flags)
    logger.info(f"[{cid}] Gate 7 Default fallback -> ESCALATE.", gate="GATE_7", candidate_id=cid)
    return res


def _extract_top_strengths(ledger: Optional[ScoringLedger]) -> List[str]:
    """Extracts top verified requirements from ledger entries."""
    if not ledger:
        return []
    strengths = []
    for e in ledger.entries:
        if e.score_contribution > 0:
            req_clean = e.requirement.replace("Must-Have: ", "").replace("[Nice-to-Have] ", "").strip()
            strengths.append(req_clean)
    return strengths


def _validate_decision(
    result: Gate7DecisionResult,
    verified_must_haves_count: int,
    integrity_flags: List[Any],
    verification_flags: List[Any],
) -> None:
    """
    Asserts compliance with core assignment invariants (Task 6.2):
      1. Decision is strictly one of AUTO_ADVANCE, ESCALATE, AUTO_REJECT.
      2. Reason string is non-empty.
      3. No candidate with a verified must-have match is AUTO_REJECT (Recall Bias).
      4. No candidate with integrity or critical verification flags is AUTO_ADVANCE (Flag Immunity).
    """
    assert result.decision in (DecisionType.AUTO_ADVANCE, DecisionType.ESCALATE, DecisionType.AUTO_REJECT), (
        f"Invalid decision type: {result.decision}"
    )
    assert result.reason and len(result.reason.strip()) > 0, "Decision reason cannot be empty."

    # Invariant 3: Structural Recall Bias
    if verified_must_haves_count > 0 and result.decision == DecisionType.AUTO_REJECT:
        raise AssertionError(
            f"Violation of Principle 6 (Structural Recall Bias): Candidate with {verified_must_haves_count} "
            f"verified must-have matches was assigned AUTO_REJECT!"
        )

    # Invariant 4: Flag Immunity
    critical_v_flags = [
        f for f in verification_flags
        if (getattr(f, "name", str(f)) in ["GITHUB_NOT_FOUND", "GITHUB_LANGUAGE_MISMATCH"])
    ]
    if (len(integrity_flags) > 0 or len(critical_v_flags) > 0) and result.decision == DecisionType.AUTO_ADVANCE:
        raise AssertionError(
            f"Violation of Gate 7 Integrity Policy: Candidate with critical flags was assigned AUTO_ADVANCE! "
            f"Integrity flags: {len(integrity_flags)}, Critical Verification flags: {len(critical_v_flags)}."
        )
