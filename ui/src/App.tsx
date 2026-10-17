import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JobPostingsView } from './components/JobPostingsView';
import { ApplicantsDashboard } from './components/ApplicantsDashboard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { PostJobModal } from './components/PostJobModal';
import { SignalsModal } from './components/SignalsModal';
import { GateShieldModal } from './components/GateShieldModal';
import { CandidatePortal } from './components/CandidatePortal';
import { CandidateExploreJobs } from './components/CandidateExploreJobs';
import { TourModal } from './components/TourModal';
import { OutreachModal } from './components/OutreachModal';
import { StagesModal } from './components/StagesModal';
import { CareersPageView } from './components/CareersPageView';
import { HomePage } from './components/HomePage';
import { AnalyticsView } from './components/AnalyticsView';
import { MOCK_JOBS, MOCK_CANDIDATES } from './data/mockdata';
import { CandidateRecord, CandidateStage, JobDescription } from './types/ats';

export const App: React.FC = () => {
  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'hr' | 'candidate'>('hr');
  const [currentView, setCurrentView] = useState<'home' | 'jobs' | 'applicants' | 'candidate-portal' | 'candidate-explore-jobs' | 'careers' | 'analytics'>('applicants');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // Data State
  const [jobs, setJobs] = useState<JobDescription[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobDescription>(MOCK_JOBS[0]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>(MOCK_CANDIDATES);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(['job-swe-01']);
  const [appliedJobsList, setAppliedJobsList] = useState<JobDescription[]>([MOCK_JOBS[0]]);

  // Modals & Drawers
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState<boolean>(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [isSignalsModalOpen, setIsSignalsModalOpen] = useState<boolean>(false);
  const [isGateShieldModalOpen, setIsGateShieldModalOpen] = useState<boolean>(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState<boolean>(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState<boolean>(false);

  // Sync Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle URL hash changes (huntyourtribe.com/ats#tour)
  useEffect(() => {
    if (window.location.hash === '#tour') {
      setIsTourModalOpen(true);
    }
    const handleHashChange = () => {
      if (window.location.hash === '#tour') {
        setIsTourModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle stage update
  const handleUpdateStage = (candidateId: string, stage: CandidateStage) => {
    setCandidates(prev => prev.map(c => {
      if (c.candidate_id === candidateId) {
        return { ...c, stage };
      }
      return c;
    }));

    if (selectedCandidate && selectedCandidate.candidate_id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, stage });
    }
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
  const handleSaveJob = (savedJob: JobDescription) => {
    setJobs(prev => {
      const exists = prev.some(j => j.job_id === savedJob.job_id);
      if (exists) {
        return prev.map(j => j.job_id === savedJob.job_id ? savedJob : j);
      }
      return [savedJob, ...prev];
    });
    setSelectedJob(savedJob);
    setEditingJob(null);
  };

  // Handle candidate applying with proof to an open job
  const handleCandidateApply = (job: JobDescription, applicationData: any) => {
    if (!appliedJobIds.includes(job.job_id)) {
      setAppliedJobIds(prev => [...prev, job.job_id]);
      setAppliedJobsList(prev => [...prev, job]);
    }
  };

  // Handle running custom signals
  const handleRunSignals = (target: 'suggested' | 'all') => {
    setCandidates(prev => prev.map(c => {
      if (c.decision === 'AUTO_ADVANCE') {
        const bonus = 1.2;
        return {
          ...c,
          final_score: Math.min(100, c.final_score + bonus),
          top_strengths: [
            ...c.top_strengths,
            "Custom Signals Re-Evaluated: High technical depth and verified proof of work match."
          ]
        };
      }
      return c;
    }));
  };

  // If on HomePage, render the full-bleed landing page
  if (currentView === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <HomePage 
          onEnterRecruiter={() => {
            setActiveRole('hr');
            setCurrentView('applicants');
          }}
          onEnterCandidate={() => {
            setActiveRole('candidate');
            setCurrentView('candidate-portal');
          }}
          onOpenTour={() => setIsTourModalOpen(true)}
          onExploreJobs={() => {
            setActiveRole('candidate');
            setCurrentView('candidate-explore-jobs');
          }}
          jobs={jobs}
        />

        {/* Product Tour Modal directly accessible from Home */}
        <TourModal 
          isOpen={isTourModalOpen}
          onClose={() => {
            setIsTourModalOpen(false);
            if (window.location.hash === '#tour') {
              history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sleek Dark Left Sidebar */}
      <Sidebar 
        currentView={currentView}
        onNavigate={view => {
          setCurrentView(view);
          if (view === 'candidate-portal' || view === 'candidate-explore-jobs') {
            setActiveRole('candidate');
          }
          if (view === 'jobs' || view === 'applicants' || view === 'careers' || view === 'analytics') {
            setActiveRole('hr');
          }
        }}
        activeRole={activeRole}
        onOpenSignals={() => setIsSignalsModalOpen(true)}
        onOpenGateShield={() => setIsGateShieldModalOpen(true)}
        onOpenTour={() => setIsTourModalOpen(true)}
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
            setCurrentView(role === 'hr' ? 'applicants' : 'candidate-portal');
          }}
          onNavigate={view => setCurrentView(view)}
          onOpenSignals={() => setIsSignalsModalOpen(true)}
          onOpenTour={() => setIsTourModalOpen(true)}
        />

        {/* View Switcher */}
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
          ) : currentView === 'careers' ? (
            <CareersPageView 
              jobs={jobs}
              onApplyForJob={(job) => {
                setSelectedJob(job);
                setActiveRole('candidate');
                setCurrentView('candidate-explore-jobs');
              }}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsView />
          ) : (
            <ApplicantsDashboard 
              job={selectedJob}
              candidates={candidates}
              onSelectCandidate={handleSelectCandidate}
              onUpdateStage={handleUpdateStage}
              onOpenSignals={() => setIsSignalsModalOpen(true)}
              onEditJob={() => {
                setEditingJob(selectedJob);
                setIsPostJobModalOpen(true);
              }}
              onOpenStages={() => setIsStagesModalOpen(true)}
              onOpenOutreach={() => setIsOutreachModalOpen(true)}
            />
          )
        ) : (
          currentView === 'candidate-explore-jobs' ? (
            <CandidateExploreJobs 
              jobs={jobs}
              appliedJobIds={appliedJobIds}
              onApplyJob={handleCandidateApply}
              onNavigateToApplications={() => setCurrentView('candidate-portal')}
            />
          ) : (
            <CandidatePortal 
              jobs={jobs}
              currentCandidate={candidates[0]}
              appliedJobsList={appliedJobsList}
              onApplyNew={(data) => {
                alert("Proof of work submitted successfully! 12-Gate screening pipeline activated.");
              }}
              onExploreJobs={() => setCurrentView('candidate-explore-jobs')}
            />
          )
        )}
      </div>

      {/* Candidate Detail Modal / Drawer */}
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

      {/* Signals Drawer / Config */}
      <SignalsModal 
        isOpen={isSignalsModalOpen}
        onClose={() => setIsSignalsModalOpen(false)}
        onRunSignals={handleRunSignals}
      />

      {/* 12-Gate Architecture Inspector */}
      <GateShieldModal 
        isOpen={isGateShieldModalOpen}
        onClose={() => setIsGateShieldModalOpen(false)}
      />

      {/* Product Tour Modal (huntyourtribe.com/ats#tour) */}
      <TourModal 
        isOpen={isTourModalOpen}
        onClose={() => {
          setIsTourModalOpen(false);
          if (window.location.hash === '#tour') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
      />

      {/* Bulk Stage Email Outreach */}
      <OutreachModal 
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        job={selectedJob}
        candidates={candidates}
      />

      {/* Pipeline Stage Manager */}
      <StagesModal 
        isOpen={isStagesModalOpen}
        onClose={() => setIsStagesModalOpen(false)}
        candidates={candidates}
      />
    </div>
  );
};

export default App;
