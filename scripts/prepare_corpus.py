"""
prepare_corpus.py
=================
HYT ATS - One-time corpus preparation script.

What this script does (in order):
  1. Scans GIVEN/data/ for IT + Engineering PDFs
  2. Classifies each PDF as SW-relevant or not (heuristic keyword scan)
  3. Strips contact PII from each usable PDF - copies clean version to data/sample/
  4. Extracts 6 diverse SWE job descriptions from postings.csv -> data/jds/
  5. Builds golden set pairing scaffold:
       - 6 JDs x ~42 resumes each  = ~252 labelled pairs
       - Sampling: 25% obvious fit, 25% obvious mismatch, 50% borderline
  6. Writes data/golden/golden_labels.csv with preliminary auto-labels + blank columns for human override
  7. Writes data/golden/labelling_guide.md - instructions for the human labelling step

Run once:
  python scripts/prepare_corpus.py --given_dir e:/HYT/GIVEN --out_dir ./data

Idempotent: running twice produces the same output. Already-copied files are skipped.
"""

import os
import re
import csv
import sys
import json
import shutil
import hashlib
import argparse
import logging
from pathlib import Path
from datetime import datetime

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("prepare_corpus")

# ===========================
# CONSTANTS
# ===========================

RESUME_CATEGORIES = ["INFORMATION-TECHNOLOGY", "ENGINEERING"]

SW_ENGINEERING_KEYWORDS = [
    "software", "developer", "programmer", "coding", "python", "java",
    "javascript", "react", "node", "backend", "frontend", "devops",
    "fullstack", "full stack", "aws", "cloud", "kubernetes", "docker",
    "typescript", "angular", "vue", "spring", "microservice", "api",
    "rest", "graphql", "ci/cd", "agile", "scrum", "git", "linux",
    "machine learning", "deep learning", "tensorflow", "pytorch", "data pipeline",
]

PII_PATTERNS = [
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    r"\b(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b",
    r"https?://(?!github\.com)[^\s]+",
    r"www\.(?!github\.com)[^\s]+",
]

CHOSEN_JD_IDS = [
    "3887497535",
    "3586167732",
    "3886458575",
    "3891267064",
    "2234533717",
    "3900940733",
]

GOLDEN_PER_JD = 42
OBVIOUS_FIT_RATIO = 0.25
MISMATCH_RATIO = 0.25
BORDERLINE_RATIO = 0.50

JD_MUST_HAVES = {
    "3887497535": [
        "java", "python", "javascript", "software development",
        "object-oriented programming", "git", "agile", "sql",
        "REST API", "web application",
    ],
    "3586167732": [
        "python", "machine learning", "LLM", "NLP", "API development",
        "cloud deployment", "docker", "software architecture",
        "backend development", "system design",
    ],
    "3886458575": [
        "distributed systems", "backend engineering", "python", "golang",
        "microservices", "kubernetes", "AWS", "system design",
        "database optimization", "API design",
    ],
    "3891267064": [
        "AWS", "terraform", "kubernetes", "docker", "CI/CD",
        "cloud architecture", "infrastructure as code", "DevOps",
        "python", "linux",
    ],
    "2234533717": [
        "react", "node.js", "javascript", "typescript", "REST API",
        "SQL", "git", "frontend development", "backend development",
        "agile",
    ],
    "3900940733": [
        "java", "microservices", "distributed systems", "kafka",
        "spring boot", "AWS", "system design", "CI/CD",
        "database", "REST API",
    ],
}

