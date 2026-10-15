"""
HYT ATS - End-to-End Pipeline Orchestrator (Phase 7 Integration)
================================================================
Wires all 10 gates into a seamless, deterministic screening pipeline:
  Gate 0: Integrity Shield (Adversarial attacks & prompt injection)
  Gate 1: Layout-Aware PyMuPDF extraction (Gutter-aware columns)
  Gate 2: Privacy Shield (PII redaction & GitHub extraction)
  Gate 3: Structured Extraction (LLM Call 1 with disk caching)
  Gate 4: Verification Engine (Skill depth & live GitHub audit)
  Gate 5: Fast Filter Funnel (Domain embedding cosine check)
  Gate 6: Deterministic Scoring Engine (5-dim score & evidence ledger)
  Gate 7: Decision Policy Engine (8 priority rules & recall bias)
  Gate 8: Grounded Recruiter Explanation (LLM Call 2 with disk caching)
  Gate 9: CandidateRecord Assembler (Audit trail & output report)
"""

from datetime import datetime
from pathlib import Path
from typing import List, Optional, Union, Dict, Any

from src.models.schemas import (
    CandidateRecord,
    JobDescription,
    DecisionType,
    DimensionType,
    ScoringBreakdown,
)
from src.gates.jd_input import process_jd_input
from src.gates.jd_extraction import extract_job_description
from src.gates.jd_embedding import embed_job_requirements
from src.gates.gate0 import evaluate_gate0
from src.gates.gate1 import extract_clean_text
from src.gates.gate2 import mask_pii
from src.gates.gate3 import extract_structured_resume
from src.gates.gate4 import evaluate_gate4
from src.gates.gate5 import evaluate_gate5
from src.gates.gate6 import evaluate_gate6
from src.gates.gate7 import evaluate_gate7
from src.gates.gate8 import evaluate_gate8
from src.utils.logger import get_logger

logger = get_logger("PIPELINE_ORCHESTRATOR")


