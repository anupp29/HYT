# HYT ATS - Golden Set Labelling Guide

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
