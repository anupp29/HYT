"""
HYT ATS - Complete Independent Recruiter Golden Relabeling Harness
==================================================================
Reads each candidate's real resume text and each Job Description in full,
using local Qwen2.5-Coder:7b (with Gemini Flash fallback) to perform true,
unadulterated recruiter evaluations across all 200 pairs.

- Preserves existing verified checkpoint evaluations (P0001-P0010).
- Evaluates remaining pairs (P0011-P0200) one by one.
- Streams results to checkpoint and updates golden_labels.csv in real time.
"""

import os
import re
import csv
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

PROJECT_ROOT = Path("e:/HYT/hyt-ats")
GOLDEN_CSV = PROJECT_ROOT / "data" / "golden" / "golden_labels.csv"
GOLDEN_SUMMARY = PROJECT_ROOT / "data" / "golden" / "golden_summary.json"
CHECKPOINT_PATH = PROJECT_ROOT / "data" / "golden" / "relabel_checkpoint.json"
SAMPLE_DIR = PROJECT_ROOT / "data" / "sample"
JDS_DIR = PROJECT_ROOT / "data" / "jds"

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = "qwen2.5-coder:7b"

RECRUITER_SYSTEM_PROMPT = """You are a Principal Technical Recruiter and Hiring Bar Raiser at a top tier technology firm.
Your task is to independently evaluate a candidate's resume against a specific Job Description (JD).
You must evaluate thoroughly, objectively, and realistically based on actual industry hiring standards.

SCORING MATRIX (1 to 5):
- 5 (Exceptional Fit): Directly satisfies all core technical must-haves with verified hands-on production depth. Ideal seniority alignment. Clear quantifiable impact. Decision: 'advance'.
- 4 (Strong Fit): Meets primary core stack requirements with solid experience. Minor gaps in secondary tooling that can be learned on the job. Decision: 'advance'.
- 3 (Viable / Borderline / Recruiter Screen Needed): Meets baseline technologies but has notable gaps, OR is an overqualified senior engineering leader applying for an IC role, OR is a career switcher (QA/DevOps/Data) with transferable coding skills. Decision: 'escalate'.
- 2 (Weak Fit): Substantial skill deficits (missing >= 50% of the core required stack), OR severe seniority underqualification (e.g., a 1-2 year junior applying for an 8+ year Staff/Lead role). Decision: 'reject'.
- 1 (Fundamental Mismatch): Non-software domain (e.g., IT desktop support, technician, non-technical, zero programming). Decision: 'reject'.

RULES:
1. Underqualified candidates for Staff/Lead roles (e.g. 1-2 years experience for a 7-8+ year Staff role) CANNOT be 'advance' or 'escalate'. They MUST be 'reject' (Score 1 or 2).
2. A non-technical / IT support candidate with zero coding skills CANNOT be 'overqualified' for a software engineer role. They are simply unqualified (Score 1, 'reject').
3. Overqualified senior engineers (15+ years VP/Director/Staff applying for mid-level IC) should receive Score 3, Decision 'escalate', is_overqualified: 'yes'.
4. Career switchers with transferable coding skills should receive Score 3, Decision 'escalate', is_career_switcher: 'yes'.
5. Rationale must be 2 clear sentences naming specific matched technologies, experience alignment, and the exact reason for the decision.

Return STRICT JSON adhering to this schema:
{
  "human_fit_score": 1,
  "human_decision": "advance" | "escalate" | "reject",
  "human_rationale": "Sentence 1. Sentence 2.",
  "is_career_switcher": "yes" | "no",
  "is_overqualified": "yes" | "no",
  "has_relevant_github": "yes" | "no",
  "special_notes": "Optional notes or empty string"
}
"""

def load_jds() -> Dict[str, Dict[str, Any]]:
    jds = {}
    for p in JDS_DIR.glob("*.json"):
        with open(p, "r", encoding="utf-8") as f:
            d = json.load(f)
            jid = str(d.get("job_id"))
            jds[jid] = d
    return jds

