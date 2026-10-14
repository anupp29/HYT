# HYT ATS — Production AI Screening Pipeline
> High-Reliability, Terminal-Only Applicant Screening & Verification Layer for Software Engineering

**HuntYourTribe (HYT) — Graduate 2027 SDE Intern Engineering Assignment**  
**Author:** Candidate Engineer  
**Domain Focus:** Software Engineering & IT Systems  
**Core Principles:** Terminal-only CLI, 100% deterministic scoring math, structural recall bias, zero hardcoded thresholds, multi-provider LLM support with offline local capability.

---

## Architecture Overview

HYT ATS executes a multi-gate screening and verification pipeline:

```
[Candidate PDF Resume]
        │
        ▼
 [Gate 0: Integrity Shield] ──────► WCAG contrast, 0pt font, off-page text, metadata stuffing, prompt injections
        │
        ▼
 [Gate 1: Layout Extraction] ─────► Column-aware PyMuPDF text & geometry extraction
        │
        ▼
 [Gate 2: Privacy Shield]   ──────► PII redaction (names, emails, phones, addresses) & GitHub URL extraction
        │
        ▼
 [Gate 3: Structural Extractor] ──► PII-free schema extraction (LLM Call 1, atomic disk caching)
        │
        ▼
 [Gate 4: Verification Layer] ────► 3-Tier Skills Taxonomy cascade, depth audit & GitHub cross-referencing
        │
        ▼
 [Gate 5: Fast Filter Funnel] ────► Local sentence-transformer domain cosine similarity check
        │
        ▼
 [Gate 6: Deep Fit Engine]   ─────► Deterministic 5-dimension scoring (0-100) + Immutable Evidence Ledger
        │
        ▼
 [Gate 7: Decision Engine]   ─────► 8-condition priority ladder: AUTO_ADVANCE / ESCALATE / AUTO_REJECT
        │
        ▼
 [Gate 8: Explanation Engine] ────► Grounded 3-sentence recruiter assessment from Ledger (LLM Call 2, cached)
        │
        ▼
 [Gate 9: Candidate Record]   ────► Auditable recruiter output report with 5-dim scorecard & citation trail
        │
        ▼
 [Gate 10: Ranking Engine]    ────► Hierarchical decision-bucket leaderboard (ADVANCE -> ESCALATE -> REJECT)
```

---

## 15-Minute Reproduction Guide

### 1. Prerequisites & Environment Setup
Requires Python 3.10+ (Windows / Linux / macOS):

```bash
# 1. Clone repository and navigate inside
cd hyt-ats

# 2. Create virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux / macOS:
# source .venv/bin/activate

# 3. Install pinned dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and supply your preferred provider key (or run 100% locally with Ollama)
```

### 2. Multi-Provider AI Model Support (Zero Key Lock-in)
Inspect available providers and models:
```bash
python -m src.main list-models
```
Supported ecosystems:
1. **Google Gemini:** `gemini-2.5-flash`, `gemini-2.5-pro` (Fast, generous rate limits)
2. **Groq Cloud:** `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` (Ultra-fast cloud inference)
3. **Local Ollama:** `swift-12b` (Gemma 4), `qwen2.5-coder:1.5b` (100% offline, zero API keys required)
4. **OpenAI / Anthropic:** `gpt-4o-mini`, `claude-3-5-haiku-20241022`

Select via flag `--provider <name>` and `--model <name>`, or set `HYT_LLM_PROVIDER` in your environment.

---

## CLI Commands & Verification Workflows

### Command 1: Inspect Target Job Descriptions
```bash
# List all 6 pre-configured JDs
python -m src.main list-jds

# Inspect extracted structured requirements for a JD
python -m src.main verify-jd --job-id 2234533717
```

### Command 2: Screen a Single Candidate (Full 10-Gate Audit)
```bash
python -m src.main run-candidate --resume data/sample/10089434.pdf --jd 2234533717
```
*Outputs complete Candidate Record: 5-dimensional scorecard, integrity status, 3-sentence recruiter summary, and 26-item mandatory evidence ledger.*

