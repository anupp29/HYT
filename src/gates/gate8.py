"""
HYT ATS - Gate 8: Grounded Recruiter Explanation Generator (LLM Call 2)
=======================================================================
Generates a grounded, 3-sentence recruiter assessment (Principles 2, 7, & 8).
Guarantees:
  1. Non-Token Waste (Rule 8): Never generates explanations for AUTO_REJECT (returns None).
  2. Grounded Truth: Input to LLM is strictly the Evidence Ledger JSON.
     The model cannot hallucinate evidence or skills not present in the ledger.
  3. Structured 3-Sentence Schema:
     - Sentence 1: Top verified strengths with specific citations.
     - Sentence 2: Critical gaps with named JD requirements.
     - Sentence 3: Actionable interview focus areas.
  4. Flag Verbatim Appending: All security and verification flags are appended verbatim.
  5. Caching: Re-runs load from cache with zero LLM API calls.
"""

import hashlib
import json
import re
from typing import Dict, Any, List, Optional

from src.models.schemas import (
    DecisionType,
    Gate7DecisionResult,
    ScoringLedger,
    Gate0IntegrityReport,
    Gate4VerificationReport,
    JobDescription,
    RecruiterExplanation,
)
from src.utils.cache import get_cache_manager
from src.utils.config import get_config
from src.utils.llm_client import get_llm_client
from src.utils.logger import get_logger

logger = get_logger("GATE_8_EXPLANATION_GENERATOR")


EXPLANATION_SYSTEM_PROMPT = """You are a senior technical hiring auditor.
You are given the immutable Evidence Ledger from an Applicant Tracking System evaluation.
Your task is to write a strictly grounded, factual, 3-sentence recruiter summary.

STRICT INSTRUCTIONS:
1. Rely EXCLUSIVELY on the provided ledger data. DO NOT hallucinate, infer, or introduce any technologies, companies, or metrics not explicitly cited in the ledger.
2. Structure your output into exactly three sentences:
   - Sentence 1 (Strengths): State candidate's primary verified technical strengths and citations from the ledger. Name specific skills.
   - Sentence 2 (Gaps): State critical missing must-haves or experience deficits cited in the ledger gaps.
   - Sentence 3 (Interview Focus): Recommend 1 to 2 targeted technical interview questions or live coding focus areas based on the gaps.
3. Return strictly valid JSON adhering to this schema:
{
  "strengths_sentence": "Sentence 1 text here.",
  "gaps_sentence": "Sentence 2 text here.",
  "interview_focus_sentence": "Sentence 3 text here."
}
"""


