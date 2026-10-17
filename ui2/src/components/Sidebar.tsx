import React from 'react';
import { 
  Briefcase, 
  Users, 
  ShieldCheck, 
  Home, 
  MoreVertical,
  Layers,
  BarChart3,
  UploadCloud
} from 'lucide-react';
import { CURRENT_HR_USER } from '../data/mockdata';

interface SidebarProps {
  currentView: 'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics' | string;
  onNavigate: (view: any) => void;
  activeRole: 'hr' | 'candidate';
  onOpenGateShield: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeRole,
  onOpenGateShield
}) => {
  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#191918',
      color: '#A8A29E',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      padding: '16px 12px',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      userSelect: 'none',
      zIndex: 40
    }}>
      <div>
        {/* Top Brand Logo matching Screenshot (305) */}
        <div 
          onClick={() => onNavigate('jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 8px 24px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#191918',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            flexShrink: 0
          }}>
            <Layers size={18} color="#191918" />
          </div>
          <span style={{
            color: '#F5F5F4',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.3px'
          }}>
            HuntYourTribe
          </span>
        </div>

        {/* Primary Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Jobs */}
          <button
            onClick={() => onNavigate('jobs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentView === 'jobs' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
              color: currentView === 'jobs' ? '#F5F5F4' : '#A8A29E',
              fontWeight: currentView === 'jobs' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (currentView !== 'jobs') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'jobs') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Briefcase size={18} color={currentView === 'jobs' ? '#F5F5F4' : '#A8A29E'} />
            <span>Jobs</span>
          </button>

          {/* Applicants */}
          <button
            onClick={() => onNavigate('applicants')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentView === 'applicants' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
              color: currentView === 'applicants' ? '#F5F5F4' : '#A8A29E',
              fontWeight: currentView === 'applicants' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (currentView !== 'applicants') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'applicants') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Users size={18} color={currentView === 'applicants' ? '#F5F5F4' : '#A8A29E'} />
            <span>Applicants</span>
          </button>

          {/* 12-Gate Shield Modal Trigger */}
          <button
            onClick={onOpenGateShield}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#A8A29E',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ShieldCheck size={18} color="#A8A29E" />
            <span>12-Gate Shield</span>
          </button>

          {/* Candidate Apply / Screening */}
          <button
            onClick={() => onNavigate('candidate-explore-jobs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentView === 'candidate-explore-jobs' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
              color: currentView === 'candidate-explore-jobs' ? '#F5F5F4' : '#A8A29E',
              fontWeight: currentView === 'candidate-explore-jobs' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (currentView !== 'candidate-explore-jobs') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'candidate-explore-jobs') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <UploadCloud size={18} color={currentView === 'candidate-explore-jobs' ? '#F5F5F4' : '#A8A29E'} />
            <span>Candidate Portal</span>
          </button>
        </nav>
      </div>

      {/* Bottom Profile Section matching Screenshot (305) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {/* Home */}
        <button
          onClick={() => onNavigate('jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#A8A29E',
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Home size={16} />
          <span>Home</span>
        </button>

        {/* User Card: Vishal Joshi */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#0285FA',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              V
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#F5F5F4', fontSize: '13px', fontWeight: 600 }}>
                {CURRENT_HR_USER.name}
              </span>
              <span style={{ color: '#78716C', fontSize: '11px' }}>
                {CURRENT_HR_USER.email}
              </span>
            </div>
          </div>
          <MoreVertical size={16} color="#78716C" />
        </div>
      </div>
    </aside>
  );
};
