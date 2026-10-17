/**
 * HYT ATS — TypeScript Data Types
 * Strictly aligned with src/models/schemas.py and master.md
 */

export type SeniorityLevel = 
  | 'entry' 
  | 'junior' 
  | 'mid' 
  | 'senior' 
  | 'lead' 
  | 'staff' 
  | 'principal' 
  | 'executive';

export type DecisionType = 
  | 'AUTO_ADVANCE' 
  | 'ESCALATE' 
  | 'AUTO_REJECT';

export type DimensionType = 
  | 'technical' 
  | 'experience' 
  | 'seniority' 
  | 'education' 
  | 'location';

export type CandidateStage = 
  | 'Suggested' 
  | 'All' 
  | 'Shortlisted' 
  | 'Ready to Interview' 
  | 'Rejected' 
  | 'Unassigned' 
  | 'Quarantined';

export type IntegrityFlag = 
  | 'HIDDEN_TEXT'
  | 'OFF_PAGE'
  | 'TINY_FONT'
  | 'METADATA_STUFFED'
  | 'LAYER_ATTACK'
  | 'GAMING_DETECTED'
  | 'INJECTION_ATTEMPT'
  | 'WHITE_FONT_DETECTED'
  | 'ZERO_PT_FONT_DETECTED'
  | 'METADATA_SKILL_STUFFING'
  | 'VERBATIM_JD_COPY'
  | 'PROMPT_INJECTION_DETECTED'
  | 'EXCESSIVE_PAGES'
  | 'SUSPICIOUS_CHARACTERS'
  | 'PARSING_ERROR';

export type VerificationFlag = 
  | 'SHALLOW_PROFILE'
  | 'GITHUB_LANGUAGE_MISMATCH'
  | 'GITHUB_MISMATCH'
  | 'GITHUB_INACTIVE'
  | 'GITHUB_NOT_FOUND'
  | 'GITHUB_API_ERROR'
  | 'DATE_SUSPICIOUS'
  | 'EXTRACTION_FAILED'
  | 'PARSING_ERROR';

export interface Skill {
  name: string;
  context?: string | null;
  is_verified: boolean;
  years_experience?: number | null;
}

export interface ExperienceEntry {
  title: string;
  company?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  years: number;
  bullets: string[];
  skills_demonstrated: string[];
}

export interface EducationEntry {
  institution?: string | null;
  degree?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
}

export interface LedgerEntry {
  dimension: DimensionType;
  requirement: string;
  evidence: string | null;
  is_verified: boolean;
  score_contribution: number;
  gap: string | null;
}

export interface ScoringBreakdown {
  technical_score: number;
  experience_score: number;
  seniority_score: number;
  education_score: number;
  location_score: number;
  weighted_total: number;
}

export interface RecruiterExplanation {
  strengths_sentence: string;
  gaps_sentence: string;
  interview_focus_sentence: string;
  full_explanation: string;
  integrity_flags: string[];
  verification_flags: string[];
}

export interface GitHubStats {
  handle: string;
  url: string;
  rank: string;
  stars: string;
  recent_commits: number;
  total_prs: number;
  languages: Record<string, number>;
  active_in_lookback: boolean;
}

export interface ProjectRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  live_url?: string;
  repo_url: string;
  date_range?: string;
  image_preview?: string;
}

export interface CandidateQuestionAnswer {
  question: string;
  answer: string;
}

export interface CandidateRecord {
  candidate_id: string;
  name: string;
  headline: string;
  avatar_url?: string;
  email?: string;
  location: string;
  job_id: string;
  job_title: string;
  stage: CandidateStage;
  applied_at: string;
  final_score: number;
  decision: DecisionType;
  decision_reason: string;
  scoring_breakdown: ScoringBreakdown;
  ledger: LedgerEntry[];
  top_strengths: string[];
  critical_gaps: string[];
  integrity_flags: IntegrityFlag[];
  integrity_flag_reasons?: Record<string, string>;
  verification_flags: VerificationFlag[];
  is_quarantined: boolean;
  is_overqualified: boolean;
  bio: string;
  skills: Skill[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  github_stats?: GitHubStats;
  project_repos: ProjectRepo[];
  answers: CandidateQuestionAnswer[];
  explanation?: RecruiterExplanation;
  processed_at: string;
  matched_condition?: number;
}

export interface JobDescription {
  job_id: string;
  title: string;
  company: string;
  seniority_level: SeniorityLevel;
  min_years_experience: number;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  education_requirement: string;
  location: string;
  remote_policy: 'remote' | 'hybrid' | 'onsite';
  domain_context?: string;
  posted_at: string;
  active: boolean;
  applicant_count: number;
  description: string;
  persona: string;
}

export interface SignalCriterion {
  id: string;
  name: string;
  description: string;
  high_score_rule: string;
  points: number;
  percentage: number;
}