JD_METADATA = {
    "3887497535": {
        "title": "Associate Software Engineer / Software Engineer",
        "company": "University of Illinois Urbana-Champaign",
        "seniority_level": "junior",
        "min_years_experience": 0,
        "location": "Urbana, IL",
        "remote_policy": "onsite",
        "domain_context": "University IT systems, web apps, Java/Python stack",
    },
    "3586167732": {
        "title": "Senior Software Engineer",
        "company": "StyleAI",
        "seniority_level": "senior",
        "min_years_experience": 5,
        "location": "San Francisco Bay Area",
        "remote_policy": "onsite",
        "domain_context": "AI/ML product, Python backend, LLM integration",
    },
    "3886458575": {
        "title": "Staff Software Engineer",
        "company": "Function Health",
        "seniority_level": "lead",
        "min_years_experience": 8,
        "location": "Remote",
        "remote_policy": "remote",
        "domain_context": "Health-tech platform, distributed backend, Go/Python",
    },
    "3891267064": {
        "title": "Lead AWS Platform Engineer",
        "company": "Perficient",
        "seniority_level": "lead",
        "min_years_experience": 7,
        "location": "Remote",
        "remote_policy": "remote",
        "domain_context": "Cloud infrastructure, AWS/Terraform/Kubernetes, DevOps",
    },
    "2234533717": {
        "title": "Full Stack Engineer",
        "company": "Ideando Inc",
        "seniority_level": "mid",
        "min_years_experience": 3,
        "location": "Remote",
        "remote_policy": "remote",
        "domain_context": "SaaS product, React/Node.js, full stack development",
    },
    "3900940733": {
        "title": "Staff Software Engineer (Backend Systems)",
        "company": "DAT Freight and Analytics",
        "seniority_level": "lead",
        "min_years_experience": 8,
        "location": "Denver, CO (Remote OK)",
        "remote_policy": "flexible",
        "domain_context": "Logistics platform, Java/Kafka/microservices, high scale",
    },
}

# ===========================
# HELPERS
# ===========================

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        blocks = []
        for page in doc:
            page_blocks = page.get_text("blocks")
            page_blocks.sort(key=lambda b: (round(b[1] / 20), b[0]))
            for block in page_blocks:
                if block[6] == 0:
                    blocks.append(block[4].strip())
        return "\n".join(b for b in blocks if b)
    except Exception as e:
        log.warning(f"PDF extraction failed for {pdf_path}: {e}")
        return ""


def strip_pii(text):
    for pattern in PII_PATTERNS:
        text = re.sub(pattern, "[REDACTED]", text, flags=re.IGNORECASE)
    lines = text.split("\n")
    if lines:
        first = lines[0].strip()
        if len(first) < 60 and re.match(r"^[A-Z][a-zA-Z\s'\-\.]+$", first):
            lines[0] = "[CANDIDATE NAME]"
    return "\n".join(lines)


def is_sw_adjacent(text):
    text_lower = text.lower()
    return any(kw in text_lower for kw in SW_ENGINEERING_KEYWORDS)


def score_resume_fit(resume_text, jd_must_haves):
    resume_tokens = set(re.findall(r"\b\w{3,}\b", resume_text.lower()))
    hits = 0
    for req in jd_must_haves:
        req_tokens = set(re.findall(r"\b\w{3,}\b", req.lower()))
        if req_tokens & resume_tokens:
            hits += 1
    return hits / max(len(jd_must_haves), 1)


def assign_preliminary_label(score):
    if score >= 0.70:
        return {"prelim_fit_score_1_5": 5, "prelim_decision": "advance", "stratum": "obvious_fit"}
    elif score >= 0.50:
        return {"prelim_fit_score_1_5": 4, "prelim_decision": "advance", "stratum": "borderline_fit"}
    elif score >= 0.30:
        return {"prelim_fit_score_1_5": 3, "prelim_decision": "escalate", "stratum": "borderline_weak"}
    elif score >= 0.15:
        return {"prelim_fit_score_1_5": 2, "prelim_decision": "escalate", "stratum": "borderline_mismatch"}
    else:
        return {"prelim_fit_score_1_5": 1, "prelim_decision": "reject", "stratum": "obvious_mismatch"}


# ===========================
# STAGE 1 - Resume Corpus
# ===========================

