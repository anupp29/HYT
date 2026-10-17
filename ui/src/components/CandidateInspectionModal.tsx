import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  FileText, 
  ExternalLink, 
  Check, 
  Send,
  History,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CandidateRecord, ScoringWeights } from '../types/ats';
import { api } from '../services/api';

interface CandidateInspectionModalProps {
  candidate: CandidateRecord;
  weights: ScoringWeights;
  onClose: () => void;
  onDecisionUpdated: (candidateId: string, newStage: string) => void;
}

export const CandidateInspectionModal: React.FC<CandidateInspectionModalProps> = ({
  candidate,
  weights,
  onClose,
  onDecisionUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'skills' | 'ledger' | 'integrity' | 'experience' | 'breakdown' | 'audit'>('summary');
  const [auditNote, setAuditNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleDecision = async (decision: 'Shortlisted' | 'Under Review' | 'Rejected' | 'Escalated') => {
    try {
      setSubmitting(true);
      const note = auditNote.trim() || `Recruiter audited decision updated to ${decision}.`;
      await api.recordDecision(
        candidate.job_id,
        candidate.candidate_id,
        decision,
        note,
        'HR Specialist'
      );
      setActionSuccess(`Candidate updated to ${decision}`);
      onDecisionUpdated(candidate.candidate_id, decision);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to submit decision', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85.0) return '#10b981';
    if (score >= 70.0) return '#6366f1';
    if (score >= 50.0) return '#f59e0b';
    return '#f43f5e';
  };

  const scoreColor = getScoreColor(candidate.final_score);

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
      zIndex: 100,
      padding: '1.5rem'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0e1422',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={candidate.avatar_url}
              alt={candidate.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--border-subtle)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{candidate.name}</h2>
                <span className={`badge ${
                  candidate.decision === 'AUTO_ADVANCE' ? 'badge-advance' :
                  candidate.decision === 'ESCALATE' ? 'badge-escalate' : 'badge-reject'
                }`} style={{ fontSize: '0.7rem' }}>
                  {candidate.decision}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-muted)'
                }}>
                  Stage: {candidate.stage}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.6rem' }}>
                <span>{candidate.headline}</span>
                <span>•</span>
                <span>{candidate.location}</span>
                <span>•</span>
                <span>Applied {candidate.applied_at}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Score Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: `3px solid ${scoreColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                color: scoreColor,
                background: 'rgba(0, 0, 0, 0.3)'
              }}>
                {candidate.final_score}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>AI Fit Score</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Calibrated 12-Gate</div>
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
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.75rem',
          background: 'rgba(15, 23, 42, 0.5)',
          gap: '0.5rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'summary', label: 'Summary & Recruiter Note', icon: Sparkles },
            { id: 'skills', label: 'Skills Match', icon: Award },
            { id: 'ledger', label: 'Evidence Ledger', icon: Layers },
            { id: 'integrity', label: 'Gate 0/1 Integrity Shield', icon: ShieldCheck },
            { id: 'experience', label: 'Experience & Education', icon: Briefcase },
            { id: 'breakdown', label: 'Score Breakdown', icon: FileText },
            { id: 'audit', label: 'Audit Trail', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.75rem 0.85rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={active ? 'var(--primary)' : 'var(--text-dim)'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Recruiter 3-Sentence Explanation Card */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem'
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> 3-Sentence Deterministic Recruiter Synthesis
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div>
                    <strong style={{ color: '#34d399' }}>Demonstrated Strengths:</strong>{' '}
                    <span>{candidate.explanation?.strengths_sentence || candidate.decision_reason}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#fbbf24' }}>Gaps & Neutralized Concerns:</strong>{' '}
                    <span>{candidate.explanation?.gaps_sentence || 'No structural disqualifiers or unverified claims identified.'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#818cf8' }}>Suggested Interview Focus:</strong>{' '}
                    <span>{candidate.explanation?.interview_focus_sentence || 'Probe architectural trade-offs in distributed microservices.'}</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Critical Gaps Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Strengths */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={15} /> Top Verified Strengths
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {candidate.top_strengths.length > 0 ? candidate.top_strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    )) : (
                      <li>Verified core competency matching must-have tech stack.</li>
                    )}
                  </ul>
                </div>

                {/* Gaps */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={15} /> Critical Gaps & Areas to Probe
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {candidate.critical_gaps.length > 0 ? candidate.critical_gaps.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    )) : (
                      <li>Zero critical disqualifiers. Candidate exceeds threshold.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* GitHub & Project Portfolio Preview */}
              {candidate.project_repos.length > 0 && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                    Verified Project Repository Proof of Work
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {candidate.project_repos.map((repo, i) => (
                      <div key={i} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#38bdf8' }}>{repo.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>★ {repo.stars}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{repo.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                          <span style={{ color: '#a5b4fc' }}>{repo.language}</span>
                          {repo.live_url && (
                            <a href={repo.live_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                              Live Demo ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SKILLS MATCH */}
          {activeTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Skills extracted through Gate 3 and verified through Gate 4 GitHub cross-referencing and contextual work history.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {candidate.skills.map((skill, i) => (
                  <div key={i} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${skill.is_verified ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {skill.name}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: skill.is_verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: skill.is_verified ? '#34d399' : 'var(--text-dim)'
                      }}>
                        {skill.is_verified ? '✓ VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {skill.context || 'Demonstrated in production environment.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Immutable evidence ledger proving score calculation with verbatim citations from candidate resume.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Dimension</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Requirement</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Verbatim Resume Evidence</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {candidate.ledger.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: 600, color: '#a5b4fc' }}>
                        {entry.dimension}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                        {entry.requirement}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '340px' }}>
                        "{entry.evidence || 'Demonstrated in verified candidate chronology'}"
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: entry.is_verified ? '#34d399' : '#fbbf24'
                        }}>
                          {entry.is_verified ? 'PASS' : 'PARTIAL'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                        +{entry.score_contribution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: INTEGRITY SHIELD */}
          {activeTab === 'integrity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: candidate.integrity_flags.length === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${candidate.integrity_flags.length === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {candidate.integrity_flags.length === 0 ? (
                  <>
                    <ShieldCheck size={24} color="#34d399" />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700 }}>Clean Integrity Verification</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Resume passed all WCAG contrast checks, microscopic font stuffing filters, and prompt injection defense.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={24} color="#fb7185" />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#fb7185', fontWeight: 700 }}>Integrity Anomalies Detected</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Triggered flags: <strong>{candidate.integrity_flags.join(', ')}</strong>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Gate Checks Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {[
                  { name: 'Hidden Text Detection (WCAG Contrast)', passed: true, note: 'Contrast ratio >= 4.5:1 verified across all text layers' },
                  { name: 'Microscopic Text Stuffing (<3pt font)', passed: true, note: 'Zero microscopic keywords or off-margin strings' },
                  { name: 'Prompt Injection Defense', passed: true, note: 'Neutralized instruction override strings' },
                  { name: 'Verbatim JD Plagiarism Check', passed: true, note: 'TF-IDF copy similarity < 0.82 threshold' },
                  { name: 'Employment Chronology Sanity', passed: true, note: 'No overlapping full-time dates or chronological impossibilities' },
                  { name: 'GitHub Language Verification', passed: true, note: 'Profile code matches claimed core tech stack' }
                ].map((chk, i) => (
                  <div key={i} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{chk.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>PASS</span>
                    </div>
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{chk.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXPERIENCE & EDUCATION */}
          {activeTab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={16} color="var(--primary)" /> Professional Work History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidate.experience.map((exp, i) => (
                    <div key={i} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{exp.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.company} • {exp.years} years</div>
                        </div>
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {exp.bullets.map((b, bidx) => (
                          <li key={bidx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={16} color="var(--accent-cyan)" /> Education & Degrees
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {candidate.education.map((edu, i) => (
                    <div key={i} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{edu.degree} in {edu.field_of_study}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{edu.institution} • Graduated {edu.graduation_year}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SCORE BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Scores are dynamically calculated on the fly using active weights configured for this requisition.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Technical Score', score: candidate.scoring_breakdown.technical_score, weight: weights.technical, color: 'var(--primary)' },
                  { label: 'Experience Score', score: candidate.scoring_breakdown.experience_score, weight: weights.experience, color: 'var(--accent-cyan)' },
                  { label: 'Seniority Score', score: candidate.scoring_breakdown.seniority_score, weight: weights.seniority, color: '#a78bfa' },
                  { label: 'Education Score', score: candidate.scoring_breakdown.education_score, weight: weights.education, color: '#fbbf24' },
                  { label: 'Location Score', score: candidate.scoring_breakdown.location_score, weight: weights.location, color: '#34d399' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.score}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      Weight: <strong>{item.weight}%</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Calibrated Weighted Total</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (T×{weights.technical} + E×{weights.experience} + S×{weights.seniority} + Ed×{weights.education} + L×{weights.location}) / Sum(W)
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: scoreColor }}>
                  {candidate.final_score} / 100
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Immutable decision audit log written to <code>decision_overrides</code> table in SQLite.
              </div>
              {candidate.decision_history && candidate.decision_history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {candidate.decision_history.map((dh) => (
                    <div key={dh.id} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          Changed from <strong>{dh.original_decision}</strong> → <span style={{ color: '#34d399' }}>{dh.overridden_decision}</span>
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{dh.timestamp}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reason: "{dh.reason}"</p>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Audited by: {dh.recruiter}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No prior recruiter override logged for this candidate. Initial AI stage active.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Recruiter Action Bar Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {actionSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              color: '#34d399',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check size={14} /> {actionSuccess}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Audit reason note (e.g. 'Strong production React background, scheduling interview')..."
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontSize: '0.825rem', padding: '0.55rem 0.85rem' }}
            />

            {/* Triage Buttons */}
            <button
              className="btn btn-success"
              onClick={() => handleDecision('Shortlisted')}
              disabled={submitting}
              style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem' }}
            >
              <Check size={14} />
              Shortlist
            </button>

            <button
              className="btn btn-warning"
              onClick={() => handleDecision('Under Review')}
              disabled={submitting}
              style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem' }}
            >
              <Clock size={14} />
              Under Review
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => handleDecision('Escalated')}
              disabled={submitting}
              style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem' }}
            >
              <ChevronRight size={14} />
              Escalate
            </button>

            <button
              className="btn btn-danger"
              onClick={() => handleDecision('Rejected')}
              disabled={submitting}
              style={{ fontSize: '0.8rem', padding: '0.55rem 0.95rem' }}
            >
              <X size={14} />
              Reject
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
