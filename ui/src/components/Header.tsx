import React from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  Moon, 
  Sun,
  Sidebar as SidebarIcon
} from 'lucide-react';

interface HeaderProps {
  currentView: 'jobs' | 'applicants' | 'candidate-explore-jobs' | 'analytics' | string;
  currentJobTitle?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (view: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentJobTitle = "Senior Full Stack Engineer",
  theme,
  onToggleTheme,
  onNavigate
}) => {
  return (
    <header style={{
      height: '56px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E7E5E4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', color: '#78716C' }}>
        {/* Sidebar Icon matching reference */}
        <div style={{ display: 'flex', alignItems: 'center', color: '#191918', marginRight: '4px' }}>
          <SidebarIcon size={18} />
        </div>

        {currentView === 'jobs' ? (
          <span style={{ color: '#191918', fontWeight: 600 }}>
            Jobs
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onNavigate('jobs')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#44403C',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '13.5px',
                padding: 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#191918'}
              onMouseLeave={e => e.currentTarget.style.color = '#44403C'}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <span>|</span>
            <span 
              onClick={() => onNavigate('applicants')}
              style={{ cursor: 'pointer', color: '#78716C' }}
            >
              Applicants
            </span>
            <ChevronRight size={14} color="#A8A29E" />
            <span style={{ color: '#191918', fontWeight: 600 }}>
              {currentJobTitle}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            background: 'transparent',
            border: '1px solid #E7E5E4',
            borderRadius: '6px',
            padding: '6px',
            color: '#78716C',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
