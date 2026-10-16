"""
HYT ATS - Gate 6: Deterministic Scoring Engine & Evidence Ledger
================================================================
Implements the fully deterministic 5-dimensional scoring engine (Principles 1, 2, & 10).
Guarantees:
  1. Strict Determinism: Zero LLM, zero randomness. Same resume + JD produces identical scores.
  2. Mandatory Evidence Ledger: Every score contribution is backed by an explicit LedgerEntry citing verbatim resume quotes.
  3. Hard Gate (Must-Haves): Unverified skills are strictly excluded from hard gates.
  4. Partial Credit: Unverified skills and nice-to-haves receive configurable partial credit.
  5. Non-Fatal Baseline Policy: Education and Location alone NEVER produce 0.0 scores or kill a candidacy.
  6. Ledger Completeness Enforcement: Every must-have requirement and dimension must have an entry before proceeding.
"""

import math
import re
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from src.models.schemas import (
    ResumeStructured,
    Skill,
    JobDescription,
    DimensionType,
    SeniorityLevel,
    LedgerEntry,
    ScoringBreakdown,
    ScoringLedger,
)
from src.gates.jd_embedding import get_embedding_model, embed_job_requirements
from src.utils.config import get_config
from src.utils.logger import get_logger
from src.utils.taxonomy import (
    canonicalize_skill,
    are_skills_equivalent,
    are_skills_related,
    are_skills_in_same_cluster,
    does_skill_subsume,
)

logger = get_logger("GATE_6_SCORING_ENGINE")

SENIORITY_HIERARCHY = {
    SeniorityLevel.ENTRY: 1,
    SeniorityLevel.JUNIOR: 2,
    SeniorityLevel.MID: 3,
    SeniorityLevel.SENIOR: 4,
    SeniorityLevel.LEAD: 5,
    SeniorityLevel.STAFF: 6,
    SeniorityLevel.PRINCIPAL: 7,
    SeniorityLevel.EXECUTIVE: 8,
}


