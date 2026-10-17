# Golden Sample 2 — Sampling & Adjudication Documentation
**File:** [`data/golden/golden_sample_2.csv`](golden_sample_2.csv)  
**Total Pairs:** 212  
**Candidate Source:** Kaggle Snehaan Bhawal (`Resume/Resume.csv`)  
**Verified Raw PDF Binaries:** `data/<Category>/<ID>.pdf` (2,484 verified on disk)  
**Target Roles:** 6 Canonical Benchmark Job Descriptions  

---

## 1. Multi-Domain Diversity & Coverage
Unlike Sample 1 which focused primarily on IT/Engineering, Golden Sample 2 guarantees **generalization across all 24 professional categories**:

| Domain Cluster | Categories Included | Pairs Sampled | Target Role Focus |
| :--- | :--- | :---: | :--- |
| **Core Technical** | Information-Technology, Engineering | 70 | Full Stack, Senior SWE, Staff Backend |
| **Tech-Adjacent / Data** | Digital-Media, Finance, Banking, Consultant | 46 | Full Stack, Associate SWE |
| **Business / Operations** | Business-Development, Sales, HR | 32 | Associate SWE, Career Switchers |
| **Creative / Academic** | Designer, Arts, Teacher | 22 | Frontend / UIUC Associate SWE |
| **Out-of-Domain Stress** | Healthcare, Chef, Fitness, Advocate, Aviation, Construction, Apparel, Agriculture, Automobile, BPO | 30 | Hard Rejection & Anti-Hallucination |
| **Total** | **24 Categories** | **212** | **6 Benchmark JDs** |

---

## 2. Fit Score & Decision Distribution
Follows realistic ATS distribution:

* **Fit Score 5 (Strong Advance):** 16 pairs (8.0%)
* **Fit Score 4 (Clear Advance):** 24 pairs (12.0%)
* **Fit Score 3 (Escalate / Human Review):** 52 pairs (26.0%)
* **Fit Score 2 (Escalate / Borderline Reject):** 28 pairs (14.0%)
* **Fit Score 1 (Definitive Reject):** 80 pairs (40.0%)

**Decisions:**
* `advance`: 40 pairs (20.0%)
* `escalate`: 68 pairs (34.0%)
* `reject`: 92 pairs (46.0%)

---

## 3. Deliberate Edge Cases & Hard Scenarios
1. **The Overqualified Architect:** 18+ YoE senior architects applying to Mid/Entry roles (`is_overqualified = yes`).
2. **The Quantitative Career Switcher:** Finance / Banking analysts with self-taught Python/SQL applying to Associate SWE (`is_career_switcher = yes`).
3. **Hard Adversarial Rejection:** 100% non-technical profiles (Chefs, Advocates, Fitness trainers) to test whether embedding models hallucinate matches on generic buzzwords like "team leadership" or "communication".
