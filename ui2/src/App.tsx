import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JobPostingsView } from './components/JobPostingsView';
import { ApplicantsDashboard } from './components/ApplicantsDashboard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { PostJobModal } from './components/PostJobModal';
import { SignalsModal } from './components/SignalsModal';
import { StagesModal } from './components/StagesModal';
import { GateShieldModal } from './components/GateShieldModal';
import { CandidateExploreJobs } from './components/CandidateExploreJobs';
import { ResumePreviewPage } from './components/ResumePreviewPage';
import { MOCK_JOBS, MOCK_CANDIDATES } from './data/mockdata';
import { CandidateRecord, CandidateStage, JobDescription } from './types/ats';
import { api } from './services/api';
import './styles/index.css';

export const App: React.FC = () => {
  // Check if opened as dedicated resume preview tab (/resume/:id or ?resume=:id)
  const [resumeCandidateId, setResumeCandidateId] = useState<string | null>(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/resume/')) {
      const parts = pathname.split('/resume/')[1].split('/');
      return parts[0] || null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('resume');
  });

  // Listen to browser popstate navigation
  useEffect(() => {
    const onPop = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/resume/')) {
        const parts = pathname.split('/resume/')[1].split('/');
        setResumeCandidateId(parts[0] || null);
      } else {
        const params = new URLSearchParams(window.location.search);
        setResumeCandidateId(params.get('resume'));
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'hr' | 'candidate'>('hr');
  const [currentView, setCurrentView] = useState<'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics'>('jobs');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Data State
  const [jobs, setJobs] = useState<JobDescription[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobDescription>(MOCK_JOBS[0]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>(MOCK_CANDIDATES);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(['2234533717']);

  // Modals & Drawers
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState<boolean>(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [isSignalsModalOpen, setIsSignalsModalOpen] = useState<boolean>(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState<boolean>(false);
  const [isGateShieldModalOpen, setIsGateShieldModalOpen] = useState<boolean>(false);

  // If dedicated resume route active, render ResumePreviewPage directly
  if (resumeCandidateId) {
    return (
      <ResumePreviewPage
        candidateId={resumeCandidateId}
        onClose={() => {
          setResumeCandidateId(null);
          if (window.opener) {
            window.close();
          } else {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  // Initial load: Fetch real Jobs from port 1234
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const liveJobs = await api.getJobs();
        if (isMounted && liveJobs && liveJobs.length > 0) {
          setJobs(liveJobs);
          setSelectedJob(liveJobs[0]);
        }
      } catch (e) {
        console.warn('Initial jobs fetch notice:', e);
      }
    };
    initData();
    return () => { isMounted = false; };
  }, []);

  // Sync candidates when selectedJob changes
  const loadCandidatesForJob = async (jobId: string) => {
    if (!jobId) return;
    try {
      const liveCands = await api.getCandidates(jobId);
      if (liveCands && liveCands.length > 0) {
        setCandidates(liveCands);
      }
    } catch (e) {
      console.warn('Error syncing candidates for job:', e);
    }
  };

  useEffect(() => {
    if (selectedJob?.job_id) {
      loadCandidatesForJob(selectedJob.job_id);
    }
  }, [selectedJob?.job_id]);

  // Sync Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle stage update (persists to SQLite decision_overrides & applicant_metadata)
  const handleUpdateStage = async (candidateId: string, stage: CandidateStage | string) => {
    setCandidates(prev => prev.map(c => {
      if (c.candidate_id === candidateId) {
        return { ...c, stage };
      }
      return c;
    }));

    if (selectedCandidate && selectedCandidate.candidate_id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, stage } : null);
    }

    await api.updateCandidateStage(candidateId, stage, selectedJob?.job_id);
  };

  // Handle select candidate
  const handleSelectCandidate = (candidate: CandidateRecord) => {
    setSelectedCandidate(candidate);
    setIsCandidateModalOpen(true);
  };

  // Handle selecting a job from job postings
  const handleSelectJob = (job: JobDescription) => {
    setSelectedJob(job);
    setCurrentView('applicants');
  };

  // Handle saving new or edited job
  const handleSaveJob = async (savedJob: JobDescription) => {
    const persisted = await api.createJob(savedJob);
    setJobs(prev => {
      const exists = prev.some(j => j.job_id === persisted.job_id);
      if (exists) {
        return prev.map(j => j.job_id === persisted.job_id ? persisted : j);
      }
      return [persisted, ...prev];
    });
    setSelectedJob(persisted);
    setEditingJob(null);
    setIsPostJobModalOpen(false);
  };

  // Handle running signals (updates weights on backend and refreshes scores)
  const handleRunSignals = async (target: 'suggested' | 'all') => {
    if (selectedJob?.job_id) {
      // Reload candidates with updated weights
      await loadCandidatesForJob(selectedJob.job_id);
    }
    setIsSignalsModalOpen(false);
  };

  // Handle candidate applying with proof to an open job
  const handleCandidateApply = async (job: JobDescription, applicationData: any) => {
    if (!appliedJobIds.includes(job.job_id)) {
      setAppliedJobIds(prev => [...prev, job.job_id]);
    }
    await loadCandidatesForJob(job.job_id);
    setCurrentView('applicants');
  };

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Dark Obsidian Left Sidebar matching Screenshot (305) */}
      <Sidebar 
        currentView={currentView}
        onNavigate={view => {
          if (view === 'candidate-explore-jobs') {
            setActiveRole('candidate');
            setCurrentView('candidate-explore-jobs');
          } else if (view === 'jobs' || view === 'applicants') {
            setActiveRole('hr');
            setCurrentView(view);
          }
        }}
        activeRole={activeRole}
        onOpenGateShield={() => setIsGateShieldModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        <Header 
          currentView={currentView}
          currentJobTitle={selectedJob ? selectedJob.title : "Software Engineer"}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onNavigate={view => setCurrentView(view)}
        />

        {/* Core Views matching Reference Screenshots */}
        {activeRole === 'hr' ? (
          currentView === 'jobs' ? (
            /* Screenshot (305) — Job Postings View */
            <JobPostingsView 
              jobs={jobs}
              onSelectJob={handleSelectJob}
              onOpenCreateJob={() => {
                setEditingJob(null);
                setIsPostJobModalOpen(true);
              }}
              onEditJob={(job) => {
                setEditingJob(job);
                setIsPostJobModalOpen(true);
              }}
            />
          ) : (
            /* Screenshot (298), (303), (304), 013310 — Applicants Dashboard */
            <ApplicantsDashboard 
              job={selectedJob}
              jobs={jobs}
              onSelectJob={handleSelectJob}
              candidates={candidates}
              onSelectCandidate={handleSelectCandidate}
              onUpdateStage={handleUpdateStage}
              onOpenSignals={() => setIsSignalsModalOpen(true)}
              onEditJob={() => {
                setEditingJob(selectedJob);
                setIsPostJobModalOpen(true);
              }}
              onOpenStages={() => setIsStagesModalOpen(true)}
              onScreenCandidate={(newCand) => {
                setCandidates(prev => [newCand, ...prev.filter(c => c.candidate_id !== newCand.candidate_id)]);
                setSelectedCandidate(newCand);
                setIsCandidateModalOpen(true);
              }}
            />
          )
        ) : (
          <CandidateExploreJobs 
            jobs={jobs}
            appliedJobIds={appliedJobIds}
            onApplyJob={handleCandidateApply}
            onNavigateToApplications={() => {
              setActiveRole('hr');
              setCurrentView('applicants');
            }}
          />
        )}
      </div>

      {/* Candidate Detail Modal matching Screenshot (299)-(302) */}
      <CandidateDetailModal 
        candidate={selectedCandidate}
        candidatesList={candidates}
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        onSelectCandidate={cand => setSelectedCandidate(cand)}
        onUpdateStage={handleUpdateStage}
      />

      {/* Signals Modal matching Screenshot 013332 & 013336 */}
      <SignalsModal 
        isOpen={isSignalsModalOpen}
        onClose={() => setIsSignalsModalOpen(false)}
        onRunSignals={handleRunSignals}
      />

      {/* Stages Modal matching Screenshot 013319 */}
      <StagesModal 
        isOpen={isStagesModalOpen}
        onClose={() => setIsStagesModalOpen(false)}
        candidates={candidates}
      />

      {/* Post a Job Modal matching Screenshot 013402 */}
      <PostJobModal 
        isOpen={isPostJobModalOpen}
        onClose={() => {
          setIsPostJobModalOpen(false);
          setEditingJob(null);
        }}
        onSaveJob={handleSaveJob}
        jobToEdit={editingJob}
      />

      {/* 12-Gate Architecture Inspector Modal */}
      <GateShieldModal 
        isOpen={isGateShieldModalOpen}
        onClose={() => setIsGateShieldModalOpen(false)}
      />
    </div>
  );
};

export default App;
