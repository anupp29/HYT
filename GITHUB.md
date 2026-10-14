# GitHub Candidate Extraction via GitHub-Readme-Stats
> Architectural Catalog & Route Specification for Gate 4 Candidate Verification  
> Target Service: `https://github-readme-stats.vercel.app`  
> Upstream Repository: [`anuraghazra/github-readme-stats`](https://github.com/anuraghazra/github-readme-stats)

---

## 1. Executive Summary & Purpose

In automated ATS candidate screening (Gate 4: Verification Engine), candidate resumes frequently cite GitHub handles (e.g., `github.com/{username}`). 

Instead of requiring individual GitHub Personal Access Tokens (PAT) or hitting strict GitHub REST API rate limits (60 requests/hr for unauthenticated calls), **`github-readme-stats`** acts as a centralized proxy service that aggregates, computes, and renders real-time developer statistics.

The service serves responses as **SVG XML** (`Content-Type: image/svg+xml; charset=utf-8`). The raw metrics are embedded directly inside `<desc id="descId">` and `<text data-testid="...">` XML tags, allowing zero-token extraction of:
1. Lifetime commit volume and active repository contributions
2. Verified programming language distribution (% by codebase bytes)
3. Flagship open-source projects (stargazers, forks, primary language)
4. Coding time intensity and active IDE hours (via WakaTime integration)

---

## 2. Comprehensive Route Catalog

---

### Route 1: Overall Developer Profile Stats Card
Fetches aggregated candidate activity across all public repositories.

* **Base Endpoint:**  
  `https://github-readme-stats.vercel.app/api`

* **Template URL:**  
  `https://github-readme-stats.vercel.app/api?username={username}&include_all_commits=true&show_icons=true&show=reviews,prs_merged,prs_merged_percentage`

* **Key Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `username` | string | *Required* | Candidate's GitHub username |
  | `include_all_commits` | boolean | `false` | If `true`, counts lifetime commits instead of just the past calendar year |
  | `commits_year` | integer | (Current) | Specify particular year (e.g. `commits_year=2024`) to inspect recency |
  | `show` | comma-separated | none | Add extra metrics: `reviews`, `discussions_started`, `discussions_answered`, `prs_merged`, `prs_merged_percentage` |
  | `hide` | comma-separated | none | Hide specific stats: `stars`, `commits`, `prs`, `issues`, `contribs` |
  | `show_icons` | boolean | `false` | Renders descriptive icons alongside metric labels |
  | `rank_icon` | string | `default` | Options: `default`, `github`, `percentile` |
  | `theme` | string | `default` | Options: `github_dark`, `radical`, `tokyonight`, `transparent` |
  | `hide_border` | boolean | `false` | Removes SVG card border |

* **Extracted Candidate Signals:**
  * **Total Lifetime Commits (`commits`):** Validates active hands-on coding vs. resume fabrication.
  * **Pull Requests Created & Merged (`prs`, `prs_merged`):** Proves collaborative development and peer-reviewed code.
  * **Code Reviews Submitted (`reviews`):** Distinguishes senior/staff engineers from entry-level coders.
  * **Repositories Contributed To (`contribs`):** Measures community engagement and real open-source impact.
  * **Japanese Academic Rank (`level-rank-icon`):** Global percentile grade (`S`, `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`).

* **Raw Data Payload Elements in SVG:**
  ```xml
  <desc id="descId">
    Total Stars Earned: 265326, Total Commits (last year) : 3742, Total PRs: 85, Total Issues: 10, Contributed to (last year): 0
  </desc>
  <text data-testid="level-rank-icon">A</text>
  <text data-testid="stars">265.3k</text>
  <text data-testid="commits">3.7k</text>
  <text data-testid="prs">85</text>
  <text data-testid="issues">10</text>
  <text data-testid="contribs">0</text>
  ```

---

### Route 2: Top Languages & Stack Distribution Card
Calculates candidate code volume and language distribution based on actual repository bytes.

* **Base Endpoint:**  
  `https://github-readme-stats.vercel.app/api/top-langs/`

* **Template URL:**  
  `https://github-readme-stats.vercel.app/api/top-langs/?username={username}&layout=compact&langs_count=8&theme=github_dark&hide_border=true`

* **Key Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `username` | string | *Required* | Candidate's GitHub username |
  | `layout` | string | `normal` | Display layout: `compact`, `donut`, `donut-vertical`, `pie` |
  | `langs_count` | integer | `5` | Number of top languages to return (e.g. `langs_count=8`) |
  | `hide` | comma-separated | none | Exclude non-programming markup: `hide=html,css,jupyter notebook` |
  | `exclude_repo` | comma-separated | none | Exclude fork dumps or non-original repositories (`exclude_repo=coursework,assignments`) |
  | `size_weight` | float | `1` | Weight given to repository size vs language byte count |
  | `count_weight` | float | `0` | Weight given to frequency of language across repos |

* **Extracted Candidate Signals:**
  * **Stack Alignment Verification:** Detects if a candidate claiming "Senior Python Developer" has 95% JavaScript and 0% Python on GitHub.
  * **Primary vs. Incidental Languages:** Computes exact percentage breakdown by bytes (e.g. `C: 97.92%`, `Rust: 0.44%`, `Python: 0.36%`).
  * **Gate 4 Mismatch Trigger:** Flags `GITHUB_LANGUAGE_MISMATCH` if core JD must-haves are completely missing from candidate's top codebase languages.

* **Raw Data Payload Elements in SVG:**
  ```xml
  <text data-testid="header">Most Used Languages</text>
  <text data-testid="lang-name">C 97.92%</text>
  <text data-testid="lang-name">Assembly 0.65%</text>
  <text data-testid="lang-name">Rust 0.44%</text>
  <text data-testid="lang-name">Shell 0.43%</text>
  <text data-testid="lang-name">Python 0.36%</text>
  ```

---

### Route 3: Flagship Repository Pin Card ("Extra Pins")
Inspects specific flagship, capstone, or featured project repositories cited on the resume.

* **Base Endpoint:**  
  `https://github-readme-stats.vercel.app/api/pin/`

* **Template URL:**  
  `https://github-readme-stats.vercel.app/api/pin/?username={username}&repo={repo}&theme=github_dark&show_owner=true`

* **Key Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `username` | string | *Required* | Repository owner or candidate username |
  | `repo` | string | *Required* | Exact name of the repository |
  | `show_owner` | boolean | `false` | Displays repository owner handle |
  | `description_lines_count` | integer | `2` | Lines of repository description rendered |

* **Extracted Candidate Signals:**
  * **Production Stargazers & Adoption (`stargazers`):** Validates real industry utility (e.g. 100+ stars vs. empty toy project).
  * **Forks & Community Usage (`forkcount`):** Proves third-party adoption.
  * **Primary Language Identification (`lang-name`):** Confirms repo technology matches resume project claim.
  * **Project Description Grounding:** Verbatim comparison against resume project bullet points.

* **Raw Data Payload Elements in SVG:**
  ```xml
  <text data-testid="header">{repo}</text>
  <text data-testid="lang-name">C</text>
  <text data-testid="stargazers">251.9k</text>
  <text data-testid="forkcount">67.9k</text>
  ```

---

### Route 4: GitHub Gist Pin Card
Inspects candidate code snippets, algorithmic solutions, and technical gists.

* **Base Endpoint:**  
  `https://github-readme-stats.vercel.app/api/gist`

* **Template URL:**  
  `https://github-readme-stats.vercel.app/api/gist?id={gist_id}&theme=github_dark`

* **Key Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `id` | string | *Required* | Gist unique identifier hash |
  | `show_owner` | boolean | `false` | Displays gist owner handle |

* **Extracted Candidate Signals:**
  * Quick scripts, algorithmic challenge answers, or custom configuration artifacts.

---

### Route 5: WakaTime Coding Time & Effort Card
Measures verified active coding time, IDE hours, and daily language usage.

* **Base Endpoint:**  
  `https://github-readme-stats.vercel.app/api/wakatime`

* **Template URL:**  
  `https://github-readme-stats.vercel.app/api/wakatime?username={wakatime_username}&layout=compact&range=all_time`

* **Key Query Parameters:**
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `username` | string | *Required* | Candidate's WakaTime username |
  | `range` | string | `last_7_days` | Time window: `last_7_days`, `last_30_days`, `last_year`, `all_time` |
  | `layout` | string | `normal` | Display layout: `compact` or `normal` |
  | `hide` | comma-separated | none | Exclude specific languages from time calculation |

* **Extracted Candidate Signals:**
  * **Authentic Working Hours:** Verifies real time spent in editors (VS Code, IntelliJ, Neovim) vs. cloned repositories.
  * **Active Technology Hours:** Measures actual hours coded in Python, TypeScript, Java over the last 30 days.

---

## 3. Candidate Assessment & ATS Gate 4 Integration Matrix

| Screening Signal | Target Route | Threshold / Condition | Screening Action |
|---|---|---|:---:|
| **Language Mismatch** | `/api/top-langs` | Core JD languages $\le 5\%$ of total repo bytes | Trigger `GITHUB_LANGUAGE_MISMATCH` flag $\rightarrow$ Escalate |
| **Dormant Profile** | `/api` | Lifetime commits $< 10$ or 0 in past year | Trigger `GITHUB_INACTIVE` flag |
| **High Conviction Profile** | `/api` | Rank `A` or `S`, Commits $> 500$, PRs $> 20$ | Boost Pillar 4 Evidence Score (+5.0 pts) |
| **Flagship Project Verif.** | `/api/pin` | Stargazers $\ge 50$, Forks $\ge 10$ | Mark matching skill in Ledger as `is_verified = True` |
| **Non-Existent Profile** | `/api` | HTTP 404 or "User not found" SVG error | Trigger `GITHUB_NOT_FOUND` flag (Non-blocking) |

---

## 4. Brutal Reality Check: Caveats & Architectural Constraints

1. **HTTP User-Agent Header is Mandatory:**
   * Sending bare HTTP requests from automated scripts triggers an immediate `ConnectionResetError (WinError 10054)` from Vercel Edge firewall.
   * *Requirement:* Client must include a standard User-Agent header (e.g. `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) HYT-ATS/1.0`).

2. **Public Vercel Instance Reliability & Rate Limits:**
   * The public instance (`github-readme-stats.vercel.app`) shares an upstream GitHub API token pool with thousands of developers worldwide. During peak US hours, it can return temporary rate-limit or downtime cards.
   * *ATS Fail-Safe Rule (Principle 6 in `master.md`):* If GitHub or Vercel returns HTTP 429/500/timeout, Gate 4 **must log a warning and gracefully skip verification without penalizing the candidate**. An external service outage must never reject a viable applicant.

3. **SVG Scraping vs. Native JSON:**
   * The API returns SVG XML, not raw JSON. Extraction requires regex or XML tree parsing (`<desc>` or `data-testid="..."`).
   * Because SVG templates can evolve across library versions, regex extractors must use defensive fallbacks.

4. **Public vs. Private Commits:**
   * By default, the public instance only tallies **public** repositories. Enterprise software engineers whose primary work lives in private corporate repositories will show low public commit counts.
   * *Constraint:* Gate 4 can only be used as positive verification, **never as a hard negative auto-reject trigger**.
