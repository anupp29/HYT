# HYT ATS — AI Screening Pipeline
> Production-Grade, Lightweight Applicant Tracking & Screening Layer for Software Engineering

**HuntYourTribe (HYT) — Graduate 2027 SDE Intern Take-Home Project**  
**Author:** Candidate Submission  
**Domain Focus:** Software Engineering & IT Infrastructure  
**Core Constraint:** Terminal-only CLI, deterministic scoring math, structural recall bias, zero hardcoded thresholds.

---

## Architecture Overview

HYT ATS implements a 12-gate deterministic screening and audit pipeline:

```
[Candidate PDF]
       │
       ▼
 [Gate 0: Integrity Shield] ──► White font, 0pt text, metadata stuffing, JD plagiarism
       │
       ▼
 [Gate 1: Security Shield]  ──► Prompt injection detection & sanitization
       │
       ▼
 [Gate 2: Privacy Shield]   ──► PII redaction (names, emails, phones, addresses)
       │
       ▼
 [Gate 3: Structural Extractor] ──► PII-free schema extraction (LLM Call 1, cached)
       │
       ▼
 [Gate 4: Verification Engine]  ──► GitHub cross-ref & shallow profile detection
       │
       ▼
 [Gate 5: Fast Filter]          ──► Local sentence-transformer pre-filter
       │
       ▼
 [Gate 6: Deep Fit Engine]      ──► Deterministic 4-vector scoring + Evidence Ledger
       │
       ▼
 [Gate 7: Decision Engine]      ──► AUTO_ADVANCE / ESCALATE / AUTO_REJECT (Recall Bias)
       │
       ▼
 [Gate 8: Explanation Engine]   ──► 3-sentence recruiter summary from Ledger (LLM Call 2)
       │
       ▼
 [Gate 9: Recruiter Record]     ──► Complete auditable JSON record + terminal output
```

---

## 15-Minute Quickstart & Reproduction Guide

### 1. Prerequisites & Environment Setup
Requires Python 3.10+ (Windows / Linux / macOS):

```bash
# 1. Clone repository and navigate inside
cd hyt-ats

# 2. Create virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# 3. Install pinned dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and supply your OPENAI_API_KEY (or other LLM provider)
```

### 2. Verify Phase 0 Foundation
Run the Phase 0 verification suite:

```bash
pytest tests/test_phase0.py -v
```

---

## Project Structure

```
hyt-ats/
├── src/
│   ├── gates/          # Pipeline gate modules (gate0 ... gate8)
│   ├── models/         # Pydantic schemas (schemas.py)
│   ├── utils/          # Config, structured logger, atomic cache
│   └── main.py         # Terminal CLI orchestrator
├── eval/
│   ├── harness.py      # Automated benchmark runner (NDCG, F1, Kappa)
│   ├── metrics.py      # Mathematical metric computations
│   └── judge.py        # LLM-as-judge explanation evaluator
├── data/
│   ├── sample/         # Working resume PDFs & clean sidecars (gitignored)
│   ├── jds/            # 6 structured target JDs (JSON)
│   └── golden/         # 200-pair ground-truth benchmark (golden_labels.csv)
├── cache/              # Deterministic disk cache (gitignored)
├── logs/               # Structured JSON-lines execution logs (gitignored)
├── tests/              # Unit & adversarial test suites
├── config.yaml         # Fully tuneable pipeline parameters (no hardcoded values)
├── .env.example        # Environment variable template
├── requirements.txt    # Pinned dependencies
├── DECISION_LOG.md     # 10 non-obvious engineering decisions
└── README.md           # This documentation
```

---

## Dynamic Configuration & Self-Adjustable Thresholds

All thresholds, weights, and model definitions are loaded dynamically from `config.yaml` and validated at startup:
- **Mathematical constraint:** Gate 6 weights (`technical + experience + seniority + education + location`) must sum to exactly `1.0`.
- **Dynamic overrides:** Any value can be overridden via environment variables prefixed with `HYT_` (e.g. `HYT_GATE7_HIGH_THRESHOLD=80.0`).
- **Zero hardcoded constants:** No magic numbers in the source code.
