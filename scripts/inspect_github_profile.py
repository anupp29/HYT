"""
HYT ATS — Standalone GitHub & Project Verification Tool
======================================================
Zero-token GitHub Profile & Flagship Repository Verification using github-readme-stats.
Does NOT require a GitHub Personal Access Token (PAT).

Usage:
    python scripts/inspect_github_profile.py --username anupp29
    python scripts/inspect_github_profile.py --username anupp29 --repos atlas,guard --live https://atlas-dhe.vercel.app
    python scripts/inspect_github_profile.py  # Interactive prompt
"""

import sys
import argparse
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import requests

# Ensure project root in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

sys.stdout.reconfigure(encoding="utf-8")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HYT-ATS/1.0",
    "Accept": "image/svg+xml,application/xml,text/xml,*/*",
}


def get_profile_stats(username: str, timeout: int = 10) -> Dict[str, Any]:
    """Fetches lifetime commits, PRs, stars, and activity stats via Route 1."""
    url = f"https://github-readme-stats.vercel.app/api?username={username}&include_all_commits=true"
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return {"error": f"HTTP {r.status_code}"}
        
        svg = r.text
        if "User not found" in svg:
            return {"not_found": True, "error": "User not found on GitHub"}

        desc_m = re.search(r'<desc id="descId">(.*?)</desc>', svg, re.DOTALL)
        rank_m = re.search(r'data-testid="level-rank-icon"[^>]*>(.*?)</text>', svg)
        stars_m = re.search(r'data-testid="stars"[^>]*>(.*?)</text>', svg)
        commits_m = re.search(r'data-testid="commits"[^>]*>(.*?)</text>', svg)
        prs_m = re.search(r'data-testid="prs"[^>]*>(.*?)</text>', svg)
        issues_m = re.search(r'data-testid="issues"[^>]*>(.*?)</text>', svg)
        contribs_m = re.search(r'data-testid="contribs"[^>]*>(.*?)</text>', svg)

        return {
            "username": username,
            "rank": rank_m.group(1).strip() if rank_m else "N/A",
            "stars": stars_m.group(1).strip() if stars_m else "0",
            "commits": commits_m.group(1).strip() if commits_m else "0",
            "prs": prs_m.group(1).strip() if prs_m else "0",
            "issues": issues_m.group(1).strip() if issues_m else "0",
            "contribs": contribs_m.group(1).strip() if contribs_m else "0",
            "summary_text": desc_m.group(1).strip() if desc_m else "",
        }
    except Exception as e:
        return {"error": str(e)}


def get_top_languages(username: str, timeout: int = 10) -> Dict[str, Any]:
    """Fetches verified language distribution based on codebase bytes via Route 2."""
    url = f"https://github-readme-stats.vercel.app/api/top-langs/?username={username}&layout=compact&langs_count=8"
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return {"error": f"HTTP {r.status_code}"}
        
        svg = r.text
        langs = re.findall(r'data-testid="lang-name"[^>]*>(.*?)</text>', svg)
        return {"username": username, "languages": [l.strip() for l in langs if l.strip()]}
    except Exception as e:
        return {"error": str(e)}


def get_repo_pin(owner: str, repo: str, timeout: int = 10) -> Dict[str, Any]:
    """Fetches repository stars, forks, and primary language via Route 3."""
    clean_repo = repo.strip().rstrip("/")
    if "/" in clean_repo:
        parts = clean_repo.split("/")
        owner, clean_repo = parts[-2], parts[-1]

    url = f"https://github-readme-stats.vercel.app/api/pin/?username={owner}&repo={clean_repo}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return {"repo": f"{owner}/{clean_repo}", "error": f"HTTP {r.status_code}"}
        
        svg = r.text
        if "Repo not found" in svg or "User not found" in svg:
            return {"repo": f"{owner}/{clean_repo}", "error": "Repository not found"}

        lang_m = re.search(r'data-testid="lang-name"[^>]*>(.*?)</text>', svg)
        stars_m = re.search(r'data-testid="stargazers"[^>]*>(.*?)</text>', svg)
        forks_m = re.search(r'data-testid="forkcount"[^>]*>(.*?)</text>', svg)

        return {
            "repo": f"{owner}/{clean_repo}",
            "primary_language": lang_m.group(1).strip() if lang_m else "Unknown",
            "stars": stars_m.group(1).strip() if stars_m else "0",
            "forks": forks_m.group(1).strip() if forks_m else "0",
        }
    except Exception as e:
        return {"repo": f"{owner}/{clean_repo}", "error": str(e)}


