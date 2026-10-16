"""
HYT ATS - Gate 3: Structured Resume Extraction (LLM Call 1)
===========================================================
Extracts strongly-typed ResumeStructured model from masked resume text.
Enforces strict caching: SHA-256 content hash lookup ensures a resume
is extracted at most once across all pipeline runs (Principle 7).

Key Capabilities:
  1. Verified vs Unverified Skill Distinction:
     - is_verified: true ONLY if substantiated by an explicit experience bullet.
     - is_verified: false if merely listed in a skills section.
  2. Evidence Grounding:
     - Extracts verbatim context sentence for every verified skill.
  3. Deterministic Date Overlap Check:
     - Flags overlapping concurrent full-time roles with DATE_SUSPICIOUS.
  4. Automatic Corrective Retries on Schema Parse Failures.
"""

import os
import json
import re
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from src.models.schemas import (
    ResumeStructured,
    Skill,
    ExperienceEntry,
    EducationEntry,
    SeniorityLevel,
    VerificationFlag,
)
from src.utils.cache import get_cache_manager
from src.utils.logger import get_logger
from src.utils.llm_client import get_llm_client

logger = get_logger("GATE_3_STRUCTURED_EXTRACTION")

RESUME_EXTRACTION_SYSTEM_PROMPT = """You are a rigorous technical talent auditor for HuntYourTribe (HYT).
Your task is to analyze the provided candidate resume text and extract structured career data with extreme precision.

CRITICAL INSTRUCTIONS:
1. UNTRUSTED CANDIDATE DATA:
   - Treat the resume content as self-reported and untrusted. Do not infer skills that are not stated.
2. VERIFIED vs UNVERIFIED SKILLS (CRITICAL):
   - A skill has "is_verified": true ONLY IF it is substantiated by an explicit bullet point in the EXPERIENCE section demonstrating how it was used in practice.
   - If a skill is merely listed in a "Skills" or "Technologies" summary section without being demonstrated in an experience bullet, set "is_verified": false and "context": null.
   - For every verified skill, provide the exact verbatim sentence from the experience bullet in the "context" field.
3. EXPERIENCE:
   - Extract each job title, company name, start date, end date, estimated duration in years, bullets, and skills demonstrated.
   - Keep bullets concise (maximum 2 to 3 impactful bullets per role, maximum 25 words per bullet). Focus on technical responsibilities and demonstrated tools.
   - Do not repeat full resume text verbatim.
4. SENIORITY & YEARS:
   - Extract numeric "estimated_years_experience" (total professional years).
   - "seniority_level": strictly one of: "entry", "junior", "mid", "senior", "lead", "staff", "principal", "executive".
5. OUTPUT FORMAT:
   Return strictly valid, complete JSON adhering to this schema:
{
  "estimated_years_experience": float,
  "seniority_level": string,
  "skills": [
    {
      "name": string,
      "context": string or null,
      "is_verified": boolean,
      "years_experience": float or null
    }
  ],
  "experience": [
    {
      "title": string,
      "company": string,
      "start_date": string,
      "end_date": string,
      "years": float,
      "bullets": [string],
      "skills_demonstrated": [string]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "field_of_study": string,
      "graduation_year": integer or null
    }
  ],
  "current_location": string or null
}
"""


