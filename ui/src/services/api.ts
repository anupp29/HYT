/**
 * HYT ATS — Frontend API Client
 * Seamlessly connects React UI to the Python FastAPI backend engine (:8000).
 */

import { CandidateRecord, JobDescription, CandidateStage, DecisionType } from '../types/ats';
import { MOCK_JOBS, MOCK_CANDIDATES } from '../data/mockdata';

const BASE_URL = '/api';

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  total_jds: number;
  total_resumes_in_corpus: number;
  llm_providers: Record<string, any>;
}

export interface AnalyticsData {
  total_applicants: number;
  decision_breakdown: {
    AUTO_ADVANCE: number;
    ESCALATE: number;
    AUTO_REJECT: number;
  };
  avg_score: number;
  escalation_rate: number;
  advance_rate: number;
  rejection_rate: number;
  integrity_flag_rate: number;
  avg_time_to_decision_ms: number;
}

export const api = {
  /**
   * Health and LLM status probe
   */
  async checkHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Backend not reachable:', e);
      return null;
    }
  },

  /**
   * Fetch all jobs from backend (with fallback)
   */
  async getJobs(): Promise<JobDescription[]> {
    try {
      const res = await fetch(`${BASE_URL}/jobs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Error fetching jobs, falling back:', e);
    }
    return MOCK_JOBS;
  },

  /**
   * Fetch specific job details
   */
  async getJob(jobId: string): Promise<JobDescription | null> {
    try {
      const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Error fetching job details:', e);
    }
    return MOCK_JOBS.find(j => j.job_id === jobId) || null;
  },

  /**
   * Create or update a Job Description
   */
  async createJob(jobData: Partial<JobDescription> & { raw_text?: string }): Promise<JobDescription> {
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to persist job on backend:', e);
    }
    const fallback: JobDescription = {
      job_id: `job-${Date.now().toString(16)}`,
      title: jobData.title || 'Software Engineer',
      company: jobData.company || 'HuntYourTribe',
      location: jobData.location || 'Remote',
      seniority_level: (jobData.seniority_level as any) || 'mid',
      min_years_experience: jobData.min_years_experience || 2,
      must_have_skills: jobData.must_have_skills || ['Python', 'SQL'],
      nice_to_have_skills: jobData.nice_to_have_skills || ['Docker', 'AWS'],
      description: jobData.description || 'Engineered software solutions.',
      education_requirement: jobData.education_requirement || "Bachelor's Degree",
      remote_policy: (jobData.remote_policy as any) || 'remote',
      content_hash: `hash_${Date.now()}`,
      posted_at: 'Just now',
      active: true,
      applicant_count: 0,
      total_applicants: 0,
      persona: 'Technical Recruiter',
    };
    return fallback;
  },

  /**
   * Fetch candidates for a target role
   */
  async getCandidates(jobId?: string, stage?: string, decision?: string, search?: string): Promise<CandidateRecord[]> {
    try {
      const params = new URLSearchParams();
      if (jobId && jobId !== 'All') params.append('job_id', jobId);
      if (stage && stage !== 'All') params.append('stage', stage);
      if (decision && decision !== 'All') params.append('decision', decision);
      if (search) params.append('search', search);

      const res = await fetch(`${BASE_URL}/candidates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Using fallback candidates:', e);
    }
    return MOCK_CANDIDATES;
  },

  /**
   * Fetch specific candidate details with full evidence ledger
   */
  async getCandidate(candidateId: string, jobId?: string): Promise<CandidateRecord | null> {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('job_id', jobId);
      const res = await fetch(`${BASE_URL}/candidates/${candidateId}?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Error fetching candidate:', e);
    }
    return MOCK_CANDIDATES.find(c => c.candidate_id === candidateId) || null;
  },

  /**
   * Update candidate stage (drag/drop or dropdown)
   */
  async updateCandidateStage(candidateId: string, stage: CandidateStage, jobId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('job_id', jobId);
      const res = await fetch(`${BASE_URL}/candidates/${candidateId}/stage?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to update stage on backend:', e);
      return false;
    }
  },

  /**
   * Recruiter overrides an AI decision
   */
  async overrideDecision(
    candidateId: string,
    decision: DecisionType,
    reason: string,
    jobId?: string,
    recruiter: string = 'human_recruiter'
  ): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/candidates/${candidateId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          decision,
          reason,
          recruiter
        })
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to record override on backend:', e);
      return false;
    }
  },

  /**
   * Get Gate Trace for GateShieldModal
   */
  async getGateTrace(candidateId: string, jobId?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('job_id', jobId);
      const res = await fetch(`${BASE_URL}/candidates/${candidateId}/gate-trace?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to get gate trace:', e);
    }
    return null;
  },

  /**
   * Apply & Screen Candidate with resume file
   */
  async applyCandidate(formData: FormData): Promise<CandidateRecord | null> {
    try {
      const res = await fetch(`${BASE_URL}/candidates/apply`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed candidate apply submission:', e);
    }
    return null;
  },

  /**
   * Fetch Analytics metrics
   */
  async getAnalytics(jobId?: string): Promise<AnalyticsData | null> {
    try {
      const params = new URLSearchParams();
      if (jobId && jobId !== 'All') params.append('job_id', jobId);
      const res = await fetch(`${BASE_URL}/analytics?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch analytics:', e);
    }
    return null;
  }
};