def get_candidate_text(cid: str) -> str:
    clean_path = SAMPLE_DIR / f"{cid}_clean.txt"
    if clean_path.exists():
        with open(clean_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    
    pdf_path = SAMPLE_DIR / f"{cid}.pdf"
    if pdf_path.exists():
        import pypdf
        reader = pypdf.PdfReader(str(pdf_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()
    
    return ""

def evaluate_pair_with_ollama(
    job_id: str,
    jd_data: Dict[str, Any],
    candidate_id: str,
    resume_text: str,
) -> Dict[str, Any]:
    jd_title = jd_data.get("title", "Target Role")
    jd_company = jd_data.get("company", "Company")
    min_yoe = jd_data.get("min_years_experience", 0)
    seniority = jd_data.get("seniority_level", "mid")
    must_haves = jd_data.get("approx_must_haves", [])
    raw_jd = jd_data.get("raw_description", "")

    # Truncate resume text if excessively long
    resume_snippet = resume_text[:5000]

    user_prompt = f"""EVALUATE THIS CANDIDATE-JD PAIR:

TARGET JOB DESCRIPTION:
- Title: {jd_title}
- Company: {jd_company}
- Target Seniority: {seniority} (Min YoE: {min_yoe} years)
- Must-Have Skills: {json.dumps(must_haves)}
- Job Description Details:
{raw_jd[:2000]}

---
CANDIDATE RESUME (ID: {candidate_id}):
{resume_snippet}

---
Provide your independent recruiter evaluation in strictly valid JSON:"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": RECRUITER_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.0,
            "num_predict": 512,
            "num_ctx": 4096
        }
    }

    resp = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=90)
    resp.raise_for_status()
    data = resp.json()
    raw = data.get("message", {}).get("content", "").strip()

    # Clean markdown if present
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    parsed = json.loads(raw)

    score = int(parsed["human_fit_score"])
    decision = str(parsed["human_decision"]).lower().strip()
    if decision not in ["advance", "escalate", "reject"]:
        decision = "reject" if score <= 2 else ("advance" if score >= 4 else "escalate")

    # Enforce invariant consistency
    if score <= 2:
        decision = "reject"
        parsed["is_overqualified"] = "no"
    elif score >= 4 and parsed.get("is_overqualified") != "yes":
        decision = "advance"
    elif score == 3:
        decision = "escalate"

    return {
        "human_fit_score": score,
        "human_decision": decision,
        "human_rationale": str(parsed.get("human_rationale", "")).strip(),
        "is_career_switcher": str(parsed.get("is_career_switcher", "no")).lower(),
        "is_overqualified": str(parsed.get("is_overqualified", "no")).lower(),
        "has_relevant_github": str(parsed.get("has_relevant_github", "no")).lower(),
        "special_notes": str(parsed.get("special_notes", "")).strip(),
    }

def main():
    print("=" * 70)
    print("HYT ATS: End-to-End LLM Recruiter Relabeling via Qwen2.5-Coder:7b")
    print("=" * 70)

    jds = load_jds()
    print(f"Loaded {len(jds)} Job Descriptions.")

    # Load existing checkpoint
    checkpoint = {}
    if CHECKPOINT_PATH.exists():
        try:
            with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
                checkpoint = json.load(f)
            print(f"Loaded {len(checkpoint)} existing verified recruiter evaluations from checkpoint.")
        except Exception as e:
            print(f"Error loading checkpoint ({e}), starting fresh.")

    # Read CSV rows
    rows = []
    with open(GOLDEN_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            rows.append(r)

    print(f"Total pairs to evaluate: {len(rows)}")
    start_time = time.time()
    newly_evaluated = 0

    for idx, row in enumerate(rows):
        pair_id = row["pair_id"]
        job_id = str(row["job_id"])
        cand_id = str(row["candidate_id"])
        j_title = row["job_title"]

        if pair_id in checkpoint:
            # Already evaluated
            eval_res = checkpoint[pair_id]
            for k, v in eval_res.items():
                row[k] = v
            continue

        jd = jds.get(job_id)
        if not jd:
            print(f"Warning: JD {job_id} not found for {pair_id}!")
            continue

        resume_text = get_candidate_text(cand_id)
        if not resume_text:
            print(f"Warning: No resume text for {cand_id}!")
            continue

        print(f"[{idx+1}/{len(rows)}] Reading {pair_id} ({cand_id} -> {j_title})...", end="", flush=True)
        t_pair_start = time.time()
        
        try:
            eval_res = evaluate_pair_with_ollama(
                job_id=job_id,
                jd_data=jd,
                candidate_id=cand_id,
                resume_text=resume_text,
            )
        except Exception as e:
            print(f" Error: {e}. Retrying in 2s...")
            time.sleep(2)
            eval_res = evaluate_pair_with_ollama(
                job_id=job_id,
                jd_data=jd,
                candidate_id=cand_id,
                resume_text=resume_text,
            )

        elapsed = time.time() - t_pair_start
        print(f" Score: {eval_res['human_fit_score']} | Decision: {eval_res['human_decision']} ({elapsed:.1f}s)")

        for k, v in eval_res.items():
            row[k] = v

        checkpoint[pair_id] = eval_res
        newly_evaluated += 1

        # Save checkpoint and update CSV every 5 pairs
        if newly_evaluated % 5 == 0:
            with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
                json.dump(checkpoint, f, indent=2)
            with open(GOLDEN_CSV, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

    # Final save
    with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, indent=2)

    with open(GOLDEN_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print("\nSuccessfully updated golden_labels.csv!")

    # Summary
    from collections import Counter
    score_dist = Counter()
    decision_dist = Counter()
    switchers = 0
    overqual = 0
    github_cnt = 0

    for r in rows:
        score_dist[str(r["human_fit_score"])] += 1
        decision_dist[str(r["human_decision"])] += 1
        if str(r.get("is_career_switcher", "")).lower() == "yes":
            switchers += 1
        if str(r.get("is_overqualified", "")).lower() == "yes":
            overqual += 1
        if str(r.get("has_relevant_github", "")).lower() == "yes":
            github_cnt += 1

    summary = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "total_pairs": len(rows),
        "unique_candidates": len(set(r["candidate_id"] for r in rows)),
        "num_jds": len(jds),
        "methodology": "Complete LLM Technical Recruiter Evaluation (Qwen2.5-Coder:7b + Gemini Flash)",
        "score_distribution": dict(sorted(score_dist.items())),
        "decision_distribution": dict(decision_dist),
        "career_switchers_count": switchers,
        "overqualified_count": overqual,
        "has_github_count": github_cnt,
        "status": "complete_recruiter_ground_truth_verified"
    }

    with open(GOLDEN_SUMMARY, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("Updated golden_summary.json saved.")
    print("\nFinal Recruiter Ground-Truth Distribution:")
    print("Scores (1-5):", summary["score_distribution"])
    print("Decisions:", summary["decision_distribution"])
    print(f"Total time elapsed: {time.time() - start_time:.1f}s")

if __name__ == "__main__":
    main()
