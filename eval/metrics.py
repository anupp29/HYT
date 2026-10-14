"""
HYT ATS - Evaluation Metrics & Baseline Algorithms (Phase 8)
============================================================
Mathematical implementation of evaluation metrics per master.md Section D and plan.md Phase 8:
  1. NDCG@k (Normalized Discounted Cumulative Gain) for ranking quality.
  2. Multi-class Decision Metrics (Precision, Recall, Macro F1, Weighted F1, Confusion Matrix).
  3. Extraction F1 per field (Skills, Experience, Education, Titles, Location).
  4. Baseline 1: Token Jaccard Similarity Ranker.
  5. Baseline 2: TF-IDF Cosine Similarity Ranker.
"""

import math
import re
from typing import List, Dict, Any, Tuple, Set, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ------------------------------------------------------------------------------
# 1. Ranking Quality: NDCG@k
# ------------------------------------------------------------------------------

def compute_dcg(relevance_scores: List[float], k: int) -> float:
    """
    Computes Discounted Cumulative Gain at rank k using exponential gain formulation:
    DCG@k = sum_{i=1}^k (2^{rel_i} - 1) / log2(i + 1)
    """
    dcg = 0.0
    for idx, rel in enumerate(relevance_scores[:k]):
        gain = (2.0 ** float(rel)) - 1.0
        discount = math.log2(idx + 2.0)  # idx 0 -> log2(2) = 1
        dcg += gain / discount
    return dcg


def compute_ndcg(
    actual_relevances: List[float],
    predicted_scores: List[float],
    k: int = 10,
) -> float:
    """
    Computes Normalized Discounted Cumulative Gain at rank k.
    
    Args:
        actual_relevances: Ground truth relevance ratings (e.g. human fit score 1-5).
        predicted_scores: System scores or ranking scores used to sort the candidates.
        k: Cutoff rank.
        
    Returns:
        NDCG@k score in [0.0, 1.0].
    """
    if not actual_relevances or not predicted_scores:
        return 0.0

    n = len(actual_relevances)
    k = min(k, n)

    # Sort actual relevances by predicted scores descending (stable tie-break)
    paired = list(zip(predicted_scores, actual_relevances, range(n)))
    # Sort key: predicted score desc, original index asc
    paired.sort(key=lambda x: (-x[0], x[2]))
    predicted_order_relevances = [rel for score, rel, idx in paired]

    # Compute DCG@k for predicted ranking
    dcg = compute_dcg(predicted_order_relevances, k)

    # Compute Ideal DCG (IDCG@k) by sorting actual relevances descending
    ideal_order_relevances = sorted(actual_relevances, reverse=True)
    idcg = compute_dcg(ideal_order_relevances, k)

    if idcg == 0.0:
        return 1.0 if dcg == 0.0 else 0.0

    return dcg / idcg


# ------------------------------------------------------------------------------
# 2. Decision Classification Metrics & Confusion Matrix
# ------------------------------------------------------------------------------

STANDARD_DECISION_CLASSES = ["AUTO_ADVANCE", "ESCALATE", "AUTO_REJECT"]

LABEL_NORMALIZATION = {
    "advance": "AUTO_ADVANCE",
    "auto_advance": "AUTO_ADVANCE",
    "escalate": "ESCALATE",
    "reject": "AUTO_REJECT",
    "auto_reject": "AUTO_REJECT",
}


def normalize_decision_label(label: str) -> str:
    """Normalizes decision strings to canonical enum values."""
    cleaned = str(label).strip().lower().replace("-", "_")
    return LABEL_NORMALIZATION.get(cleaned, str(label).upper())