### Command 3: Batch Screening & Recruiter Leaderboard
```bash
python -m src.main rank --jd 2234533717 --limit 5
```
*Outputs hierarchical ASCII leaderboard partitioned by decision bucket (AUTO_ADVANCE &rarr; ESCALATE &rarr; AUTO_REJECT).*

### Command 4: Human Recruiter Decision Override
```bash
python -m src.main override --candidate-id 10089434 --decision AUTO_ADVANCE --reason "Candidate demonstrated exceptional architecture skills during technical interview"
```
*Appends an immutable audit entry to `logs/overrides.jsonl` recording candidate ID, timestamp, prior decision, new decision, and recruiter justification.*

### Command 5: Run the Complete Evaluation Benchmark
```bash
python -m eval.harness --limit 10
```
*Executes NDCG@5/10 against Jaccard & TF-IDF baselines, decision accuracy, LLM-as-Judge Cohen's Kappa, 324-variant demographic fairness audit, and 15-vector adversarial quarantine test. Outputs `eval_results.json`.*

### Command 6: Execute the Full Test Suite
```bash
pytest -v tests/
```
*Runs all 118 unit and integration tests across all phases with 100% pass rate.*

---

## Core Engineering Decisions

1. **Deterministic Scoring Math (No LLM Scoring):** Numerical scores (0–100) are computed strictly through dot-product vector projections and rules, not LLMs. Two runs on identical resumes produce identical scores to the 4th decimal place.
2. **Structural Recall Bias (Gate 7):** Rejecting a qualified software developer is exponentially worse than reviewing an ambiguous one. An applicant is never auto-rejected if they satisfy even a single verified must-have requirement or present transferable potential.
3. **Grounded Recruiter Explanations (Gate 8):** The LLM explanation generator only receives the structured `ScoringLedger` JSON—never raw text. It cannot hallucinate skills or evidence not present in the verified audit trail. Furthermore, per Rule 8, zero LLM tokens are wasted explaining `AUTO_REJECT` decisions.
4. **Three-Tier Skills Taxonomy Cascade:** Resolves aliases (`k8s` &harr; `Kubernetes`) in Tier 1, uses word-boundary regex (`\b`) to prevent substring bleed (`Java` inside `JavaScript`) in Tier 2, and evaluates dense embeddings in Tier 3 strictly $\ge 0.68$.
5. **Counterfactual Demographic Neutrality:** Evaluated over 324 demographic and institutional variants, proving $\Delta = 0.0000$ score delta and $0.0\%$ decision flip rate.

---

## Project Structure

```
hyt-ats/
├── src/
│   ├── gates/          # Pipeline gates: gate0 (integrity) to gate10 (ranking)
│   ├── models/         # Pydantic schemas (schemas.py)
│   ├── utils/          # Config, multi-provider LLM client, cache, taxonomy, output, override
│   ├── pipeline.py     # End-to-end pipeline orchestrator
│   └── main.py         # Terminal CLI entry point
├── eval/
│   ├── harness.py      # Automated benchmark runner
│   ├── metrics.py      # NDCG, decision accuracy, extraction F1, baselines
│   ├── judge.py        # LLM-as-judge rubric & Cohen's Kappa
│   ├── fairness.py     # Counterfactual demographic fairness audit
│   └── adversarial.py  # 15-vector adversarial attack suite
├── data/
│   ├── jds/            # 6 structured target JDs
│   ├── golden/         # 200-pair ground-truth benchmark (golden_labels.csv)
│   ├── taxonomy/       # Skills taxonomy map (skills_taxonomy.json)
│   └── sample/         # Working resume PDFs
├── tests/              # 11 test modules (118/118 passing tests)
├── config.yaml         # Fully tuneable pipeline parameters (no hardcoded values)
├── eval_results.json   # Benchmark results output artifact
├── DECISION_LOG.md     # 17 documented non-obvious engineering decisions
├── REPORT.md           # 6-page technical report and failure analysis
└── README.md           # 15-minute reproduction guide
```