def build_resume_corpus(given_dir, sample_dir):
    sample_dir.mkdir(parents=True, exist_ok=True)
    corpus = []
    skipped = 0

    for category in RESUME_CATEGORIES:
        cat_dir = given_dir / "data" / category
        if not cat_dir.exists():
            log.warning(f"Category dir not found: {cat_dir}")
            continue

        pdf_files = sorted(cat_dir.glob("*.pdf"))
        log.info(f"Processing {category}: {len(pdf_files)} PDFs found")

        for pdf_path in pdf_files:
            candidate_id = pdf_path.stem
            dest_path = sample_dir / f"{candidate_id}.pdf"

            text = extract_text_from_pdf(str(pdf_path))

            if not text.strip():
                log.warning(f"Empty text: {pdf_path.name} - skipping")
                skipped += 1
                continue

            if category == "ENGINEERING" and not is_sw_adjacent(text):
                skipped += 1
                continue

            if not dest_path.exists():
                shutil.copy2(str(pdf_path), str(dest_path))

            clean_text = strip_pii(text)
            txt_path = sample_dir / f"{candidate_id}_clean.txt"
            if not txt_path.exists():
                txt_path.write_text(clean_text, encoding="utf-8")

            github_url = None
            github_match = re.search(r"https?://github\.com/[^\s]+", text, re.IGNORECASE)
            if github_match:
                github_url = github_match.group(0).rstrip(".,;)")

            corpus.append({
                "candidate_id": candidate_id,
                "source_category": category,
                "pdf_path": f"sample/{candidate_id}.pdf",
                "clean_txt_path": f"sample/{candidate_id}_clean.txt",
                "github_url": github_url,
                "text_length": len(clean_text),
                "sw_adjacent": True,
            })

    log.info(f"Corpus built: {len(corpus)} usable resumes, {skipped} skipped")
    return corpus


# ===========================
# STAGE 2 - Extract JDs
# ===========================

