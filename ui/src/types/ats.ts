/**
 * HuntYourTribe ATS Types (ui2)
 * Complete TypeScript models strictly aligned with ui/references/ and api2 on port 1234
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
  dimension: DimensionType | string;
  requirement: string;
  evidence: string | null;
  is_verified: boolean;
  score_contribution: number;
  gap: string | null;
}

export interface GateTraceEntry {
  gate: string;
  status: string;
  flags?: string;
  duration_ms?: number;
  yoe?: number;
  score?: number;
  decision?: string;
  skills_found?: number;
  similarity?: number;
}

export interface ScoringWeights {
  technical: number;
  experience: number;
  seniority: number;
  education: number;
  location: number;
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
  url?: string;
  rank?: string;
  stars: string | number;
  recent_commits?: number;
  total_prs?: number;
  languages?: Record<string, number>;
  active_in_lookback?: boolean;
  active?: boolean;
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

export interface DecisionHistoryEntry {
  id: number;
  candidate_id: string;
  job_id: string;
  original_decision: string;
  overridden_decision: string;
  reason: string;
  recruiter: string;
  timestamp: string;
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
  stage: CandidateStage | string;
  applied_at: string;
  final_score: number;
  original_score?: number;
  decision: DecisionType | string;
  original_decision?: string;
  decision_reason: string;
  scoring_breakdown: ScoringBreakdown;
  ledger: LedgerEntry[];
  top_strengths: string[];
  critical_gaps: string[];
  integrity_flags: (IntegrityFlag | string)[];
  integrity_flag_reasons?: Record<string, string>;
  verification_flags: (VerificationFlag | string)[];
  is_quarantined: boolean;
  is_overqualified: boolean;
  is_career_switcher?: boolean;
  bio?: string;
  skills: Skill[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  github_stats?: GitHubStats;
  project_repos: ProjectRepo[];
  answers: CandidateQuestionAnswer[];
  explanation?: RecruiterExplanation;
  processed_at?: string;
  matched_condition?: number;
  gate_trace?: GateTraceEntry[];
  pdf_path?: string | null;
  text_path?: string | null;
  raw_resume_text?: string | null;
  real_links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    [key: string]: any;
  };
  has_pdf?: boolean;
  decision_history?: DecisionHistoryEntry[];
}

export interface JobDescription {
  job_id: string;
  title: string;
  company: string;
  seniority_level: SeniorityLevel | string;
  min_years_experience: number;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  education_requirement: string;
  location: string;
  remote_policy: 'remote' | 'hybrid' | 'onsite' | string;
  domain_context?: string;
  posted_at: string;
  active: boolean;
  applicant_count: number;
  total_applicants?: number;
  shortlisted_count?: number;
  under_review_count?: number;
  rejected_count?: number;
  description: string;
  persona?: string;
  scoring_weights?: ScoringWeights;
}

export interface SignalCriterion {
  id: string;
  name: string;
  description: string;
  high_score_rule: string;
  points: number;
  percentage: number;
}

export interface ApplicantsResponse {
  job_id: string;
  job_title: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  weights_applied: ScoringWeights;
  items: CandidateRecord[];
}

export interface PipelineStats {
  total_jobs: number;
  total_applications: number;
  stages: {
    shortlisted: number;
    shortlisted_pct: number;
    under_review: number;
    under_review_pct: number;
    rejected: number;
    rejected_pct: number;
    escalated: number;
    escalated_pct: number;
    quarantined: number;
    quarantined_pct: number;
  };
  average_score: number;
  benchmarks: {
    extraction_f1: number;
    ndcg_at_5: number;
    false_negative_rate: number;
    decision_accuracy: number;
  };
}

export interface EvaluationData {
  timestamp: string;
  total_pairs_evaluated: number;
  runtime_seconds: number;
  ranking_ndcg_at_5: {
    HYT_ATS: number;
    Jaccard_Baseline: number;
    TF_IDF_Baseline: number;
    improvement_over_jaccard_pct: number;
  };
  extraction_metrics: {
    f1_score: number;
    precision: number;
    recall: number;
  };
  false_negative_rate: number;
  security_suite: {
    total_attacks_tested: number;
    detected: number;
    detection_rate: number;
    tests: Array<{
      test_name: string;
      gate: string;
      expected_flag: string;
      detected: boolean;
      triggered_flags: string[];
      quarantined: boolean;
    }>;
  };
}

export interface ExecutiveReport {
  success: boolean;
  message: string;
  json_path: string;
  csv_path: string;
  report_id: string;
  summary: {
    total_applicants: number;
    shortlisted_count: number;
    shortlisted_rate: number;
    under_review_count: number;
    rejected_count: number;
    average_calibrated_score: number;
    top_candidate: string;
    top_candidate_score: number;
  };
  download_url_json: string;
  download_url_csv: string;
}
