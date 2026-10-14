# HYT ATS - Golden Dataset Recruiter Metric & Scoring Specification

**Document Version:** 1.0.0  
**Domain Focus:** Software Engineering & Information Technology (SDE Intern / Graduate 2027 ATS Evaluation Benchmark)  
**Author:** Lead Technical Recruiter & Evaluation Architect, HYT ATS  
**Target File:** `e:\HYT\hyt-ats\data\golden\golden_labels.csv`  

---

## 1. Executive Summary & Recruiting Philosophy

The **HYT ATS Golden Dataset** represents the canonical ground truth for candidate-job alignment across six distinct software engineering and IT tiers (Entry/Junior, Mid-Level Full Stack, Senior AI/ML, Lead DevOps/Platform, and Staff Backend/Distributed Systems).

In high-stakes enterprise technical recruiting, automated screening must strike an uncompromising balance between **precision** (preventing unqualified applicants from reaching engineering interviews) and **recall** (never arbitrarily rejecting promising non-traditional candidates, career switchers, or transferable talent). 

As codified in Principle 4 of the HYT Master Specification (*Recall Bias is Structural*), any resume presenting genuine ambiguity, adjacent qualifications, or domain transfers is steered toward **human escalation** rather than mechanical rejection.

---

## 2. Four-Pillar Recruiter Scoring Rubric (0 – 100 Scale)

Every candidate-job pair is evaluated across four orthogonal quantitative pillars totaling 100 points:

```
Total Recruiter Fit Score (0 - 100) = P1 (Tech Alignment) + P2 (Seniority Calibration) + P3 (System Complexity) + P4 (Evidence Depth)
```

```mermaid
graph TD
    A[Resume & Job Description] --> P1[Pillar 1: Technical Stack Alignment (0-40 pts)]
    A --> P2[Pillar 2: Seniority & YoE Calibration (0-25 pts)]
    A --> P3[Pillar 3: Domain & Architectural Complexity (0-25 pts)]
    A --> P4[Pillar 4: Evidence & Verifiable Artifacts (0-10 pts)]
    P1 --> TOT[Composite Recruiter Score (0-100)]
    P2 --> TOT
    P3 --> TOT
    P4 --> TOT
    TOT --> MAP[Fit Score 1 - 5]
    MAP --> DEC[Recruiter Decision: Advance / Escalate / Reject]
```

---

### Pillar 1: Core Technical Stack Alignment (0 – 40 Points)
Measures the correspondence between the job's required core technologies and the candidate's verified skills:

* **Primary Tech Stack Match (0 – 25 pts):**
  * Direct demonstrated production experience in primary languages/frameworks (e.g., React/Node for Full Stack, Go/Python for AI/Backend, Terraform/AWS for Platform, Java/Kafka for Staff Systems).
  * *Distinction:* Technologies evidenced inside chronological work history bullets receive full credit; isolated keyword listing in a "Skills" summary receives 40% fractional credit.
* **Secondary / Ecosystem Tooling Match (0 – 15 pts):**
  * Database layers (PostgreSQL, MySQL, MongoDB, DynamoDB, Redis).
  * Infrastructure/CI/CD (Docker, Kubernetes, GitHub Actions, Jenkins).
  * Methodologies (Agile/Scrum, TDD, REST API architecture).

---

### Pillar 2: Seniority & Experience Calibration (0 – 25 Points)
Calibrates the candidate's validated Years of Experience (YoE) and scope of responsibility against the JD seniority tier:

