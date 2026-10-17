/**
 * HuntYourTribe ATS API Client
 * Connects directly to Isolated API2 backend at http://localhost:1234
 */

import {
  PipelineStats,
  JobDescription,
  CandidateRecord,
  ApplicantsResponse,
  ScoringWeights,
  EvaluationData,
  ExecutiveReport,
  CandidateStage
} from '../types/ats';
import { MOCK_JOBS, MOCK_CANDIDATES } from '../data/mockdata';

const API_BASE = 'http://localhost:1234/api';

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    });

    if (!res.ok) {
      let detail = `Request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) detail = errJson.detail;
      } catch {
        detail = res.statusText || detail;
      }
      throw new ApiError(detail, res.status);
    }

    return await res.json() as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Unable to connect to ATS backend on port 1234', 503);
  }
}

export const api = {
  // 1. Health
  checkHealth: async () => {
    try {
      return await request<{ status: string; port: number; database: any; pipeline_active: boolean }>('/health');
    } catch {
      return null;
    }
  },

  // 2. Stats
  getStats: async (): Promise<PipelineStats> => {
    return request<PipelineStats>('/stats');
  },

  // 3. Jobs
  getJobs: async (): Promise<JobDescription[]> => {
    try {
      const liveJobs = await request<JobDescription[]>('/jobs');
      if (Array.isArray(liveJobs) && liveJobs.length > 0) {
        return liveJobs;
      }
    } catch (e) {
      console.warn('Backend fetch jobs failed, using reference fallback:', e);
    }
    return MOCK_JOBS;
  },

  getJob: async (jobId: string): Promise<JobDescription> => {
    try {
      return await request<JobDescription>(`/jobs/${jobId}`);
    } catch {
      return MOCK_JOBS.find(j => j.job_id === jobId) || MOCK_JOBS[0];
    }
  },

  createJob: async (payload: Partial<JobDescription>): Promise<JobDescription> => {
    try {
      return await request<JobDescription>('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Create job fallback:', e);
      return {
        job_id: payload.job_id || `job-${Date.now()}`,
        title: payload.title || 'Software Engineer',
        company: payload.company || 'HuntYourTribe',
        location: payload.location || 'Remote',
        seniority_level: payload.seniority_level || 'mid',
        min_years_experience: payload.min_years_experience || 2,
        must_have_skills: payload.must_have_skills || ['React', 'TypeScript'],
        nice_to_have_skills: payload.nice_to_have_skills || ['FastAPI', 'Docker'],
        education_requirement: payload.education_requirement || "Bachelor's degree",
        remote_policy: payload.remote_policy || 'remote',
        posted_at: 'Just now',
        active: true,
        applicant_count: 0,
        description: payload.description || ''
      };
    }
  },

  // 4. Scoring Weights
  getWeights: async (jobId: string): Promise<{ job_id: string; weights: ScoringWeights; is_custom: boolean }> => {
    return request<{ job_id: string; weights: ScoringWeights; is_custom: boolean }>(`/jobs/${jobId}/weights`);
  },

  updateWeights: async (jobId: string, weights: ScoringWeights): Promise<{ success: boolean; weights: ScoringWeights }> => {
    return request<{ success: boolean; weights: ScoringWeights }>(`/jobs/${jobId}/weights`, {
      method: 'POST',
      body: JSON.stringify({ weights })
    });
  },

  resetWeights: async (jobId: string): Promise<{ success: boolean; weights: ScoringWeights }> => {
    return request<{ success: boolean; weights: ScoringWeights }>(`/jobs/${jobId}/weights/reset`, {
      method: 'POST'
    });
  },

  // 5. Applicants
  getJobApplicants: async (
    jobId: string,
    params: {
      page?: number;
      page_size?: number;
      search?: string;
      stage?: string;
      decision?: string;
      sort?: string;
    } = {}
  ): Promise<ApplicantsResponse> => {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', params.page.toString());
    if (params.page_size) sp.set('page_size', params.page_size.toString());
    if (params.search) sp.set('search', params.search);
    if (params.stage && params.stage !== 'All') sp.set('stage', params.stage);
    if (params.decision && params.decision !== 'All') sp.set('decision', params.decision);
    if (params.sort) sp.set('sort', params.sort);

    const query = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApplicantsResponse>(`/jobs/${jobId}/applicants${query}`);
  },

  getCandidates: async (jobId: string): Promise<CandidateRecord[]> => {
    try {
      const resp = await api.getJobApplicants(jobId, { page_size: 100 });
      if (resp && resp.items && resp.items.length > 0) {
        return resp.items;
      }
    } catch (e) {
      console.warn('Backend fetch candidates failed, using reference candidates:', e);
    }
    return MOCK_CANDIDATES;
  },

  getApplicantDetail: async (jobId: string, candidateId: string): Promise<CandidateRecord> => {
    return request<CandidateRecord>(`/jobs/${jobId}/applicants/${candidateId}`);
  },

  getCandidateStandalone: async (candidateId: string): Promise<CandidateRecord> => {
    try {
      return await request<CandidateRecord>(`/candidates/${candidateId}`);
    } catch {
      // Fallback search in mock candidates
      const found = MOCK_CANDIDATES.find(c => c.candidate_id === candidateId || c.candidate_id === `cand-${candidateId}`);
      if (found) return found;
      throw new Error(`Candidate ${candidateId} not found`);
    }
  },

  // 6. Recruiter Decision
  recordDecision: async (
    jobId: string,
    candidateId: string,
    decision: 'Shortlisted' | 'Under Review' | 'Rejected' | 'Escalated' | string,
    reason: string = 'Recruiter decision via ATS workflow',
    recruiter: string = 'Vishal Joshi'
  ): Promise<{ success: boolean; candidate_id: string; new_stage: string }> => {
    return request<{ success: boolean; candidate_id: string; new_stage: string }>(
      `/jobs/${jobId}/applicants/${candidateId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, reason, recruiter })
      }
    );
  },

  updateCandidateStage: async (candidateId: string, stage: CandidateStage | string, jobId?: string) => {
    if (!jobId) return;
    try {
      await api.recordDecision(jobId, candidateId, stage, `Stage updated to ${stage}`, 'Vishal Joshi');
    } catch (e) {
      console.warn('Record decision error:', e);
    }
  },

  // 7. Executive Report
  generateReport: async (jobId: string): Promise<ExecutiveReport> => {
    return request<ExecutiveReport>(`/jobs/${jobId}/report`, {
      method: 'POST'
    });
  },

  getExportCsvUrl: (jobId: string): string => {
    return `${API_BASE}/jobs/${jobId}/export-csv`;
  },

  // 8. Evaluation
  getEvaluation: async (): Promise<EvaluationData> => {
    return request<EvaluationData>('/evaluation');
  },

  // 9. Candidate Apply
  applyCandidate: async (formData: FormData): Promise<CandidateRecord> => {
    return request<CandidateRecord>('/candidates/apply', {
      method: 'POST',
      body: formData
    });
  }
};