def extract_jds(postings_path, jds_dir):
    jds_dir.mkdir(parents=True, exist_ok=True)
    target_ids = set(CHOSEN_JD_IDS)
    found_jds = []

    log.info(f"Scanning postings.csv for {len(target_ids)} target JDs...")

    with open(str(postings_path), encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            jid = row.get("job_id", "").strip()
            if jid in target_ids:
                jd_data = {
                    "job_id": jid,
                    "title": JD_METADATA[jid]["title"],
                    "company": row.get("company_name", "").strip(),
                    "raw_description": row.get("description", "").strip(),
                    "skills_desc": row.get("skills_desc", "").strip(),
                    "location": row.get("location", "").strip(),
                    "remote_allowed": row.get("remote_allowed", ""),
                    "exp_level": row.get("formatted_experience_level", "").strip(),
                    "work_type": row.get("formatted_work_type", "").strip(),
                    "seniority_level": JD_METADATA[jid]["seniority_level"],
                    "min_years_experience": JD_METADATA[jid]["min_years_experience"],
                    "remote_policy": JD_METADATA[jid]["remote_policy"],
                    "domain_context": JD_METADATA[jid]["domain_context"],
                    "approx_must_haves": JD_MUST_HAVES[jid],
                }
                out_path = jds_dir / f"jd_{jid}.json"
                if not out_path.exists():
                    out_path.write_text(
                        json.dumps(jd_data, indent=2, ensure_ascii=False),
                        encoding="utf-8",
                    )
                found_jds.append(jd_data)
                target_ids.discard(jid)
                log.info(f"  JD {jid}: {jd_data['title']} @ {jd_data['company']}")

                if not target_ids:
                    break

    if target_ids:
        log.warning(f"Could not find JD IDs: {target_ids}")

    return found_jds


# ===========================
# STAGE 3 - Golden Set
# ===========================

def build_golden_set(corpus, jds, golden_dir, data_dir):
    golden_dir.mkdir(parents=True, exist_ok=True)
    all_pairs = []
    pair_id = 0

    for jd in jds:
        jid = jd["job_id"]
        must_haves = jd["approx_must_haves"]
        log.info(f"Scoring corpus against JD {jid}: {jd['title']}")

        scored = []
        for resume in corpus:
            txt_path = data_dir / resume["clean_txt_path"]
            try:
                text = txt_path.read_text(encoding="utf-8")
            except Exception:
                text = ""
            fit_score = score_resume_fit(text, must_haves)
            label = assign_preliminary_label(fit_score)
            scored.append({
                "resume": resume,
                "fit_score": round(fit_score, 4),
                **label,
            })

        obvious_fit = sorted([r for r in scored if r["stratum"] == "obvious_fit"], key=lambda x: -x["fit_score"])
        obvious_mis = sorted([r for r in scored if r["stratum"] == "obvious_mismatch"], key=lambda x: x["fit_score"])
        borderline  = sorted([r for r in scored if "borderline" in r["stratum"]], key=lambda x: -x["fit_score"])

        n_fit = max(1, int(GOLDEN_PER_JD * OBVIOUS_FIT_RATIO))
        n_mis = max(1, int(GOLDEN_PER_JD * MISMATCH_RATIO))
        n_bor = GOLDEN_PER_JD - n_fit - n_mis

        selected = obvious_fit[:n_fit] + borderline[:n_bor] + obvious_mis[:n_mis]

        log.info(f"  JD {jid}: {min(n_fit,len(obvious_fit))} fit + {min(n_bor,len(borderline))} borderline + {min(n_mis,len(obvious_mis))} mismatch = {len(selected)} pairs")

        for entry in selected:
            pair_id += 1
            all_pairs.append({
                "pair_id": f"P{pair_id:04d}",
                "job_id": jid,
                "job_title": jd["title"],
                "job_company": jd["company"],
                "candidate_id": entry["resume"]["candidate_id"],
                "resume_pdf": entry["resume"]["pdf_path"],
                "source_category": entry["resume"]["source_category"],
                "jaccard_fit_score": entry["fit_score"],
                "stratum": entry["stratum"],
                "prelim_fit_score_1_5": entry["prelim_fit_score_1_5"],
                "prelim_decision": entry["prelim_decision"],
                "human_fit_score": "",
                "human_decision": "",
                "human_rationale": "",
                "is_career_switcher": "",
                "is_overqualified": "",
                "has_relevant_github": "",
                "special_notes": "",
            })

    labels_path = golden_dir / "golden_labels.csv"
    fieldnames = list(all_pairs[0].keys())
    with open(str(labels_path), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_pairs)

    log.info(f"Golden labels written: {len(all_pairs)} pairs -> {labels_path}")

    summary = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "total_pairs": len(all_pairs),
        "jds": [{"job_id": j["job_id"], "title": j["title"]} for j in jds],
        "strata_counts": {
            "obvious_fit": sum(1 for p in all_pairs if p["stratum"] == "obvious_fit"),
            "borderline": sum(1 for p in all_pairs if "borderline" in p["stratum"]),
            "obvious_mismatch": sum(1 for p in all_pairs if p["stratum"] == "obvious_mismatch"),
        },
        "labelling_status": "PENDING - human review required",
        "labels_path": "data/golden/golden_labels.csv",
    }
    (golden_dir / "golden_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log.info("Golden summary written.")


# ===========================
# STAGE 4 - Manifest
# ===========================

def write_corpus_manifest(corpus, jds, data_dir):
    manifest = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "domain": "Software Engineering & Information Technology",
        "resume_count": len(corpus),
        "jd_count": len(jds),
        "resume_sources": {
            "INFORMATION-TECHNOLOGY": sum(1 for r in corpus if r["source_category"] == "INFORMATION-TECHNOLOGY"),
            "ENGINEERING_SW_ADJACENT": sum(1 for r in corpus if r["source_category"] == "ENGINEERING"),
        },
        "resumes": corpus,
        "jds": [
            {
                "job_id": j["job_id"],
                "title": j["title"],
                "company": j["company"],
                "seniority_level": j["seniority_level"],
                "min_years_experience": j["min_years_experience"],
                "path": f"data/jds/jd_{j['job_id']}.json",
            }
            for j in jds
        ],
    }
    path = data_dir / "corpus_manifest.json"
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info(f"Corpus manifest written -> {path}")


# ===========================
# STAGE 5 - Labelling Guide
# ===========================

