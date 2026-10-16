"""
HYT ATS - Gate A2: Structured Job Description Extraction
=========================================================
Extracts strongly-typed JobDescription schema from raw JD text.
Enforces caching strategy: SHA-256 hash lookup ensures JD is extracted
at most once across all pipeline runs. Zero API calls on cache hit.
"""

import json
import re
from typing import Optional, Dict, Any

from src.models.schemas import JobDescriptionRaw, JobDescription, SeniorityLevel
from src.utils.cache import get_cache_manager
from src.utils.logger import get_logger
from src.utils.llm_client import get_llm_client

logger = get_logger("GATE_A2_JD_EXTRACTION")

JD_EXTRACTION_SYSTEM_PROMPT = """You are an expert technical recruiter and talent architect for HuntYourTribe (HYT).
Your task is to analyze the provided raw Job Description and extract structured requirements with extreme precision.

CRITICAL INSTRUCTIONS:
1. MUST-HAVES vs NICE-TO-HAVES:
   - "must_have_skills": Only include strict non-negotiable core technical requirements, primary programming languages, and foundational frameworks required for the role. Keep them concise (e.g. "React", "Node.js", "Python", "Kubernetes", "PostgreSQL").
   - "nice_to_have_skills": Include secondary preferences, bonus tooling, domain experiences (e.g. "GraphQL", "Healthcare experience", "Kafka").
2. SENIORITY LEVEL:
   - Must be strictly one of: "entry", "junior", "mid", "senior", "lead", "staff", "principal", "executive".
3. MINIMUM YEARS EXPERIENCE:
   - Extract numeric minimum years of experience (e.g. 3, 5, 8). If entry level, use 0 or 1.
4. REMOTE POLICY:
   - One of: "remote", "hybrid", "onsite".
5. Output format must be strictly valid JSON matching this schema:
{
  "title": string,
  "company": string,
  "seniority_level": string,
  "min_years_experience": float,
  "must_have_skills": [string],
  "nice_to_have_skills": [string],
  "education_requirement": string,
  "location": string,
  "remote_policy": string,
  "domain_context": string
}
"""


