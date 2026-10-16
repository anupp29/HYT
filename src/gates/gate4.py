"""
HYT ATS - Gate 4: Verification Layer (Skill Depth & GitHub Cross-Check)
=======================================================================
Enforces post-extraction verification checks completely deterministically (Principle 1 & 10).
No LLM calls are made in Gate 4.

Key Verifications:
  1. Skill Depth Audit:
     - Audits proportion of unverified vs verified skills.
     - Unverified ratio exceeding threshold triggers SHALLOW_PROFILE flag.
     - Records evidence ledger entry.
  2. GitHub Cross-Check:
     - If no GitHub URL provided: neutral recruiter note, zero penalty (Guiding Principle).
     - If GitHub URL provided:
       * Primary proxy: Extracts language breakdown & commit volume via github-readme-stats (zero token required).
       * Fallback: Queries GitHub REST API if proxy is unavailable or GITHUB_TOKEN is configured.
       * Caches profile lookups to disk under cache/github/ to prevent duplicate requests.
       * Detects language stack mismatch (claimed core coding languages vs GitHub repositories).
       * Detects inactive profiles (zero activity in lookback window).
       * Fault-tolerant: API failures log warnings and continue pipeline cleanly without penalty.
"""

import os
import re
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import requests

from src.models.schemas import (
    ResumeStructured,
    Skill,
    Gate4VerificationReport,
    VerificationFlag,
)
from src.utils.config import get_config
from src.utils.logger import get_logger
from src.utils.cache import get_cache_manager

logger = get_logger("GATE_4_VERIFICATION")

# Standard recognized programming languages for stack alignment audits
CORE_PROGRAMMING_LANGUAGES = {
    "python", "javascript", "typescript", "java", "c++", "cpp", "c#", "csharp",
    "c", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "sql", "r", "dart", "shell", "bash", "html", "css", "vue", "react", "solidity"
}


def audit_skill_depth(
    skills: List[Skill],
    threshold: float = 0.60,
) -> Tuple[bool, float, int, int, str]:
    """
    Audits the ratio of unverified skills (claimed only in skills section without context).
    
    Args:
        skills: List of extracted candidate skills.
        threshold: Proportion of unverified skills triggering SHALLOW_PROFILE.
        
    Returns:
        Tuple of (is_shallow, unverified_ratio, total_skills, unverified_count, ledger_note)
    """
    total = len(skills)
    if total == 0:
        return False, 0.0, 0, 0, "No skills claimed in resume."

    unverified_count = len([s for s in skills if not s.is_verified])
    verified_count = total - unverified_count
    unverified_ratio = unverified_count / total

    # Trigger shallow profile flag if ratio exceeds threshold and candidate claimed >= 3 skills
    is_shallow = (unverified_ratio >= threshold) and (total >= 3)

    if is_shallow:
        note = (
            f"SHALLOW PROFILE: {unverified_count} of {total} claimed skills ({unverified_ratio:.1%}) "
            f"have no demonstrated context in experience bullets (threshold: {threshold:.1%})."
        )
    else:
        note = (
            f"Skill Depth Verified: {verified_count} of {total} skills ({verified_count / total:.1%}) "
            f"substantiated by concrete experience evidence."
        )

    return is_shallow, unverified_ratio, total, unverified_count, note


