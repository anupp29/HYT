import React from 'react';
import { 
  Briefcase, 
  Users, 
  Moon, 
  Sun, 
  ChevronRight, 
  Building
} from 'lucide-react';
import { CURRENT_HR_USER } from '../data/mockdata';

interface HeaderProps {
  currentView: 'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics' | string;
  currentJobTitle?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeRole: 'hr' | 'candidate';
  onSwitchRole: (role: 'hr' | 'candidate') => void;
  onNavigate: (view: any) => void;
  onOpenSignals?: () => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentJobTitle = "Senior Full Stack Engineer",
  theme,
  onToggleTheme,
  activeRole,
  onSwitchRole,
  onNavigate
}) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            onClick={() => onNavigate('applicants')}
            title="HuntYourTribe ATS"
          >
            <Building size={16} /> HuntYourTribe
          </span>
          <ChevronRight size={14} />
          {activeRole === 'hr' ? (
            currentView === 'jobs' ? (
              <span className="breadcrumb-active">Job Postings</span>
            ) : currentView === 'analytics' ? (
              <span className="breadcrumb-active">Pipeline Analytics & Benchmarks</span>
            ) : (
              <>
                <span 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('jobs')}
                >
                  Jobs
                </span>
                <ChevronRight size={14} />
                <span className="breadcrumb-active">{currentJobTitle}</span>
              </>
            )
          ) : (
            <span className="breadcrumb-active">Apply & Screen Resume</span>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Role Switcher Pill */}
        <div className="role-switcher">
          <button 
            className={`role-switch-btn ${activeRole === 'hr' ? 'active' : ''}`}
            onClick={() => {
              onSwitchRole('hr');
              onNavigate('applicants');
            }}
            title="Switch to Recruiter Dashboard"
          >
            <Users size={14} />
            <span>Recruiter</span>
          </button>
          <button 
            className={`role-switch-btn ${activeRole === 'candidate' ? 'active' : ''}`}
            onClick={() => {
              onSwitchRole('candidate');
              onNavigate('candidate-explore-jobs');
            }}
            title="Upload Candidate Resume"
          >
            <Briefcase size={14} />
            <span>Apply</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <button 
          className="icon-button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile Snippet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
          <div 
            style={{ 
              width: 30, 
              height: 30, 
              borderRadius: '50%', 
              background: CURRENT_HR_USER.avatar_color,
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12
            }}
          >
            {CURRENT_HR_USER.avatar_initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {CURRENT_HR_USER.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Recruiter
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
