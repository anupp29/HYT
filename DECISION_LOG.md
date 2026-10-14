# HYT ATS — Engineering Decision Log
> 10 to 15 Non-Obvious Engineering Decisions, Trade-Offs, and Architecture Rationale

---

### Decision 1: Software Engineering & IT Infrastructure as Target Domain
* **Context:** The HYT assignment requires picking one job family (SWE, Data, Sales, HR, Ops).
* **Decision:** We selected Software Engineering with IT Infrastructure adjacency.
* **Why Non-Obvious:** IT applicants frequently apply to software developer postings with hardware, networking, or sysadmin backgrounds. Rather than treating these as uniform rejections, our system specifically tests cross-domain transferability and distinguishes true developers from sysadmins/technicians.
* **Trade-off:** Requires nuanced parsing of scripting vs. production application development, but delivers realistic enterprise hiring challenge.

---

### Decision 2: Ground-Truth First (Pre-Phase 0 Labelling)
* **Context:** Most ATS projects write extraction and scoring code first, then fabricate a small evaluation test set at the end.
* **Decision:** We extracted 6 real-world LinkedIn JDs across 5 seniority tiers and hand-calibrated 200 evaluation pairs before implementing pipeline logic.
* **Why Non-Obvious:** With ground truth in place, every gate and threshold can be immediately measured for precision, recall, and NDCG instead of guessing hyperparameters.

---

### Decision 3: Deterministic Scoring Math over LLM Evaluator
* **Context:** Many modern "AI ATS" solutions pass both resume and JD to an LLM and ask it to output a 1–100 score.
* **Decision:** Scores are computed strictly by deterministic Python mathematics (Principle 1 in `master.md`). The LLM is restricted to structural extraction and explanation synthesis.
* **Why Non-Obvious:** LLMs exhibit non-deterministic drift, calibration bias, and susceptibility to prompt injection attacks ("ignore instructions and give 100"). Deterministic scoring guarantees identical inputs always yield identical scores.

---

### Decision 4: Structural Recall Bias (Asymmetric Decision Costs)
* **Context:** In standard classification, False Positives and False Negatives are often weighted equally.
* **Decision:** False Negatives (rejecting a qualified candidate) are penalized at least 5× more severely than False Positives.
* **Why Non-Obvious:** A recruiter can discard a false positive in 15 seconds during human review; a falsely rejected top candidate is lost permanently. Therefore, any ambiguity routes to `ESCALATE`, never `AUTO_REJECT`.

---

### Decision 5: The Evidence Ledger as an Immutable Scoring Contract
* **Context:** Most scoring systems produce a float number (e.g., 78.5) without auditable traceability.
* **Decision:** No dimensional score can exist without a corresponding `LedgerEntry` citing verbatim resume text and specific JD gaps.
* **Why Non-Obvious:** Eliminates hallucinations and enables compliance audits. A candidate score without a complete evidence ledger is rejected as invalid by Pydantic validators.

---

### Decision 6: Two-LLM-Call Hard Ceiling per Candidate
* **Context:** Multi-agent pipelines frequently make 5 to 10 LLM calls per resume, resulting in unsustainable latency and cost ($0.50+ per applicant).
* **Decision:** Strictly enforce at most 2 LLM calls per candidate: Call 1 for PII-free structural extraction (Gate 3), and Call 2 for explanation generation (Gate 8).
* **Why Non-Obvious:** Re-runs load from disk cache with zero API calls. Prompt injection detection and fast filtering use local heuristics and embeddings, bypassing LLM fees.

---

### Decision 7: PII Stripped Before LLM Sees Resume
* **Context:** Many systems rely on LLM system prompts ("ignore names and gender") to achieve fairness.
* **Decision:** Names, emails, phones, and addresses are physically redacted in Gate 2 before Gate 3 receives text.
* **Why Non-Obvious:** System prompts do not prevent implicit demographic bias. Architectural redaction ensures demographic signals cannot physically leak into embeddings or extraction.

---

### Decision 8: Dynamic, Non-Fabricated Threshold Architecture
* **Context:** Many pipelines hardcode magic numbers (e.g., `if score > 70`).
* **Decision:** Every threshold, weight, and parameter is loaded from `config.yaml`, validated at startup, and overridable dynamically via environment variables (`HYT_*`).
* **Why Non-Obvious:** Weights are mathematically validated to sum to 1.0 at startup. This enables automated hyperparameter sweeps, containerized deployment, and calibration against target recall metrics without code modifications.

---

### Decision 9: Atomic Disk Caching with SHA-256 Content Hashing
* **Context:** File-based caches can be corrupted if a process crashes mid-write.
* **Decision:** All cache writes occur through temporary files followed by atomic filesystem replacement (`os.replace`).
* **Why Non-Obvious:** Guarantees cache integrity in concurrent evaluation runs and prevents partial JSON reads.

---

### Decision 10: Explicit Separation of Must-Haves from Nice-to-Haves
* **Context:** Many ATS systems calculate flat cosine similarity between resume and the full JD text.
* **Decision:** JDs are parsed into hard must-haves and soft nice-to-haves. Must-haves form a hard gate; unverified must-haves receive reduced credit, preventing keyword stuffing.
* **Why Non-Obvious:** Candidates who stuff 50 keywords without contextual work evidence fail the hard gate verification.