LABELLING_GUIDE = """# HYT ATS - Golden Set Labelling Guide

## Your task
Open `golden_labels.csv` and fill in three columns for every row:
- `human_fit_score` - integer 1-5 (see scale below)
- `human_decision` - one of: `advance` / `escalate` / `reject`
- `human_rationale` - 1-2 sentences explaining your decision

Do NOT modify any other column. Do NOT leave all three blank for any row.

---

## Fit Score Scale (1-5)

| Score | Meaning |
|-------|---------|
| 5 | Excellent fit. Matches most must-haves with demonstrated evidence. |
| 4 | Good fit. Matches most must-haves; minor gaps. Would shortlist. |
| 3 | Partial fit. Matches some must-haves but notable gaps remain. Human judgment call. |
| 2 | Weak fit. Few relevant skills. Unlikely candidate but not impossible. |
| 1 | Clear mismatch. Wrong domain, wrong seniority, or insufficient experience. |

---

## Decision Guide

| Decision | When to use |
|----------|-------------|
| `advance` | Score 4-5 AND no red flags. Shortlist this candidate. |
| `escalate` | Score 2-4 OR any uncertainty. Human recruiter should see this. |
| `reject` | Score 1 AND clearly wrong domain. Safe to auto-reject. |

IMPORTANT: Bias toward `escalate` on any doubt. Auto-reject is the hardest outcome by design.

---

## Hard Cases - Label These Carefully

The golden set intentionally includes:
- Career switchers: adjacent domain, transferable skills -> usually `escalate`
- Overqualified: too senior for the role -> `escalate` (flag is_overqualified=yes)
- Keyword stuffers: long skill list, no evidence in experience -> score low, note in rationale
- Non-standard format: multi-column, tables -> score on content, not format

---

## Strata

The `stratum` column is your starting point:
- `obvious_fit` -> likely score 4-5, but verify the resume
- `borderline_*` -> needs careful reading - these are the hard cases
- `obvious_mismatch` -> likely score 1-2, but check for transferable skills

The `prelim_fit_score_1_5` and `prelim_decision` are auto-generated via Jaccard keyword overlap.
They are a first-pass hint ONLY. Override them whenever resume content does not match.

---

## Time budget
~1-2 minutes per pair. 252 pairs = approx 5-8 hours total.
Focus reading time on borderline_* stratum - those drive system quality.
"""


def write_labelling_guide(golden_dir):
    path = golden_dir / "labelling_guide.md"
    path.write_text(LABELLING_GUIDE, encoding="utf-8")
    log.info(f"Labelling guide written -> {path}")


# ===========================
# MAIN
# ===========================

def main():
    parser = argparse.ArgumentParser(description="HYT ATS - Corpus Preparation")
    parser.add_argument("--given_dir", default="e:/HYT/GIVEN", help="Path to GIVEN/ folder")
    parser.add_argument("--out_dir", default="./data", help="Output base directory")
    args = parser.parse_args()

    given_dir  = Path(args.given_dir)
    out_dir    = Path(args.out_dir)
    sample_dir = out_dir / "sample"
    golden_dir = out_dir / "golden"
    jds_dir    = out_dir / "jds"

    log.info("=" * 60)
    log.info("HYT ATS - Corpus Preparation")
    log.info(f"  Given dir : {given_dir}")
    log.info(f"  Output dir: {out_dir}")
    log.info("=" * 60)

    log.info("\n[STAGE 1] Building resume corpus...")
    corpus = build_resume_corpus(given_dir, sample_dir)
    if not corpus:
        log.error("No resumes in corpus. Check --given_dir path.")
        sys.exit(1)

    log.info("\n[STAGE 2] Extracting job descriptions...")
    postings_path = given_dir / "postings.csv"
    jds = extract_jds(postings_path, jds_dir)
    if not jds:
        log.error("No JDs extracted.")
        sys.exit(1)

    log.info("\n[STAGE 3] Building golden set...")
    build_golden_set(corpus, jds, golden_dir, out_dir)

    log.info("\n[STAGE 4] Writing corpus manifest...")
    write_corpus_manifest(corpus, jds, out_dir)

    log.info("\n[STAGE 5] Writing labelling guide...")
    write_labelling_guide(golden_dir)

    log.info("\n" + "=" * 60)
    log.info("CORPUS PREPARATION COMPLETE")
    log.info(f"  Resumes in corpus : {len(corpus)}")
    log.info(f"  JDs extracted     : {len(jds)}")
    log.info(f"  Golden pairs      : ~{len(jds) * GOLDEN_PER_JD}")
    log.info(f"  Next: Fill data/golden/golden_labels.csv")
    log.info(f"        See data/golden/labelling_guide.md")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
