"""
HYT ATS - Gate 5: Fast Filter Funnel (Domain Pre-Filter)
=========================================================
Implements conservative domain mismatch pre-filtering using local sentence-transformers (Zero API Cost).
Enforces Principle 6 (Structural Recall Bias):
  - Threshold is set conservatively (e.g. 0.30) to catch obvious domain mismatches
    (e.g. healthcare/nursing resumes applying for Senior Distributed Systems roles).
  - Candidates falling below threshold are NEVER auto-rejected. They are marked
    as ESCALATE for human recruiter confirmation, skipping further scoring computation.
"""

from typing import Dict, Any, List, Optional
import numpy as np

from src.models.schemas import (
    ResumeStructured,
    JobDescription,
    PreFilterResult,
    DecisionType,
)
from src.gates.jd_embedding import get_embedding_model, embed_job_requirements
from src.utils.config import get_config
from src.utils.logger import get_logger

logger = get_logger("GATE_5_PRE_FILTER")


def evaluate_gate5(
    resume: ResumeStructured,
    jd: JobDescription,
    jd_embeddings: Optional[Dict[str, Any]] = None,
) -> PreFilterResult:
    """
    Computes dense cosine similarity between candidate verified skills and JD must-haves.
    
    Args:
        resume: Extracted candidate ResumeStructured model from Gate 3.
        jd: Target JobDescription model.
        jd_embeddings: Optional pre-computed JD embeddings dict from Gate A3.
        
    Returns:
        PreFilterResult detailing whether candidate passed the domain pre-filter.
    """
    cfg = get_config()
    threshold = cfg.gate5.prefilter_similarity_threshold
    cid = resume.candidate_id
    jid = jd.job_id

    # 1. Load JD Embeddings if not provided
    if jd_embeddings is None:
        jd_embeddings = embed_job_requirements(jd, use_cache=True)

    must_have_vectors = list(jd_embeddings.get("must_haves", {}).values())
    domain_vec = jd_embeddings.get("domain_vector", [])

    # 2. Extract Candidate Skills Representation
    # Prioritize verified skills; fall back to all claimed skills if 0 verified
    candidate_skills = [s.name for s in resume.skills if s.is_verified]
    if not candidate_skills:
        candidate_skills = [s.name for s in resume.skills]

    # If candidate has zero skills claimed or verified
    if not candidate_skills:
        logger.warning(
            f"[{cid}] Candidate has zero technical skills extracted. Triggering Gate 5 ESCALATE.",
            gate="GATE_5",
            candidate_id=cid,
        )
        return PreFilterResult(
            candidate_id=cid,
            job_id=jid,
            passed=False,
            similarity=0.0,
            threshold=threshold,
            decision=DecisionType.ESCALATE,
            reason="Job family mismatch suspected. Candidate has no demonstrated technical skills.",
            skip_scoring=False,
        )

    # 3. Dense Vector Encoding of Candidate Skills
    model = get_embedding_model()
    cand_skill_text = ", ".join(candidate_skills)

    if model == "FALLBACK":
        # Deterministic token lexical overlap fallback if PyTorch sentence-transformers unavailable
        jd_terms = set(s.lower() for s in jd.must_have_skills)
        cand_terms = set(s.lower() for s in candidate_skills)
        overlap = len(jd_terms.intersection(cand_terms))
        sim = overlap / max(len(jd_terms), 1)
    else:
        cand_vec = model.encode(cand_skill_text, normalize_embeddings=True)
        cand_vec = np.array(cand_vec, dtype=np.float32)

        # 4. Compute Conservative Cosine Similarity against JD
        similarities = []
        
        # Compare against mean of must-haves
        if must_have_vectors:
            mh_arr = np.array(must_have_vectors, dtype=np.float32)
            mean_mh = np.mean(mh_arr, axis=0)
            norm = np.linalg.norm(mean_mh)
            if norm > 1e-6:
                mean_mh = mean_mh / norm
            similarities.append(float(np.dot(cand_vec, mean_mh)))

            # Compare against max individual must-have match against composite string
            indiv_sims = [float(np.dot(cand_vec, v)) for v in must_have_vectors]
            similarities.append(max(indiv_sims))

            # Compare against pairwise individual candidate skill vs JD must-have skill (guarantees specialists never filtered out)
            if candidate_skills:
                indiv_cand_vecs = model.encode(candidate_skills, normalize_embeddings=True)
                cand_arr = np.array(indiv_cand_vecs, dtype=np.float32)
                pairwise_matrix = np.dot(cand_arr, mh_arr.T)
                similarities.append(float(np.max(pairwise_matrix)))

        # Compare against overall domain vector
        if domain_vec:
            d_vec = np.array(domain_vec, dtype=np.float32)
            norm = np.linalg.norm(d_vec)
            if norm > 1e-6:
                d_vec = d_vec / norm
            similarities.append(float(np.dot(cand_vec, d_vec)))

        sim = max(similarities) if similarities else 0.0

    # Clean float rounding
    sim_score = round(float(sim), 4)

    # 5. Evaluate Against Threshold
    if sim_score < threshold:
        logger.info(
            f"[{cid}] Gate 5 PRE_FILTER triggered: similarity {sim_score:.2f} < threshold {threshold:.2f}. "
            f"Candidate routed to ESCALATE.",
            gate="GATE_5",
            candidate_id=cid,
        )
        return PreFilterResult(
            candidate_id=cid,
            job_id=jid,
            passed=False,
            similarity=sim_score,
            threshold=threshold,
            decision=DecisionType.ESCALATE,
            reason="Job family mismatch suspected. Human confirmation required.",
            skip_scoring=False,
        )

    logger.info(
        f"[{cid}] Gate 5 PASSED: similarity {sim_score:.2f} >= threshold {threshold:.2f}. Proceeding to Gate 6.",
        gate="GATE_5",
        candidate_id=cid,
    )
    return PreFilterResult(
        candidate_id=cid,
        job_id=jid,
        passed=True,
        similarity=sim_score,
        threshold=threshold,
        decision=None,
        reason=None,
        skip_scoring=False,
    )