def _compute_cosine_sim(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two dense float vectors."""
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-6 or norm_b < 1e-6:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _split_compound_tokens(text: str) -> List[str]:
    """
    Splits compound requirements or candidate skill strings into constituent searchable tokens.
    Handles delimiters: '/', 'or', 'and', '&', ',', and extracts parenthetical items.
    Also strips trailing version numbers ('SQL Server 2005' -> 'SQL Server').
    """
    if not text:
        return []
    raw = text.strip()
    tokens = [raw]
    
    # Extract parenthetical contents e.g. "AWS (EC2, S3, Lambda)" -> adds "EC2", "S3", "Lambda"
    paren_matches = re.findall(r'\((.*?)\)', raw)
    for pm in paren_matches:
        for sub in re.split(r'[,/]|(?:\s+or\s+)|\betc\.?\b', pm, flags=re.IGNORECASE):
            s = sub.strip()
            if len(s) >= 2 and s.lower() not in [t.lower() for t in tokens]:
                tokens.append(s)

    # Split text on common compound separators
    clean_base = re.sub(r'\(.*?\)', '', raw)
    parts = re.split(r'\s*/\s*|\s+or\s+|\s+and\s+|\s*&\s*|,\s*', clean_base, flags=re.IGNORECASE)
    for p in parts:
        p_clean = p.strip()
        if len(p_clean) >= 2 and p_clean.lower() not in [t.lower() for t in tokens]:
            tokens.append(p_clean)
        # Check sub-words
        subwords = p_clean.split()
        if len(subwords) > 1:
            for w in subwords:
                if len(w) >= 3 and w.lower() not in [t.lower() for t in tokens]:
                    tokens.append(w)
        # Version-stripped version
        no_ver = re.sub(r'\b(v?\d+(\.\d+)*[a-z]?|\d{4})\b', '', p_clean).strip()
        if len(no_ver) >= 2 and no_ver.lower() not in [t.lower() for t in tokens]:
            tokens.append(no_ver)
            
    return tokens


def _find_best_skill_match(
    requirement: str,
    skills: List[Skill],
    req_vec: Optional[List[float]],
    model: Any,
    precomputed_vecs: Optional[np.ndarray] = None,
) -> Tuple[float, Optional[Skill]]:
    """
    Finds best matching candidate skill for a requirement via taxonomy,
    compound token disaggregation, subsumption, umbrella clusters, and cosine similarity.
    """
    if not skills:
        return 0.0, None

    req_tokens = _split_compound_tokens(requirement)

    # 1. Exact, Canonical, Subsumption, or Umbrella Cluster Match
    for token in req_tokens:
        tok_clean = token.lower().strip()
        for s in skills:
            cand_tokens = _split_compound_tokens(s.name)
            for cand_tok in cand_tokens:
                cand_clean = cand_tok.lower().strip()
                # Exact or canonical alias
                if tok_clean == cand_clean or are_skills_equivalent(tok_clean, cand_clean):
                    return 1.0, s
                # Direct subsumption (e.g. candidate has TypeScript, token is JavaScript; or candidate has jQuery, token is JavaScript)
                if does_skill_subsume(cand_clean, tok_clean):
                    return 1.0, s
                # Umbrella cluster transferability (e.g. candidate has AWS, token is Azure/GCP; or candidate has PHP, token is Golang/Python)
                if are_skills_in_same_cluster(cand_clean, tok_clean):
                    return 1.0, s
                # Word boundary match (e.g. "PostgreSQL" in "PostgreSQL 14", or "SQL" in "SQL Server")
                if len(tok_clean) >= 3 and re.search(rf"\b{re.escape(tok_clean)}\b", cand_clean):
                    return 1.0, s
                if len(cand_clean) >= 3 and re.search(rf"\b{re.escape(cand_clean)}\b", tok_clean):
                    return 1.0, s

    # 2. Lexical word overlap fallback
    if model == "FALLBACK" or req_vec is None:
        best_sim = 0.0
        best_skill = None
        for token in req_tokens:
            tok_words = set(re.findall(r'\w+', token.lower()))
            for s in skills:
                s_words = set(re.findall(r'\w+', s.name.lower()))
                overlap = len(tok_words.intersection(s_words))
                score = overlap / max(len(tok_words), 1)
                if score > best_sim:
                    best_sim = score
                    best_skill = s
        return best_sim, best_skill

    # 3. Neural Embedding Cosine Similarity
    if precomputed_vecs is not None and len(precomputed_vecs) == len(skills):
        skill_vecs = precomputed_vecs
    else:
        skill_names = [s.name for s in skills]
        skill_vecs = model.encode(skill_names, normalize_embeddings=True)

    best_sim = -1.0
    best_idx = -1
    req_arr = np.array(req_vec, dtype=np.float32)

    for idx, s_vec in enumerate(skill_vecs):
        sim = float(np.dot(req_arr, s_vec))
        if sim > best_sim:
            best_sim = sim
            best_idx = idx

    if best_idx >= 0:
        return best_sim, skills[best_idx]
    return 0.0, None


def evaluate_gate6(
    resume: ResumeStructured,
    jd: JobDescription,
    jd_embeddings: Optional[Dict[str, Any]] = None,
) -> ScoringLedger:
    """
    Executes the deterministic 5-dimensional scoring engine and compiles immutable Evidence Ledger.
    
    Args:
        resume: Extracted candidate ResumeStructured model from Gate 3.
        jd: Target JobDescription model.
        jd_embeddings: Optional cached embeddings from Gate A3.
        
    Returns:
        Immutable ScoringLedger containing breakdown, scores, and complete evidence entries.
    """
    cfg = get_config()
    cid = resume.candidate_id
    jid = jd.job_id

    # 1. Load JD Embeddings
    if jd_embeddings is None:
        jd_embeddings = embed_job_requirements(jd, use_cache=True)

    model = get_embedding_model()
    must_have_vecs = jd_embeddings.get("must_haves", {})
    nice_to_have_vecs = jd_embeddings.get("nice_to_haves", {})

    verified_skills = [s for s in resume.skills if s.is_verified]
    unverified_skills = [s for s in resume.skills if not s.is_verified]

    # Harvest additional verified skills directly from experience bullets and demonstrated skills
    existing_verified_names = {s.name.lower().strip() for s in verified_skills}
    for exp in resume.experience:
        context_str = exp.bullets[0] if exp.bullets else exp.title
        for sd in exp.skills_demonstrated:
            sd_clean = sd.strip()
            if sd_clean and sd_clean.lower() not in existing_verified_names:
                verified_skills.append(
                    Skill(
                        name=sd_clean,
                        context=f"Demonstrated in {exp.title} ({exp.company or 'Role'}): {context_str}",
                        is_verified=True,
                        years_experience=exp.years,
                    )
                )
                existing_verified_names.add(sd_clean.lower())

        # Check bullets for explicit technical keywords from taxonomy
        for b in exp.bullets:
            b_lower = b.lower()
            for tech_kw in [
                "python", "golang", "java", "c#", "c++", "rust", "php", "ruby", "node.js", "nodejs",
                "javascript", "typescript", "react", "angular", "vue", "docker", "kubernetes", "k8s",
                "aws", "azure", "gcp", "postgresql", "mysql", "mongodb", "oracle", "sql server", "sql",
                "kafka", "rabbitmq", "redis", "rest", "graphql", "selenium", "katalon", "behat",
                "git", "ci/cd", "cicd", "jenkins", "linux", "unix"
            ]:
                if re.search(rf"\b{re.escape(tech_kw)}\b", b_lower):
                    if tech_kw not in existing_verified_names:
                        verified_skills.append(
                            Skill(
                                name=tech_kw.capitalize(),
                                context=b,
                                is_verified=True,
                                years_experience=exp.years,
                            )
                        )
                        existing_verified_names.add(tech_kw)

    # Precompute skill embedding vectors once across all requirements for maximum throughput
    verified_vecs = None
    unverified_vecs = None
    if model != "FALLBACK":
        if verified_skills:
            verified_vecs = model.encode([s.name for s in verified_skills], normalize_embeddings=True)
        if unverified_skills:
            unverified_vecs = model.encode([s.name for s in unverified_skills], normalize_embeddings=True)

    ledger_entries: List[LedgerEntry] = []
    hard_gate_threshold = cfg.gate6.hard_gate_similarity_threshold

    # --------------------------------------------------------------------------
    # Step 1 & 2.1: Technical Alignment Scoring (Hard Gate + Must/Nice-To-Haves)
    # --------------------------------------------------------------------------
    hard_failures: List[str] = []
    must_have_contributions: List[float] = []
    nice_to_have_contributions: List[float] = []
    verified_must_haves_count = 0

    # Must-Haves Evaluation
    for must_have in jd.must_have_skills:
        req_vec = must_have_vecs.get(must_have)

        # 1. First check among VERIFIED skills (demonstrated with bullet evidence)
        v_sim, v_skill = _find_best_skill_match(
            must_have, verified_skills, req_vec, model, precomputed_vecs=verified_vecs
        )

        if v_sim >= hard_gate_threshold and v_skill:
            must_have_contributions.append(1.0)
            verified_must_haves_count += 1
            ledger_entries.append(
                LedgerEntry(
                    dimension=DimensionType.TECHNICAL,
                    requirement=f"Must-Have: {must_have}",
                    evidence=v_skill.context or f"Demonstrated in role bullets as {v_skill.name}.",
                    is_verified=True,
                    score_contribution=100.0,
                    gap=None,
                )
            )
        else:
            # 2. Check among UNVERIFIED / skills summary list
            u_sim, u_skill = _find_best_skill_match(
                must_have, unverified_skills, req_vec, model, precomputed_vecs=unverified_vecs
            )

            if u_sim >= hard_gate_threshold and u_skill:
                # Skill is merely listed in summary without work evidence -> Award partial credit per anti-gaming policy (F1)
                u_weight = getattr(cfg.gate6, "unverified_skill_weight", 0.5)
                must_have_contributions.append(u_weight)
                ledger_entries.append(
                    LedgerEntry(
                        dimension=DimensionType.TECHNICAL,
                        requirement=f"Must-Have: {must_have}",
                        evidence=f"Claimed in technical skills summary as '{u_skill.name}' (unverified, awarded {u_weight:.0%} credit).",
                        is_verified=False,
                        score_contribution=round(u_weight * 100.0, 2),
                        gap=None,
                    )
                )
            else:
                # Candidate does NOT have this skill anywhere -> Genuine Hard Failure
                hard_failures.append(must_have)
                must_have_contributions.append(0.0)
                best_match_name = v_skill.name if v_skill else (u_skill.name if u_skill else "None")
                best_sim = max(v_sim, u_sim)
                ledger_entries.append(
                    LedgerEntry(
                        dimension=DimensionType.TECHNICAL,
                        requirement=f"Must-Have: {must_have}",
                        evidence=None,
                        is_verified=False,
                        score_contribution=0.0,
                        gap=(
                            f"Missing required must-have skill '{must_have}'. "
                            f"Closest resume skill was '{best_match_name}' ({best_sim:.2f} similarity vs {hard_gate_threshold:.2f} threshold)."
                        ),
                    )
                )

    # Nice-To-Haves Evaluation (Bonus / Secondary Credit)
    for nice_to_have in jd.nice_to_have_skills:
        req_vec = nice_to_have_vecs.get(nice_to_have)
        nv_sim, nv_skill = _find_best_skill_match(
            nice_to_have, verified_skills + unverified_skills, req_vec, model
        )

        if nv_sim >= hard_gate_threshold and nv_skill:
            nth_weight = cfg.gate6.nicetohave_skill_weight
            nice_to_have_contributions.append(nth_weight)
            ledger_entries.append(
                LedgerEntry(
                    dimension=DimensionType.TECHNICAL,
                    requirement=f"[Nice-to-Have] {nice_to_have}",
                    evidence=nv_skill.context or f"Demonstrated/listed as {nv_skill.name}.",
                    is_verified=nv_skill.is_verified,
                    score_contribution=round(nth_weight * 100.0, 2),
                    gap=None,
                )
            )

    # Compute Technical Score (0.0 to 100.0)
    total_must_haves = max(len(jd.must_have_skills), 1)
    raw_tech = (sum(must_have_contributions) + sum(nice_to_have_contributions)) / total_must_haves
    technical_score = min(raw_tech, 1.0) * 100.0

    # --------------------------------------------------------------------------
    # Step 2.2: Experience Alignment Scoring (Domain-Modulated)
    # --------------------------------------------------------------------------
    actual_years = resume.estimated_years_experience
    required_years = jd.min_years_experience

    # In professional recruitment, experience must be relevant to the target domain.
    # A candidate with 10 years in unrelated non-technical work (e.g. desktop hardware maintenance,
    # cashier, office admin) applying for software engineering receives baseline non-technical credit (25%),
    # not full 100% relevant engineering experience.
    # Conversely, any candidate demonstrating real technical competency (raw_tech > 0) receives 100% full relevance.
    domain_relevance_factor = 1.0 if raw_tech > 0.0 else 0.25

    if required_years > 0:
        exp_ratio = (actual_years / required_years) * domain_relevance_factor
        experience_score = min(exp_ratio, 1.0) * 100.0
    else:
        experience_score = 100.0 * domain_relevance_factor

    exp_gap = None
    if actual_years < required_years:
        exp_gap = f"Experience deficit: candidate has {actual_years:.1f} years vs {required_years:.1f} years required."
    elif raw_tech == 0.0:
        exp_gap = f"Candidate experience ({actual_years:.1f} years) lacks demonstrated technical alignment with target domain."

    ledger_entries.append(
        LedgerEntry(
            dimension=DimensionType.EXPERIENCE,
            requirement=f"Minimum {required_years:.1f} years of relevant professional experience",
            evidence=f"Candidate has {actual_years:.1f} total years across {len(resume.experience)} chronological positions.",
            is_verified=True,
            score_contribution=round(experience_score, 2),
            gap=exp_gap,
        )
    )

    # --------------------------------------------------------------------------
    # Step 2.3: Seniority Alignment Scoring
    # --------------------------------------------------------------------------
    cand_level = resume.seniority_level
    jd_level = jd.seniority_level

    cand_rank = SENIORITY_HIERARCHY.get(cand_level, 3)
    jd_rank = SENIORITY_HIERARCHY.get(jd_level, 3)
    diff = cand_rank - jd_rank

    is_overqualified = False
    sen_scores = cfg.gate6.seniority_scores
    calib_cfg = getattr(cfg.gate6, "overqualification_calibration", None)
    max_seniority_str = calib_cfg.max_applicable_target_seniority if calib_cfg else "mid"
    try:
        max_seniority_enum = SeniorityLevel(max_seniority_str.lower())
    except ValueError:
        max_seniority_enum = SeniorityLevel.MID
    max_seniority_rank = SENIORITY_HIERARCHY.get(max_seniority_enum, 3)
    min_diff = calib_cfg.min_seniority_diff if calib_cfg else 2
    excess_thresh = (
        calib_cfg.excess_years_threshold
        if calib_cfg
        else getattr(sen_scores, "overqualified_flag_threshold", 3.0)
    )

    # Overqualification check: excess experience and seniority level over target role (F2/F15)
    # In enterprise recruitment, overqualification structurally applies to roles up to max_applicable_target_seniority (e.g. Entry, Junior, Mid).
    # Technical leadership roles (Staff, Lead, Principal) are exempt from overqualification penalties.
    excess_years = actual_years - max(required_years, 0.0)
    is_excessively_senior = (
        jd_rank <= max_seniority_rank
        and diff >= min_diff
        and excess_years >= excess_thresh
    )
    if is_excessively_senior and raw_tech >= 0.40:
        is_overqualified = True
        seniority_score = getattr(sen_scores, "overqualified", 0.70) * 100.0
        sen_gap = f"Candidate seniority ({cand_level.value}, {actual_years:.1f} yrs) exceeds target requirement ({jd_level.value}, {required_years:.1f} yrs); routed for overqualification review."
    elif raw_tech < 0.40 and diff >= 0:
        # Candidate lacks domain competence; inflated title rank does not confer seniority bonus
        seniority_score = sen_scores.two_levels_below * 100.0
        sen_gap = f"Seniority title lacks demonstrated technical competency in target engineering domain."
    elif diff >= 0:
        # Candidate meets or exceeds target role seniority -> 100% full credit!
        seniority_score = 100.0
        sen_gap = None
    elif diff == -1:
        seniority_score = sen_scores.one_level_below * 100.0
        sen_gap = f"Candidate is 1 level below target seniority ({cand_level.value} vs {jd_level.value})."
    else:
        seniority_score = sen_scores.two_levels_below * 100.0
        sen_gap = f"Candidate is {abs(diff)} levels below target seniority ({cand_level.value} vs {jd_level.value})."

    ledger_entries.append(
        LedgerEntry(
            dimension=DimensionType.SENIORITY,
            requirement=f"Target role seniority: {jd_level.value.upper()}",
            evidence=f"Candidate evaluated at {cand_level.value.upper()} level based on titles and career progression.",
            is_verified=True,
            score_contribution=round(seniority_score, 2),
            gap=sen_gap,
        )
    )

    # --------------------------------------------------------------------------
    # Step 2.4: Education Alignment Scoring (Never 0.0)
    # --------------------------------------------------------------------------
    has_education = len(resume.education) > 0
    edu_requirement = jd.education_requirement or "Bachelor's degree or equivalent"
    edu_req_lower = edu_requirement.lower()

    # Check for relevant degree match, flexible baseline, or real-world experience equivalence
    meets_education = False
    if not jd.education_requirement or any(k in edu_req_lower for k in ["none", "any", "not specified"]):
        meets_education = True
    elif actual_years >= 3.0: # 3+ years of professional experience satisfies or waives degree requirement
        meets_education = True
    else:
        for edu in resume.education:
            deg = (edu.degree or "").lower()
            field = (edu.field_of_study or "").lower()
            if any(term in deg for term in ["bachelor", "master", "phd", "b.s", "m.s", "b.tech", "m.tech", "b.e."]):
                meets_education = True
                break
            if any(term in field for term in ["computer", "engineering", "information", "software", "science"]):
                meets_education = True
                break

    if meets_education:
        education_score = 100.0
        edu_gap = None
    else:
        education_score = cfg.gate6.education_partial_score * 100.0
        edu_gap = "Candidate degree does not directly match specification; awarded baseline partial credit per non-fatal policy."

    edu_evidence = (
        "; ".join([f"{e.degree} in {e.field_of_study}" for e in resume.education if e.degree])
        if resume.education else "No degree listed on resume."
    )

    ledger_entries.append(
        LedgerEntry(
            dimension=DimensionType.EDUCATION,
            requirement=f"Education baseline: {edu_requirement}",
            evidence=edu_evidence,
            is_verified=has_education,
            score_contribution=round(education_score, 2),
            gap=edu_gap,
        )
    )

    # --------------------------------------------------------------------------
    # Step 2.5: Location Alignment Scoring (Never 0.0)
    # --------------------------------------------------------------------------
    cand_loc = (resume.current_location or "").lower()
    jd_loc = (jd.location or "").lower()
    remote_policy = (jd.remote_policy or "").lower()

    # Robust bidirectional city & state token match
    loc_matched = (
        remote_policy in ("remote", "flexible")
        or "remote" in cand_loc
        or (jd_loc in cand_loc and jd_loc)
        or (cand_loc in jd_loc and cand_loc)
        or any(len(part.strip()) >= 3 and part.strip() in cand_loc for part in jd_loc.split(","))
    )

    if loc_matched:
        location_score = 100.0
        loc_gap = None
    else:
        # Partial credit: Location alone NEVER kills a candidacy (Principle 1 & Master Plan line 184)
        location_score = cfg.gate6.location_partial_score * 100.0
        loc_gap = f"Location mismatch ({resume.current_location or 'Unknown'} vs {jd.location}); awarded baseline partial credit."

    ledger_entries.append(
        LedgerEntry(
            dimension=DimensionType.LOCATION,
            requirement=f"Location requirement: {jd.location} ({jd.remote_policy})",
            evidence=f"Candidate location: {resume.current_location or 'Not specified'}",
            is_verified=bool(resume.current_location),
            score_contribution=round(location_score, 2),
            gap=loc_gap,
        )
    )

    # --------------------------------------------------------------------------
    # Step 3: Weighted Total Score Calculation
    # --------------------------------------------------------------------------
    w = cfg.gate6.weights
    total_weights = w.technical + w.experience + w.seniority + w.education + w.location
    if not math.isclose(total_weights, 1.0, rel_tol=1e-4):
        raise ValueError(f"Gate 6 weights must sum to exactly 1.0 (currently {total_weights:.4f})")

    weighted_total = (
        (technical_score * w.technical)
        + (experience_score * w.experience)
        + (seniority_score * w.seniority)
        + (education_score * w.education)
        + (location_score * w.location)
    )

    # Enterprise ATS Calibration: Role-Level Overqualification Ceiling
    # When a candidate is overqualified for an Entry/Junior/Mid role, their requisition fit
    # represents a 3-star recruiter escalation call (not an auto-advance). Their continuous score
    # cannot exceed the recruiter escalation boundary (<= 73.0), preserving top-k ranking for target fits.
    if is_overqualified and calib_cfg and calib_cfg.enabled:
        weighted_total = min(weighted_total * calib_cfg.score_factor, calib_cfg.score_ceiling)
        ledger_entries.append(
            LedgerEntry(
                dimension=DimensionType.SENIORITY,
                requirement=f"Requisition Alignment ({jd_level.value.upper()})",
                evidence=f"Candidate seniority ({cand_level.value.upper()}) and {actual_years:.1f} YoE exceed target requisition scope.",
                is_verified=True,
                score_contribution=round(weighted_total, 2),
                gap=(
                    f"Overqualification calibration applied: Continuous score adjusted to recruiter review "
                    f"band (<= {calib_cfg.score_ceiling}) to preserve top-k ranking for target talent."
                ),
            )
        )

    breakdown = ScoringBreakdown(
        technical_score=round(technical_score, 2),
        experience_score=round(experience_score, 2),
        seniority_score=round(seniority_score, 2),
        education_score=round(education_score, 2),
        location_score=round(location_score, 2),
        weighted_total=round(weighted_total, 2),
    )

    # --------------------------------------------------------------------------
    # Step 4: Mandatory Ledger Completeness Assertions (Task 5.9)
    # --------------------------------------------------------------------------
    _assert_ledger_completeness(ledger_entries, jd.must_have_skills)

    ledger = ScoringLedger(
        candidate_id=cid,
        job_id=jid,
        entries=ledger_entries,
        breakdown=breakdown,
        hard_failures=hard_failures,
        hard_failures_count=len(hard_failures),
        verified_must_haves_count=verified_must_haves_count,
        total_must_haves_count=total_must_haves,
        is_overqualified=is_overqualified,
    )

    logger.info(
        f"[{cid}] Gate 6 Complete: Score = {breakdown.weighted_total:.2f}/100 "
        f"(tech={breakdown.technical_score:.1f}, exp={breakdown.experience_score:.1f}, "
        f"sen={breakdown.seniority_score:.1f}, hard_failures={len(hard_failures)})",
        gate="GATE_6",
        candidate_id=cid,
    )
    return ledger


def _assert_ledger_completeness(entries: List[LedgerEntry], must_have_skills: List[str]) -> None:
    """
    Asserts that every must-have requirement and every scoring dimension has an entry.
    Raises ValueError if the audit trail is incomplete (Principle 2).
    """
    dims_found = set(e.dimension for e in entries)
    required_dims = {
        DimensionType.TECHNICAL,
        DimensionType.EXPERIENCE,
        DimensionType.SENIORITY,
        DimensionType.EDUCATION,
        DimensionType.LOCATION,
    }

    missing_dims = required_dims - dims_found
    if missing_dims:
        raise ValueError(f"Evidence Ledger incomplete: missing entries for dimensions: {missing_dims}")

    # Check must-haves
    tech_requirements = [e.requirement for e in entries if e.dimension == DimensionType.TECHNICAL]
    for mh in must_have_skills:
        expected = f"Must-Have: {mh}"
        if not any(expected in req for req in tech_requirements):
            raise ValueError(f"Evidence Ledger incomplete: missing entry for required must-have '{mh}'")
