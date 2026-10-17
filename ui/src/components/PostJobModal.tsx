import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Check, 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link2, 
  Image, 
  Minus,
  Sparkles,
  HelpCircle,
  Plus
} from 'lucide-react';
import { JobDescription } from '../types/ats';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (job: JobDescription) => void;
  jobToEdit?: JobDescription | null;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  onSaveJob,
  jobToEdit = null
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');
  const [persona, setPersona] = useState<string>('Developer');
  const [title, setTitle] = useState<string>('Senior Full Stack Engineer');
  const [company, setCompany] = useState<string>('HuntYourTribe');
  const [positionType, setPositionType] = useState<string>('Full-time');
  const [minExp, setMinExp] = useState<number>(4);
  const [seniority, setSeniority] = useState<string>('senior');
  const [location, setLocation] = useState<string>('Bengaluru, India');
  const [remotePolicy, setRemotePolicy] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [description, setDescription] = useState<string>(
    'We are looking for a Senior Full Stack Engineer with strong React, Node.js and PostgreSQL fundamentals to build deterministic, verifiable AI workflows.'
  );
  const [mustHaves, setMustHaves] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
  const [newSkill, setNewSkill] = useState<string>('');

  // Proof of work questions
  const [askGithub, setAskGithub] = useState<boolean>(true);
  const [askLiveUrl, setAskLiveUrl] = useState<boolean>(true);
  const [customQuestion, setCustomQuestion] = useState<string>(
    'Describe the most complex architectural trade-off you resolved in a recent web application.'
  );

  // Sync state if jobToEdit is provided
  React.useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setCompany(jobToEdit.company);
      setPersona(jobToEdit.persona || 'Developer');
      setSeniority(jobToEdit.seniority_level || 'senior');
      setMinExp(jobToEdit.min_years_experience || 4);
      setLocation(jobToEdit.location || 'Bengaluru, India');
      setRemotePolicy((jobToEdit.remote_policy as any) || 'remote');
      setDescription(jobToEdit.description || '');
      setMustHaves(jobToEdit.must_have_skills || ['React', 'TypeScript', 'Node.js']);
    } else {
      setTitle('Senior Full Stack Engineer');
      setCompany('HuntYourTribe');
      setPersona('Developer');
      setSeniority('senior');
      setMinExp(4);
      setLocation('Bengaluru, India');
      setRemotePolicy('remote');
      setDescription('We are looking for a Senior Full Stack Engineer with strong React, Node.js and PostgreSQL fundamentals to build deterministic, verifiable AI workflows.');
      setMustHaves(['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddMustHave = () => {
    if (newSkill.trim() && !mustHaves.includes(newSkill.trim())) {
      setMustHaves([...mustHaves, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveMustHave = (skill: string) => {
    setMustHaves(mustHaves.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedJob: JobDescription = {
      job_id: jobToEdit ? jobToEdit.job_id : `job-${Date.now()}`,
      title,
      company,
      seniority_level: seniority as any,
      min_years_experience: minExp,
      must_have_skills: mustHaves,
      nice_to_have_skills: jobToEdit ? jobToEdit.nice_to_have_skills : ['FastAPI', 'Docker', 'AWS'],
      education_requirement: jobToEdit ? jobToEdit.education_requirement : "Bachelor's degree or practical demonstration",
      location,
      remote_policy: remotePolicy,
      posted_at: jobToEdit ? jobToEdit.posted_at : 'Just now',
      active: true,
      applicant_count: jobToEdit ? jobToEdit.applicant_count : 0,
      persona,
      description
    };
    onSaveJob(updatedJob);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="job-logo-box" style={{ width: 28, height: 28 }}>
              <Briefcase size={16} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {jobToEdit ? 'Edit Job Description & Proof Parameters' : 'Create New Job Posting'}
            </span>
          </div>

          <button 
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Tab Bar: Job Details vs Additional Questions */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface-subtle)',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'details' ? '2px solid var(--primary-600)' : '2px solid transparent',
              color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'details' ? 700 : 500,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Briefcase size={15} />
            <span>Job Details</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'questions' ? '2px solid var(--primary-600)' : '2px solid transparent',
              color: activeTab === 'questions' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'questions' ? 700 : 500,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Sparkles size={15} color="#D97706" />
            <span>Ask For Proof & Questions</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-scroll" style={{ flex: 1 }}>
            {activeTab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Job Persona Dropdown */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    Job Persona *
                  </label>
                  <select 
                    className="filter-select"
                    value={persona}
                    onChange={e => setPersona(e.target.value)}
                    style={{ padding: '9px 12px' }}
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                {/* Job Title & Company */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Job Title *
                    </label>
                    <input 
                      type="text"
                      className="search-input"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      style={{ 
                        border: '1px solid var(--border-subtle)', 
                        padding: '9px 12px', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Company *
                    </label>
                    <input 
                      type="text"
                      className="search-input"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      style={{ 
                        border: '1px solid var(--border-subtle)', 
                        padding: '9px 12px', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Position Type, Seniority & Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Position Type *
                    </label>
                    <select 
                      className="filter-select"
                      value={positionType}
                      onChange={e => setPositionType(e.target.value)}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Seniority Level *
                    </label>
                    <select 
                      className="filter-select"
                      value={seniority}
                      onChange={e => setSeniority(e.target.value)}
                    >
                      <option value="junior">Junior (0-2 yrs)</option>
                      <option value="mid">Mid-level (2-4 yrs)</option>
                      <option value="senior">Senior (4-7 yrs)</option>
                      <option value="lead">Lead / Staff (7+ yrs)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Work Experience (Min Yrs) *
                    </label>
                    <input 
                      type="number"
                      className="search-input"
                      value={minExp}
                      onChange={e => setMinExp(Number(e.target.value))}
                      min={0}
                      max={20}
                      style={{ 
                        border: '1px solid var(--border-subtle)', 
                        padding: '8px 12px', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Must Have Skills (Gate 6 Hard Gate) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Strict Must-Have Skills (Gate 6 Hard Gate) *
                    </label>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Non-negotiable skills for deterministic ATS evaluation
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input 
                      type="text"
                      className="search-input"
                      placeholder="e.g. React, PostgreSQL, Docker..."
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMustHave();
                        }
                      }}
                      style={{ 
                        border: '1px solid var(--border-subtle)', 
                        padding: '8px 12px', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)'
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleAddMustHave}
                      style={{ padding: '8px 16px' }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {mustHaves.map(skill => (
                      <span 
                        key={skill} 
                        className="skill-pill"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          background: 'var(--primary-50)', 
                          borderColor: 'var(--primary-100)',
                          color: 'var(--primary-700)',
                          padding: '4px 10px'
                        }}
                      >
                        {skill}
                        <X 
                          size={12} 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveMustHave(skill)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rich Text Editor Simulation */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    Job Description *
                  </label>

                  {/* Formatting Toolbar */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '8px 12px', 
                    background: 'var(--bg-surface-subtle)', 
                    border: '1px solid var(--border-subtle)',
                    borderBottom: 'none',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0'
                  }}>
                    <select style={{ fontSize: 12, border: 'none', background: 'transparent', outline: 'none' }}>
                      <option>Normal</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <span style={{ color: 'var(--border-strong)' }}>|</span>
                    <Bold size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <Italic size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <Strikethrough size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--border-strong)' }}>|</span>
                    <List size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <ListOrdered size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <Link2 size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <Image size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <Minus size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {description.length} / 20000
                    </span>
                  </div>

                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      fontFamily: 'inherit',
                      fontSize: 13.5,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>
              </div>
            ) : (
              /* Proof of Work & Screening Questions Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ 
                  background: 'var(--ai-gold-bg)', 
                  border: '1px solid var(--ai-gold-border)', 
                  borderRadius: 'var(--radius-md)',
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Sparkles size={16} color="#D97706" />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ai-gold-text)' }}>
                      Ask for Proof: Eliminate Resume Bluffing
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Move away from keyword stuffing and boolean search. Ask applicants for public proof of work, verifiable GitHub repositories, and live project deployments that our 12-gate audit engine verifies.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* GitHub Repo Toggle */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-subtle)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        Require Public GitHub Handle & Repository
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        Gate 4 will verify language breakdowns, recent commit frequency, and PR history.
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={askGithub}
                      onChange={e => setAskGithub(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary-600)' }}
                    />
                  </label>

                  {/* Live URL Toggle */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-subtle)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        Require Live Deployed Project URL
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        Candidate must supply working web application or demo link.
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={askLiveUrl}
                      onChange={e => setAskLiveUrl(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary-600)' }}
                    />
                  </label>

                  {/* Custom Architecture Question */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Screening Architecture Question
                    </label>
                    <textarea 
                      value={customQuestion}
                      onChange={e => setCustomQuestion(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-subtle)', 
            background: 'var(--bg-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12
          }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
            >
              <Check size={16} />
              <span>{jobToEdit ? 'Save Changes' : 'Publish Job Posting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
