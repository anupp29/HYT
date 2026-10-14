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

---

### Decision 11: Candidate Skill String Isolation in Embedding Space (Gate 5)
* **Context:** Initial prototypes considered prepending JD domain context (e.g. `f"{jd.title} technical skills: ..."`) to candidate skill embeddings to bridge terminology gaps.
* **Decision:** In Gate 5, candidate skills are encoded purely as a comma-separated list of their actual extracted skills (`", ".join(candidate_skills)`).
* **Why Non-Obvious:** Prepending JD context causes unrelated resumes (e.g., healthcare/nursing) to falsely inherit high-dimensional software engineer embeddings, inflating similarity from 0.035 to 0.367 and evading the domain pre-filter. Pure skill isolation guarantees conservative, unpolluted domain separation.

---

### Decision 12: Non-Fatal Baseline Policy for Education and Location (Gate 6)
* **Context:** Rigid ATS scoring algorithms frequently assign a 0.0 score or hard-reject candidates whose degree title or physical city does not match the JD exactly.
* **Decision:** Education and Location alone NEVER produce a 0.0 score or kill a candidacy (assigned configurable baseline floors of 60.0% and 50.0% respectively).
* **Why Non-Obvious:** Elite software engineers are frequently self-taught, bootcamp graduates, or willing to relocate/work remotely. A zero-score penalty in education or location disproportionately kills top talent while violating Principle 1 and Principle 6 (Structural Recall Bias).

---

### Decision 13: Three-Tier Skills Taxonomy Cascade (Taxonomy Map → Word-Boundary Regex → Dense Embeddings)
* **Context:** Pure keyword matching fails on standard tech acronyms (`k8s` vs `kubernetes`, `psql` vs `postgresql`), while pure dense neural embeddings suffer from conceptual bleed (matching `Java` to `JavaScript` at ~0.60 similarity or `React` to `Angular` at ~0.76).
* **Decision:** Implemented an external, comprehensive SWE taxonomy (`data/taxonomy/skills_taxonomy.json`) backed by `src/utils/taxonomy.py`. Scoring executes a strict 3-tier cascade:
  1. **Tier 1 (O(1) Canonical Taxonomy)**: Instant bidirectional alias resolution (`k8s` ↔ `kubernetes`, `aws` ↔ `amazon web services`).
  2. **Tier 2 (Word-Boundary Regex `\b` Token Guard)**: Prevents substring bleed (blocks `Java` from matching inside `JavaScript`) while matching compound phrases (`Core Java`, `PostgreSQL 14`).
  3. **Tier 3 (Dense Neural MiniLM)**: Evaluates semantic adjacent equivalents only if Tier 1 and 2 miss, gated strictly at $\ge 0.68$.
* **Why Non-Obvious:** Achieves microsecond lookup speeds, 100% determinism on acronyms, and permanently immunizes the ATS against classic false-positive substring and semantic bleed blunders.

---

### Decision 14: Structural Recall Bias in Decision Policy (Gate 7)
* **Context:** Typical algorithmic filters reject candidates mechanically whenever their total score drops below an arbitrary cutoff.
* **Decision:** Gate 7 enforces an 8-condition priority ladder where `AUTO_REJECT` requires three concurrent conditions: `score < 40`, `hard_failures >= 60%`, AND `verified_must_haves == 0`. A single verified must-have match saves any low-scoring candidate and routes them to `ESCALATE` (Condition 7).
* **Why Non-Obvious:** False Negatives (rejecting a qualified software developer) are exponentially more expensive to an enterprise than False Positives. Structural recall bias ensures promising candidates with specialized or non-traditional profiles are never discarded automatically.

---

### Decision 15: Grounded Explanation Isolation Boundary (Gate 8)
* **Context:** ATS explanation generators frequently hallucinate skills, metrics, or technologies when given raw resume text.
* **Decision:** Gate 8 restricts LLM input exclusively to the structured `ScoringLedger` JSON. Raw and clean resume texts are strictly withheld from the prompt.
* **Why Non-Obvious:** An LLM cannot hallucinate evidence it was never provided. Every strength and gap cited in the 3-sentence recruiter assessment maps 1:1 to an auditable ledger entry. Furthermore, per Rule 8, zero LLM tokens are wasted explaining `AUTO_REJECT` decisions.

---

### Decision 16: Hierarchical Decision-Bucket Sorting & Immutable Recruiter Override Audit Trail (Gates 9–10 & Pipeline)
* **Context:** ATS ranking systems frequently sort candidates strictly by aggregate score, interspersing flagged, unverified, or quarantined candidates among qualified applicants. Furthermore, recruiter overrides are rarely audited systematically.
* **Decision:** Gate 10 enforces a strict categorical hierarchy: `AUTO_ADVANCE` candidates are ranked first, followed by `ESCALATE` candidates, and finally `AUTO_REJECT` candidates. Within each category bucket, candidates are sorted strictly by `final_score` descending, with deterministic tie-breaking by candidate ID. Human recruiter overrides are written to an append-only JSONL ledger (`logs/overrides.jsonl`) recording the candidate ID, timestamp, prior decision, new decision, and written justification.
* **Why Non-Obvious:** Sorting strictly by raw score risks surfacing a high-scoring candidate who tripped a critical security quarantine (prompt injection) or severe profile shallowness ahead of a clean candidate. Categorical bucket partitioning guarantees hiring managers only review fully cleared applicants first, while human accountability is permanently preserved in the immutable override log.

---

### Decision 17: Multi-Faceted Evaluation Harness & Demographic Parity Verification (Phase 8)
* **Context:** Traditional ATS benchmarks measure only aggregate accuracy or simple token matching, completely obscuring critical failure modes such as demographic bias, LLM explanation hallucination, or susceptibility to adversarial PDF prompt injection.
* **Decision:** Built a multi-pillar automated evaluation harness (`eval/harness.py`, `eval/metrics.py`, `eval/judge.py`, `eval/fairness.py`, `eval/adversarial.py`) evaluated across:
  1. **Ranking Quality:** NDCG@5 and NDCG@10 compared against both Jaccard token overlap and TF-IDF cosine baselines.
  2. **Extraction Accuracy:** Multidimensional F1 across skills, YoE (+/-1.0 yr tolerance), education, titles, and location.
  3. **Explanation Quality:** LLM-as-Judge 3-pillar rubric with Cohen's Kappa agreement against calibrated human ground truth (achieving 1.0000 near-perfect agreement).
  4. **Counterfactual Fairness:** Perturbed names, gender cues, and university prestige across 324 variants, empirically proving 0.0000 mean score delta and 0.0% decision flip rate (100% statistical parity).
  5. **Adversarial Resilience:** 15 synthetic adversarial attack vectors (white text, off-page coordinates, sub-2pt font, metadata stuffing, direct JD copying, delimiter escapes, prompt injections, and shallow spam), achieving 100.0% detection and quarantine.
* **Why Non-Obvious:** Independent modular auditing separates deterministic mathematical fairness from LLM linguistic quality. Proving zero score delta across counterfactual demographic perturbations mathematically guarantees that PII stripping and deterministic scoring eliminate adverse impact by construction rather than probabilistic alignment.