* **Target Seniority Tiers:**
  * **Junior / Associate (UIUC #3887497535):** Target 0–3 yrs.
  * **Mid-Level Full Stack (Ideando #2234533717):** Target 3–6 yrs.
  * **Senior SWE (StyleAI #3586167732):** Target 5–8+ yrs.
  * **Lead AWS Platform Engineer (Perficient #3891267064):** Target 7–10+ yrs.
  * **Staff SWE (Function Health #3886458575):** Target 8–12+ yrs.
  * **Staff SWE Backend Systems (DAT #3900940733):** Target 8–12+ yrs.
* **Scoring Rules:**
  * Candidate YoE meets or appropriately spans target range: **25 pts**
  * Minor gap (-1 to -2 yrs) with strong technical density: **18–20 pts**
  * Substantial underqualification (-3+ yrs for Senior/Staff roles): **5–10 pts**
  * Substantial overqualification (+10+ yrs over Entry/Junior): **12–15 pts** (Flagged as `is_overqualified = yes`).

---

### Pillar 3: Domain & Architectural Complexity Match (0 – 25 Points)
Evaluates whether the candidate operates at the required level of system design and engineering depth:

* **Software Engineering vs. IT Operations Distinction:**
  * **Production Software Development:** Designing distributed microservices, state management, algorithmic logic, API contracts, database schema migrations.
  * **DevOps / Cloud Architecture:** Infrastructure-as-code, multi-account AWS topologies, VPC networking, container orchestration.
  * **IT Systems / Helpdesk Support:** Hardware installation, desktop troubleshooting, Active Directory admin, ticketing systems.
* **Scoring Rules:**
  * Direct domain alignment (e.g., Distributed systems engineer for Staff Backend): **25 pts**
  * Transferable engineering domain (e.g., Embedded C++ or QA Automation to Full Stack): **15–18 pts** (Flagged as `is_career_switcher = yes`).
  * Pure IT helpdesk/hardware technician applying for Senior/Staff SWE: **0–5 pts** (Clear mismatch).

---

### Pillar 4: Engineering Evidence & Verifiable Artifacts (0 – 10 Points)
Validates the presence of high-conviction engineering artifacts and measurable impact:

* Measurable business metrics in work accomplishments (e.g., latency reduction, cost savings, user scale): **5 pts**
* Verifiable code repositories, open-source work, GitHub/GitLab links, or technical publications: **5 pts** (Flagged as `has_relevant_github = yes`).

---

## 3. Score-to-Fit Mapping & Recruiter Decision Policy

The composite 100-point score deterministically maps to the 5-point discrete recruiter scale (`human_fit_score`) and routing decision (`human_decision`):

| Total Score | Human Fit Score | Classification | Recruiter Decision | Criteria & Routing Action |
|:---:|:---:|:---|:---:|:---|
| **85 – 100** | **5** | **Exceptional Fit** | `advance` | Direct shortlist. Matches primary stack, validated YoE, strong demonstrated production impact. Fast-track to technical screening. |
| **70 – 84** | **4** | **Good Fit** | `advance` | Shortlist. Solid match on core requirements. Minor secondary tooling gaps that are easily bridged on the job. No red flags. |
| **50 – 69** | **3** | **Partial / Borderline** | `escalate` | Human judgment call. Candidate exhibits transferable technical aptitude, career switch potential, or adjacent stack, but has noticeable gaps. Must be reviewed by human recruiter. |
| **30 – 49** | **2** | **Weak Fit** | `escalate` / `reject` | Significant technical or seniority deficit. If adjacent potential exists (e.g., junior dev applying to senior role), route to `escalate` for lower-tier pool; if zero development ability, route to `reject`. |
| **0 – 29** | **1** | **Clear Mismatch** | `reject` | Safe automatic rejection. Disconnected domain (e.g., non-technical, physical hardware/cabling, desktop password support for Staff SWE). |

---

## 4. Special Classification Flags

To provide granular diagnostic labels for ATS evaluation, four metadata columns are assigned for every pair:

1. **`is_career_switcher` (`yes` / `no`):**
   * Assigned `yes` when candidate transitions from non-traditional software engineering disciplines (e.g., QA Automation, Hardware/Electrical Engineering, IT Helpdesk, Mechanical CAD) into core software development, demonstrating self-taught programming, bootcamps, or scripting initiatives.
2. **`is_overqualified` (`yes` / `no`):**
   * Assigned `yes` when candidate has >= 12–15 years of senior engineering leadership (Director, VP, Senior Architect, Executive) applying for Junior, Entry-Level, or Mid-Level individual contributor roles.
3. **`has_relevant_github` (`yes` / `no`):**
   * Assigned `yes` when candidate resume contains references to GitHub, GitLab, personal code portfolios, or open-source repositories.
4. **`special_notes`:**
   * Contextual notes highlighting specific recruiter nuances (e.g., *"QA Automation specialist with Java/Selenium transitioning to full-stack"*, *"Senior IT Executive overqualified for entry UIUC posting"*, *"Strong AWS infrastructure match lacking Terraform IaC"*).

---

## 5. Recruiter Rationale (`human_rationale`) Standard

Every row in the golden set must include a **concise, professional, factual 1–2 sentence recruiter justification** containing:
1. **Candidate Profile Summary:** Validated YoE and primary functional title.
2. **Key Match/Gap Analysis:** Specific tech stack overlap and identified architectural discrepancies.
3. **Action Recommendation:** Clear rationale justifying `advance`, `escalate`, or `reject`.
