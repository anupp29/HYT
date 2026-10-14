"""
HYT ATS - Pydantic Data Models
==============================
Defines immutable, strongly-typed schemas for all data moving through
the 12-gate ATS screening pipeline.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class SeniorityLevel(str, Enum):
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    STAFF = "staff"
    PRINCIPAL = "principal"
    EXECUTIVE = "executive"


class DecisionType(str, Enum):
    AUTO_ADVANCE = "AUTO_ADVANCE"
    ESCALATE = "ESCALATE"
    AUTO_REJECT = "AUTO_REJECT"


class DimensionType(str, Enum):
    TECHNICAL = "technical"
    EXPERIENCE = "experience"
    SENIORITY = "seniority"
    EDUCATION = "education"
    LOCATION = "location"


class IntegrityFlag(str, Enum):
    HIDDEN_TEXT = "HIDDEN_TEXT"
    OFF_PAGE = "OFF_PAGE"
    TINY_FONT = "TINY_FONT"
    METADATA_STUFFED = "METADATA_STUFFED"
    LAYER_ATTACK = "LAYER_ATTACK"
    GAMING_DETECTED = "GAMING_DETECTED"
    INJECTION_ATTEMPT = "INJECTION_ATTEMPT"
    WHITE_FONT_DETECTED = "WHITE_FONT_DETECTED"
    ZERO_PT_FONT_DETECTED = "ZERO_PT_FONT_DETECTED"
    METADATA_SKILL_STUFFING = "METADATA_SKILL_STUFFING"
    VERBATIM_JD_COPY = "VERBATIM_JD_COPY"
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    EXCESSIVE_PAGES = "EXCESSIVE_PAGES"
    SUSPICIOUS_CHARACTERS = "SUSPICIOUS_CHARACTERS"
    PARSING_ERROR = "PARSING_ERROR"


class VerificationFlag(str, Enum):
    SHALLOW_PROFILE = "SHALLOW_PROFILE"
    GITHUB_LANGUAGE_MISMATCH = "GITHUB_LANGUAGE_MISMATCH"
    GITHUB_MISMATCH = "GITHUB_MISMATCH"
    GITHUB_INACTIVE = "GITHUB_INACTIVE"
    GITHUB_NOT_FOUND = "GITHUB_NOT_FOUND"
    GITHUB_API_ERROR = "GITHUB_API_ERROR"
    DATE_SUSPICIOUS = "DATE_SUSPICIOUS"
    EXTRACTION_FAILED = "EXTRACTION_FAILED"
    PARSING_ERROR = "PARSING_ERROR"


# ------------------------------------------------------------------------------
# 1. Job Description Schemas
# ------------------------------------------------------------------------------

class JobDescriptionRaw(BaseModel):
    """Raw unparsed JD input with content-derived hash."""
    job_id: str
    raw_text: str
    title: Optional[str] = None
    company: Optional[str] = None
    content_hash: str = Field(description="SHA-256 hash of raw_text for deterministic caching")


class JobDescription(BaseModel):
    """Fully structured Job Description after extraction."""
    job_id: str
    title: str
    company: Optional[str] = "Company"
    seniority_level: SeniorityLevel = SeniorityLevel.MID
    min_years_experience: float = Field(ge=0.0, default=2.0)
    must_have_skills: List[str] = Field(default_factory=list, description="Strict non-negotiable requirements")
    nice_to_have_skills: List[str] = Field(default_factory=list, description="Preferred secondary skills")
    education_requirement: Optional[str] = "Bachelor's degree or equivalent"
    location: Optional[str] = "Remote"
    remote_policy: str = "remote" # "remote", "hybrid", "onsite"
    domain_context: Optional[str] = None
    content_hash: str = Field(description="SHA-256 hash of raw JD text for caching")


# ------------------------------------------------------------------------------
# 2. Candidate Resume Schemas
# ------------------------------------------------------------------------------

class PDFTextBlock(BaseModel):
    """Detailed visual and geometric representation of an extracted PDF text block."""
    text: str
    bbox: List[float] = Field(default_factory=list, description="[x0, y0, x1, y1] coordinates")
    font_size: float = 10.0
    font_name: Optional[str] = None
    color_srgb: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0], description="[r, g, b] in [0, 1]")
    page_index: int = 0
    is_hidden: bool = False
    is_off_page: bool = False
    is_tiny: bool = False


class PDFData(BaseModel):
    """Parsed low-level PDF representation extracted prior to text processing."""
    candidate_id: str
    pdf_path: str
    page_count: int
    metadata: Dict[str, str] = Field(default_factory=dict)
    raw_text: str = ""
    blocks: List[PDFTextBlock] = Field(default_factory=list)
    has_images: bool = False
    image_count: int = 0
    file_size_bytes: int = 0


class ResumeRaw(BaseModel):
    """Raw candidate resume reference."""
    candidate_id: str
    pdf_path: str
    source_category: Optional[str] = None


class Skill(BaseModel):
    """Individual extracted skill with verification grounding."""
    name: str
    context: Optional[str] = Field(None, description="Verbatim quote/sentence where skill was demonstrated")
    is_verified: bool = Field(default=False, description="True if substantiated by experience bullets, false if listed-only")
    years_experience: Optional[float] = None


class ExperienceEntry(BaseModel):
    """Chronological employment record."""
    title: str
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    years: float = Field(ge=0.0, default=1.0)
    bullets: List[str] = Field(default_factory=list)
    skills_demonstrated: List[str] = Field(default_factory=list)


class EducationEntry(BaseModel):
    """Educational qualification record."""
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None


class ResumeStructured(BaseModel):
    """Fully extracted structured resume (PII-free representation)."""
    candidate_id: str
    estimated_years_experience: float = Field(ge=0.0, default=0.0)
    seniority_level: SeniorityLevel = SeniorityLevel.MID
    skills: List[Skill] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    github_handle: Optional[str] = None
    current_location: Optional[str] = None
    verification_flags: List[str] = Field(default_factory=list, description="Flags like DATE_SUSPICIOUS detected during extraction")
    content_hash: str = Field(description="SHA-256 hash of PII-stripped resume text")

    @property
    def verified_skills(self) -> List[Skill]:
        return [s for s in self.skills if s.is_verified]

    @property
    def unverified_skills(self) -> List[Skill]:
        return [s for s in self.skills if not s.is_verified]


# ------------------------------------------------------------------------------
# 3. Gate Reports & Evidence Ledger
# ------------------------------------------------------------------------------

class Gate0IntegrityReport(BaseModel):
    """Output of Gate 0 Integrity Shield."""
    candidate_id: str
    is_quarantined: bool = False
    flags: List[IntegrityFlag] = Field(default_factory=list)
    flag_reasons: Dict[str, str] = Field(default_factory=dict, description="Explanations of why each flag was triggered")
    min_contrast_ratio: float = 21.0
    min_font_size_pt: float = 10.0
    metadata_skill_density: float = 0.0
    jd_copy_similarity: float = 0.0
    page_count: int = 1
    raw_text_length: int = 0
    clean_text_length: int = 0


class PreFilterResult(BaseModel):
    """Output of Gate 5 Fast Filter Funnel."""
    candidate_id: str
    job_id: str
    passed: bool
    similarity: float
    threshold: float
    decision: Optional[DecisionType] = None
    reason: Optional[str] = None
    skip_scoring: bool = False


class Gate4VerificationReport(BaseModel):
    """Output of Gate 4 Verification Engine."""
    candidate_id: str
    github_handle: Optional[str] = None
    github_url: Optional[str] = None
    flags: List[VerificationFlag] = Field(default_factory=list)
    total_skills_count: int = 0
    verified_skills_count: int = 0
    unverified_skills_count: int = 0
    unverified_skill_ratio: float = 0.0
    github_top_languages: List[str] = Field(default_factory=list)
    github_language_breakdown: Dict[str, float] = Field(default_factory=dict)
    github_active_in_lookback: bool = True
    recent_public_commits: int = 0
    inactive_skills: List[str] = Field(default_factory=list)
    ledger_notes: List[str] = Field(default_factory=list)
    is_verified: bool = True


class LedgerEntry(BaseModel):
    """Individual verifiable entry in the Gate 6 Evidence Ledger."""
    dimension: DimensionType
    requirement: str
    evidence: Optional[str] = Field(None, description="Exact quotation from resume grounding this score")
    is_verified: bool = False
    score_contribution: float = Field(ge=0.0, le=100.0)
    gap: Optional[str] = Field(None, description="Detailed explanation of what is missing")


class ScoringBreakdown(BaseModel):
    """Subtotals across the 5 scoring dimensions."""
    technical_score: float = Field(ge=0.0, le=100.0)
    experience_score: float = Field(ge=0.0, le=100.0)
    seniority_score: float = Field(ge=0.0, le=100.0)
    education_score: float = Field(ge=0.0, le=100.0)
    location_score: float = Field(ge=0.0, le=100.0)
    weighted_total: float = Field(ge=0.0, le=100.0)


class ScoringLedger(BaseModel):
    """Immutable audit trail for candidate scoring."""
    candidate_id: str
    job_id: str
    entries: List[LedgerEntry] = Field(default_factory=list)
    breakdown: ScoringBreakdown
    hard_failures: List[str] = Field(default_factory=list)
    hard_failures_count: int = 0
    verified_must_haves_count: int = 0
    total_must_haves_count: int = 0
    is_overqualified: bool = False


# ------------------------------------------------------------------------------
# 4. Final Output & Recruiter Explanations
# ------------------------------------------------------------------------------

class Gate7DecisionResult(BaseModel):
    """Output of Gate 7 Decision Policy Engine."""
    candidate_id: str
    job_id: str
    decision: DecisionType
    reason: str
    matched_condition: int
    escalation_reason: Optional[str] = None


class RecruiterExplanation(BaseModel):
    """3-sentence structured recruiter explanation (Gate 8)."""
    strengths_sentence: str
    gaps_sentence: str
    interview_focus_sentence: str
    full_explanation: str
    integrity_flags: List[str] = Field(default_factory=list)
    verification_flags: List[str] = Field(default_factory=list)


class CandidateRecord(BaseModel):
    """Complete, immutable end-to-end audit record for a candidate (Gate 9)."""
    candidate_id: str
    job_id: str
    job_title: str
    final_score: float = Field(ge=0.0, le=100.0)
    decision: DecisionType
    decision_reason: str
    scoring_breakdown: ScoringBreakdown
    ledger: List[LedgerEntry] = Field(default_factory=list)
    top_strengths: List[str] = Field(default_factory=list)
    critical_gaps: List[str] = Field(default_factory=list)
    integrity_flags: List[str] = Field(default_factory=list)
    verification_flags: List[str] = Field(default_factory=list)
    is_quarantined: bool = False
    is_overqualified: bool = False
    explanation: Optional[RecruiterExplanation] = None
    processed_at: str


# ------------------------------------------------------------------------------
# 5. Evaluation Schemas
# ------------------------------------------------------------------------------

class EvalPair(BaseModel):
    """Pair definition for the golden evaluation set."""
    pair_id: str
    job_id: str
    job_title: str
    candidate_id: str
    human_fit_score: int = Field(ge=1, le=5)
    human_decision: str # "advance", "escalate", "reject"
    human_rationale: str
    is_career_switcher: str = "no"
    is_overqualified: str = "no"
    has_relevant_github: str = "no"
    special_notes: Optional[str] = None
