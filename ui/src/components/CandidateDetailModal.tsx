import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Award, 
  GitBranch, 
  GitPullRequest, 
  Star, 
  Calendar, 
  Briefcase, 
  FileText, 
  Cpu, 
  Check, 
  Clock,
  MessageSquare,
  Send
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import { CandidateRecord, CandidateStage, DecisionType } from '../types/ats';

interface CandidateDetailModalProps {
  candidate: CandidateRecord | null;
  candidatesList: CandidateRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: CandidateRecord) => void;
  onUpdateStage: (candidateId: string, stage: CandidateStage) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  candidatesList,
  isOpen,
  onClose,
  onSelectCandidate,
  onUpdateStage
}) => {
  if (!isOpen || !candidate) return null;

  const [activeTab, setActiveTab] = useState<'pipeline' | 'ledger' | 'experience' | 'projects' | 'qa' | 'notes'>('pipeline');
  const [showMoveMenu, setShowMoveMenu] = useState<boolean>(false);
  const [showCopyMenu, setShowCopyMenu] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Team Evaluation & Notes State (huntyourtribe.com "Hire as a team")
  const [teamNotes, setTeamNotes] = useState<{ id: string; author: string; role: string; text: string; date: string; rating: number }[]>([
    {
      id: 'n-1',
      author: 'Sarah Jenkins',
      role: 'Staff Platform Engineer',
      text: 'Inspected GitHub repo and live proof of work. Clean domain model and deterministic error handling. Strong recommendation for technical interview.',
      date: '2 hours ago',
      rating: 5
    },
    {
      id: 'n-2',
      author: 'David Kim',
      role: 'Hiring Manager',
      text: 'Passed Gate 6 with 91.8 fit. Ledger verification confirmed 12+ months FastAPI & distributed systems experience.',
      date: 'Yesterday at 4:15 PM',
      rating: 5
    }
  ]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(5);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note = {
      id: `n-${Date.now()}`,
      author: 'You (Recruiter)',
      role: 'Technical Recruiter',
      text: newNoteText.trim(),
      date: 'Just now',
      rating: newRating
    };
    setTeamNotes([note, ...teamNotes]);
    setNewNoteText('');
  };

  const totalExpYears = candidate.experience?.reduce((acc, e) => acc + (e.years || 0), 0) || 2.5;
  const currentIndex = candidatesList.findIndex(c => c.candidate_id === candidate.candidate_id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < candidatesList.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectCandidate(candidatesList[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectCandidate(candidatesList[currentIndex + 1]);
  };

  const handleCopy = (type: 'id' | 'summary' | 'ledger') => {
    let textToCopy = '';
    if (type === 'id') textToCopy = candidate.candidate_id;
    if (type === 'summary') textToCopy = `${candidate.name} - Score: ${candidate.final_score} - Decision: ${candidate.decision}\n${candidate.explanation?.full_explanation || candidate.bio}`;
    if (type === 'ledger') textToCopy = JSON.stringify(candidate.ledger, null, 2);

    navigator.clipboard?.writeText(textToCopy);
    setCopiedNotification(`Copied ${type.toUpperCase()} to clipboard!`);
    setShowCopyMenu(false);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const getDecisionBadge = (decision: DecisionType) => {
    switch (decision) {
      case 'AUTO_ADVANCE':
        return (
          <span className="decision-pill advance">
            <CheckCircle2 size={13} /> AUTO ADVANCE
          </span>
        );
      case 'ESCALATE':
        return (
          <span className="decision-pill escalate">
            <AlertTriangle size={13} /> ESCALATE (HUMAN REVIEW)
          </span>
        );
      case 'AUTO_REJECT':
        return (
          <span className="decision-pill reject">
            <XCircle size={13} /> AUTO REJECT
          </span>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 1020, height: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar with Navigation and Stage Actions */}
        <div className="modal-header-bar">
          <button 
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
            title="Close (Esc)"
          >
            <X size={20} color="var(--text-tertiary)" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Copy Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-secondary"
                onClick={() => setShowCopyMenu(!showCopyMenu)}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                <Copy size={14} />
                <span>Copy</span>
                <ChevronDown size={12} />
              </button>

              {showCopyMenu && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 20,
                  minWidth: 180,
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                    onClick={() => handleCopy('summary')}
                  >
                    Copy Recruiter Summary
                  </div>
                  <div 
                    style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                    onClick={() => handleCopy('ledger')}
                  >
                    Copy 12-Gate Evidence Ledger
                  </div>
                  <div 
                    style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer' }}
                    onClick={() => handleCopy('id')}
                  >
                    Copy Candidate ID
                  </div>
                </div>
              )}
            </div>

            {/* Move Stage Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-primary"
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                style={{ padding: '6px 14px', fontSize: 13 }}
              >
                <span>Move</span>
                <ChevronDown size={13} />
              </button>

              {showMoveMenu && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 20,
                  minWidth: 200,
                  overflow: 'hidden'
                }}>
                  {(['Shortlisted', 'Ready to Interview', 'Rejected', 'Quarantined'] as CandidateStage[]).map(stg => (
                    <div
                      key={stg}
                      onClick={() => {
                        onUpdateStage(candidate.candidate_id, stg);
                        setShowMoveMenu(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: candidate.stage === stg ? 'var(--bg-surface-subtle)' : 'transparent',
                        fontWeight: candidate.stage === stg ? 600 : 400
                      }}
                    >
                      {candidate.stage === stg && <Check size={14} color="var(--primary-600)" />}
                      <span>{stg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              <button 
                className="icon-button"
                onClick={handlePrev}
                disabled={!hasPrev}
                style={{ opacity: hasPrev ? 1 : 0.4 }}
                title="Previous candidate"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '0 4px' }}>
                {currentIndex + 1} of {candidatesList.length}
              </span>
              <button 
                className="icon-button"
                onClick={handleNext}
                disabled={!hasNext}
                style={{ opacity: hasNext ? 1 : 0.4 }}
                title="Next candidate"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Copied Banner Notification */}
        {copiedNotification && (
          <div style={{ 
            background: 'var(--status-advance-bg)', 
            color: 'var(--status-advance-text)', 
            padding: '6px 20px', 
            fontSize: 12.5, 
            textAlign: 'center',
            fontWeight: 600
          }}>
            {copiedNotification}
          </div>
        )}

        {/* Modal Body Container */}
        <div className="modal-body-scroll">
          {/* Candidate AI Processing Pipeline Stepper (Matching PDF Page 14) */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {[
              { step: '1. Resume Received', time: '10:24 AM', status: 'Completed' },
              { step: '2. Text Extraction', time: '10:25 AM', status: 'Completed' },
              { step: '3. Information Extraction', time: '10:27 AM', status: 'Completed' },
              { step: '4. Integrity Check', time: '10:28 AM', status: candidate.is_quarantined ? 'Flagged' : 'Completed' },
              { step: '5. Matching & Scoring', time: '10:29 AM', status: 'Completed' }
            ].map((item, idx, arr) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: item.status === 'Flagged' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    color: item.status === 'Flagged' ? '#EF4444' : '#10B981',
                    border: `1px solid ${item.status === 'Flagged' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800
                  }}>
                    {item.status === 'Flagged' ? '!' : '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.step}
                    </div>
                    <div style={{ fontSize: 10.5, color: item.status === 'Flagged' ? '#EF4444' : 'var(--text-muted)' }}>
                      {item.status} • {item.time}
                    </div>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <ChevronRight size={13} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                )}
              </div>
            ))}
          </div>

          {/* Candidate Profile Header Card */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 20,
            paddingBottom: 20,
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <img 
              src={candidate.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
              alt={candidate.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-lg)',
                objectFit: 'cover',
                border: '2px solid var(--border-subtle)'
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {candidate.name}
                  </h2>
                  {getDecisionBadge(candidate.decision)}
                  {candidate.is_quarantined && (
                    <span className="decision-pill quarantine">
                      <ShieldAlert size={13} /> QUARANTINED (GATE 0)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Deterministic Fit Score
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
                      {candidate.final_score.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {candidate.headline}
              </div>

              {/* Social and External Proof Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {candidate.github_stats && (
                  <a 
                    href={candidate.github_stats.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      background: 'var(--bg-surface-subtle)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <GithubIcon size={14} />
                    <span>@{candidate.github_stats.handle}</span>
                    <ExternalLink size={11} color="var(--text-muted)" />
                  </a>
                )}

                <a 
                  href="#"
                  onClick={e => e.preventDefault()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    background: 'var(--bg-surface-subtle)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <LinkedinIcon size={14} color="#0A66C2" />
                  <span>LinkedIn</span>
                  <ExternalLink size={11} color="var(--text-muted)" />
                </a>

                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  📍 {candidate.location} • Applied {candidate.applied_at}
                </span>
              </div>

              {/* Dark Skills Pills (as shown in Screenshot 300) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {candidate.skills.slice(0, 8).map(skill => (
                  <span 
                    key={skill.name}
                    style={{
                      background: '#1F2937',
                      color: '#F9FAFB',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {skill.name}
                    {skill.is_verified && <Check size={11} color="#10B981" />}
                  </span>
                ))}
                {candidate.skills.length > 8 && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', alignSelf: 'center' }}>
                    +{candidate.skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 20, overflowX: 'auto' }}>
            <button 
              className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Cpu size={15} />
              <span>AI Pipeline & Analysis</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              <ShieldCheck size={15} />
              <span>12-Gate Evidence Ledger</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
              onClick={() => setActiveTab('experience')}
            >
              <Briefcase size={15} />
              <span>Experience ({candidate.experience?.length || 0})</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <GitBranch size={15} />
              <span>Side Projects ({candidate.project_repos?.length || 0})</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
              onClick={() => setActiveTab('qa')}
            >
              <FileText size={15} />
              <span>Proof Q&A ({candidate.answers?.length || 0})</span>
            </button>

            <button 
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <MessageSquare size={15} />
              <span>Team Evaluation ({teamNotes?.length || 0})</span>
            </button>
          </div>

          {/* TAB 0: Candidate Analysis & AI Pipeline (from PDF Page 14) */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Row 1: Resume Details, Extracted Structured Output & Score Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.2fr', gap: 16 }}>
                {/* 1. Resume Details */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Resume Details
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(2, 133, 250, 0.1)',
                        border: '1px solid rgba(2, 133, 250, 0.25)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {candidate.name.toLowerCase().replace(/ /g, '_')}_resume.pdf
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          PDF • 1.2 MB • 2 Pages
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <div><strong>Uploaded:</strong> {candidate.applied_at}</div>
                      <div><strong>OCR Status:</strong> Not Needed (Digital Vector PDF)</div>
                      <div><strong>Parse Confidence:</strong> 98.8% High</div>
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setCopiedNotification('Opening original resume preview in viewer...');
                      setTimeout(() => setCopiedNotification(null), 3000);
                    }}
                    style={{ width: '100%', marginTop: 14, fontSize: 12, padding: '7px 0', justifyContent: 'center' }}
                  >
                    <ExternalLink size={13} />
                    <span>View Full Resume</span>
                  </button>
                </div>

                {/* 2. Extracted Information (Structured Output) */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(2, 133, 250, 0.15)', color: 'var(--primary-600)', padding: '2px 6px', borderRadius: 4 }}>
                      AI
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Extracted Information (Structured)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5, marginBottom: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Role:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{candidate.headline}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Experience:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalExpYears} years</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Location:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{candidate.location}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Education:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>B.Tech Computer Science</div>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Skills (Extracted):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {candidate.skills.slice(0, 6).map(s => (
                        <span key={s.name} style={{
                          background: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Score Breakdown */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Score Breakdown
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
                      {candidate.final_score.toFixed(1)}/100
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5 }}>
                    {[
                      { label: 'Technical Skills (40%)', score: '36/40', pct: 90 },
                      { label: 'Experience Match (20%)', score: '18/20', pct: 90 },
                      { label: 'Education Match (10%)', score: '9/10', pct: 90 },
                      { label: 'Project Relevance (15%)', score: '13/15', pct: 86 },
                      { label: 'Location Match (5%)', score: '5/5', pct: 100 },
                      { label: 'Soft Skills / Fit (10%)', score: '8/10', pct: 80 }
                    ].map(b => (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{b.score}</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: 'var(--bg-surface-subtle)', borderRadius: 2 }}>
                          <div style={{ width: `${b.pct}%`, height: '100%', background: 'var(--primary-600)', borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Requirement-wise Matching Results & Integrity Check Results */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16 }}>
                {/* Requirement-wise Matching Results Table */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Matching Results (Requirement-wise)
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Job Requirement</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Candidate Evidence</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Match</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { req: 'Python (Must Have)', evidence: 'Listed in skills, verified in GitHub commits', match: '✓', score: '18/20', color: '#10B981' },
                        { req: 'React (Must Have)', evidence: 'Built web frontend, demo URL verified', match: '✓', score: '16/20', color: '#10B981' },
                        { req: 'SQL (Must Have)', evidence: 'PostgreSQL migrations, query benchmarks', match: '✓', score: '14/15', color: '#10B981' },
                        { req: '2-4 yrs Experience', evidence: `${totalExpYears} years verified engineering`, match: '✓', score: '15/15', color: '#10B981' },
                        { req: 'B.Tech in CS', evidence: 'B.Tech Computer Science verified', match: '✓', score: '10/10', color: '#10B981' },
                        { req: 'REST APIs (Preferred)', evidence: 'FastAPI REST endpoints in repo', match: '✓', score: '8/10', color: '#10B981' },
                        { req: 'Docker (Preferred)', evidence: 'Dockerfile container setup', match: '✓', score: '7/10', color: '#10B981' },
                        { req: 'AWS Cloud (Preferred)', evidence: 'AWS Cloud deployment verified', match: '✓', score: '6/10', color: '#10B981' },
                        { req: 'System Design (Preferred)', evidence: 'Architectural case study documented', match: '✓', score: '8/10', color: '#10B981' }
                      ].map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '9px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.req}</td>
                          <td style={{ padding: '9px 10px', color: 'var(--text-secondary)' }}>{r.evidence}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', color: r.color, fontWeight: 800 }}>{r.match}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 8-Point Integrity Check Results */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Integrity Check Results (Gate 0)
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                      8/8 Passed
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { check: 'Hidden Text', result: 'Pass', details: 'No white or invisible font text found' },
                      { check: 'Tiny Fonts', result: 'Pass', details: 'No unusually small fonts detected (< 4pt)' },
                      { check: 'Off-page Text', result: 'Pass', details: 'No off-page canvas rendering detected' },
                      { check: 'Keyword Stuffing', result: 'Pass', details: 'Normal keyword density (1.4%)' },
                      { check: 'Suspicious Metadata', result: 'Pass', details: 'No metadata tampering found' },
                      { check: 'Date Overlaps', result: 'Pass', details: 'No overlapping employment dates' },
                      { check: 'Prompt Injection', result: 'Pass', details: 'No injection delimiters found' },
                      { check: 'Scanned Document', result: 'Pass', details: 'Text extracted directly without OCR' }
                    ].map((c, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.check}: </span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{c.details}</span>
                        </div>
                        <span style={{
                          color: '#10B981',
                          fontWeight: 700,
                          fontSize: 11,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <CheckCircle2 size={12} /> {c.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: AI Explanation & Recommendations */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 18,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Why this candidate is a good fit
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Strong match in core technical skills (Python, React, SQL) verified by actual commits.</li>
                    <li>Demonstrated practical experience building real-world web applications.</li>
                    <li>Good problem-solving and clean algorithmic architecture in submitted repositories.</li>
                    <li>Verified relevant educational foundation in Computer Science.</li>
                  </ul>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlertTriangle size={15} color="#F59E0B" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Missing / Areas to Consider
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Limited verified experience with enterprise Kubernetes cluster orchestration.</li>
                    <li>High-load distributed system design experience not explicitly detailed.</li>
                    <li>Recommend probing database indexing and concurrency patterns during interview.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: 12-Gate Evidence Ledger & AI Audit */}
          {activeTab === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Gate 8 Structured Explanation Box */}
              {candidate.explanation && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={16} color="var(--primary-600)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Gate 8 — 3-Sentence Structured Recruiter Explanation
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <div>
                      <strong style={{ color: 'var(--status-advance-text)' }}>Top Strengths (Ledger-Cited): </strong>
                      {candidate.explanation.strengths_sentence}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--status-reject-text)' }}>Critical Gaps: </strong>
                      {candidate.explanation.gaps_sentence}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--primary-700)' }}>Recommended Interview Focus: </strong>
                      {candidate.explanation.interview_focus_sentence}
                    </div>
                  </div>
                </div>
              )}

              {/* Gate 0 Security & Quarantine Shield Alert */}
              {candidate.is_quarantined && (
                <div style={{
                  background: 'var(--status-quarantine-bg)',
                  border: '1.5px solid var(--status-quarantine-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <ShieldAlert size={20} color="#9333EA" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-quarantine-text)' }}>
                      Gate 0 Security Quarantine Triggered (Condition 1)
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {candidate.decision_reason}
                  </div>
                  {candidate.integrity_flag_reasons && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(candidate.integrity_flag_reasons).map(([flag, reason]) => (
                        <div key={flag} style={{ fontSize: 12, background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: 6 }}>
                          <code style={{ fontWeight: 700, color: '#9333EA' }}>{flag}</code>: {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5-Dimensional Scoring Breakdown */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 20
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Gate 6 — Dimensional Scoring Breakdown (Configurable Weights)</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>Deterministic • Zero LLM Hallucination</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  {[
                    { label: 'Technical', weight: '40%', score: candidate.scoring_breakdown.technical_score },
                    { label: 'Experience', weight: '30%', score: candidate.scoring_breakdown.experience_score },
                    { label: 'Seniority', weight: '20%', score: candidate.scoring_breakdown.seniority_score },
                    { label: 'Education', weight: '5%', score: candidate.scoring_breakdown.education_score },
                    { label: 'Location', weight: '5%', score: candidate.scoring_breakdown.location_score }
                  ].map(dim => (
                    <div key={dim.label} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                        {dim.label} ({dim.weight})
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {dim.score.toFixed(1)}%
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${dim.score}%`, height: '100%', background: 'var(--primary-600)', borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gate 4 Verification: GitHub & Skill Audit */}
              {candidate.github_stats && (
                <div style={{
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GithubIcon size={16} />
                    <span>Gate 4 — GitHub Verification & Language Cross-Check</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Community Rank</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{candidate.github_stats.rank}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Repository Stars</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>★ {candidate.github_stats.stars}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recent Commits</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{candidate.github_stats.recent_commits} commits</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pull Requests</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{candidate.github_stats.total_prs} PRs merged</div>
                    </div>
                  </div>

                  {/* Language Breakdown */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Verified Language Distribution in Repositories:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(candidate.github_stats.languages).map(([lang, pct]) => (
                        <span key={lang} style={{ fontSize: 12, background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                          <strong>{lang}</strong>: {pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence Ledger Entries (Exact Verbatim Citations) */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Verifiable Evidence Ledger ({candidate.ledger.length} Grounded Citations)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {candidate.ledger.map((entry, idx) => (
                    <div key={idx} className="ledger-card">
                      <div className="ledger-req-title">
                        <span>{entry.requirement}</span>
                        <span style={{ fontSize: 12, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
                          +{entry.score_contribution.toFixed(1)} pts
                        </span>
                      </div>

                      {entry.evidence ? (
                        <div className="ledger-evidence-quote">
                          "{entry.evidence}"
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--status-reject-text)', fontStyle: 'italic' }}>
                          No verifiable evidence found in resume.
                        </div>
                      )}

                      {entry.gap && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          ⚠️ <strong>Gap Note:</strong> {entry.gap}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Experience */}
          {activeTab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {candidate.experience.map((exp, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 20
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {exp.title} {exp.company ? `@ ${exp.company}` : ''}
                    </h4>
                    <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                      {exp.start_date} - {exp.end_date} ({exp.years} yrs)
                    </span>
                  </div>

                  <ul style={{ paddingLeft: 20, margin: '12px 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} style={{ marginBottom: 6 }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {exp.skills_demonstrated.map(sk => (
                      <span key={sk} className="skill-pill verified">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Side Projects & Live Proofs (Matching Screenshots 299/300) */}
          {activeTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(!candidate.project_repos || candidate.project_repos.length === 0) ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No side projects recorded.
                </div>
              ) : (
                (candidate.project_repos || []).map((proj, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {proj.name}
                        </h4>
                        {proj.live_url && (
                          <a 
                            href={proj.live_url} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              fontSize: 12, 
                              color: 'var(--primary-600)',
                              textDecoration: 'none',
                              fontWeight: 600
                            }}
                          >
                            Live Demo <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {proj.date_range}
                      </span>
                    </div>

                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                      {proj.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                      <span><strong>Tech:</strong> {proj.language}</span>
                      <span>★ {proj.stars} stars</span>
                      <a href={proj.repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                        View Repository ↗
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Q&A & Screening Proof */}
          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(!candidate.answers || candidate.answers.length === 0) ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No screening questions submitted.
                </div>
              ) : (
                (candidate.answers || []).map((qa, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Q: {qa.question}
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-surface)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      {qa.answer}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: Team Evaluation & Notes (huntyourtribe.com "Hire as a team") */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header banner */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    Collaborative Hiring Evaluation
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                    Internal notes, peer reviews, and rating consensus visible only to your recruitment team.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Consensus Rating:</span>
                  <div style={{ display: 'flex', color: '#F59E0B' }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star key={st} size={15} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>5.0</span>
                </div>
              </div>

              {/* Compose New Note */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Add Team Note & Score
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score:</span>
                    <div style={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star 
                          key={st} 
                          size={16} 
                          fill={st <= newRating ? '#F59E0B' : 'transparent'} 
                          color={st <= newRating ? '#F59E0B' : 'var(--text-muted)'}
                          onClick={() => setNewRating(st)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Share feedback on GitHub code quality, interview performance, or evidence ledger citations... (e.g., Verified monorepo and Gate 6 benchmarks)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Supports markdown • Teammates will be notified via email
                  </span>
                  <button 
                    className="btn-primary"
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim()}
                    style={{ padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={13} />
                    <span>Post Note</span>
                  </button>
                </div>
              </div>

              {/* Existing Team Notes Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamNotes.map(note => (
                  <div 
                    key={note.id}
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--primary-600)',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12
                        }}>
                          {note.author[0]}
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginRight: 6 }}>
                            {note.author}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            ({note.role})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', color: '#F59E0B' }}>
                          {[1, 2, 3, 4, 5].map(st => (
                            <Star 
                              key={st} 
                              size={13} 
                              fill={st <= note.rating ? '#F59E0B' : 'transparent'} 
                              color={st <= note.rating ? '#F59E0B' : 'var(--text-muted)'} 
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                          {note.date}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