def extract_job_description(
    raw_jd: JobDescriptionRaw,
    use_cache: bool = True,
    force_refresh: bool = False,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> JobDescription:
    """
    Extracts structured JobDescription from raw input with atomic disk caching.
    
    Args:
        raw_jd: JobDescriptionRaw containing raw text and content_hash.
        use_cache: If True, checks cache before calling LLM.
        force_refresh: If True, bypasses cache and re-extracts.
        provider: Optional provider override ("gemini", "groq", "ollama", "openai", "anthropic").
        model: Optional model override (e.g. "llama-3.3-70b-versatile", "gemma4", "swift-12b").
        
    Returns:
        Validated JobDescription model.
    """
    cache = get_cache_manager()
    cache_key = raw_jd.content_hash

    # 1. Cache Check (Master Plan Section 5)
    if use_cache and not force_refresh:
        cached_jd = cache.get_model("jds", cache_key, JobDescription)
        if cached_jd is not None:
            logger.info(
                f"Cache HIT for JD {raw_jd.job_id} (hash: {cache_key[:12]}). Zero LLM calls made.",
                gate="JD_EXTRACTION",
            )
            return cached_jd

    logger.info(
        f"Cache MISS for JD {raw_jd.job_id} (hash: {cache_key[:12]}). Calling LLM extractor...",
        gate="JD_EXTRACTION",
    )

    user_prompt = f"""Job ID: {raw_jd.job_id}
Title Hint: {raw_jd.title or 'Unknown'}
Company Hint: {raw_jd.company or 'Unknown'}

RAW JOB DESCRIPTION TEXT:
\"\"\"
{raw_jd.raw_text}
\"\"\"

Please extract the structured job requirements JSON."""

    llm = get_llm_client(provider=provider, model=model)

    try:
        raw_json_str = llm.complete(
            system_prompt=JD_EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_mode=True,
            override_provider=provider,
            override_model=model,
        )
        cleaned_json = llm._clean_json_markdown(raw_json_str)
        parsed_dict = json.loads(cleaned_json)
    except Exception as e:
        logger.warning(
            f"LLM extraction error: {e}. Executing deterministic heuristic fallback...",
            gate="JD_EXTRACTION",
        )
        parsed_dict = _heuristic_jd_fallback(raw_jd)

    # Normalize seniority level
    sen_str = str(parsed_dict.get("seniority_level", "mid")).lower().strip()
    try:
        seniority = SeniorityLevel(sen_str)
    except ValueError:
        if "staff" in sen_str: seniority = SeniorityLevel.STAFF
        elif "lead" in sen_str: seniority = SeniorityLevel.LEAD
        elif "senior" in sen_str or "sr" in sen_str: seniority = SeniorityLevel.SENIOR
        elif "junior" in sen_str or "jr" in sen_str: seniority = SeniorityLevel.JUNIOR
        elif "entry" in sen_str or "associate" in sen_str: seniority = SeniorityLevel.ENTRY
        elif "principal" in sen_str: seniority = SeniorityLevel.PRINCIPAL
        elif "director" in sen_str or "vp" in sen_str: seniority = SeniorityLevel.EXECUTIVE
        else: seniority = SeniorityLevel.MID

    # Architectural Seniority Calibration (Title & YoE Precedence over LLM Hallucinations)
    jd_title_lower = str(parsed_dict.get("title") or raw_jd.title or "").lower().strip()
    min_exp_val = float(parsed_dict.get("min_years_experience", 2.0))
    if "intern" in jd_title_lower:
        seniority = SeniorityLevel.ENTRY
    elif any(k in jd_title_lower for k in ["associate", "entry", "graduate"]) or min_exp_val == 0.0:
        if not any(k in jd_title_lower for k in ["staff", "principal", "lead", "director", "executive"]):
            seniority = SeniorityLevel.ENTRY
    elif any(k in jd_title_lower for k in ["junior", "jr.", "jr "]):
        seniority = SeniorityLevel.JUNIOR
    elif "principal" in jd_title_lower:
        seniority = SeniorityLevel.PRINCIPAL
    elif "staff" in jd_title_lower:
        seniority = SeniorityLevel.STAFF
    elif "lead" in jd_title_lower:
        seniority = SeniorityLevel.LEAD
    elif any(k in jd_title_lower for k in ["senior", "sr.", "sr "]):
        seniority = SeniorityLevel.SENIOR

    must_haves = [str(s).strip() for s in parsed_dict.get("must_have_skills", []) if str(s).strip()]
    nice_to_haves = [str(s).strip() for s in parsed_dict.get("nice_to_have_skills", []) if str(s).strip()]
    
    # Ensure minimum skills
    if not must_haves:
        must_haves = ["Software Development", "Problem Solving", "Git"]

    # Construct validated model
    job_description = JobDescription(
        job_id=raw_jd.job_id,
        title=parsed_dict.get("title") or raw_jd.title or "Software Engineer",
        company=parsed_dict.get("company") or raw_jd.company or "Company",
        seniority_level=seniority,
        min_years_experience=float(parsed_dict.get("min_years_experience", 2.0)),
        must_have_skills=must_haves,
        nice_to_have_skills=nice_to_haves,
        education_requirement=parsed_dict.get("education_requirement") or "Bachelor's degree or equivalent experience",
        location=parsed_dict.get("location") or "Remote",
        remote_policy=parsed_dict.get("remote_policy") or "remote",
        domain_context=parsed_dict.get("domain_context") or f"{job_description_title_clean(raw_jd.title)} engineering",
        content_hash=raw_jd.content_hash,
    )

    # 2. Cache Write (Master Plan Section 5)
    cache.set("jds", cache_key, job_description)
    logger.info(
        f"Successfully extracted and cached JD {raw_jd.job_id} ({len(must_haves)} must-haves, {len(nice_to_haves)} nice-to-haves)",
        gate="JD_EXTRACTION",
    )

    return job_description


def job_description_title_clean(title: Optional[str]) -> str:
    return re.sub(r'[^a-zA-Z0-9\s]', '', title or "Software").strip()


def _heuristic_jd_fallback(raw_jd: JobDescriptionRaw) -> Dict[str, Any]:
    """Deterministic regex extraction fallback if LLM endpoint is completely unreachable."""
    text = raw_jd.raw_text.lower()
    
    # Extract years of experience
    yoe_matches = re.findall(r'(\d+)\+?\s*years', text)
    min_yoe = min([float(y) for y in yoe_matches if float(y) <= 20], default=2.0)
    
    # Determine seniority
    if any(k in text for k in ["staff engineer", "staff software"]):
        sen = "staff"
    elif any(k in text for k in ["lead engineer", "lead software", "principal"]):
        sen = "lead"
    elif any(k in text for k in ["senior software", "senior engineer", "sr."]):
        sen = "senior"
    elif any(k in text for k in ["associate", "entry level", "entry-level", "intern"]) or min_yoe == 0.0:
        sen = "entry"
    elif any(k in text for k in ["junior", "jr."]):
        sen = "junior"
    else:
        sen = "mid"

    # Known common SWE skills regex
    common_skills = [
        "python", "java", "golang", "go", "javascript", "typescript", "react", "react.js",
        "node.js", "nodejs", "c++", "c#", ".net", "rust", "sql", "postgresql", "mysql",
        "mongodb", "redis", "kafka", "docker", "kubernetes", "aws", "gcp", "azure",
        "terraform", "ci/cd", "rest api", "microservices", "git", "linux", "agile"
    ]
    found_skills = [s.capitalize() for s in common_skills if re.search(r'\b' + re.escape(s) + r'\b', text)]
    
    return {
        "title": raw_jd.title or "Software Engineer",
        "company": raw_jd.company or "Company",
        "seniority_level": sen,
        "min_years_experience": min_yoe,
        "must_have_skills": found_skills[:8] or ["Python", "SQL", "Git"],
        "nice_to_have_skills": found_skills[8:14],
        "education_requirement": "Bachelor's degree in Computer Science or related field",
        "location": "Remote",
        "remote_policy": "remote" if "remote" in text else "onsite",
        "domain_context": "Software engineering systems development",
    }
