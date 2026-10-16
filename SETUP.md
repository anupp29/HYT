# HuntYourTribe (HYT) — AI ATS Screening Engine
## Complete Multi-Machine Setup & Deployment Guide (`SETUP.md`)
**Author:** Anup Patil ([@anupp29](https://github.com/anupp29)) — Graduate 2027 SDE Intern Applicant  
**Domain Focus:** Software Engineering & IT Systems  

This guide provides step-by-step instructions to clone, configure, and execute the **HYT ATS Screening Engine** on any machine (developer workstation, friend's laptop, or recruiter computer) from scratch.

---

### Table of Contents
1. [System Prerequisites](#1-system-prerequisites)
2. [Quickstart: 4-Step Setup](#2-quickstart-4-step-setup)
3. [Configuring Environment Variables (`.env`)](#3-configuring-environment-variables-env)
4. [Zero-API-Key Local Fallback: Ollama Setup](#4-zero-api-key-local-fallback-ollama-setup)
5. [System Health Check](#5-system-health-check)
6. [CLI Command Reference (Custom Resumes & Custom JDs)](#6-cli-command-reference-custom-resumes--custom-jds)
7. [Running Evaluations & Benchmarks](#7-running-evaluations--benchmarks)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

### 1. System Prerequisites

Ensure the target machine has the following installed:

- **Python:** Version `3.10`, `3.11`, or `3.12` ([python.org/downloads](https://www.python.org/downloads/))
- **Git:** Version `2.x+` ([git-scm.com](https://git-scm.com/))
- **Memory (RAM):** 8 GB minimum (16 GB recommended if running local Ollama LLMs)
- **Disk Space:** ~2 GB for Python packages and sentence-transformer embeddings cache
- **Operating System:** Windows 10/11, macOS, or Ubuntu/Linux

---

### 2. Quickstart: 4-Step Setup

Open your terminal (PowerShell / Command Prompt on Windows, or Bash / Zsh on macOS / Linux) and run:

#### Step 1: Clone or Copy the Repository
```bash
git clone <repository-url> hyt-ats
cd hyt-ats
```
*(If you are copying the folder manually via USB or ZIP, simply unzip it and open a terminal in `hyt-ats`)*

#### Step 2: Create and Activate a Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell gives an execution policy error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install Required Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 4: Create Your Environment File
```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On macOS / Linux
cp .env.example .env
```

---

### 3. Configuring Environment Variables (`.env`)

Open `.env` in any text editor (Notepad, VS Code, etc.). 

The pipeline supports **4 AI ecosystems** with automatic fallback. You only need **ONE** provider to run the system:

```ini
# ==============================================================================
# OPTION A: GROQ (Recommended - Primary Benchmark Provider)
# Official benchmark results in eval_2_results.json were produced via Groq qwen/qwen3.8-27b
# Get a free key at: https://console.groq.com/keys
# ==============================================================================
GROQ_API_KEY=gsk_your_groq_api_key_here

# For high-volume batch runs, you can supply multiple keys separated by commas
# for automatic round-robin load balancing (avoids rate limits):
# GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3

# ==============================================================================
# OPTION B: GOOGLE GEMINI (Fast Cloud Inference)
# Get a free key at: https://aistudio.google.com/app/apikey
# ==============================================================================
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# ==============================================================================
# OPTION C: OPENAI / ANTHROPIC (Optional)
# ==============================================================================
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# ==============================================================================
# OPTION D: ZERO-API-KEY LOCAL FALLBACK (Ollama)
# 100% Free, Offline, and Private. No API key needed!
# ==============================================================================
OLLAMA_BASE_URL=http://localhost:11434

# ==============================================================================
# OPTIONAL: GITHUB API TOKEN (Increases Gate 4 rate limit from 60 to 5,000/hr)
# ==============================================================================
GITHUB_TOKEN=ghp_your_github_token_here
```

> **Benchmark Model Disclosure:**  
> The official benchmark evaluation artifact (`eval_2_results.json`) was generated using **Groq Cloud** with `qwen/qwen3.8-27b` under Option 3 calibration (`high_threshold: 85.0`, `low_threshold: 50.0`). If running with local Ollama (`qwen2.5-coder:7b`), slight extraction phrasing variations may occur due to model quantization, but Gate 6 deterministic scoring math produces identical dot-product computations.

---

### 4. Zero-API-Key Local Fallback: Ollama Setup

If you or the recruiter want to run the pipeline **100% offline with zero cloud API keys**, use Ollama:

1. **Download and Install Ollama:**
   - Go to [ollama.ai/download](https://ollama.ai/download) and install Ollama for Windows, Mac, or Linux.
2. **Pull an AI Model:**
   Open a terminal and run:
   ```bash
   # Recommended SOTA coding/reasoning model (4.7 GB):
   ollama pull qwen2.5-coder:7b

   # Or for low-RAM machines / laptops (2.0 GB):
   ollama pull llama3.2:3b
   ```
3. **Verify Ollama is Running:**
   ```bash
   ollama list
   ```
4. **Run HYT-ATS Using Ollama:**
   You can either set `HYT_LLM_PROVIDER=ollama` in `.env`, or simply add `--provider ollama` to any CLI command:
   ```bash
   python main.py test-llm --provider ollama
   ```

---

### 5. System Health Check

Run these 4 quick diagnostic commands to verify that the installation is functioning:

```bash
# 1. Test your AI model connection
python main.py test-llm

# 2. List all available LLM models & provider status
python main.py list-models

# 3. List pre-configured enterprise Job Descriptions
python main.py list-jds

# 4. Run the core test suite (verifies gates & scoring)
python -m pytest tests/test_phase6.py
```

---

### 6. CLI Command Reference (Custom Resumes & Custom JDs)

The pipeline is fully accessible via `python main.py`.

#### Scenario 1: Screen a Single Resume against a Target Job
```bash
python main.py run-candidate --resume "path/to/resume.pdf" --jd 2234533717
```
- Replace `2234533717` with any Job ID from `python main.py list-jds`.
- The terminal will display the **Candidate Audit Report**, Gate 0 integrity score, Gate 4 verification, Gate 6 breakdown (Technical, Experience, Seniority, Education, Location), and Gate 7 decision (`AUTO_ADVANCE`, `ESCALATE`, `AUTO_REJECT`).

#### Scenario 2: Screen a 3rd-Party PDF against a BRAND NEW / Custom Job Description
You can provide your own custom Job Description file (`.json` or `.txt`):

**Using a Custom Text JD:**
```bash
python main.py run-candidate --resume "path/to/candidate_resume.pdf" --jd "path/to/my_custom_job_description.txt"
```

**Using a Custom JSON JD:**
```bash
python main.py run-candidate --resume "path/to/candidate_resume.pdf" --jd "path/to/my_custom_job_description.json"
```

*(The engine will automatically parse the custom JD, extract must-haves, generate semantic embeddings, and screen the resume with zero manual configuration).*

#### Scenario 3: Force Re-Extraction (Bypass Cache)
By default, the engine caches structured extractions to disk to save API tokens and time. To force a fresh re-evaluation:
```bash
python main.py run-candidate --resume "path/to/resume.pdf" --jd 2234533717 --refresh
```

#### Scenario 4: Override LLM Provider or Model on the Fly
Run with a specific cloud or local model without editing `.env` or `config.yaml`:
```bash
# Force execution via Groq (Primary Benchmark Configuration)
python main.py run-candidate --resume "path/to/resume.pdf" --jd 2234533717 --provider groq --model qwen/qwen3.8-27b

# Force execution via Local Ollama (zero API keys)
python main.py run-candidate --resume "path/to/resume.pdf" --jd 2234533717 --provider ollama --model qwen2.5-coder:7b

# Force execution via Google Gemini
python main.py run-candidate --resume "path/to/resume.pdf" --jd 2234533717 --provider gemini --model models/gemini-2.5-flash
```

#### Scenario 5: Batch Screen an Entire Folder of Resumes
Screen 50+ candidates in one command:
```bash
python main.py run-batch --resume-dir "path/to/resumes_directory" --jd 2234533717 --limit 20
```

#### Scenario 6: Display Ranked Candidate Leaderboard
View candidates ranked by score with NDCG-level precision:
```bash
python main.py rank --jd 2234533717
```

#### Scenario 7: Inspect Gate 0 Security & Integrity Shield
Check for adversarial attacks (white text stuffing, prompt injections, sub-2pt tiny fonts):
```bash
python main.py check-integrity --pdf "path/to/suspicious_resume.pdf"
```

#### Scenario 8: Record a Human Recruiter Decision Override
If a recruiter decides to overturn an automated decision:
```bash
python main.py override --candidate-id 10089434 --decision AUTO_ADVANCE --reason "VP engineering granted interview waiver for exceptional portfolio"
```
*(Appends an immutable entry to `data/audit/audit_trail.jsonl` per enterprise compliance).*

---

### 7. Running Evaluations & Benchmarks

The system provides two distinct, non-overlapping evaluation suites:

#### Benchmark Suite 1: Primary 200-Pair Human Golden Benchmark
Evaluates the full 200 real-world candidate-job pairs sampled from the [Snehaan Bhawal Resume Dataset](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset) mapped against software engineering postings from the [Arshkon LinkedIn Job Postings Dataset](https://www.kaggle.com/datasets/arshkon/linkedin-job-postings?select=mappings) (as recommended in the HYT assignment specification) under Option 3 calibration (`high_threshold: 85.0`, `low_threshold: 50.0`):
```bash
python -m eval.harness --golden-path data/golden/golden_labels.csv --output eval_2_results.json
```

**Verified Ground-Truth Performance Output:**
- **Decision Accuracy:** **82.50%** (165 / 200, Weighted F1: **0.8197**, Macro Precision: **0.8852**)
- **Safety Guarantee:** False Rejection Rate of Star Talent (**0.00%**, 0 / 8)
- **Risk Mitigation:** False Advance Rate of Unqualified Talent (**0.00%**, 0 / 104)
- **Filtration Precision:** Auto-Reject Precision (**90.32%**, 84 / 93)
- **Ranking Quality:** NDCG@5 (**0.7861**, +83.1% over Jaccard) and NDCG@10 (**0.8033**, +39.4% over Jaccard)
- **Extraction F1:** **1.0000** across skills, YoE, education, titles, and location.

#### Benchmark Suite 2: 50-Pair Synthetic Edge-Case & Stress-Test Suite
Evaluates the 50 AI-generated edge cases generated via Anthropic Claude (Claude 3.5 Sonnet) and kept strictly separate in `check/`:
```bash
python -m eval.harness --golden-path check/synthetic_labels.csv --output check/eval_results.json
```

**Synthetic Stress Performance Output:**
- **Ranking Quality:** NDCG@5 = **0.8641**, NDCG@10 = **0.8825** (outperforming TF-IDF 0.8138 and Jaccard 0.8366)
- **Decision Accuracy:** **76.00%** (Macro F1: **0.7290**, Weighted F1: **0.7542**)
- **Adversarial Neutralization:** **100.0%** (15 / 15 vectors quarantined)

> **Formal Data Generation & AI-Assistance Disclosure:**  
> Initial candidate-job annotations on the 200 Kaggle pairs were assisted by an AI recruiter simulation using Anthropic Claude (Claude 3.5 Sonnet) and subsequently reviewed, hand-calibrated, and adjudicated for internal consistency. 50 additional synthetic pairs were generated using Claude to stress-test diverse boundary conditions, career switchers, and adversarial injections, and are kept strictly separate from the 200-pair human golden set in all evaluation runs. The synthetic set is clearly marked as AI-generated in all output files.

---

### 8. Troubleshooting & FAQ

#### Q1: "ModuleNotFoundError: No module named 'fitz'"
- **Fix:** `fitz` is provided by `PyMuPDF`. Run:
  ```bash
  pip install pymupdf
  ```

#### Q2: "SentenceTransformer download is slow on first run"
- **Explanation:** On first run, the local embedding model (`sentence-transformers/all-MiniLM-L6-v2`, ~80MB) is downloaded once and cached in `~/.cache/torch/sentence_transformers`. Subsequent runs execute with 100% offline cache hits.

#### Q3: "PowerShell: File ... cannot be loaded because running scripts is disabled"
- **Fix:** In PowerShell, run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

#### Q4: "Groq Rate Limit Exceeded (HTTP 429)"
- **Fix 1:** Add multiple free Groq keys in `.env` as `GROQ_API_KEYS=key1,key2,key3`. The client automatically cycles keys.
- **Fix 2:** Switch to local Ollama (`--provider ollama`) or Gemini (`--provider gemini`).

#### Q5: "Where are evaluation results and human labels stored?"
- Primary Ground Truth Golden Labels: `data/golden/golden_labels.csv` (200 pairs)
- Synthetic Edge-Case Labels: `check/synthetic_labels.csv` (50 pairs)
- Full Evaluation Benchmark Artifact: `eval_2_results.json`
- Synthetic Stress Benchmark Artifact: `check/eval_results.json`
- Master Configuration: `config.yaml`
- Golden Labelling & Scoring Guides: `data/golden/labelling_guide.md`, `data/golden/metric_definition.md`
