import React from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Award, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  ExternalLink,
  FolderCheck
} from 'lucide-react';
import { ExecutiveReport } from '../types/ats';

interface ExecutiveReportModalProps {
  report: ExecutiveReport;
  jobTitle: string;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  report,
  jobTitle,
  onClose
}) => {
  const { summary } = report;

  const downloadFile = (path: string, defaultName: string) => {
    // In local dev, report paths are written to disk at reports/{job_id}/report_...
    const link = document.createElement('a');
    link.href = `http://localhost:1234/api/jobs/${report.report_id.split('_')[1]}/export-csv`;
    link.download = defaultName;
    link.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1.5rem'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0d1322',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Executive Hiring Report</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Requisition: <strong>{jobTitle}</strong> • Report ID: <code>{report.report_id}</code>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* File Storage Notification Banner */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <FolderCheck size={24} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                Report Artifacts Persisted Locally
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Saved strictly organized under: <code>{report.json_path}</code> and <code>{report.csv_path}</code>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.85rem'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Pool Evaluated</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem' }}>
                {summary.total_applicants}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shortlisted Cohort</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                {summary.shortlisted_count}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                  ({summary.shortlisted_rate}%)
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Under Review</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                {summary.under_review_count}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Fit Score</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', marginTop: '0.25rem' }}>
                {summary.average_calibrated_score}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
          </div>

          {/* Top Cohort Highlight */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={18} color="#fbbf24" /> Top Recommendation Cohort
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {summary.top_candidate}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Top Ranked Candidate across 12-Gate verification
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px'
                }}>
                  {summary.top_candidate_score}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Generated with deterministic calibrated weights
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <a
              href={`http://localhost:1234/api/jobs/${report.report_id.split('_')[1]}/export-csv`}
              download={`report_${report.report_id}.csv`}
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={15} />
              Download Report CSV
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};
