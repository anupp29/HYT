"""
Unit Tests for Phase 8 (Evaluation Harness, Metrics, Judge, Fairness, Adversarial)
===================================================================================
"""

import math
import pytest
from pathlib import Path
from tempfile import TemporaryDirectory

from eval.metrics import (
    compute_dcg,
    compute_ndcg,
    compute_decision_metrics,
    compute_set_f1,
    compute_extraction_metrics,
    compute_jaccard_similarity,
    rank_by_jaccard,
    rank_by_tfidf,
    normalize_decision_label,
)
from eval.judge import (
    evaluate_explanation_rule_based,
    interpret_cohen_kappa,
    run_judge_audit,
)
from eval.fairness import (
    create_counterfactual_variant,
    audit_candidate_fairness,
)
from eval.adversarial import generate_adversarial_pdf, run_adversarial_suite
from eval.harness import load_golden_dataset

from src.models.schemas import (
    RecruiterExplanation,
    ResumeStructured,
    Skill,
    JobDescription,
    EducationEntry,
    ExperienceEntry,
)
from src.gates.gate0 import evaluate_gate0

PROJECT_ROOT = Path(__file__).resolve().parent.parent


# ==========================================
# 1. NDCG & Ranking Quality Tests
# ==========================================

def test_ndcg_perfect_ranking():
    """Perfect ranking must produce an NDCG@k of 1.0."""
    actual_relevances = [5.0, 4.0, 3.0, 2.0, 1.0]
    predicted_scores = [95.0, 85.0, 75.0, 65.0, 55.0]

    ndcg5 = compute_ndcg(actual_relevances, predicted_scores, k=5)
    assert math.isclose(ndcg5, 1.0, rel_tol=1e-5)


def test_ndcg_inverted_ranking_degradation():
    """Inverted ranking must produce significantly lower NDCG."""
    actual_relevances = [5.0, 4.0, 3.0, 2.0, 1.0]
    inverted_scores = [55.0, 65.0, 75.0, 85.0, 95.0]

    ndcg_inverted = compute_ndcg(actual_relevances, inverted_scores, k=5)
    assert 0.0 < ndcg_inverted < 0.85


def test_ndcg_empty_or_zero_relevance():
    """Handles empty inputs and zero relevance lists gracefully."""
    assert compute_ndcg([], []) == 0.0
    assert compute_ndcg([0.0, 0.0], [50.0, 60.0]) == 1.0


# ==========================================
# 2. Decision Metrics & Confusion Matrix
# ==========================================

def test_decision_metrics_perfect_accuracy():
    """Perfect predictions yield 100% accuracy and 1.0 F1."""
    y_true = ["advance", "escalate", "reject", "advance"]
    y_pred = ["AUTO_ADVANCE", "ESCALATE", "AUTO_REJECT", "AUTO_ADVANCE"]

    metrics = compute_decision_metrics(y_true, y_pred)
    assert metrics["accuracy"] == 1.0
    assert metrics["macro_f1"] == 1.0
    assert metrics["total_evaluated"] == 4
    assert metrics["confusion_matrix"]["matrix"][0][0] == 2  # AUTO_ADVANCE TP


def test_decision_metrics_confusion_matrix_structure():
    """Confusion matrix properly logs false positives and false negatives."""
    y_true = ["advance", "reject"]
    y_pred = ["ESCALATE", "AUTO_REJECT"]  # Recall bias escalation

    metrics = compute_decision_metrics(y_true, y_pred)
    assert metrics["accuracy"] == 0.5
    cm = metrics["confusion_matrix"]["matrix"]
    # Row 0 (AUTO_ADVANCE) predicted as ESCALATE (col 1)
    assert cm[0][1] == 1


# ==========================================
# 3. Extraction Quality (Field F1)
# ==========================================

def test_set_f1_math():
    """Validates precision, recall, and F1 calculations on token sets."""
    s1 = {"python", "fastapi", "docker"}
    s2 = {"python", "docker", "kubernetes"}

    p, r, f1 = compute_set_f1(s1, s2)
    assert math.isclose(p, 2 / 3, rel_tol=1e-3)
    assert math.isclose(r, 2 / 3, rel_tol=1e-3)
    assert math.isclose(f1, 2 / 3, rel_tol=1e-3)


def test_compute_extraction_metrics():
    """Validates multidimensional extraction evaluation."""
    ext = [{
        "skills": ["python", "sql"],
        "experience_years": 4.5,
        "education_level": "Bachelor of Science",
        "job_titles": ["Software Engineer"],
        "location": "San Francisco, CA",
    }]
    gt = [{
        "skills": ["python", "sql", "git"],
        "experience_years": 5.0,  # Within 1.0 yr tolerance
        "education_level": "Bachelor of Science in CS",
        "job_titles": ["Software Engineer"],
        "location": "San Francisco",
    }]

    res = compute_extraction_metrics(ext, gt)
    assert res["experience_years_accuracy"] == 1.0
    assert res["education_accuracy"] == 1.0
    assert res["job_titles_f1"] == 1.0
    assert res["skills_f1"] > 0.70


