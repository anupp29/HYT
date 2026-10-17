import React from 'react';
import { 
  Briefcase, 
  Users, 
  Moon, 
  Sun, 
  Sparkles, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck,
  Building,
  Play,
  Globe,
  Home
} from 'lucide-react';
import { CURRENT_HR_USER, CURRENT_CANDIDATE_USER } from '../data/mockdata';

interface HeaderProps {
  currentView: 'home' | 'jobs' | 'applicants' | 'candidate-portal' | 'candidate-explore-jobs' | 'careers';
  currentJobTitle?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeRole: 'hr' | 'candidate';
  onSwitchRole: (role: 'hr' | 'candidate') => void;
  onNavigate: (view: 'home' | 'jobs' | 'applicants' | 'candidate-portal' | 'candidate-explore-jobs' | 'careers') => void;
  onOpenSignals: () => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentJobTitle = "Senior Full Stack Engineer",
  theme,
  onToggleTheme,
  activeRole,
  onSwitchRole,
  onNavigate,
  onOpenSignals,
  onOpenTour
}) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => onNavigate('home')}
            title="Return to HuntYourTribe Home"
          >
            <Building size={16} /> HuntYourTribe
          </span>
          <ChevronRight size={14} />
          {activeRole === 'hr' ? (
            currentView === 'jobs' ? (
              <span className="breadcrumb-active">Job Postings</span>
            ) : currentView === 'careers' ? (
              <span className="breadcrumb-active">Hosted Careers Page</span>
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
            currentView === 'candidate-explore-jobs' ? (
              <>
                <span 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('candidate-portal')}
                >
                  Candidate Portal
                </span>
                <ChevronRight size={14} />
                <span className="breadcrumb-active">Explore Open Positions</span>
              </>
            ) : (
              <span className="breadcrumb-active">My Applications & Status</span>
            )
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Product Tour Trigger (#tour) */}
        {onOpenTour && (
          <button 
            className="btn-secondary"
            onClick={onOpenTour}
            style={{ 
              padding: '6px 12px', 
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 201, 94, 0.12)',
              borderColor: 'rgba(255, 201, 94, 0.35)',
              color: '#B45309'
            }}
            title="Interactive ATS Product Tour (huntyourtribe.com/ats#tour)"
          >
            <Play size={13} fill="#D97706" color="#D97706" />
            <span>Product Tour</span>
          </button>
        )}

        {/* Signals Quick Launcher (HR Only) */}
        {activeRole === 'hr' && (
          <button 
            className="btn-secondary"
            onClick={onOpenSignals}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            <Sparkles size={15} color="#D97706" />
            <span>Signals</span>
          </button>
        )}

        {/* Role Switcher Pill (Recruiter vs Candidate) */}
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
            <span>Recruiter (HR)</span>
          </button>
          <button 
            className={`role-switch-btn ${activeRole === 'candidate' ? 'active' : ''}`}
            onClick={() => {
              onSwitchRole('candidate');
              onNavigate('candidate-portal');
            }}
            title="Switch to Candidate Portal"
          >
            <UserCheck size={14} />
            <span>Candidate</span>
          </button>
        </div>

        {/* Home Button */}
        <button 
          className="icon-button"
          onClick={() => onNavigate('home')}
          title="Return to HuntYourTribe Home (Landing Page)"
        >
          <Home size={16} />
        </button>

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
              background: activeRole === 'hr' ? CURRENT_HR_USER.avatar_color : '#10B981',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12
            }}
          >
            {activeRole === 'hr' ? CURRENT_HR_USER.avatar_initial : 'B'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {activeRole === 'hr' ? CURRENT_HR_USER.name : CURRENT_CANDIDATE_USER.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {activeRole === 'hr' ? 'Recruiter' : 'Candidate'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
