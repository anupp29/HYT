import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  Edit3, 
  Share2, 
  Users, 
  ArrowRight, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { JobDescription } from '../types/ats';

interface JobPostingsViewProps {
  jobs: JobDescription[];
  onSelectJob: (job: JobDescription) => void;
  onOpenCreateJob: () => void;
  onEditJob?: (job: JobDescription) => void;
}

export const JobPostingsView: React.FC<JobPostingsViewProps> = ({
  jobs,
  onSelectJob,
  onOpenCreateJob,
  onEditJob
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredJobs = jobs.filter(j => activeTab === 'active' ? j.active : !j.active);

  const handleShare = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-container">
      {/* Title & Action Row */}
      <div className="page-header-row">
        <div>
          <div className="job-title-group">
            <div className="job-logo-box" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
              <Briefcase size={20} color="#FFFFFF" />
            </div>
            <h1 className="page-title">Job Postings</h1>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
            Manage and track your active job postings and candidate pipelines.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={onOpenCreateJob}
          id="btn-post-a-job"
        >
          <Plus size={16} />
          <span>Post a Job</span>
        </button>
      </div>

      {/* Segmented Control (Active | Inactive) */}
      <div style={{ display: 'flex', marginBottom: 24 }}>
        <div style={{ 
          background: 'var(--bg-surface-subtle)', 
          padding: 4, 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 4
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '6px 20px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'active' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'active' ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'active' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Active ({jobs.filter(j => j.active).length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            style={{
              padding: '6px 20px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'inactive' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'inactive' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'inactive' ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'inactive' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Inactive (0)
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredJobs.map((job, idx) => (
          <div
            key={job.job_id}
            onClick={() => onSelectJob(job)}
            style={{
              background: 'var(--bg-surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Left side info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div 
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-md)',
                  background: idx % 2 === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  color: idx % 2 === 0 ? '#10B981' : '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Building2 size={24} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {job.title}
                  </h3>
                  <span className="badge-active">
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-tertiary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={14} /> {job.posted_at}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={14} /> {job.applicant_count} applicants evaluated
                  </span>
                  <span>•</span>
                  <span>{job.company}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditJob) {
                    onEditJob(job);
                  } else {
                    onSelectJob(job);
                  }
                }}
                style={{ fontSize: 13, padding: '7px 14px' }}
                title="Edit Job Description & Proof Requirements"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>

              <button
                className="btn-secondary"
                onClick={(e) => handleShare(e, job.job_id)}
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                {copiedId === job.job_id ? (
                  <>
                    <CheckCircle2 size={14} color="#10B981" />
                    <span style={{ color: '#10B981' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                className="btn-primary"
                onClick={() => onSelectJob(job)}
                style={{ fontSize: 13, padding: '7px 16px' }}
              >
                <span>View Candidates</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