def verify_live_url(url: str, timeout: int = 5) -> Dict[str, Any]:
    """Tests if a candidate live project deployment is reachable (HTTP 200)."""
    clean_url = url.strip()
    if not clean_url.startswith("http"):
        clean_url = "https://" + clean_url

    try:
        r = requests.head(clean_url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if r.status_code in (405, 403):
            # Fallback to GET if HEAD blocked
            r = requests.get(clean_url, headers=HEADERS, timeout=timeout)
        return {
            "url": clean_url,
            "status_code": r.status_code,
            "is_live": r.status_code < 400,
        }
    except Exception as e:
        return {
            "url": clean_url,
            "status_code": None,
            "is_live": False,
            "error": str(e),
        }


def discover_user_public_repos(username: str, limit: int = 6, timeout: int = 8) -> Tuple[List[str], List[str]]:
    """
    Discovers top public repositories and live deployment homepage URLs
    directly from GitHub's public REST API without requiring a token.
    """
    url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page={limit}"
    repos: List[str] = []
    live_urls: List[str] = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code == 200:
            for item in r.json():
                repo_full = item.get("full_name") or f"{username}/{item.get('name')}"
                if repo_full and not item.get("fork"):
                    repos.append(repo_full)
                elif repo_full and len(repos) < limit:
                    repos.append(repo_full)
                hp = item.get("homepage")
                if hp and hp.strip() and hp.startswith("http"):
                    live_urls.append(hp.strip())
    except Exception:
        pass
    return repos[:limit], live_urls


def run_full_inspection(username: str, repos: Optional[List[str]] = None, live_urls: Optional[List[str]] = None):
    """Executes full GitHub profile and project audit, printing structured summary."""
    clean_user = username.strip().lstrip("@")
    if "/" in clean_user:
        clean_user = clean_user.split("/")[-1]

    print("=" * 80)
    print(f"HYT ATS - GITHUB CANDIDATE AUDIT: @{clean_user}")
    print(f"Proxy Source: https://github-readme-stats.vercel.app (Zero Token Required)")
    print("=" * 80)

    # 1. Profile Stats
    print("\n[1/3] Fetching Developer Profile Statistics...")
    stats = get_profile_stats(clean_user)
    if stats.get("error"):
        print(f"  [!] Error fetching profile stats: {stats['error']}")
    else:
        print(f"  * GitHub Handle:     @{stats['username']}")
        print(f"  * Global Rank Grade: {stats['rank']}")
        print(f"  * Lifetime Commits:  {stats['commits']}")
        print(f"  * Pull Requests:     {stats['prs']}")
        print(f"  * Stargazers Earned: {stats['stars']}")
        print(f"  * Total Issues:      {stats['issues']}")
        print(f"  * Repos Contributed: {stats['contribs']}")
        if stats.get("summary_text"):
            print(f"  * Activity Summary:  {stats['summary_text']}")

    # 2. Languages
    print("\n[2/3] Fetching Codebase Language Distribution...")
    lang_data = get_top_languages(clean_user)
    languages = lang_data.get("languages", [])
    if languages:
        for idx, l in enumerate(languages, 1):
            print(f"  {idx}. {l}")
    else:
        print("  (No language distribution returned or user has no public repo bytes)")

    # 3. Project Repositories
    repos_to_check = repos or []
    auto_discovered_live = []
    if not repos_to_check:
        auto_repos, auto_discovered_live = discover_user_public_repos(clean_user)
        repos_to_check = auto_repos

    if repos_to_check:
        source_desc = "Specified" if repos else "Auto-Discovered Public"
        print(f"\n[3/3] Auditing Flagship Project Repositories ({len(repos_to_check)} {source_desc})...")
        print(f"  {'Repository':<32} | {'Language':<14} | {'Stars':<8} | {'Forks':<8}")
        print("  " + "-" * 70)
        for r_spec in repos_to_check:
            owner = clean_user
            repo_name = r_spec.strip()
            if "/" in repo_name:
                parts = repo_name.split("/")
                owner = parts[-2]
                repo_name = parts[-1]
            pin = get_repo_pin(owner, repo_name)
            if pin.get("error"):
                print(f"  {pin.get('repo'):<32} | [Error: {pin['error']}]")
            else:
                print(f"  {pin.get('repo'):<32} | {pin.get('primary_language'):<14} | {pin.get('stars'):<8} | {pin.get('forks'):<8}")

    # 4. Live Deployments
    all_live = list(dict.fromkeys((live_urls or []) + auto_discovered_live))
    if all_live:
        print(f"\n[4/4] Verifying Live Project Deployments ({len(all_live)} URLs)...")
        for u in all_live:
            res = verify_live_url(u)
            status_desc = f"HTTP {res['status_code']} (ONLINE)" if res["is_live"] else f"OFFLINE ({res.get('error', 'Error')})"
            print(f"  * {res['url']:<40} -> {status_desc}")

    print("\n" + "=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="HYT ATS GitHub & Project Verifier")
    parser.add_argument("--username", "-u", type=str, default=None, help="GitHub username")
    parser.add_argument("--repos", "-r", type=str, default=None, help="Comma-separated repository names or owner/repo paths")
    parser.add_argument("--live", "-l", type=str, default=None, help="Comma-separated live deployment URLs to verify")
    args = parser.parse_args()

    user = args.username
    if not user:
        try:
            user = input("Enter GitHub username (e.g. anupp29): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            return

    if not user:
        print("Username cannot be empty.")
        return

    repo_list = [r.strip() for r in args.repos.split(",") if r.strip()] if args.repos else []
    live_list = [l.strip() for l in args.live.split(",") if l.strip()] if args.live else []

    run_full_inspection(user, repo_list, live_list)


if __name__ == "__main__":
    main()