# ==========================================
# 4. Baselines (Jaccard and TF-IDF)
# ==========================================

def test_jaccard_similarity_identical_and_disjoint():
    """Tests token overlap behavior."""
    text1 = "Python Docker Kubernetes AWS"
    text2 = "Python Docker Kubernetes AWS"
    text3 = "Unrelated Healthcare Clinical Nursing"

    assert compute_jaccard_similarity(text1, text2) == 1.0
    assert compute_jaccard_similarity(text1, text3) == 0.0


def test_tfidf_baseline_ranking():
    """Tests TF-IDF cosine similarity ranker."""
    jd = "Senior Python engineer building microservices with Docker and Kubernetes"
    resumes = [
        "Expert Python developer proficient in Kubernetes, Docker, and microservices architecture.",
        "Experienced registered nurse providing patient care and medical charting.",
    ]
    sims = rank_by_tfidf(resumes, jd)
    assert len(sims) == 2
    assert sims[0] > sims[1]  # Tech resume must rank higher than nursing resume
    assert sims[0] > 0.35


# ==========================================
# 5. LLM-as-Judge & Cohen's Kappa
# ==========================================

def test_explanation_rule_based_audit():
    """Validates rubric ratings on a high-quality recruiter explanation."""
    expl = RecruiterExplanation(
        strengths_sentence="Candidate demonstrates strong verified expertise in Python, FastAPI, and Docker microservices.",
        gaps_sentence="Candidate lacks hands-on production experience in Kubernetes orchestration and distributed Kafka streaming.",
        interview_focus_sentence="Probe candidate's ability to assess distributed consensus algorithms and evaluate readiness for container scaling.",
        full_explanation="Full text explanation...",
    )
    res = evaluate_explanation_rule_based(expl)
    assert res["citation_quality"] == 3
    assert res["gap_specificity"] == 3
    assert res["actionability"] == 3
    assert res["composite_score"] == 3.0


def test_cohen_kappa_interpretation():
    """Validates Landis-Koch scale mappings."""
    assert interpret_cohen_kappa(0.85) == "Near Perfect Agreement"
    assert interpret_cohen_kappa(0.70) == "Substantial Agreement"
    assert interpret_cohen_kappa(0.50) == "Moderate Agreement"
    assert interpret_cohen_kappa(0.15) == "Slight Agreement"


# ==========================================
# 6. Counterfactual Demographic Fairness
# ==========================================

def test_create_counterfactual_variant():
    """Verifies variant creation modifies demographic institution while preserving skills."""
    base = ResumeStructured(
        candidate_id="base_cand",
        skills=[Skill(name="Python", is_verified=True, proficiency=4)],
        experience=[ExperienceEntry(title="Developer", company="Tech Corp", start_date="2020", end_date="2023", years=3.0)],
        education=[EducationEntry(degree="B.S. Computer Science", institution="Stanford University", graduation_year=2020)],
        content_hash="test_base_hash",
    )

    variant = create_counterfactual_variant(
        base,
        {"name": "Aisha Khan", "gender": "Female", "ethnicity": "South Asian"},
        "Metropolitan State University of Denver",
    )

    assert variant.education[0].institution == "Metropolitan State University of Denver"
    assert variant.skills[0].name == "Python"
    assert variant.experience[0].years == 3.0


# ==========================================
# 7. Adversarial Test Suite
# ==========================================

def test_generate_adversarial_pdf_and_detection():
    """Verifies synthetic adversarial PDFs are created and detected by Gate 0."""
    with TemporaryDirectory() as tmpdir:
        dest = Path(tmpdir) / "white_text_attack.pdf"
        generate_adversarial_pdf("white_text", dest)
        assert dest.exists()
        assert dest.stat().st_size > 0

        report = evaluate_gate0(str(dest))
        # White text detector must catch low-contrast hidden text
        flag_names = [f.name for f in report.flags]
        assert "WHITE_TEXT_DETECTED" in flag_names or len(report.flags) > 0


# ==========================================
# 8. Golden Dataset Intake Integrity
# ==========================================

def test_load_golden_dataset_integrity():
    """Verifies golden_labels.csv is loaded and meets the 200-pair requirement."""
    golden_file = PROJECT_ROOT / "data" / "golden" / "golden_labels.csv"
    if not golden_file.exists():
        pytest.skip("Golden dataset not found at expected location")

    pairs = load_golden_dataset(golden_file)
    assert len(pairs) >= 200

    required_cols = ["pair_id", "job_id", "candidate_id", "human_fit_score", "human_decision"]
    for p in pairs:
        for col in required_cols:
            assert col in p
            assert p[col] != "", f"Missing field {col} in pair {p.get('pair_id')}"
        score = float(p["human_fit_score"])
        assert 1.0 <= score <= 5.0
        assert p["human_decision"] in ["advance", "escalate", "reject"]