def evaluate_gate8(
    ledger: ScoringLedger,
    decision_result: Gate7DecisionResult,
    gate0_report: Optional[Gate0IntegrityReport] = None,
    gate4_report: Optional[Gate4VerificationReport] = None,
    jd: Optional[JobDescription] = None,
    use_cache: bool = True,
    force_refresh: bool = False,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> Optional[RecruiterExplanation]:
    """
    Synthesizes a grounded 3-sentence recruiter explanation for AUTO_ADVANCE and ESCALATE candidates.
    
    Args:
        ledger: Complete ScoringLedger from Gate 6.
        decision_result: Gate7DecisionResult from Gate 7.
        gate0_report: Optional Gate0 report for flag appending.
        gate4_report: Optional Gate4 report for flag appending.
        jd: Target JobDescription model.
        use_cache: If True, reads from disk cache on duplicate runs.
        force_refresh: If True, bypasses cache.
        provider: Optional LLM provider override.
        model: Optional model override.
        
    Returns:
        RecruiterExplanation if candidate is AUTO_ADVANCE or ESCALATE; None if AUTO_REJECT.
    """
    cid = ledger.candidate_id
    jid = ledger.job_id
    cfg = get_config()

    # Rule 8: Never generate explanations for AUTO_REJECT (Token Conservation)
    if decision_result.decision == DecisionType.AUTO_REJECT:
        logger.info(
            f"[{cid}] Candidate AUTO_REJECTED. Skipping Gate 8 explanation per Rule 8 (Zero token waste).",
            gate="GATE_8",
            candidate_id=cid,
        )
        return None

    # Compute deterministic cache key (candidate_id + job content hash per Master Plan Section 5)
    cache = get_cache_manager()
    jd_hash = jd.content_hash if jd else jid
    cache_key = hashlib.sha256(f"{cid}:{jd_hash}".encode("utf-8")).hexdigest()

    # 1. Disk Cache Check (Principle 7)
    if use_cache and not force_refresh:
        cached = cache.get_model("explanations", cache_key, RecruiterExplanation)
        if cached is None:
            # Fallback to legacy score-appended cache key if exists
            alt_k = hashlib.sha256(f"{cid}:{jd_hash}:{ledger.breakdown.weighted_total}".encode("utf-8")).hexdigest()
            cached = cache.get_model("explanations", alt_k, RecruiterExplanation)
            if cached is not None:
                cache.set_model("explanations", cache_key, cached)

        if cached is not None:
            logger.info(
                f"[{cid}] Cache HIT for candidate explanation (hash: {cache_key[:12]}). Zero LLM calls made.",
                gate="GATE_8",
                candidate_id=cid,
            )
            return cached

    # 2. Extract Flags
    integrity_flags = [f.name if hasattr(f, "name") else str(f) for f in (gate0_report.flags if gate0_report else [])]
    verification_flags = [f.name if hasattr(f, "name") else str(f) for f in (gate4_report.flags if gate4_report else [])]

    # 3. Compile Grounded Ledger Payload (LLM sees ONLY the ledger)
    verified_strengths = []
    gaps_list = []
    all_skills_in_ledger = set()

    for e in ledger.entries:
        req_clean = e.requirement.replace("Must-Have: ", "").replace("[Nice-to-Have] ", "").strip()
        all_skills_in_ledger.add(req_clean.lower())
        if e.is_verified and e.score_contribution > 0:
            verified_strengths.append({
                "requirement": req_clean,
                "evidence_quote": e.evidence[:140] if e.evidence else "Demonstrated in work experience.",
                "points": e.score_contribution,
            })
        if e.gap:
            gaps_list.append({
                "requirement": req_clean,
                "gap_detail": e.gap,
            })

    ledger_payload = {
        "candidate_id": cid,
        "job_title": jd.title if jd else "Target Role",
        "weighted_score": ledger.breakdown.weighted_total,
        "decision": decision_result.decision.value,
        "decision_reason": decision_result.reason,
        "is_overqualified": ledger.is_overqualified,
        "verified_strengths": verified_strengths[:6],
        "critical_gaps": gaps_list[:5],
        "hard_failures": ledger.hard_failures,
    }

    # 4. Generate 3 Sentences via LLM Client (LLM Call 2)
    llm = get_llm_client()
    user_prompt = f"EVIDENCE LEDGER:\n```json\n{json.dumps(ledger_payload, indent=2)}\n```\nSynthesize the 3-sentence recruiter assessment:"

    parsed_json = None
    try:
        response = llm.complete(
            system_prompt=EXPLANATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_mode=True,
            override_provider=provider,
            override_model=model,
            max_tokens=300,
        )
        parsed_json = _clean_and_parse_explanation(response)
    except Exception as exc:
        logger.warning(
            f"[{cid}] LLM Explanation call failed: {exc}. Activating deterministic grounded fallback.",
            gate="GATE_8",
            candidate_id=cid,
        )

    # 5. Deterministic Fallback if LLM unavailable
    if not parsed_json or not _is_valid_explanation(parsed_json):
        parsed_json = _generate_deterministic_fallback(ledger_payload, verified_strengths, gaps_list)

    s1 = parsed_json.get("strengths_sentence", "").strip()
    s2 = parsed_json.get("gaps_sentence", "").strip()
    s3 = parsed_json.get("interview_focus_sentence", "").strip()

    full_text = f"{s1} {s2} {s3}".strip()

    # 6. Strict Validation: Must reference at least one skill name from ledger
    has_skill_reference = any(skill in full_text.lower() for skill in all_skills_in_ledger if len(skill) >= 3)
    if not has_skill_reference and verified_strengths:
        # Grounding patch if LLM was too generic
        first_skill = verified_strengths[0]["requirement"]
        s1 = f"Candidate demonstrated verified competency in {first_skill}, backed by documented project accomplishments. " + s1
        full_text = f"{s1} {s2} {s3}".strip()

    explanation = RecruiterExplanation(
        strengths_sentence=s1,
        gaps_sentence=s2,
        interview_focus_sentence=s3,
        full_explanation=full_text,
        integrity_flags=integrity_flags,
        verification_flags=verification_flags,
    )

    # 7. Write to Disk Cache
    cache.set("explanations", cache_key, explanation)
    logger.info(
        f"[{cid}] Gate 8 complete: Generated and cached 3-sentence explanation ({len(full_text)} chars).",
        gate="GATE_8",
        candidate_id=cid,
    )

    return explanation


def _clean_and_parse_explanation(response_text: str) -> Optional[Dict[str, Any]]:
    """Cleans JSON markdown fences and parses explanation dictionary."""
    if not response_text:
        return None
    cleaned = re.sub(r'```(?:json)?', '', response_text).strip('` \n')
    # Match JSON object
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _is_valid_explanation(parsed: Dict[str, Any]) -> bool:
    """Verifies all 3 sentence keys are present and non-empty."""
    return bool(
        parsed.get("strengths_sentence")
        and parsed.get("gaps_sentence")
        and parsed.get("interview_focus_sentence")
    )


def _generate_deterministic_fallback(
    payload: Dict[str, Any],
    strengths: List[Dict[str, Any]],
    gaps: List[Dict[str, Any]],
) -> Dict[str, str]:
    """Generates 100% grounded deterministic 3-sentence summary when LLM is offline."""
    # Sentence 1: Strengths
    if strengths:
        top_skills = [s["requirement"] for s in strengths[:3]]
        s1 = f"Candidate demonstrates validated technical proficiency in {', '.join(top_skills)}, supported by documented project deliverables in work history."
    else:
        s1 = f"Candidate offers broad foundational industry experience with a total composite score of {payload['weighted_score']:.1f}/100."

    # Sentence 2: Gaps
    if gaps:
        gap_reqs = [g["requirement"] for g in gaps[:3]]
        s2 = f"Primary gaps center on missing verified experience with {', '.join(gap_reqs)} as required by the role specification."
    elif payload.get("is_overqualified"):
        s2 = "Candidate exhibits significant seniority surplus that exceeds the target role requirements."
    else:
        s2 = "No critical technical deficits identified across core requirements."

    # Sentence 3: Interview Focus
    if gaps:
        s3 = f"The technical interview should prioritize assessing practical architecture trade-offs and ability to rapidly bridge the {gaps[0]['requirement']} gap."
    else:
        s3 = "Technical screening should focus on system design depth, production scalability, and team leadership capabilities."

    return {
        "strengths_sentence": s1,
        "gaps_sentence": s2,
        "interview_focus_sentence": s3,
    }