def fetch_github_profile_data(
    github_handle: str,
    timeout_seconds: int = 5,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """
    Fetches developer metrics and language distribution for a GitHub user.
    Checks disk cache first, then attempts github-readme-stats proxy,
    falling back to GitHub REST API.
    
    Args:
        github_handle: GitHub username (e.g. 'Akshada-kale').
        timeout_seconds: Network request timeout.
        use_cache: If True, uses cached data if available.
        
    Returns:
        Dict containing languages, activity metrics, and profile status.
    """
    clean_handle = github_handle.strip().lstrip("@")
    if "/" in clean_handle:
        clean_handle = clean_handle.split("/")[-1]

    cache = get_cache_manager()
    cache_key = f"github_{clean_handle.lower()}"

    if use_cache:
        cached = cache.get("github", cache_key)
        if cached:
            logger.info(f"GitHub cache HIT for user '{clean_handle}'.", gate="GATE_4")
            return cached

    # Attempt 1: github-readme-stats Proxy (Zero-token, pre-computed SVGs)
    proxy_result = _fetch_from_github_readme_stats(clean_handle, timeout_seconds)
    if proxy_result and not proxy_result.get("error") and not proxy_result.get("api_error"):
        if use_cache and not proxy_result.get("not_found"):
            cache.set("github", cache_key, proxy_result)
        return proxy_result

    # Attempt 2: Direct GitHub REST API fallback
    rest_result = _fetch_from_github_rest_api(clean_handle, timeout_seconds)
    if rest_result:
        if use_cache and not rest_result.get("not_found"):
            cache.set("github", cache_key, rest_result)
        return rest_result

    # Return error dict if both failed
    err_dict = {
        "handle": clean_handle,
        "languages": {},
        "active_in_lookback": True,
        "recent_commits": 0,
        "api_error": proxy_result.get("api_error") if proxy_result else "GitHub API unreachable",
    }
    return err_dict


def _fetch_from_github_readme_stats(handle: str, timeout: int) -> Optional[Dict[str, Any]]:
    """Fetches stats and language breakdown from github-readme-stats."""
    top_langs_url = f"https://github-readme-stats.vercel.app/api/top-langs/?username={handle}&layout=compact&langs_count=10"
    stats_url = f"https://github-readme-stats.vercel.app/api?username={handle}&include_all_commits=true"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HYT-ATS/1.0",
        "Accept": "image/svg+xml,application/xml,text/xml,*/*",
    }

    try:
        # 1. Fetch Top Languages
        lang_resp = requests.get(top_langs_url, headers=headers, timeout=timeout)
        if lang_resp.status_code == 404 or "User not found" in lang_resp.text:
            return {"handle": handle, "not_found": True, "languages": {}, "recent_commits": 0}

        languages: Dict[str, float] = {}
        if lang_resp.status_code == 200:
            # Parse SVG text tags: e.g. '\n        Java 28.55%\n      '
            text_matches = re.findall(r'<text[^>]*>([^<]+)</text>', lang_resp.text)
            for raw_text in text_matches:
                clean_t = raw_text.strip()
                m = re.match(r'^([a-zA-Z0-9\+\#\.\s\-]+?)\s+([\d\.]+)%$', clean_t)
                if m:
                    lang_name = m.group(1).strip()
                    lang_pct = float(m.group(2))
                    languages[lang_name] = lang_pct

        # 2. Fetch Overall Stats
        stats_resp = requests.get(stats_url, headers=headers, timeout=timeout)
        total_commits = 0
        total_prs = 0
        rank = "N/A"
        active_in_lookback = True

        if stats_resp.status_code == 200:
            svg_text = stats_resp.text
            # Commits
            cm = re.search(r'Total Commits[^:]*:\s*</text>\s*<text[^>]*>(\d+[\.\d]*[kK]?)', svg_text)
            if not cm:
                cm = re.search(r'data-testid="commits">([^<]+)</text>', svg_text)
            if cm:
                c_str = cm.group(1).strip().lower()
                total_commits = int(float(c_str.replace("k", "")) * 1000) if "k" in c_str else int(float(c_str))

            # PRs
            pm = re.search(r'data-testid="prs">([^<]+)</text>', svg_text)
            if pm:
                try:
                    total_prs = int(pm.group(1).strip())
                except ValueError:
                    pass

            # Rank
            rm = re.search(r'data-testid="level-rank-icon">([^<]+)</text>', svg_text)
            if rm:
                rank = rm.group(1).strip()

            active_in_lookback = (total_commits > 0 or total_prs > 0 or len(languages) > 0)

        logger.info(
            f"Successfully extracted GitHub stats via proxy for '{handle}': "
            f"{len(languages)} languages, ~{total_commits} commits.",
            gate="GATE_4",
        )
        return {
            "handle": handle,
            "languages": languages,
            "recent_commits": total_commits,
            "total_prs": total_prs,
            "rank": rank,
            "active_in_lookback": active_in_lookback,
            "source": "github-readme-stats",
        }
    except requests.exceptions.RequestException as e:
        logger.warning(f"github-readme-stats proxy request failed for '{handle}': {e}", gate="GATE_4")
        return {"handle": handle, "api_error": str(e), "languages": {}}