def process_candidate(
    resume_path: Union[str, Path],
    jd: Union[JobDescription, str, Path],
    candidate_id: Optional[str] = None,
    use_cache: bool = True,
    force_refresh: bool = False,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> CandidateRecord:
    """
    Executes the complete ATS screening pipeline for a single candidate against a target JD.
    
    Args:
        resume_path: Path to candidate resume PDF file.
        jd: JobDescription object or path to JD file (JSON/TXT/MD).
        candidate_id: Optional candidate identifier; inferred from filename if omitted.
        use_cache: If True, uses cached extractions, embeddings, and explanations.
        force_refresh: If True, invalidates cache and re-computes.
        provider: Optional AI provider override ('ollama', 'groq', 'gemini').
        model: Optional model name override.
        
    Returns:
        Immutable, fully-populated CandidateRecord model.
    """
    resume_file = Path(resume_path)
    if not resume_file.exists():
        raise FileNotFoundError(f"Candidate resume file not found: {resume_file}")

    cid = candidate_id or resume_file.stem
    logger.info(f"[{cid}] Initiating end-to-end ATS screening for candidate {cid}.", candidate_id=cid)

    # 1. Prepare Target Job Description
    if isinstance(jd, JobDescription):
        structured_jd = jd
        raw_jd_text = f"{jd.title} {jd.domain_context or ''} {' '.join(jd.must_have_skills)}"
    else:
        raw_jd = process_jd_input(jd)
        raw_jd_text = raw_jd.raw_text
        structured_jd = extract_job_description(raw_jd, use_cache=use_cache and not force_refresh)

    # Embed JD requirements
    jd_embeddings = embed_job_requirements(structured_jd, use_cache=use_cache and not force_refresh)

    # 2. Gate 0: Integrity Shield
    logger.info(f"[{cid}] [1/8] Running Gate 0 Integrity Shield...", gate="GATE_0", candidate_id=cid)
    gate0_report = evaluate_gate0(str(resume_file), target_jd_text=raw_jd_text)
    integrity_flags = [f.name if hasattr(f, "name") else str(f) for f in gate0_report.flags]

    # 3. Gate 1: Layout-Aware Text Extraction
    logger.info(f"[{cid}] [2/8] Running Gate 1 Layout Extraction...", gate="GATE_1", candidate_id=cid)
    clean_text = extract_clean_text(str(resume_file))

    # 4. Gate 2: Privacy Shield (PII Redaction)
    logger.info(f"[{cid}] [3/8] Running Gate 2 Privacy Shield...", gate="GATE_2", candidate_id=cid)
    pii_res = mask_pii(clean_text, candidate_id=cid)

    # 5. Gate 3: Structured Resume Extraction (LLM Call 1, Cached)
    logger.info(f"[{cid}] [4/8] Running Gate 3 Structured Extraction...", gate="GATE_3", candidate_id=cid)
    structured_resume = extract_structured_resume(
        masked_clean_text=pii_res.masked_clean_text,
        candidate_id=cid,
        github_handle=pii_res.github_handle,
        use_cache=use_cache and not force_refresh,
        force_refresh=force_refresh,
        provider=provider,
        model=model,
    )

    # 6. Gate 4: Verification Layer (Skill Depth & GitHub Audit)
    logger.info(f"[{cid}] [5/8] Running Gate 4 Verification Engine...", gate="GATE_4", candidate_id=cid)
    gate4_report = evaluate_gate4(
        resume=structured_resume,
        github_url=pii_res.github_url,
        github_handle=pii_res.github_handle,
        candidate_id=cid,
        use_cache=use_cache and not force_refresh,
    )
    verification_flags = [f.name if hasattr(f, "name") else str(f) for f in gate4_report.flags]

    # 7. Gate 5: Domain Pre-Filter Funnel
    logger.info(f"[{cid}] [6/8] Running Gate 5 Domain Pre-Filter...", gate="GATE_5", candidate_id=cid)
    prefilter_result = evaluate_gate5(
        resume=structured_resume,
        jd=structured_jd,
        jd_embeddings=jd_embeddings,
    )

    # If Pre-Filter explicitly requested to skip scoring (rare, e.g. corruption)
    if prefilter_result.skip_scoring:
        logger.info(f"[{cid}] Pre-Filter triggered: skipping Gate 6 scoring, routing to ESCALATE.", gate="GATE_5", candidate_id=cid)
        decision_result = evaluate_gate7(
            ledger=None,
            gate0_report=gate0_report,
            gate4_report=gate4_report,
            prefilter_result=prefilter_result,
            candidate_id=cid,
            job_id=structured_jd.job_id,
        )
        empty_breakdown = ScoringBreakdown(
            technical_score=0.0, experience_score=0.0, seniority_score=0.0, education_score=0.0, location_score=0.0, weighted_total=0.0
        )
        return CandidateRecord(
            candidate_id=cid,
            job_id=structured_jd.job_id,
            job_title=structured_jd.title,
            final_score=0.0,
            decision=decision_result.decision,
            decision_reason=decision_result.reason,
            scoring_breakdown=empty_breakdown,
            ledger=[],
            top_strengths=[],
            critical_gaps=["Domain mismatch: Profile does not match target job family."],
            integrity_flags=integrity_flags,
            verification_flags=verification_flags,
            is_quarantined=gate0_report.is_quarantined,
            is_overqualified=False,
            explanation=None,
            processed_at=datetime.now().isoformat(),
        )

    # 8. Gate 6: Deterministic 5-Dimensional Scoring Engine & Evidence Ledger
    logger.info(f"[{cid}] [7/8] Running Gate 6 Deterministic Scoring Engine...", gate="GATE_6", candidate_id=cid)
    ledger = evaluate_gate6(
        resume=structured_resume,
        jd=structured_jd,
        jd_embeddings=jd_embeddings,
    )

    # 9. Gate 7: Decision Policy Engine
    logger.info(f"[{cid}] [8/8] Running Gate 7 Decision Policy Engine...", gate="GATE_7", candidate_id=cid)
    decision_result = evaluate_gate7(
        ledger=ledger,
        gate0_report=gate0_report,
        gate4_report=gate4_report,
        prefilter_result=prefilter_result,
        candidate_id=cid,
        job_id=structured_jd.job_id,
    )

    # 10. Gate 8: Grounded Recruiter Explanation (LLM Call 2, Cached)
    explanation = evaluate_gate8(
        ledger=ledger,
        decision_result=decision_result,
        gate0_report=gate0_report,
        gate4_report=gate4_report,
        jd=structured_jd,
        use_cache=use_cache and not force_refresh,
        force_refresh=force_refresh,
        provider=provider,
        model=model,
    )

    # Compile Top Strengths and Critical Gaps for Record
    top_strengths = []
    critical_gaps = []
    for e in ledger.entries:
        req_clean = e.requirement.replace("Must-Have: ", "").replace("[Nice-to-Have] ", "").strip()
        if e.is_verified and e.score_contribution > 0:
            top_strengths.append(req_clean)
        if e.gap:
            critical_gaps.append(e.gap)

    record = CandidateRecord(
        candidate_id=cid,
        job_id=structured_jd.job_id,
        job_title=structured_jd.title,
        final_score=ledger.breakdown.weighted_total,
        decision=decision_result.decision,
        decision_reason=decision_result.reason,
        scoring_breakdown=ledger.breakdown,
        ledger=ledger.entries,
        top_strengths=top_strengths,
        critical_gaps=critical_gaps,
        integrity_flags=integrity_flags,
        verification_flags=verification_flags,
        is_quarantined=gate0_report.is_quarantined,
        is_overqualified=ledger.is_overqualified,
        explanation=explanation,
        processed_at=datetime.now().isoformat(),
    )

    logger.info(
        f"[{cid}] Screening complete: Score={record.final_score:.2f}, Decision=[{record.decision.value}].",
        candidate_id=cid,
    )
    return record


def process_batch(
    resume_paths: List[Union[str, Path]],
    jd: Union[JobDescription, str, Path],
    use_cache: bool = True,
    force_refresh: bool = False,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> List[CandidateRecord]:
    """
    Processes multiple candidate resumes sequentially with robust progress tracking.
    """
    records: List[CandidateRecord] = []
    total = len(resume_paths)
    logger.info(f"Initiating batch processing of {total} candidate resumes.")

    for idx, path in enumerate(resume_paths, 1):
        p = Path(path)
        logger.info(f"[{idx}/{total}] Processing applicant {p.stem}...")
        try:
            record = process_candidate(
                resume_path=p,
                jd=jd,
                use_cache=use_cache,
                force_refresh=force_refresh,
                provider=provider,
                model=model,
            )
            records.append(record)
        except Exception as exc:
            logger.error(f"Failed processing candidate {p.stem}: {exc}", exc_info=True)

    return records
