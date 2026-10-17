import React from 'react';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Home, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck2,
  Send,
  Globe,
  Play,
  BarChart3
} from 'lucide-react';
import { CURRENT_HR_USER, CURRENT_CANDIDATE_USER } from '../data/mockdata';

interface SidebarProps {
  currentView: 'home' | 'jobs' | 'applicants' | 'candidate-portal' | 'candidate-explore-jobs' | 'careers' | 'analytics';
  onNavigate: (view: 'home' | 'jobs' | 'applicants' | 'candidate-portal' | 'candidate-explore-jobs' | 'careers' | 'analytics') => void;
  activeRole: 'hr' | 'candidate';
  onOpenSignals: () => void;
  onOpenGateShield: () => void;
  onOpenTour?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeRole,
  onOpenSignals,
  onOpenGateShield,
  onOpenTour,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-brand" onClick={() => onNavigate('home')} title="Return to HuntYourTribe Home">
          <div className="brand-icon">
            <Layers size={18} />
          </div>
          {isExpanded && (
            <span className="brand-title">HuntYourTribe</span>
          )}
        </div>

        {/* Navigation Section */}
        <div className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
            title="HuntYourTribe Home (Landing Page)"
          >
            <Home size={18} />
            {isExpanded && <span>Home</span>}
          </button>

          {activeRole === 'hr' ? (
            <>
              <button
                className={`sidebar-nav-item ${currentView === 'jobs' ? 'active' : ''}`}
                onClick={() => onNavigate('jobs')}
                title="Job Postings"
              >
                <Briefcase size={18} />
                {isExpanded && <span>Jobs</span>}
                {isExpanded && <span className="nav-badge">4</span>}
              </button>

              <button
                className={`sidebar-nav-item ${currentView === 'applicants' ? 'active' : ''}`}
                onClick={() => onNavigate('applicants')}
                title="Applicants Pipeline"
              >
                <Users size={18} />
                {isExpanded && <span>Applicants</span>}
                {isExpanded && <span className="nav-badge">51</span>}
              </button>

              <button
                className="sidebar-nav-item"
                onClick={onOpenSignals}
                title="Signals & Custom Scoring Weights"
              >
                <Sparkles size={18} />
                {isExpanded && <span>Signals & Weights</span>}
              </button>

              <button
                className="sidebar-nav-item"
                onClick={onOpenGateShield}
                title="12-Gate Integrity Shield & Policy Engine"
              >
                <ShieldCheck size={18} />
                {isExpanded && <span>12-Gate Shield</span>}
              </button>

              <button
                className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
                onClick={() => onNavigate('analytics')}
                title="AI Recruitment Pipeline Analytics & Benchmarks"
              >
                <BarChart3 size={18} />
                {isExpanded && <span>Analytics</span>}
              </button>

              <button
                className={`sidebar-nav-item ${currentView === 'careers' ? 'active' : ''}`}
                onClick={() => onNavigate('careers')}
                title="Hosted Careers Page (careers.huntyourtribe.com)"
              >
                <Globe size={18} />
                {isExpanded && <span>Careers Page</span>}
              </button>

              {onOpenTour && (
                <button
                  className="sidebar-nav-item"
                  onClick={onOpenTour}
                  title="Product Tour (#tour)"
                  style={{ color: '#FFC95E' }}
                >
                  <Play size={18} />
                  {isExpanded && <span>Product Tour</span>}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className={`sidebar-nav-item ${currentView === 'candidate-portal' ? 'active' : ''}`}
                onClick={() => onNavigate('candidate-portal')}
                title="Candidate Proof Portal"
              >
                <FileCheck2 size={18} />
                {isExpanded && <span>My Applications</span>}
                {isExpanded && <span className="nav-badge">1</span>}
              </button>

              <button
                className={`sidebar-nav-item ${currentView === 'candidate-explore-jobs' ? 'active' : ''}`}
                onClick={() => onNavigate('candidate-explore-jobs')}
                title="Browse Verified Job Openings"
              >
                <Briefcase size={18} />
                {isExpanded && <span>Explore Jobs</span>}
                {isExpanded && <span className="nav-badge">4</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-nav-item" 
          onClick={onToggleExpand} 
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          style={{ marginBottom: 4 }}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          {isExpanded && <span>Collapse Sidebar</span>}
        </button>

        <div className="user-profile-badge">
          <div 
            className="user-avatar-circle"
            style={{
              background: activeRole === 'hr' ? CURRENT_HR_USER.avatar_color : '#10B981'
            }}
          >
            {activeRole === 'hr' ? CURRENT_HR_USER.avatar_initial : 'B'}
          </div>
          {isExpanded && (
            <div style={{ flex: 1, overflow: 'hidden', lineHeight: 1.2 }}>
              <div style={{ color: '#FFF', fontSize: 13, fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {activeRole === 'hr' ? CURRENT_HR_USER.name : CURRENT_CANDIDATE_USER.name}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 11, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {activeRole === 'hr' ? CURRENT_HR_USER.email : CURRENT_CANDIDATE_USER.email}
              </div>
            </div>
          )}
          {isExpanded && <MoreVertical size={16} color="#9CA3AF" />}
        </div>
      </div>
    </aside>
  );
};