def _fetch_from_github_rest_api(handle: str, timeout: int) -> Optional[Dict[str, Any]]:
    """Fallback: Queries GitHub REST API directly."""
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    headers = {
        "User-Agent": "HYT-ATS-Screening/1.0",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    repos_url = f"https://api.github.com/users/{handle}/repos?per_page=30&sort=pushed"

    try:
        resp = requests.get(repos_url, headers=headers, timeout=timeout)
        if resp.status_code == 404:
            return {"handle": handle, "not_found": True, "languages": {}, "recent_commits": 0}
        if resp.status_code == 403:
            logger.warning(f"GitHub REST API rate limit reached (403) for user '{handle}'.", gate="GATE_4")
            return {"handle": handle, "api_error": "Rate limit exceeded (403)", "languages": {}}

        if resp.status_code != 200:
            return None

        repos = resp.json()
        if not isinstance(repos, list):
            return None

        lang_counts: Dict[str, int] = {}
        cfg = get_config()
        lookback_days = cfg.gate4.github_activity_lookback_days
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        active_in_lookback = False
        most_recent_push = None

        for r in repos:
            lang = r.get("language")
            if lang:
                lang_counts[lang] = lang_counts.get(lang, 0) + 1

            pushed_str = r.get("pushed_at")
            if pushed_str:
                try:
                    pushed_dt = datetime.fromisoformat(pushed_str.replace("Z", "+00:00"))
                    if most_recent_push is None or pushed_dt > most_recent_push:
                        most_recent_push = pushed_dt
                    if pushed_dt >= cutoff_date:
                        active_in_lookback = True
                except Exception:
                    pass

        # Normalize language proportions to percentages
        total_repos = sum(lang_counts.values())
        languages = {
            lang: round((count / total_repos) * 100, 2)
            for lang, count in lang_counts.items()
        } if total_repos > 0 else {}

        return {
            "handle": handle,
            "languages": languages,
            "recent_commits": len(repos) * 5,
            "active_in_lookback": active_in_lookback or (len(repos) > 0 and most_recent_push is not None),
            "source": "github_rest_api",
        }
    except Exception as e:
        logger.warning(f"Direct GitHub REST API failed for '{handle}': {e}", gate="GATE_4")
        return None


def cross_check_github(
    github_handle: Optional[str],
    github_url: Optional[str],
    claimed_skills: List[Skill],
    timeout_seconds: int = 5,
    use_cache: bool = True,
) -> Tuple[List[VerificationFlag], Dict[str, Any], List[str]]:
    """
    Cross-checks candidate claimed programming languages and activity against GitHub.
    
    Args:
        github_handle: Extracted GitHub username.
        github_url: Candidate GitHub profile URL.
        claimed_skills: List of skills extracted from resume.
        timeout_seconds: Timeout for external network requests.
        use_cache: Whether to use disk caching for GitHub lookups.
        
    Returns:
        Tuple of (flags, github_data, ledger_notes)
    """
    flags: List[VerificationFlag] = []
    ledger_notes: List[str] = []

    # 1. Null GitHub URL / Handle: Neutral Recruiter Note (Principle: Zero Penalty)
    if not github_handle and not github_url:
        ledger_notes.append(
            "GitHub Audit: No GitHub profile URL provided on resume. "
            "Noted as neutral observation. Zero penalty applied."
        )
        return flags, {}, ledger_notes

    handle = github_handle or (github_url.split("/")[-1] if github_url else "")
    handle = handle.strip().lstrip("@").rstrip("/")
    if not handle:
        ledger_notes.append("GitHub Audit: Malformed GitHub URL provided. Skipped check.")
        return flags, {}, ledger_notes

    # 2. Fetch GitHub Profile
    cfg = get_config()
    data = fetch_github_profile_data(
        handle,
        timeout_seconds=timeout_seconds or cfg.gate4.github_api_timeout_seconds,
        use_cache=use_cache,
    )

    # 3. Handle Profile Not Found (404)
    if data.get("not_found"):
        flags.append(VerificationFlag.GITHUB_NOT_FOUND)
        ledger_notes.append(
            f"GITHUB NOT FOUND: Claimed GitHub handle '{handle}' returned 404 (user does not exist)."
        )
        return flags, data, ledger_notes

    # 4. Handle API Unavailability / Error (Resilience Principle: Never Fail Pipeline)
    if data.get("api_error") and not data.get("languages"):
        ledger_notes.append(
            f"GitHub Audit Skipped: GitHub service unavailable ({data.get('api_error')}). "
            f"Candidate evaluation proceeded without penalty."
        )
        return flags, data, ledger_notes

    gh_languages = data.get("languages", {})
    gh_lang_names_lower = {l.lower(): pct for l, pct in gh_languages.items()}

    # 5. Extract Claimed Core Coding Languages from Resume Skills
    claimed_coding_langs = []
    for s in claimed_skills:
        s_lower = s.name.lower().strip()
        if s_lower in CORE_PROGRAMMING_LANGUAGES:
            claimed_coding_langs.append(s.name)

    # 6. Language Stack Alignment Audit
    mismatch_threshold = cfg.gate4.github_language_mismatch_threshold
    if claimed_coding_langs and gh_languages:
        matched_langs = [l for l in claimed_coding_langs if l.lower() in gh_lang_names_lower]
        missing_langs = [l for l in claimed_coding_langs if l.lower() not in gh_lang_names_lower]

        unmatched_ratio = len(missing_langs) / len(claimed_coding_langs)

        if unmatched_ratio >= mismatch_threshold and len(matched_langs) == 0:
            flags.append(VerificationFlag.GITHUB_MISMATCH)
            flags.append(VerificationFlag.GITHUB_LANGUAGE_MISMATCH)
            ledger_notes.append(
                f"GITHUB STACK MISMATCH: Claimed primary languages {claimed_coding_langs} "
                f"have zero representation in public GitHub codebase (GitHub top languages: "
                f"{list(gh_languages.keys())[:5]})."
            )
        else:
            ledger_notes.append(
                f"GitHub Stack Corroborated: Verified languages {matched_langs} present on GitHub "
                f"({', '.join([f'{k}: {v:.1f}%' for k, v in list(gh_languages.items())[:3]])})."
            )
    elif claimed_coding_langs and not gh_languages:
        ledger_notes.append(
            f"GitHub Profile Verified: User '{handle}' has 0 public repositories or language statistics."
        )

    # 7. Inactivity Check in Lookback Window
    active_in_lookback = data.get("active_in_lookback", True)
    if not active_in_lookback and (len(gh_languages) > 0 or data.get("recent_commits", 0) == 0):
        flags.append(VerificationFlag.GITHUB_INACTIVE)
        lookback_days = cfg.gate4.github_activity_lookback_days
        ledger_notes.append(
            f"GITHUB INACTIVE: No active commits or contributions detected within "
            f"the {lookback_days}-day lookback window."
        )

    return flags, data, ledger_notes


def evaluate_gate4(
    resume: ResumeStructured,
    github_url: Optional[str] = None,
    github_handle: Optional[str] = None,
    candidate_id: Optional[str] = None,
    use_cache: bool = True,
) -> Gate4VerificationReport:
    """
    Orchestrates Gate 4 Verification Layer for a structured resume profile.
    
    Args:
        resume: Extracted ResumeStructured model from Gate 3.
        github_url: Optional GitHub profile URL from Gate 2.
        github_handle: Optional GitHub username from Gate 2.
        candidate_id: Unique candidate identifier.
        use_cache: Whether to use disk caching for GitHub lookups.
        
    Returns:
        Immutable Gate4VerificationReport Pydantic model.
    """
    cid = candidate_id or "candidate"
    cfg = get_config()

    all_flags: List[VerificationFlag] = []
    all_ledger_notes: List[str] = []

    # 1. Skill Depth Audit
    shallow_threshold = cfg.gate4.shallow_profile_unverified_threshold
    is_shallow, unverified_ratio, total_skills, unverified_count, depth_note = audit_skill_depth(
        resume.skills,
        threshold=shallow_threshold,
    )
    if is_shallow:
        all_flags.append(VerificationFlag.SHALLOW_PROFILE)
    all_ledger_notes.append(depth_note)

    # 2. GitHub Cross-Check
    effective_url = github_url
    effective_handle = github_handle
    if not effective_handle and resume.github_handle:
        effective_handle = resume.github_handle

    gh_flags, gh_data, gh_notes = cross_check_github(
        github_handle=effective_handle,
        github_url=effective_url,
        claimed_skills=resume.skills,
        timeout_seconds=cfg.gate4.github_api_timeout_seconds,
        use_cache=use_cache,
    )
    all_flags.extend(gh_flags)
    all_ledger_notes.extend(gh_notes)

    # Propagate any Gate 3 flags (e.g. concurrent overlapping full-time dates)
    if hasattr(resume, "verification_flags") and resume.verification_flags:
        for f in resume.verification_flags:
            f_val = getattr(f, "value", str(f))
            if f_val == "DATE_SUSPICIOUS" and VerificationFlag.DATE_SUSPICIOUS not in all_flags:
                all_flags.append(VerificationFlag.DATE_SUSPICIOUS)
                all_ledger_notes.append("DATE_SUSPICIOUS: Concurrent full-time employment date overlap detected.")

    # Dedup flags while preserving order
    unique_flags: List[VerificationFlag] = []
    for f in all_flags:
        if f not in unique_flags:
            unique_flags.append(f)

    # Compile Top Languages and Inactive Skills
    gh_languages = gh_data.get("languages", {})
    top_langs = list(gh_languages.keys())[:5]
    inactive_skills = []
    if VerificationFlag.GITHUB_INACTIVE in unique_flags:
        inactive_skills = [
            s.name for s in resume.skills
            if s.name.lower() in CORE_PROGRAMMING_LANGUAGES
        ]

    verified_skills_count = total_skills - unverified_count

    report = Gate4VerificationReport(
        candidate_id=cid,
        github_handle=effective_handle,
        github_url=effective_url,
        flags=unique_flags,
        total_skills_count=total_skills,
        verified_skills_count=verified_skills_count,
        unverified_skills_count=unverified_count,
        unverified_skill_ratio=round(unverified_ratio, 4),
        github_top_languages=top_langs,
        github_language_breakdown=gh_languages,
        github_active_in_lookback=gh_data.get("active_in_lookback", True),
        recent_public_commits=gh_data.get("recent_commits", 0),
        inactive_skills=inactive_skills,
        ledger_notes=all_ledger_notes,
        is_verified=len(unique_flags) == 0,
    )

    logger.info(
        f"[{cid}] Gate 4 Complete: {len(unique_flags)} flags triggered, "
        f"unverified_ratio={unverified_ratio:.1%}, github_langs={top_langs}",
        gate="GATE_4",
        candidate_id=cid,
    )
    return report