def compute_decision_metrics(
    y_true: List[str],
    y_pred: List[str],
    classes: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Computes multi-class precision, recall, F1, and confusion matrix.
    
    Args:
        y_true: Ground truth decisions.
        y_pred: System predicted decisions.
        classes: List of target class names.
        
    Returns:
        Dictionary containing overall accuracy, per-class metrics, macro/weighted F1,
        and 2D confusion matrix with labels.
    """
    target_classes = classes or STANDARD_DECISION_CLASSES
    norm_true = [normalize_decision_label(t) for t in y_true]
    norm_pred = [normalize_decision_label(p) for p in y_pred]

    total = len(norm_true)
    if total == 0:
        return {"accuracy": 0.0, "macro_f1": 0.0, "classes": {}}

    # Initialize confusion matrix [true_class][pred_class]
    c_idx = {cls_name: i for i, cls_name in enumerate(target_classes)}
    num_classes = len(target_classes)
    matrix = [[0 for _ in range(num_classes)] for _ in range(num_classes)]

    for t, p in zip(norm_true, norm_pred):
        if t in c_idx and p in c_idx:
            matrix[c_idx[t]][c_idx[p]] += 1

    per_class: Dict[str, Dict[str, float]] = {}
    macro_p, macro_r, macro_f1 = 0.0, 0.0, 0.0
    weighted_f1 = 0.0
    correct = 0

    for cls_name in target_classes:
        i = c_idx[cls_name]
        tp = matrix[i][i]
        fp = sum(matrix[row][i] for row in range(num_classes)) - tp
        fn = sum(matrix[i][col] for col in range(num_classes)) - tp
        support = tp + fn

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        per_class[cls_name] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "support": support,
        }

        correct += tp
        macro_p += prec
        macro_r += rec
        macro_f1 += f1
        weighted_f1 += f1 * support

    accuracy = correct / total if total > 0 else 0.0
    macro_p /= num_classes
    macro_r /= num_classes
    macro_f1 /= num_classes
    weighted_f1 = weighted_f1 / total if total > 0 else 0.0

    return {
        "total_evaluated": total,
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "per_class": per_class,
        "confusion_matrix": {
            "labels": target_classes,
            "matrix": matrix,
        },
    }


# ------------------------------------------------------------------------------
# 3. Extraction Accuracy Metrics (Field F1)
# ------------------------------------------------------------------------------

def _tokenize_text(text: str) -> Set[str]:
    """Extracts alphanumeric tokens in lowercase."""
    return set(re.findall(r"\b[a-zA-Z0-9\+\#\.\-]+\b", str(text).lower()))


def compute_set_f1(pred_set: Set[str], true_set: Set[str]) -> Tuple[float, float, float]:
    """Computes precision, recall, and F1 for two sets of string tokens."""
    if not pred_set and not true_set:
        return 1.0, 1.0, 1.0
    if not pred_set or not true_set:
        return 0.0, 0.0, 0.0

    intersection = len(pred_set.intersection(true_set))
    precision = intersection / len(pred_set)
    recall = intersection / len(true_set)
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    return precision, recall, f1


def compute_extraction_metrics(
    extracted_records: List[Dict[str, Any]],
    ground_truth_records: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluates extraction F1 across 5 key resume dimensions:
      1. Skills (set overlap)
      2. Experience Years (within +/- 1.0 year tolerance)
      3. Education Level (categorical match)
      4. Job Titles (set overlap)
      5. Location (token overlap)
    """
    total = len(ground_truth_records)
    if total == 0:
        return {}

    skills_f1_sum = 0.0
    titles_f1_sum = 0.0
    yoe_correct = 0
    edu_correct = 0
    loc_f1_sum = 0.0

    for ext, gt in zip(extracted_records, ground_truth_records):
        # 1. Skills
        ext_skills = {s.lower().strip() for s in ext.get("skills", [])}
        gt_skills = {s.lower().strip() for s in gt.get("skills", [])}
        _, _, s_f1 = compute_set_f1(ext_skills, gt_skills)
        skills_f1_sum += s_f1

        # 2. Experience Years (+/- 1.0 year tolerance)
        ext_yoe = float(ext.get("experience_years", 0.0))
        gt_yoe = float(gt.get("experience_years", 0.0))
        if abs(ext_yoe - gt_yoe) <= 1.0:
            yoe_correct += 1

        # 3. Education Level
        ext_edu = str(ext.get("education_level", "")).lower().strip()
        gt_edu = str(gt.get("education_level", "")).lower().strip()
        if ext_edu and gt_edu and (ext_edu in gt_edu or gt_edu in ext_edu):
            edu_correct += 1
        elif ext_edu == gt_edu:
            edu_correct += 1

        # 4. Job Titles
        ext_titles = _tokenize_text(" ".join(ext.get("job_titles", [])))
        gt_titles = _tokenize_text(" ".join(gt.get("job_titles", [])))
        _, _, t_f1 = compute_set_f1(ext_titles, gt_titles)
        titles_f1_sum += t_f1

        # 5. Location
        ext_loc = _tokenize_text(str(ext.get("location", "")))
        gt_loc = _tokenize_text(str(gt.get("location", "")))
        _, _, l_f1 = compute_set_f1(ext_loc, gt_loc)
        loc_f1_sum += l_f1

    return {
        "skills_f1": round(skills_f1_sum / total, 4),
        "experience_years_accuracy": round(yoe_correct / total, 4),
        "education_accuracy": round(edu_correct / total, 4),
        "job_titles_f1": round(titles_f1_sum / total, 4),
        "location_f1": round(loc_f1_sum / total, 4),
        "total_evaluated": total,
    }


# ------------------------------------------------------------------------------
# 4. Baseline Rankers (Jaccard and TF-IDF Cosine Similarity)
# ------------------------------------------------------------------------------

def compute_jaccard_similarity(text_a: str, text_b: str) -> float:
    """Computes Jaccard word-token set overlap between two texts."""
    tokens_a = _tokenize_text(text_a)
    tokens_b = _tokenize_text(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = len(tokens_a.intersection(tokens_b))
    union = len(tokens_a.union(tokens_b))
    return intersection / union if union > 0 else 0.0


def rank_by_jaccard(resume_texts: List[str], jd_text: str) -> List[float]:
    """Ranks resumes against a JD using Jaccard word-token overlap."""
    return [compute_jaccard_similarity(r_text, jd_text) for r_text in resume_texts]


def rank_by_tfidf(resume_texts: List[str], jd_text: str) -> List[float]:
    """Ranks resumes against a JD using TF-IDF cosine similarity."""
    if not resume_texts:
        return []
    corpus = [jd_text] + resume_texts
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        jd_vector = tfidf_matrix[0:1]
        resume_vectors = tfidf_matrix[1:]
        sims = cosine_similarity(resume_vectors, jd_vector).flatten()
        return [float(s) for s in sims]
    except Exception:
        # Fallback to empty zeros if vocabulary is empty
        return [0.0] * len(resume_texts)
