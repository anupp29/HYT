import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JobPostingsView } from './components/JobPostingsView';
import { ApplicantsDashboard } from './components/ApplicantsDashboard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { PostJobModal } from './components/PostJobModal';
import { GateShieldModal } from './components/GateShieldModal';
import { CandidateExploreJobs } from './components/CandidateExploreJobs';
import { AnalyticsView } from './components/AnalyticsView';
import { MOCK_JOBS, MOCK_CANDIDATES } from './data/mockdata';
import { CandidateRecord, CandidateStage, JobDescription } from './types/ats';
import { api, BackendHealth } from './services/api';

export const App: React.FC = () => {
  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'hr' | 'candidate'>('hr');
  const [currentView, setCurrentView] = useState<'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics'>('applicants');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // Data State
  const [jobs, setJobs] = useState<JobDescription[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobDescription>(MOCK_JOBS[0]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>(MOCK_CANDIDATES);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(['2234533717']);
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null);

  // Modals & Drawers (6-Core surface)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState<boolean>(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [isGateShieldModalOpen, setIsGateShieldModalOpen] = useState<boolean>(false);

  // Initial load: Fetch real Jobs & Health from FastAPI backend
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const health = await api.checkHealth();
        if (isMounted && health) {
          setBackendStatus(health);
        }

        const liveJobs = await api.getJobs();
        if (isMounted && liveJobs && liveJobs.length > 0) {
          setJobs(liveJobs);
          setSelectedJob(liveJobs[0]);
        }
      } catch (e) {
        console.warn('Backend initial fetch notice:', e);
      }
    };
    initData();
    return () => { isMounted = false; };
  }, []);

  // Sync candidates when selectedJob changes
  useEffect(() => {
    let isMounted = true;
    const loadCandidates = async () => {
      if (!selectedJob?.job_id) return;
      try {
        const liveCands = await api.getCandidates(selectedJob.job_id);
        if (isMounted && liveCands) {
          setCandidates(liveCands);
        }
      } catch (e) {
        console.warn('Error syncing candidates for job:', e);
      }
    };
    loadCandidates();
    return () => { isMounted = false; };
  }, [selectedJob?.job_id]);

  // Sync Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle stage update
  const handleUpdateStage = async (candidateId: string, stage: CandidateStage) => {
    setCandidates(prev => prev.map(c => {
      if (c.candidate_id === candidateId) {
        return { ...c, stage };
      }
      return c;
    }));

    if (selectedCandidate && selectedCandidate.candidate_id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, stage });
    }

    // Persist to SQLite backend
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

  // Handle candidate applying with proof to an open job
  const handleCandidateApply = async (job: JobDescription, applicationData: any) => {
    if (!appliedJobIds.includes(job.job_id)) {
      setAppliedJobIds(prev => [...prev, job.job_id]);
    }
    // Re-fetch candidates for this job
    const refreshed = await api.getCandidates(job.job_id);
    if (refreshed) {
      setCandidates(refreshed);
    }
    setCurrentView('applicants');
  };

  return (
    <div className="app-container">
      {/* Sleek Dark Left Sidebar */}
      <Sidebar 
        currentView={currentView}
        onNavigate={view => {
          if (view === 'candidate-explore-jobs') {
            setActiveRole('candidate');
            setCurrentView('candidate-explore-jobs');
          } else if (view === 'jobs' || view === 'applicants' || view === 'analytics') {
            setActiveRole('hr');
            setCurrentView(view);
          }
        }}
        activeRole={activeRole}
        onOpenSignals={() => {}}
        onOpenGateShield={() => setIsGateShieldModalOpen(true)}
        onOpenTour={() => {}}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main App Content Viewport */}
      <div className="main-wrapper">
        <Header 
          currentView={currentView}
          currentJobTitle={selectedJob.title}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          activeRole={activeRole}
          onSwitchRole={role => {
            setActiveRole(role);
            setCurrentView(role === 'hr' ? 'applicants' : 'candidate-explore-jobs');
          }}
          onNavigate={view => {
            if (view === 'jobs' || view === 'applicants' || view === 'analytics' || view === 'candidate-explore-jobs') {
              setCurrentView(view);
            }
          }}
          onOpenSignals={() => {}}
          onOpenTour={() => {}}
        />

        {/* Core 6-Surface View Switcher */}
        {activeRole === 'hr' ? (
          currentView === 'jobs' ? (
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
          ) : currentView === 'analytics' ? (
            <AnalyticsView />
          ) : (
            <ApplicantsDashboard 
              job={selectedJob}
              jobs={jobs}
              onSelectJob={handleSelectJob}
              candidates={candidates}
              onSelectCandidate={handleSelectCandidate}
              onUpdateStage={handleUpdateStage}
              onOpenSignals={() => {}}
              onEditJob={() => {
                setEditingJob(selectedJob);
                setIsPostJobModalOpen(true);
              }}
              onOpenStages={() => {}}
              onOpenOutreach={() => {}}
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
            onNavigateToApplications={() => setCurrentView('applicants')}
          />
        )}
      </div>

      {/* Candidate Detail Modal / Drawer with 12-Gate Evidence Ledger */}
      <CandidateDetailModal 
        candidate={selectedCandidate}
        candidatesList={candidates}
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        onSelectCandidate={cand => setSelectedCandidate(cand)}
        onUpdateStage={handleUpdateStage}
      />

      {/* Create / Edit Job Modal */}
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
