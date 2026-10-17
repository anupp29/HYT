import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Code2, 
  ShieldCheck, 
  Check, 
  X, 
  Building2, 
  SlidersHorizontal,
  ChevronRight,
  Clock,
  Layers,
  Globe,
  Sliders,
  Award,
  Zap,
  Eye,
  FileText,
  UserCheck
} from 'lucide-react';
import { GithubIcon } from './Icons';
import { JobDescription } from '../types/ats';

interface CandidateExploreJobsProps {
  jobs: JobDescription[];
  onApplyJob: (job: JobDescription, applicationData: any) => void;
  onNavigateToApplications: () => void;
  appliedJobIds?: string[];
}

export const CandidateExploreJobs: React.FC<CandidateExploreJobsProps> = ({
  jobs,
  onApplyJob,
  onNavigateToApplications,
  appliedJobIds = ['job-swe-01']
}) => {
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('All');
  const [selectedRemotePolicy, setSelectedRemotePolicy] = useState<string>('All');
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobDescription | null>(null);

  // Candidate Match Parameters (Configurable by Candidate)
  const [candidateSkills, setCandidateSkills] = useState<string[]>([
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'FastAPI', 'System Design'
  ]);
  const [candidateExperience, setCandidateExperience] = useState<number>(4.2);
  const [isConfigureProfileOpen, setIsConfigureProfileOpen] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [jobToApply, setJobToApply] = useState<JobDescription | null>(null);
  const [applyStep, setApplyStep] = useState<number>(1);
  const [resumeFile, setResumeFile] = useState<string>('Bhushan_Mehar_Resume_2026.pdf');
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com/bhushanmehar/moakmate');
  const [liveUrl, setLiveUrl] = useState<string>('https://moakmate-demo.app');
  const [caseStudyText, setCaseStudyText] = useState<string>(
    'Architected an AI-native evaluation system with React 18, FastAPI, and Server-Sent Events. Solved streaming latency by introducing optimistic client state transitions.'
  );
  const [isVerifyingGithub, setIsVerifyingGithub] = useState<boolean>(false);
  const [githubVerified, setGithubVerified] = useState<boolean>(true);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Cosine-style Profile Match Calculation
  const calculateMatch = (job: JobDescription) => {
    // 1. Must-have skill overlap
    const matchingMustHaves = job.must_have_skills.filter(s => 
      candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    );
    const skillScore = (matchingMustHaves.length / Math.max(1, job.must_have_skills.length)) * 100;

    // 2. Experience match ratio
    const expRatio = Math.min(1.0, candidateExperience / Math.max(1, job.min_years_experience));
    const expScore = expRatio * 100;

    // 3. Composite score (Weighted vectors + proof bonus)
    const composite = Math.min(99.2, (skillScore * 0.65) + (expScore * 0.25) + 10);
    const finalScore = parseFloat(composite.toFixed(1));

    return {
      score: finalScore,
      matchingMustHaves,
      missingMustHaves: job.must_have_skills.filter(s => !matchingMustHaves.includes(s)),
      skillScore: Math.round(skillScore),
      expScore: Math.round(expScore),
      level: finalScore >= 85 ? 'High Match' : finalScore >= 70 ? 'Good Match' : 'Potential Stretch',
      color: finalScore >= 85 ? '#10B981' : finalScore >= 70 ? '#F59E0B' : '#0285FA'
    };
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (selectedPersona !== 'All' && job.persona !== selectedPersona) return false;
      if (selectedRemotePolicy !== 'All' && job.remote_policy !== selectedRemotePolicy.toLowerCase()) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkill = job.must_have_skills.some(s => s.toLowerCase().includes(q));
        const matchesDesc = job.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesSkill && !matchesDesc) return false;
      }
      return true;
    });
  }, [jobs, searchQuery, selectedPersona, selectedRemotePolicy]);

  const handleOpenApplyModal = (job: JobDescription) => {
    setJobToApply(job);
    setApplyStep(1);
    setSubmissionSuccess(false);
    setIsApplyModalOpen(true);
  };

  const handleSimulateVerifyGithub = () => {
    setIsVerifyingGithub(true);
    setTimeout(() => {
      setIsVerifyingGithub(false);
      setGithubVerified(true);
    }, 600);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToApply) return;

    onApplyJob(jobToApply, {
      resumeFile,
      githubUrl,
      liveUrl,
      caseStudyText,
      appliedAt: 'Just now'
    });

    setSubmissionSuccess(true);
    setTimeout(() => {
      setIsApplyModalOpen(false);
      onNavigateToApplications();
    }, 1200);
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!candidateSkills.includes(newSkillInput.trim())) {
      setCandidateSkills([...candidateSkills, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setCandidateSkills(candidateSkills.filter(s => s !== skill));
  };

  const getCompensationEstimate = (level: string) => {
    switch (level.toLowerCase()) {
      case 'lead': return '$160,000 - $210,000 • 0.35% Equity';
      case 'senior': return '$135,000 - $175,000 • 0.20% Equity';
      case 'mid': return '$105,000 - $135,000 • 0.10% Equity';
      default: return '$90,000 - $120,000 • Competitive';
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      {/* Top Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 133, 250, 0.08) 0%, rgba(255, 201, 94, 0.08) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '30px 32px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--ai-gold-bg)',
            color: 'var(--ai-gold-text)',
            border: '1px solid var(--ai-gold-border)',
            padding: '3px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 10
          }}>
            <Sparkles size={13} color="var(--ai-gold-text)" />
            Proof-of-Work Job Discovery & Real-Time Match
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: -0.5 }}>
            Explore Verified Engineering Positions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, maxWidth: 680, lineHeight: 1.5 }}>
            Each position displays an automated match score computed against your verified skills, experience, and GitHub evidence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Configure Profile Parameters Button */}
          <button 
            className="btn-secondary"
            onClick={() => setIsConfigureProfileOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13.5 }}
          >
            <SlidersHorizontal size={15} color="var(--primary-600)" />
            <span>Tune Match Profile ({candidateSkills.length} skills)</span>
          </button>

          <button 
            className="btn-primary"
            onClick={onNavigateToApplications}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13.5 }}
          >
            <Briefcase size={16} />
            <span>My Active Applications ({appliedJobIds.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search Input Row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search by role title, tech stack (React, Python, PostgreSQL), or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%', paddingLeft: 40, height: 40, fontSize: 13.5 }}
            />
          </div>

          {searchQuery && (
            <button 
              className="btn-secondary"
              onClick={() => setSearchQuery('')}
              style={{ padding: '8px 14px', fontSize: 12.5 }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Persona Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Role Domain:</span>
            {['All', 'Developer', 'Designer', 'Product Manager', 'Growth'].map(persona => (
              <button
                key={persona}
                onClick={() => setSelectedPersona(persona)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: selectedPersona === persona ? 700 : 500,
                  border: selectedPersona === persona ? '1.5px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  background: selectedPersona === persona ? 'rgba(2, 133, 250, 0.08)' : 'var(--bg-surface-subtle)',
                  color: selectedPersona === persona ? 'var(--primary-600)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {persona}
              </button>
            ))}
          </div>

          {/* Remote Policy Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Work Style:</span>
            {['All', 'Remote', 'Hybrid'].map(style => (
              <button
                key={style}
                onClick={() => setSelectedRemotePolicy(style)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 11.5,
                  fontWeight: selectedRemotePolicy === style ? 700 : 500,
                  border: selectedRemotePolicy === style ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                  background: selectedRemotePolicy === style ? 'var(--bg-surface-subtle)' : 'transparent',
                  color: selectedRemotePolicy === style ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Meta Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Showing {filteredJobs.length} open position{filteredJobs.length !== 1 ? 's' : ''} with proof-of-work hiring
        </span>

        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          ⚡ Matches calculated based on your technical skills and experience
        </span>
      </div>

      {/* Jobs Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {filteredJobs.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '50px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Building2 size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              No open roles found matching your criteria
            </h3>
            <p style={{ fontSize: 13 }}>
              Try clearing filters or search terms to browse all available engineering openings.
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const isApplied = appliedJobIds.includes(job.job_id);
            const match = calculateMatch(job);

            return (
              <div 
                key={job.job_id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
                className="hover-card"
              >
                {/* Header row: Company, Title, Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 46,
                      height: 46,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-600)',
                      fontWeight: 800,
                      fontSize: 18,
                      flexShrink: 0
                    }}>
                      {job.company[0]}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {job.title}
                        </h2>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          Actively Hiring
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.company}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {job.location}
                        </span>
                        <span>•</span>
                        <span style={{ textTransform: 'capitalize' }}>
                          {job.remote_policy} • {job.seniority_level} Level ({job.min_years_experience}+ yrs exp)
                        </span>
                        <span>•</span>
                        <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                          {getCompensationEstimate(job.seniority_level)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Apply / Status CTA Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isApplied ? (
                      <button 
                        className="btn-secondary"
                        onClick={onNavigateToApplications}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          fontSize: 13,
                          borderColor: '#10B981',
                          color: '#10B981'
                        }}
                      >
                        <Check size={14} />
                        <span>Applied • View Status</span>
                      </button>
                    ) : (
                      <button 
                        className="btn-primary"
                        onClick={() => handleOpenApplyModal(job)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 18px',
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        <span>Apply with Proof</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Basic, Clean Profile Match Scoreline */}
                <div style={{
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      background: match.color === '#10B981' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 133, 250, 0.15)',
                      color: match.color,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 12.5,
                      fontWeight: 800
                    }}>
                      {Math.round(match.score)}% Match • {match.level}
                    </span>

                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Matching skills: <strong>{match.matchingMustHaves.join(', ') || 'General engineering'}</strong>
                    </span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setIsConfigureProfileOpen(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-600)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>Update Your Skills ⚙</span>
                  </button>
                </div>

                {/* Description snippet */}
                <p style={{
                  fontSize: 13.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {job.description}
                </p>

                {/* Non-negotiable must haves & proof tags */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 14,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Verified Must-Haves:
                    </span>
                    {job.must_have_skills.map(skill => {
                      const isMatched = match.matchingMustHaves.includes(skill);
                      return (
                        <span 
                          key={skill}
                          style={{
                            background: isMatched ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-subtle)',
                            border: isMatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                            color: isMatched ? '#10B981' : 'var(--text-secondary)',
                            padding: '2px 9px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {isMatched ? <Check size={11} color="#10B981" /> : null}
                          {skill}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Code2 size={13} color="var(--primary-600)" /> Requires Public GitHub
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Globe size={13} color="var(--primary-600)" /> Requires Live URL
                    </span>
                    <span 
                      style={{ cursor: 'pointer', color: 'var(--primary-600)', fontWeight: 600 }}
                      onClick={() => setSelectedJobForDetail(job)}
                    >
                      View Full Spec ↗
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIGURE PROFILE MATCH PARAMETERS MODAL */}
      {isConfigureProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsConfigureProfileOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 620 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Tune Candidate Match Parameters
                </h3>
              </div>
              <button className="icon-button" onClick={() => setIsConfigureProfileOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: 24, gap: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Adjust your verified skills and experience level to recalculate your real-time cosine vector match scores across all open positions.
              </p>

              {/* Skills Tags */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  Your Core Technical Skills ({candidateSkills.length}):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {candidateSkills.map(s => (
                    <span 
                      key={s}
                      style={{
                        background: 'rgba(2, 133, 250, 0.1)',
                        border: '1px solid rgba(2, 133, 250, 0.3)',
                        color: 'var(--primary-600)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>{s}</span>
                      <X 
                        size={12} 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => handleRemoveSkill(s)} 
                      />
                    </span>
                  ))}
                </div>

                {/* Add Skill Input */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text"
                    placeholder="Add a skill (e.g. Docker, AWS, GraphQL, Go)..."
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}
                    className="search-input"
                    style={{ flex: 1, height: 36, fontSize: 13 }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleAddSkill}
                    style={{ padding: '0 14px', fontSize: 13 }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Years Experience Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Years of Engineering Experience:
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
                    {candidateExperience} Years
                  </span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={candidateExperience}
                  onChange={e => setCandidateExperience(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                />
              </div>

              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                fontSize: 12,
                color: 'var(--text-secondary)'
              }}>
                ✓ Cosine similarity scores and verified must-have overlaps update instantly across all 4 position cards.
              </div>
            </div>

            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-subtle)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button 
                className="btn-primary"
                onClick={() => setIsConfigureProfileOpen(false)}
                style={{ padding: '8px 20px', fontSize: 13 }}
              >
                Apply & Save Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOB DETAIL SPEC MODAL */}
      {selectedJobForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedJobForDetail(null)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 760, maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {selectedJobForDetail.company}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedJobForDetail.title}
                </h2>
              </div>

              <button 
                className="icon-button"
                onClick={() => setSelectedJobForDetail(null)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ gap: 20 }}>
              {/* Meta Stats Bar */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--text-secondary)'
              }}>
                <span>📍 {selectedJobForDetail.location}</span>
                <span>•</span>
                <span>💼 {selectedJobForDetail.seniority_level.toUpperCase()} ({selectedJobForDetail.min_years_experience}+ yrs exp)</span>
                <span>•</span>
                <span>💰 {getCompensationEstimate(selectedJobForDetail.seniority_level)}</span>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Role Description & Scope
                </h4>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {selectedJobForDetail.description}
                </div>
              </div>

              {/* Must-Haves */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Required Technical Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedJobForDetail.must_have_skills.map(s => (
                    <span 
                      key={s}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10B981',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Check size={12} /> {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nice to Haves */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Bonus & Preferred Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedJobForDetail.nice_to_have_skills.map(s => (
                    <span 
                      key={s}
                      style={{
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Evaluated on verified code and proof of work
              </span>

              <button 
                className="btn-primary"
                onClick={() => {
                  const job = selectedJobForDetail;
                  setSelectedJobForDetail(null);
                  handleOpenApplyModal(job);
                }}
                style={{ padding: '8px 20px', fontSize: 13.5 }}
              >
                Apply with Proof →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-STEP APPLY WITH PROOF MODAL (5 STEPS WITH SCENARIO PREVIEW) */}
      {isApplyModalOpen && jobToApply && (
        <div className="modal-overlay" onClick={() => setIsApplyModalOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 800, maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header-bar">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
                  <Sparkles size={12} /> Apply with Proof of Work
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  {jobToApply.title} ({jobToApply.company})
                </h2>
              </div>

              <button 
                className="icon-button"
                onClick={() => setIsApplyModalOpen(false)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0 24px',
              background: 'var(--bg-surface-subtle)'
            }}>
              {[
                { num: 1, label: 'Resume & PII' },
                { num: 2, label: 'GitHub Repository' },
                { num: 3, label: 'Live Deployed URL' },
                { num: 4, label: 'Case Study' },
                { num: 5, label: 'Scenario Preview' }
              ].map(st => (
                <button
                  key={st.num}
                  onClick={() => setApplyStep(st.num)}
                  style={{
                    padding: '12px 14px',
                    fontSize: 12,
                    fontWeight: applyStep === st.num ? 700 : 500,
                    borderBottom: applyStep === st.num ? '2px solid var(--primary-600)' : '2px solid transparent',
                    color: applyStep === st.num ? 'var(--primary-600)' : 'var(--text-tertiary)',
                    background: 'transparent',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: applyStep === st.num ? 'var(--primary-600)' : 'var(--border-subtle)',
                    color: applyStep === st.num ? '#FFF' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800
                  }}>
                    {st.num}
                  </span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFinalSubmit}>
              <div className="modal-body-scroll" style={{ padding: 24, gap: 20 }}>
                {/* STEP 1: Resume Document */}
                {applyStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Step 1: Upload Your Resume
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        Attach your authentic resume. Your contact details are masked during initial technical review to ensure fair, unbiased evaluation.
                      </p>
                    </div>

                    <div style={{
                      border: '2px dashed var(--border-strong)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 28,
                      textAlign: 'center',
                      background: 'var(--bg-surface-subtle)',
                      cursor: 'pointer'
                    }}>
                      <UploadCloud size={32} color="var(--primary-600)" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {resumeFile}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        PDF format • 1.2 MB • Ready for review
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      fontSize: 12.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 600 }}>
                        <Check size={16} /> Resume Document Authenticated
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <Check size={14} color="#10B981" /> Privacy Protection: Personal phone and home address are sanitized before technical review.
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: GitHub Repository */}
                {applyStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Step 2: Connect Public GitHub Code Repository
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        Showcase real production code, commit history, and technical architecture matching the role.
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Public GitHub Repository URL *
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: 12 }}>
                            <GithubIcon size={16} />
                          </span>
                          <input 
                            type="url"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            className="search-input"
                            style={{ width: '100%', paddingLeft: 38, height: 40, fontSize: 13 }}
                          />
                        </div>
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={handleSimulateVerifyGithub}
                          style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}
                        >
                          {isVerifyingGithub ? 'Auditing...' : 'Audit Repo'}
                        </button>
                      </div>
                    </div>

                    {/* Gate 4 Live Breakdown Box */}
                    {githubVerified && (
                      <div style={{
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Gate 4 Repository Audit: Verified Public Activity
                          </span>
                          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                            ✓ 142 commits in past 6 months
                          </span>
                        </div>

                        {/* Language Distribution Bar */}
                        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                          <div style={{ width: '48%', background: '#3178C6' }} title="TypeScript 48%" />
                          <div style={{ width: '35%', background: '#3572A5' }} title="Python 35%" />
                          <div style={{ width: '17%', background: '#F1E05A' }} title="JavaScript 17%" />
                        </div>

                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3178C6' }} /> TypeScript: 48.2%
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3572A5' }} /> Python: 34.8%
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F1E05A' }} /> JavaScript: 17.0%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Live Deployed URL */}
                {applyStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Step 3: Provide Live Working Web Deployment
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        Demonstrate that your code runs in production. Submit a live link hosted on Vercel, Netlify, AWS, Fly.io, or similar.
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Live Demo URL *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 12 }}>
                          <ExternalLink size={16} color="var(--text-tertiary)" />
                        </span>
                        <input 
                          type="url"
                          value={liveUrl}
                          onChange={e => setLiveUrl(e.target.value)}
                          className="search-input"
                          style={{ width: '100%', paddingLeft: 38, height: 40, fontSize: 13 }}
                        />
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                      <span>Ping Check Simulation: <strong>HTTP 200 OK</strong> (Response time: 240ms). Verifiable working deployment.</span>
                    </div>
                  </div>
                )}

                {/* STEP 4: Case Study Architecture Q&A */}
                {applyStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Step 4: Architectural Case Study Challenge
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        Explain the technical implementation of your submitted proof of work. What trade-offs did you make?
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Architecture Challenge: Describe an engineering bottleneck and how you designed around it:
                      </label>
                      <textarea
                        value={caseStudyText}
                        onChange={e => setCaseStudyText(e.target.value)}
                        rows={4}
                        className="search-input"
                        style={{ width: '100%', height: 'auto', padding: '12px', fontSize: 13, lineHeight: 1.5 }}
                      />
                    </div>

                    <div style={{
                      background: 'rgba(2, 133, 250, 0.05)',
                      border: '1px solid rgba(2, 133, 250, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      fontSize: 12.5,
                      color: 'var(--primary-700)'
                    }}>
                      ⚡ Your response will be reviewed by the engineering team for architectural reasoning and design trade-offs.
                    </div>
                  </div>
                )}

                {/* STEP 5: APPLICATION PREVIEW */}
                {applyStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                        <Eye size={12} /> Application Preview
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 4px' }}>
                        Step 5: Review Application Before Submission
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                        Review your profile and attached proof artifacts before submitting to the hiring team:
                      </p>
                    </div>

                    {/* Candidate Preview Card */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Bhushan Subhash Mehar
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                            Front end Developer, AI ML enthusiastic, Unity Developer
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            📍 Pune, Maharashtra, India • Contact: +91 ••••••••84 (Privacy Protected)
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10B981',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 13,
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {Math.round(calculateMatch(jobToApply).score)}% MATCH
                          </span>
                          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>
                            ✓ Strong Candidate Match
                          </div>
                        </div>
                      </div>

                      {/* Dossier Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
                        <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Resume Document
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                            ✓ Verified & Ready
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            Doc: {resumeFile}
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Public GitHub Repository
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                            {githubUrl.replace('https://github.com/', '@')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            142 commits • 48% TypeScript, 35% Python
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Live Deployed Application
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                            ✓ HTTP 200 OK (240ms)
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {liveUrl}
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Matching Key Skills
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                            {calculateMatch(jobToApply).matchingMustHaves.length} Required Skills Satisfied
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {calculateMatch(jobToApply).matchingMustHaves.join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Case Study Snippet */}
                      <div style={{ marginTop: 12, background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Architectural Bottleneck Resolution Snippet:
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{caseStudyText}"
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission Success Toast */}
                {submissionSuccess && (
                  <div style={{
                    background: 'var(--status-advance-bg)',
                    border: '1px solid #10B981',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    color: 'var(--status-advance-text)',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: 13
                  }}>
                    ✓ Proof of Work Submitted Successfully! Redirecting to 12-Gate Screening Progress...
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setApplyStep(prev => Math.max(1, prev - 1))}
                  disabled={applyStep === 1}
                  style={{ opacity: applyStep === 1 ? 0.3 : 1 }}
                >
                  Back
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {applyStep < 5 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setApplyStep(prev => Math.min(5, prev + 1))}
                      style={{ padding: '8px 20px', fontSize: 13 }}
                    >
                      {applyStep === 4 ? 'Preview Recruiter Dossier →' : 'Next Step →'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submissionSuccess}
                      style={{ padding: '8px 26px', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, background: '#10B981', borderColor: '#10B981' }}
                    >
                      <Sparkles size={15} />
                      <span>Confirm & Submit Application</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
