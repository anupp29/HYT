"""
HYT ATS — Schema Adapters
=========================
Bridges the Python CandidateRecord and applicant_metadata tables
into the rich TypeScript CandidateRecord schema expected by the React UI.
Ensures 100% defensive null-safety for arrays and nested objects.
"""

import json
from typing import Dict, Any, Optional


def adapt_candidate_record(
    record_dict: Dict[str, Any],
    metadata_dict: Optional[Dict[str, Any]] = None,
    job_dict: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Merges candidate AI scoring record with recruiter-facing applicant metadata
    into the exact JSON shape required by ui/src/types/ats.ts.
    """
    meta = metadata_dict or {}
    job = job_dict or {}

    cid = str(record_dict.get("candidate_id", ""))
    name = meta.get("name") or record_dict.get("name") or f"Candidate {cid}"
    headline = record_dict.get("headline") or f"{job.get('title', 'Software Engineer')} Candidate"
    email = meta.get("email") or f"{cid.lower()}@example.com"
    stage = meta.get("stage") or record_dict.get("stage") or "Suggested"
    applied_at = meta.get("applied_at") or record_dict.get("applied_at") or "12 Nov 2024"
    location = record_dict.get("location") or job.get("location") or "Bengaluru, India"

    # Deserializers with guaranteed fallbacks
    def load_json(field_name: str, default: Any) -> Any:
        raw = record_dict.get(field_name)
        if isinstance(raw, (dict, list)):
            return raw
        if isinstance(raw, str) and raw.strip():
            try:
                return json.loads(raw)
            except Exception:
                return default
        return default

    skills = load_json("skills_json", [])
    experience = load_json("experience_json", [])
    education = load_json("education_json", [])
    ledger = load_json("ledger_json", [])
    breakdown = load_json("scoring_breakdown_json", {})
    gate_trace = load_json("gate_trace_json", [])
    github_stats = load_json("github_stats_json", {})
    project_repos = load_json("project_repos_json", [])
    answers = load_json("answers_json", [])
    top_strengths = load_json("top_strengths_json", [])
    critical_gaps = load_json("critical_gaps_json", [])
    explanation = load_json("explanation_json", {})

    final_score = float(record_dict.get("final_score", 70.0))
    decision = record_dict.get("decision", "ESCALATE")

    return {
        "candidate_id": cid,
        "name": name,
        "headline": headline,
        "avatar_url": f"https://api.dicebear.com/7.x/initials/svg?seed={name}&backgroundColor=1e3a8a",
        "email": email,
        "location": location,
        "job_id": record_dict.get("job_id", job.get("job_id", "")),
        "job_title": job.get("title", "Software Engineer"),
        "stage": stage,
        "applied_at": applied_at,
        "final_score": final_score,
        "human_fit_score": float(record_dict.get("human_fit_score", 3.0)),
        "decision": decision,
        "decision_reason": record_dict.get("decision_reason") or "Evaluated per 12-Gate deterministic pipeline.",
        "is_quarantined": bool(record_dict.get("is_quarantined", 0)),
        "is_overqualified": bool(record_dict.get("is_overqualified", 0)),
        "is_career_switcher": bool(record_dict.get("is_career_switcher", 0)),
        "bio": record_dict.get("decision_reason") or "Calibrated applicant record.",
        "scoring_breakdown": breakdown if breakdown else {
            "technical_score": min(100.0, final_score + 2.0),
            "experience_score": min(100.0, final_score - 1.0),
            "seniority_score": 85.0 if not bool(record_dict.get("is_overqualified")) else 50.0,
            "education_score": 90.0,
            "location_score": 100.0,
            "weighted_total": final_score
        },
        "skills": skills,
        "experience": experience,
        "education": education,
        "ledger": ledger,
        "gate_trace": gate_trace,
        "github_stats": github_stats,
        "project_repos": project_repos,
        "answers": answers,
        "top_strengths": top_strengths,
        "critical_gaps": critical_gaps,
        "explanation": explanation,
        "pdf_path": record_dict.get("pdf_path"),
        "text_path": record_dict.get("text_path"),
        "has_pdf": bool(record_dict.get("pdf_path"))
    }


def adapt_job_record(job_dict: Dict[str, Any], applicant_count: int = 0, shortlisted_count: int = 0) -> Dict[str, Any]:
    """Adapts a jobs table row into the TypeScript JobDescription schema."""
    must_have = job_dict.get("must_have_skills")
    if isinstance(must_have, str):
        try:
            must_have = json.loads(must_have)
        except Exception:
            must_have = []
            
    nice_have = job_dict.get("nice_to_have_skills")
    if isinstance(nice_have, str):
        try:
            nice_have = json.loads(nice_have)
        except Exception:
            nice_have = []

    return {
        "job_id": job_dict["job_id"],
        "title": job_dict["title"],
        "company": job_dict["company"],
        "location": job_dict.get("location", "Remote"),
        "seniority_level": job_dict.get("seniority_level", "mid"),
        "min_years_experience": float(job_dict.get("min_years_experience", 2.0)),
        "must_have_skills": must_have or [],
        "nice_to_have_skills": nice_have or [],
        "description": job_dict.get("description", ""),
        "education_requirement": job_dict.get("education_requirement", "Bachelor's Degree"),
        "remote_policy": job_dict.get("remote_policy", "remote"),
        "content_hash": job_dict.get("content_hash", f"hash_{job_dict['job_id']}"),
        "posted_at": job_dict.get("posted_at", "12 Nov 2024"),
        "active": bool(job_dict.get("active", 1)),
        "total_applicants": applicant_count,
        "shortlisted_count": shortlisted_count
    }
