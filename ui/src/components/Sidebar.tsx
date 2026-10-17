import React from 'react';
import { 
  Briefcase, 
  Users, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  UploadCloud
} from 'lucide-react';
import { CURRENT_HR_USER } from '../data/mockdata';

interface SidebarProps {
  currentView: 'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics' | string;
  onNavigate: (view: any) => void;
  activeRole: 'hr' | 'candidate';
  onOpenSignals?: () => void;
  onOpenGateShield: () => void;
  onOpenTour?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeRole,
  onOpenGateShield,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-brand" onClick={() => onNavigate('applicants')} title="HuntYourTribe ATS">
          <div className="brand-icon">
            <Layers size={18} />
          </div>
          {isExpanded && (
            <span className="brand-title">HuntYourTribe</span>
          )}
        </div>

        {/* Core Navigation Section */}
        <div className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${currentView === 'applicants' ? 'active' : ''}`}
            onClick={() => onNavigate('applicants')}
            title="Applicants Pipeline (Ranked & Filtered Candidates)"
          >
            <Users size={18} />
            {isExpanded && <span>Applicants</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'jobs' ? 'active' : ''}`}
            onClick={() => onNavigate('jobs')}
            title="Job Postings (6 Benchmark JDs)"
          >
            <Briefcase size={18} />
            {isExpanded && <span>Jobs</span>}
          </button>

          <button
            className="sidebar-nav-item"
            onClick={onOpenGateShield}
            title="12-Gate Deterministic Shield & Audit Trail"
          >
            <ShieldCheck size={18} />
            {isExpanded && <span>12-Gate Shield</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => onNavigate('analytics')}
            title="AI Pipeline Analytics & Decision Distribution"
          >
            <BarChart3 size={18} />
            {isExpanded && <span>Analytics</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'candidate-explore-jobs' ? 'active' : ''}`}
            onClick={() => onNavigate('candidate-explore-jobs')}
            title="Submit Resume & Run 12-Gate Pipeline"
          >
            <UploadCloud size={18} />
            {isExpanded && <span>Upload & Screen</span>}
          </button>
        </div>
      </div>

      {/* User Footer Profile & Sidebar Collapse Toggle */}
      <div>
        <div className="sidebar-user">
          <img
            src={CURRENT_HR_USER.avatar_url}
            alt={CURRENT_HR_USER.name}
            className="user-avatar"
          />
          {isExpanded && (
            <div className="user-info">
              <span className="user-name">{CURRENT_HR_USER.name}</span>
              <span className="user-role">{CURRENT_HR_USER.role}</span>
            </div>
          )}
        </div>

        <button 
          onClick={onToggleExpand}
          className="sidebar-toggle-btn"
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-end' : 'center',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer'
          }}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </aside>
  );
};