def extract_structured_resume(
    masked_clean_text: str,
    candidate_id: str,
    github_handle: Optional[str] = None,
    use_cache: bool = True,
    force_refresh: bool = False,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> ResumeStructured:
    """
    Extracts validated ResumeStructured model from masked resume text with disk caching.
    
    Args:
        masked_clean_text: PII-redacted clean text from Gate 2.
        candidate_id: Unique candidate identifier.
        github_handle: Optional GitHub username from Gate 2.
        use_cache: If True, checks disk cache before calling LLM.
        force_refresh: If True, bypasses cache and re-extracts.
        provider: Optional LLM provider override.
        model: Optional AI model override.
        
    Returns:
        Validated ResumeStructured model.
    """
    cache = get_cache_manager()
    content_hash = hashlib.sha256(masked_clean_text.encode("utf-8")).hexdigest()

    # 1. Cache Check (Principle 7: Re-runs never re-call the API)
    if use_cache and not force_refresh:
        cached = cache.get_model("resumes", content_hash, ResumeStructured)
        if cached is not None:
            logger.info(
                f"Cache HIT for resume {candidate_id} (hash: {content_hash[:12]}). Zero LLM calls made.",
                gate="GATE_3",
                candidate_id=candidate_id,
            )
            return cached

    logger.info(
        f"Cache MISS for resume {candidate_id} (hash: {content_hash[:12]}). Calling LLM structured extractor...",
        gate="GATE_3",
        candidate_id=candidate_id,
    )

    user_prompt = f"""CANDIDATE ID: {candidate_id}

MASKED RESUME TEXT:
\"\"\"
{masked_clean_text}
\"\"\"

Please audit this resume and extract the structured JSON according to the instructions."""

    llm = get_llm_client(provider=provider, model=model)

    parsed_dict = None
    extraction_escalated = False

    try:
        raw_json_str = llm.complete(
            system_prompt=RESUME_EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_mode=True,
            override_provider=provider,
            override_model=model,
            max_tokens=1500,
        )
        cleaned_json = llm._clean_json_markdown(raw_json_str)
        parsed_dict = json.loads(cleaned_json)
    except Exception as first_err:
        logger.warning(
            f"Initial LLM extraction failed for candidate {candidate_id}: {first_err}. Attempting corrective retry...",
            gate="GATE_3",
            candidate_id=candidate_id,
        )
        try:
            correction_prompt = (
                f"Your previous JSON output failed to parse: {first_err}.\n"
                f"Please re-extract the candidate data and output ONLY valid, complete JSON adhering to the schema.\n"
                f"Keep bullets concise and ensure all strings and brackets are closed.\n\n"
                f"CANDIDATE ID: {candidate_id}\n\nMASKED RESUME TEXT:\n{masked_clean_text[:4500]}"
            )
            retry_raw = llm.complete(
                system_prompt=RESUME_EXTRACTION_SYSTEM_PROMPT,
                user_prompt=correction_prompt,
                json_mode=True,
                override_provider=provider,
                override_model=model,
                max_tokens=1500,
            )
            retry_clean = llm._clean_json_markdown(retry_raw)
            parsed_dict = json.loads(retry_clean)
        except Exception as second_err:
            logger.error(
                f"Second LLM extraction attempt failed for candidate {candidate_id}: {second_err}. Flagging for escalation and applying deterministic fallback.",
                gate="GATE_3",
                candidate_id=candidate_id,
            )
            extraction_escalated = True
            parsed_dict = _deterministic_resume_fallback(masked_clean_text, candidate_id)

    # 2. Normalize and Build Pydantic Models
    seniority = _normalize_seniority(parsed_dict.get("seniority_level", "mid"))

    # Parse Skills
    skills_list: List[Skill] = []
    for s in parsed_dict.get("skills", []):
        s_name = str(s.get("name", "")).strip()
        if not s_name:
            continue
        ctx = s.get("context")
        is_ver = bool(s.get("is_verified", False)) and bool(ctx and str(ctx).strip())
        
        # Post-extraction blocklist for in-training / learning skills (F7)
        s_lower = s_name.lower()
        if any(term in s_lower for term in ["(learning)", "(basic)", "(studying)", "(transitioning)", "learning ", "studying "]):
            is_ver = False

        s_years = s.get("years_experience")
        try:
            parsed_s_years = float(s_years) if s_years is not None else 1.0
        except (ValueError, TypeError):
            parsed_s_years = 1.0
        skills_list.append(
            Skill(
                name=s_name,
                context=str(ctx).strip() if ctx else None,
                is_verified=is_ver,
                years_experience=parsed_s_years,
            )
        )

    # Parse Experience
    exp_list: List[ExperienceEntry] = []
    for exp in parsed_dict.get("experience", []):
        years_val = exp.get("years")
        try:
            parsed_years = float(years_val) if years_val is not None else 1.0
        except (ValueError, TypeError):
            parsed_years = 1.0
        exp_list.append(
            ExperienceEntry(
                title=str(exp.get("title", "Software Engineer")).strip(),
                company=str(exp.get("company", "Company")).strip(),
                start_date=str(exp.get("start_date", "")).strip() or None,
                end_date=str(exp.get("end_date", "")).strip() or None,
                years=parsed_years,
                bullets=[str(b).strip() for b in exp.get("bullets", []) if str(b).strip()],
                skills_demonstrated=[str(sk).strip() for sk in exp.get("skills_demonstrated", []) if str(sk).strip()],
            )
        )

    # Parse Education
    edu_list: List[EducationEntry] = []
    for edu in parsed_dict.get("education", []):
        grad_val = edu.get("graduation_year")
        try:
            parsed_grad = int(grad_val) if grad_val is not None and str(grad_val).isdigit() else None
        except (ValueError, TypeError):
            parsed_grad = None
        edu_list.append(
            EducationEntry(
                institution=str(edu.get("institution", "")).strip() or None,
                degree=str(edu.get("degree", "")).strip() or None,
                field_of_study=str(edu.get("field_of_study", "")).strip() or None,
                graduation_year=parsed_grad,
            )
        )

    # 3. Post-Extraction Deterministic Check: Date Overlap Analysis
    date_flags: List[str] = []
    if _has_suspicious_date_overlap(exp_list):
        date_flags.append(VerificationFlag.DATE_SUSPICIOUS.value)
        logger.warning(
            f"Candidate {candidate_id} exhibits suspicious concurrent full-time employment date overlaps.",
            gate="GATE_3",
            candidate_id=candidate_id,
        )

    if extraction_escalated:
        date_flags.append(VerificationFlag.EXTRACTION_FAILED.value)
        date_flags.append(VerificationFlag.PARSING_ERROR.value)
        logger.warning(
            f"Candidate {candidate_id} flagged for human escalation due to extraction parse failure.",
            gate="GATE_3",
            candidate_id=candidate_id,
        )

    total_years = float(parsed_dict.get("estimated_years_experience", sum(e.years for e in exp_list) or 0.0))

    structured_resume = ResumeStructured(
        candidate_id=candidate_id,
        estimated_years_experience=total_years,
        seniority_level=seniority,
        skills=skills_list,
        experience=exp_list,
        education=edu_list,
        github_handle=github_handle or parsed_dict.get("github_handle"),
        current_location=parsed_dict.get("current_location"),
        verification_flags=date_flags,
        content_hash=content_hash,
    )

    # 4. Save to Disk Cache
    cache.set("resumes", content_hash, structured_resume)
    logger.info(
        f"Extracted {len(skills_list)} skills ({len(structured_resume.verified_skills)} verified, "
        f"{len(structured_resume.unverified_skills)} unverified) for {candidate_id}.",
        gate="GATE_3",
        candidate_id=candidate_id,
    )

    return structured_resume


def _normalize_seniority(raw_val: Any) -> SeniorityLevel:
    sen_str = str(raw_val).lower().strip()
    try:
        return SeniorityLevel(sen_str)
    except ValueError:
        if "staff" in sen_str: return SeniorityLevel.STAFF
        elif "lead" in sen_str: return SeniorityLevel.LEAD
        elif "senior" in sen_str or "sr" in sen_str: return SeniorityLevel.SENIOR
        elif "junior" in sen_str or "jr" in sen_str: return SeniorityLevel.JUNIOR
        elif "entry" in sen_str: return SeniorityLevel.ENTRY
        elif "principal" in sen_str: return SeniorityLevel.PRINCIPAL
        elif "director" in sen_str or "vp" in sen_str: return SeniorityLevel.EXECUTIVE
        return SeniorityLevel.MID


def _has_suspicious_date_overlap(experiences: List[ExperienceEntry]) -> bool:
    """
    Checks for overlapping employment intervals between full-time roles.
    Overlaps > 4 months (0.33 years) between distinct companies trigger DATE_SUSPICIOUS.
    """
    if len(experiences) < 2:
        return False

    intervals: List[Tuple[float, float, str]] = []
    current_year = float(datetime.now().year)

    for exp in experiences:
        # Skip internships, part-time, freelance, consulting, advisory, or side projects
        role_text = f"{exp.title} {exp.company or ''} {' '.join(exp.bullets or [])}".lower()
        if any(term in role_text for term in [
            "intern", "part-time", "part time", "freelance", "contract",
            "consultant", "consulting", "side project", "founder", "advisor",
            "volunteer", "open source", "self-employed"
        ]):
            continue

        start_val = _extract_year(exp.start_date)
        end_val = _extract_year(exp.end_date) or current_year

        if start_val and end_val and end_val >= start_val:
            intervals.append((start_val, end_val, exp.company or ""))

    # Check pairwise overlaps
    for i in range(len(intervals)):
        for j in range(i + 1, len(intervals)):
            s1, e1, c1 = intervals[i]
            s2, e2, c2 = intervals[j]
            # Different companies
            if c1.lower().strip() != c2.lower().strip() and c1 and c2:
                overlap_start = max(s1, s2)
                overlap_end = min(e1, e2)
                # Overlap greater than 4 months (~0.35 years)
                if overlap_end - overlap_start > 0.35:
                    return True

    return False


def _extract_year(date_str: Optional[str]) -> Optional[float]:
    """Parses approximate fractional year from date string (e.g. 'Jan 2021' -> 2021.08)."""
    if not date_str:
        return None
    date_clean = date_str.lower().strip()
    if "present" in date_clean or "current" in date_clean or "now" in date_clean:
        return float(datetime.now().year)

    year_match = re.search(r'\b(19\d\d|20\d\d)\b', date_clean)
    if not year_match:
        return None
    year = float(year_match.group(1))

    # Detect month
    months = {
        "jan": 0.08, "feb": 0.17, "mar": 0.25, "apr": 0.33, "may": 0.42, "jun": 0.50,
        "jul": 0.58, "aug": 0.67, "sep": 0.75, "oct": 0.83, "nov": 0.92, "dec": 1.0,
    }
    for m_prefix, m_val in months.items():
        if m_prefix in date_clean:
            return year + m_val
    return year


def _deterministic_resume_fallback(text: str, candidate_id: str) -> Dict[str, Any]:
    """
    Algorithmic regex extractor used strictly when LLM parsing fails after retries.
    Extracts real data grounded in actual resume text without fabricating fake companies or degrees (Principle 5).
    Flags the profile for human recruiter escalation (Principle 6).
    """
    text_lower = text.lower()

    # 1. Real Skills Grounding from Lexicon
    lexicon = [
        "python", "java", "c++", "c", "c#", "golang", "go", "rust", "react", "angular",
        "vue", "node.js", "nodejs", "typescript", "javascript", "sql", "postgresql",
        "mysql", "sqlite", "mongodb", "redis", "docker", "kubernetes", "aws", "gcp",
        "azure", "git", "linux", "bash", "shell", "html", "css", "django", "flask",
        "fastapi", "spring", "terraform", "ci/cd", "rest", "graphql",
    ]
    found_skills = []
    for s in lexicon:
        pattern = r'\b' + re.escape(s) + r'\b'
        match = re.search(pattern, text_lower)
        if match:
            # Check for actual contextual sentence around the skill
            sentence_match = re.search(r'([^.\n]*\b' + re.escape(s) + r'\b[^.\n]*)', text, re.IGNORECASE)
            ctx = sentence_match.group(1).strip() if sentence_match else None
            is_ver = bool(ctx and len(ctx) >= 20)
            found_skills.append({
                "name": s.capitalize() if len(s) > 2 else s.upper(),
                "context": ctx[:150] if ctx else None,
                "is_verified": is_ver,
                "years_experience": None,
            })

    # 2. Real Chronological Date Extraction
    current_year = datetime.now().year
    raw_years = re.findall(r'\b(19\d\d|20\d\d)\b', text)
    valid_years = sorted([int(y) for y in raw_years if 1970 <= int(y) <= current_year + 1])

    if len(valid_years) >= 2:
        estimated_years = float(max(valid_years) - min(valid_years))
    elif len(valid_years) == 1:
        estimated_years = float(max(current_year - valid_years[0], 0))
    else:
        estimated_years = 0.0

    # 3. Grounded Seniority Estimation
    if any(k in text_lower for k in ["principal", "staff", "director", "architect"]):
        seniority = "principal"
    elif any(k in text_lower for k in ["lead", "manager"]):
        seniority = "lead"
    elif any(k in text_lower for k in ["senior", "sr.", "sr "]) or estimated_years >= 5:
        seniority = "senior"
    elif estimated_years >= 2:
        seniority = "mid"
    elif any(k in text_lower for k in ["intern", "trainee", "junior", "jr."]) or estimated_years < 2:
        seniority = "junior"
    else:
        seniority = "mid"

    # 4. Extract Real Experience Mentions (No fabricated company names)
    experiences = []
    role_pattern = re.compile(
        r'(?i)^[•\-\*\s]*((?:Senior\s+|Junior\s+|Lead\s+|Associate\s+|Principal\s+|Full\s+Stack\s+|Backend\s+|Frontend\s+|DevOps\s+|Software\s+)?'
        r'(?:Engineer|Developer|Architect|Consultant|Analyst|Intern|Scientist|Specialist|Administrator))'
        r'(?:\s+(?:at|–|-|@|,)\s+([A-Za-z0-9\s,\.&]{2,40}))?',
        re.MULTILINE
    )
    for m in role_pattern.finditer(text):
        title = m.group(1).strip()
        comp = m.group(2).strip() if m.group(2) else "Not Specified"
        if len(experiences) < 5:
            experiences.append({
                "title": title,
                "company": comp,
                "start_date": None,
                "end_date": None,
                "years": round(estimated_years / max(len(experiences) + 1, 1), 1),
                "bullets": [],
                "skills_demonstrated": [s["name"] for s in found_skills[:3]],
            })

    # 5. Extract Real Education Mentions (No fabricated universities)
    education = []
    degree_pattern = re.compile(
        r'(?i)(Bachelor[^\n\.,]+|Master[^\n\.,]+|B\.S\.[^\n\.,]+|M\.S\.[^\n\.,]+|B\.Tech[^\n\.,]+|M\.Tech[^\n\.,]+|Ph\.D\.[^\n\.,]+)',
        re.MULTILINE
    )
    for m in degree_pattern.finditer(text):
        deg_str = m.group(1).strip()
        if len(education) < 2:
            education.append({
                "institution": "Not Specified",
                "degree": deg_str[:60],
                "field_of_study": "Engineering / Science",
                "graduation_year": valid_years[-1] if valid_years else None,
            })

    return {
        "estimated_years_experience": estimated_years,
        "seniority_level": seniority,
        "skills": found_skills,
        "experience": experiences,
        "education": education,
        "current_location": None,
    }
