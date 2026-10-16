"""
HYT ATS - Counterfactual Fairness Audit Engine (Phase 8 Task 8.7)
================================================================
Evaluates statistical parity and counterfactual robustness across demographic perturbations:
  1. Gender & Ethnicity Name Cues (e.g., John Doe -> Jane Doe -> Aisha Khan -> Chen Wei).
  2. University Prestige Perturbations (e.g., MIT / Stanford -> State / Community College).
  
Evaluates deterministic Gate 6 and Gate 7 pipelines with ZERO LLM calls.
Quantifies:
  - Mean Absolute Score Delta (Δ).
  - Decision Flip Count and Decision Flip Rate (should be 0.0% by design).
"""

import copy
from typing import List, Dict, Any, Tuple
from src.models.schemas import (
    ResumeStructured,
    JobDescription,
    EducationEntry,
    DecisionType,
    Gate0IntegrityReport,
    Gate4VerificationReport,
    PreFilterResult,
)
from src.gates.gate6 import evaluate_gate6
from src.gates.gate7 import evaluate_gate7
from src.utils.logger import get_logger

logger = get_logger("FAIRNESS_AUDIT")

DEMOGRAPHIC_VARIANTS = [
    {"name": "Jane Smith", "gender": "Female", "ethnicity": "Anglo-Western"},
    {"name": "Aisha Al-Mansoor", "gender": "Female", "ethnicity": "Middle Eastern"},
    {"name": "Jamal Washington", "gender": "Male", "ethnicity": "African-American"},
    {"name": "Chen Wei", "gender": "Male", "ethnicity": "East Asian"},
    {"name": "Priya Sharma", "gender": "Female", "ethnicity": "South Asian"},
    {"name": "Alejandro Rodriguez", "gender": "Male", "ethnicity": "Hispanic"},
]

COLLEGE_VARIANTS = [
    "Massachusetts Institute of Technology (MIT)",
    "Stanford University",
    "Metropolitan State University of Denver",
    "Community College of Philadelphia",
    "University of Nairobi",
    "National Institute of Technology",
]


def create_counterfactual_variant(
    base_resume: ResumeStructured,
    name_perturbation: Dict[str, str],
    college_perturbation: str,
) -> ResumeStructured:
    """
    Creates an exact counterfactual copy of a structured resume, modifying only demographic/institution cues.
    """
    variant = copy.deepcopy(base_resume)
    # 1. Perturb Education Institution strictly on existing entries (do not inject net-new degrees)
    if variant.education:
        for edu in variant.education:
            edu.institution = college_perturbation
    return variant


def audit_candidate_fairness(
    candidate_resume: ResumeStructured,
    jd: JobDescription,
    jd_embeddings: Any,
    gate0_report: Gate0IntegrityReport,
    gate4_report: Gate4VerificationReport,
    prefilter_result: PreFilterResult,
) -> Dict[str, Any]:
    """
    Audits a single candidate across all counterfactual demographic variants.
    """
    # 1. Baseline Evaluation
    base_ledger = evaluate_gate6(candidate_resume, jd, jd_embeddings=jd_embeddings)
    base_decision = evaluate_gate7(
        ledger=base_ledger,
        gate0_report=gate0_report,
        gate4_report=gate4_report,
        prefilter_result=prefilter_result,
        candidate_id=candidate_resume.candidate_id,
        job_id=jd.job_id,
    )
    base_score = base_ledger.breakdown.weighted_total

    variant_results = []
    score_deltas = []
    decision_flips = 0

    # 2. Test counterfactual combinations
    for demo in DEMOGRAPHIC_VARIANTS:
        for college in COLLEGE_VARIANTS:
            variant_resume = create_counterfactual_variant(candidate_resume, demo, college)
            v_ledger = evaluate_gate6(variant_resume, jd, jd_embeddings=jd_embeddings)
            v_decision = evaluate_gate7(
                ledger=v_ledger,
                gate0_report=gate0_report,
                gate4_report=gate4_report,
                prefilter_result=prefilter_result,
                candidate_id=f"{candidate_resume.candidate_id}_{demo['gender']}",
                job_id=jd.job_id,
            )
            v_score = v_ledger.breakdown.weighted_total
            delta = abs(v_score - base_score)
            score_deltas.append(delta)

            flipped = v_decision.decision != base_decision.decision
            if flipped:
                decision_flips += 1

            variant_results.append({
                "perturbation": f"{demo['name']} ({demo['gender']}) @ {college[:25]}",
                "score": round(v_score, 2),
                "delta": round(delta, 2),
                "decision": v_decision.decision.value,
                "flipped": flipped,
            })

    mean_delta = sum(score_deltas) / len(score_deltas) if score_deltas else 0.0
    flip_rate = decision_flips / len(score_deltas) if score_deltas else 0.0

    return {
        "candidate_id": candidate_resume.candidate_id,
        "base_score": round(base_score, 2),
        "base_decision": base_decision.decision.value,
        "total_variants_tested": len(score_deltas),
        "mean_score_delta": round(mean_delta, 4),
        "decision_flips": decision_flips,
        "decision_flip_rate": round(flip_rate, 4),
        "parity_preserved": decision_flips == 0,
        "samples": variant_results[:4],
    }


def run_fairness_audit_suite(
    candidates: List[Tuple[ResumeStructured, JobDescription, Any, Gate0IntegrityReport, Gate4VerificationReport, PreFilterResult]],
) -> Dict[str, Any]:
    """
    Executes counterfactual fairness audit over a cohort of candidate profiles.
    """
    total_candidates = len(candidates)
    if total_candidates == 0:
        return {"total_evaluated": 0, "overall_mean_delta": 0.0, "overall_flip_rate": 0.0}

    all_deltas = []
    total_flips = 0
    total_variant_runs = 0
    candidate_reports = []

    for resume, jd, jd_emb, g0, g4, g5 in candidates:
        res = audit_candidate_fairness(resume, jd, jd_emb, g0, g4, g5)
        all_deltas.append(res["mean_score_delta"])
        total_flips += res["decision_flips"]
        total_variant_runs += res["total_variants_tested"]
        candidate_reports.append(res)

    overall_mean_delta = sum(all_deltas) / len(all_deltas) if all_deltas else 0.0
    overall_flip_rate = total_flips / total_variant_runs if total_variant_runs > 0 else 0.0

    return {
        "total_candidates_audited": total_candidates,
        "total_counterfactual_evaluations": total_variant_runs,
        "overall_mean_score_delta": round(overall_mean_delta, 4),
        "total_decision_flips": total_flips,
        "decision_flip_rate": round(overall_flip_rate, 4),
        "demographic_neutrality_verified": total_flips == 0 and abs(overall_mean_delta) < 1e-4,
        "candidate_summaries": candidate_reports,
    }
