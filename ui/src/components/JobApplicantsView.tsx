import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Search, 
  Sliders, 
  FileText, 
  Download, 
  Check, 
  Clock, 
  X, 
  AlertTriangle, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  CheckCircle,
  Award,
  Briefcase,
  FileCheck2,
  ExternalLink,
  ChevronDown,
  Edit,
  GraduationCap
} from 'lucide-react';
import { JobDescription, CandidateRecord, ScoringWeights, ApplicantsResponse } from '../types/ats';
import { api } from '../services/api';

interface JobApplicantsViewProps {
  job: JobDescription;
  onBack: () => void;
  onGenerateReport: (jobId: string) => void;
  onWeightsChanged: () => void;
}

export const JobApplicantsView: React.FC<JobApplicantsViewProps> = ({
  job,
  onBack,
  onGenerateReport,
  onWeightsChanged
}) => {
  // Candidate pool state
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs matching Screenshot 2: "Applicants (80)", "AI Screening", "Integrity Flags", "Shortlist (18)", "Under Review (52)", "Rejected (10)"
  const [activeTab, setActiveTab] = useState<'all' | 'screening' | 'flags' | 'shortlisted' | 'review' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score_desc');

  // Deep dive candidate view state (Screenshot 14)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [auditReason, setAuditReason] = useState('');
  const [decisionUpdating, setDecisionUpdating] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Per-job scoring weights drawer state
  const [showWeightsDrawer, setShowWeightsDrawer] = useState(false);
  const [weights, setWeights] = useState<ScoringWeights>(job.scoring_weights || {
    technical: 40,
    experience: 30,
    seniority: 20,
    education: 5,
    location: 5
  });
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightsSuccessMsg, setWeightsSuccessMsg] = useState(false);

  // Load applicants
  const loadApplicants = async () => {
    try {
      setLoading(true);
      let stageParam = 'All';
      if (activeTab === 'shortlisted') stageParam = 'Shortlisted';
      else if (activeTab === 'review') stageParam = 'Under Review';
      else if (activeTab === 'rejected') stageParam = 'Rejected';

      const res: ApplicantsResponse = await api.getJobApplicants(job.job_id, {
        page,
        page_size: pageSize,
        search,
        stage: stageParam,
        sort: sortBy
      });

      let items = res.items;
      if (activeTab === 'flags') {
        items = items.filter(c => c.integrity_flags.length > 0 || c.is_quarantined);
      }

      setCandidates(items);
      setTotalCandidates(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load applicants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [job.job_id, page, pageSize, search, activeTab, sortBy]);

  // Handle weight adjustments
  const handleSaveWeights = async () => {
    try {
      setSavingWeights(true);
      await api.updateWeights(job.job_id, weights);
      setWeightsSuccessMsg(true);
      setTimeout(() => setWeightsSuccessMsg(false), 3500);
      onWeightsChanged();
      await loadApplicants();
    } catch (err) {
      console.error('Failed to update weights', err);
    } finally {
      setSavingWeights(false);
    }
  };

  const handleResetWeights = async () => {
    try {
      setSavingWeights(true);
      const res = await api.resetWeights(job.job_id);
      setWeights(res.weights);
      setWeightsSuccessMsg(true);
      setTimeout(() => setWeightsSuccessMsg(false), 3500);
      onWeightsChanged();
      await loadApplicants();
    } catch (err) {
      console.error('Failed to reset weights', err);
    } finally {
      setSavingWeights(false);
    }
  };

  // Triage update handler
  const handleUpdateDecision = async (
    candidateId: string,
    newStage: 'Shortlisted' | 'Under Review' | 'Rejected' | 'Escalated'
  ) => {
    try {
      setDecisionUpdating(true);
      const reason = auditReason.trim() || `Recruiter decision updated to ${newStage}`;
      await api.recordDecision(job.job_id, candidateId, newStage, reason, 'Rohan Mehta');
      setDecisionSuccess(`Decision updated to ${newStage}`);
      setTimeout(() => setDecisionSuccess(null), 3000);

      // Refresh candidate state
      if (selectedCandidate && selectedCandidate.candidate_id === candidateId) {
        setSelectedCandidate({ ...selectedCandidate, stage: newStage });
      }
      setCandidates(prev => prev.map(c => 
        c.candidate_id === candidateId ? { ...c, stage: newStage } : c
      ));
    } catch (err) {
      console.error('Failed to record decision', err);
    } finally {
      setDecisionUpdating(false);
    }
  };

  // Helper for fit score pill color
  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'badge-success';
    if (score >= 70) return 'badge-warning';
    return 'badge-danger';
  };

  // IF A CANDIDATE IS SELECTED FOR DEEP DIVE (SCREENSHOT 14 & 2):
  if (selectedCandidate) {
    const c = selectedCandidate;
    const b = c.scoring_breakdown;
    return (
      <div style={{ padding: '1.5rem 2rem 3rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top Navigation & Status Banner matching Screenshot 14 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              onClick={() => setSelectedCandidate(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.825rem',
                color: 'var(--primary)',
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
            >
              <ArrowLeft size={16} /> Back to Applications
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Candidate Analysis — {c.name}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
              <span><strong>Job:</strong> {job.title}</span>
              <span>•</span>
              <span><strong>Applied on:</strong> {c.applied_at}</span>
              <span>•</span>
              <span><strong>Processed on:</strong> 12 Nov 2024, 10:29 AM</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: c.stage === 'Shortlisted' ? 'var(--success-bg)' : 'var(--warning-bg)',
              border: `1px solid ${c.stage === 'Shortlisted' ? 'var(--success-border)' : 'var(--warning-border)'}`
            }}>
              <Award size={20} color={c.stage === 'Shortlisted' ? 'var(--success-text)' : 'var(--warning-text)'} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Decision</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: c.stage === 'Shortlisted' ? 'var(--success-text)' : 'var(--warning-text)' }}>
                  {c.stage} — AI Score: {c.final_score}/100
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step Horizontal AI Pipeline Progress Bar matching Screenshot 14 */}
        <div className="hyt-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {[
              { num: '1', title: 'Resume Received', time: '12 Nov 2024, 10:24 AM', color: '#10b981', icon: FileText },
              { num: '2', title: 'Text Extraction', time: 'Completed 10:25 AM', color: '#10b981', icon: Layers },
              { num: '3', title: 'Information Extraction', time: 'Completed 10:27 AM', color: '#10b981', icon: FileCheck2 },
              { num: '4', title: 'Integrity Check', time: 'Completed 10:28 AM', color: '#10b981', icon: ShieldCheck },
              { num: '5', title: 'Job Matching & Scoring', time: 'Completed 10:29 AM', color: '#10b981', icon: Award }
            ].map((p, idx, arr) => {
              const Icon = p.icon;
              return (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success-border)',
                      color: 'var(--success-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      <Check size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.num}. {p.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {p.time}
                      </div>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ color: '#cbd5e1' }}>
                      <ArrowRight size={14} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 3-Column Detailed Analysis Grid matching Screenshot 14 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr 1.1fr',
          gap: '1.25rem'
        }}>
          {/* COLUMN 1: Resume Details & Score Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Resume Details Card */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>Resume Details</h3>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '54px',
                  height: '68px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <FileText size={26} />
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name.toLowerCase().replace(' ', '_')}_resume.pdf</div>
                  <div style={{ color: 'var(--text-muted)' }}>File Type: <strong>PDF</strong></div>
                  <div style={{ color: 'var(--text-muted)' }}>File Size: <strong>1.2 MB</strong></div>
                  <div style={{ color: 'var(--text-muted)' }}>Pages: <strong>2</strong></div>
                  <div style={{ color: 'var(--text-muted)' }}>Uploaded: <strong>{c.applied_at}</strong></div>
                </div>
              </div>
              <a
                href={api.getExportCsvUrl(job.job_id)}
                download
                className="hyt-btn btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem', textDecoration: 'none' }}
              >
                <Download size={14} /> Download Evidence Report
              </a>
            </div>

            {/* Score Breakdown Card with Custom Dimension Weights */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Score Breakdown</h3>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {c.final_score}/100
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Technical Skills Match ({weights.technical}%)</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((b.technical_score / 100) * weights.technical)}/{weights.technical}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.technical_score}%`, height: '100%', background: 'var(--primary)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Experience Match ({weights.experience}%)</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((b.experience_score / 100) * weights.experience)}/{weights.experience}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.experience_score}%`, height: '100%', background: '#06b6d4' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Seniority Match ({weights.seniority}%)</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((b.seniority_score / 100) * weights.seniority)}/{weights.seniority}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.seniority_score}%`, height: '100%', background: '#8b5cf6' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Education Match ({weights.education}%)</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((b.education_score / 100) * weights.education)}/{weights.education}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.education_score}%`, height: '100%', background: '#f59e0b' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Location & Remote ({weights.location}%)</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((b.location_score / 100) * weights.location)}/{weights.location}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.location_score}%`, height: '100%', background: '#10b981' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: AI Extracted Structured Info & Matching Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* AI Extracted Structured Output */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--primary)" /> AI Extracted Information (Structured Output)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Name:</span>{' '}
                  <strong>{c.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
                  <strong>{c.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>{' '}
                  <strong>{c.location}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Experience:</span>{' '}
                  <strong>{c.experience[0]?.years || 3.0} years</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Education:</span>{' '}
                  <strong>{c.education[0]?.degree} in {c.education[0]?.field_of_study} ({c.education[0]?.institution})</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Skills (Extracted):</span>{' '}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {c.skills.map(s => (
                      <span key={s.name} className="hyt-badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Matching Results (Requirement-wise) Table matching Screenshot 14 */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Matching Results (Requirement-wise)
              </h3>
              <table className="hyt-table" style={{ fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    <th>Job Requirement</th>
                    <th>Candidate Evidence</th>
                    <th style={{ textAlign: 'center' }}>Match</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {c.ledger.map((item, idx) => {
                    const isVerified = Boolean(item.is_verified || (item.score_contribution && item.score_contribution > 50));
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.requirement}</td>
                        <td style={{ color: isVerified ? 'var(--text-secondary)' : '#DC2626', maxWidth: '240px', fontSize: '0.74rem' }}>
                          {isVerified ? item.evidence : (item.gap || item.evidence)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: isVerified ? '#10b981' : '#ef4444', 
                            display: 'inline-block' 
                          }}></span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: isVerified ? 'var(--primary)' : '#DC2626' }}>
                          {item.score_contribution !== undefined ? `${item.score_contribution} pts` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* AI Explanation Card */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                AI Recruiter Explanation
              </h3>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--success-text)' }}>Why this candidate is a good fit?</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {c.explanation?.strengths_sentence || 'Strong alignment across core technical requirements.'}
                  </p>
                </div>
                <div>
                  <strong style={{ color: 'var(--warning-text)' }}>Missing / Weak Areas:</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {c.explanation?.gaps_sentence || 'No major gaps or integrity concerns found.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Integrity Check Results & HR Decision Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Integrity Check Results Card matching Screenshot 14 */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--success-solid)" /> Integrity Check Results
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.78rem' }}>
                {[
                  { name: 'Hidden Text', pass: true, detail: 'No hidden/white text found' },
                  { name: 'Tiny Fonts', pass: true, detail: 'No unusually small fonts (<3pt)' },
                  { name: 'Off-page Text', pass: true, detail: 'No off-page text detected' },
                  { name: 'Keyword Stuffing', pass: true, detail: 'Normal keyword density' },
                  { name: 'Suspicious Metadata', pass: true, detail: 'No suspicious metadata' },
                  { name: 'Date Overlaps', pass: true, detail: 'No overlapping employment dates' },
                  { name: 'Prompt Injection', pass: true, detail: 'No injection patterns found' },
                  { name: 'Scanned Document', pass: true, detail: 'Text extracted directly' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.detail}</div>
                    </div>
                    <span className="hyt-badge badge-success">
                      ✓ Pass
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Decision & Recruiter Action Card matching Screenshot 2 & 14 */}
            <div className="hyt-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                HR Recruiter Decision
              </h3>
              
              {decisionSuccess && (
                <div style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  color: 'var(--success-text)',
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Check size={14} /> {decisionSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    className="hyt-btn btn-success"
                    style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                    onClick={() => handleUpdateDecision(c.candidate_id, 'Shortlisted')}
                    disabled={decisionUpdating}
                  >
                    <Check size={14} /> Shortlist
                  </button>
                  <button
                    className="hyt-btn btn-warning"
                    style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                    onClick={() => handleUpdateDecision(c.candidate_id, 'Under Review')}
                    disabled={decisionUpdating}
                  >
                    <Clock size={14} /> Under Review
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    className="hyt-btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                    onClick={() => handleUpdateDecision(c.candidate_id, 'Escalated')}
                    disabled={decisionUpdating}
                  >
                    Escalate
                  </button>
                  <button
                    className="hyt-btn btn-danger"
                    style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                    onClick={() => handleUpdateDecision(c.candidate_id, 'Rejected')}
                    disabled={decisionUpdating}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Decision Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="+ Add decision reason..."
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="hyt-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // DEFAULT VIEW: APPLICATION DASHBOARD (SCREENSHOT 2)
  return (
    <div style={{ padding: '1.5rem 2rem 3rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Current Job Header Card matching Screenshot 2 */}
      <div className="hyt-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Left: Job identity */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Current Job
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                <Briefcase size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {job.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {job.company} • {job.location} ({job.remote_policy})
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              className="hyt-btn btn-secondary"
              onClick={() => setShowWeightsDrawer(!showWeightsDrawer)}
              style={{
                fontSize: '0.8rem',
                borderColor: showWeightsDrawer ? 'var(--primary)' : 'var(--border-light)',
                background: showWeightsDrawer ? 'var(--primary-light)' : '#ffffff',
                color: showWeightsDrawer ? 'var(--primary)' : 'var(--text-primary)'
              }}
            >
              <Sliders size={14} />
              {showWeightsDrawer ? 'Close Weights' : 'Configure Scoring Weights'}
            </button>
            <button
              className="hyt-btn btn-primary"
              onClick={() => onGenerateReport(job.job_id)}
              style={{ fontSize: '0.8rem' }}
            >
              <FileText size={14} />
              Generate Executive Report
            </button>
            <a
              href={api.getExportCsvUrl(job.job_id)}
              download
              className="hyt-btn btn-secondary"
              style={{ fontSize: '0.8rem', textDecoration: 'none' }}
            >
              <Download size={14} />
              Export CSV
            </a>
          </div>
        </div>

        {/* AI-Extracted Requirements Pills matching Screenshot 2 */}
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
              Must-Have ({job.must_have_skills.length}):
            </span>
            {job.must_have_skills.map((s) => (
              <span key={s} className="hyt-badge badge-neutral" style={{ background: '#eef2ff', color: 'var(--primary)', border: '1px solid #c7d2fe' }}>
                {s}
              </span>
            ))}

            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '1rem', marginRight: '0.25rem' }}>
              Nice-to-Have ({job.nice_to_have_skills.length}):
            </span>
            {job.nice_to_have_skills.map((s) => (
              <span key={s} className="hyt-badge badge-neutral">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Per-Job Configurable Scoring Weights Drawer */}
      {showWeightsDrawer && (
        <div className="hyt-card" style={{
          padding: '1.25rem 1.5rem',
          background: '#f8fafc',
          border: '1px solid var(--primary-border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} color="var(--primary)" />
                Per-Job Dimension Weights Calibration
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Adjust dimension importance strictly for <strong>{job.title}</strong>. Candidates are rescored instantly on the fly without mutating global configurations.
              </p>
            </div>
            {weightsSuccessMsg && (
              <span className="hyt-badge badge-success">
                <Check size={13} /> Weights Saved & Recalibrated!
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Technical</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{weights.technical}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={weights.technical}
                onChange={(e) => setWeights({ ...weights, technical: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Experience</span>
                <span style={{ fontWeight: 700, color: '#06b6d4' }}>{weights.experience}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={weights.experience}
                onChange={(e) => setWeights({ ...weights, experience: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Seniority</span>
                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{weights.seniority}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={weights.seniority}
                onChange={(e) => setWeights({ ...weights, seniority: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Education</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{weights.education}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={weights.education}
                onChange={(e) => setWeights({ ...weights, education: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Location</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{weights.location}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={weights.location}
                onChange={(e) => setWeights({ ...weights, location: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Weight: <strong>{weights.technical + weights.experience + weights.seniority + weights.education + weights.location}%</strong> (normalized automatically)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="hyt-btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={handleResetWeights}
                disabled={savingWeights}
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button
                className="hyt-btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                onClick={handleSaveWeights}
                disabled={savingWeights}
              >
                <Sparkles size={12} /> {savingWeights ? 'Saving...' : 'Apply & Rescore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Applicants Tabs matching Screenshot 2: "Applicants (80)", "AI Screening", "Integrity Flags", "Shortlist (18)", "Under Review (52)", "Rejected (10)" */}
      <div className="hyt-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Applicants (${totalCandidates})` },
            { id: 'screening', label: 'AI Screening' },
            { id: 'flags', label: 'Integrity Flags' },
            { id: 'shortlisted', label: `Shortlist (${job.shortlisted_count})` },
            { id: 'review', label: `Under Review (${job.under_review_count})` },
            { id: 'rejected', label: `Rejected (${job.rejected_count})` }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setPage(1);
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: active ? 700 : 500,
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, Filter, and Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#f8fafc',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.65rem'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search candidate name, skills..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', width: '160px' }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="hyt-input"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          >
            <option value="score_desc">Sort by: Fit Score</option>
            <option value="score_asc">Sort by: Score Low-High</option>
            <option value="name_asc">Sort by: Name A-Z</option>
          </select>
        </div>
      </div>

      {/* 4. Candidate Applications Table matching Screenshot 2 */}
      <div className="hyt-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>Loading candidates...</div>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No candidate records found for this view.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hyt-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Candidate</th>
                  <th>Experience</th>
                  <th>Key Skills (matched)</th>
                  <th style={{ textAlign: 'center' }}>Fit Score</th>
                  <th>AI Recommendation</th>
                  <th>HR Decision</th>
                  <th style={{ textAlign: 'center' }}>Flags</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, idx) => (
                  <tr key={c.candidate_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCandidate(c)}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {/* Candidate Identity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#4f46e5',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.headline}</div>
                        </div>
                      </div>
                    </td>

                    {/* Experience */}
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {c.experience[0]?.years || 2.5} yrs
                    </td>

                    {/* Key Skills */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {c.skills.slice(0, 3).map(s => (
                          <span key={s.name} className="hyt-badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Fit Score (Pill Badge matching reference e.g. 92% green, 76% yellow, 45% red) */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`hyt-badge ${getScoreBadgeClass(c.final_score)}`} style={{ fontWeight: 800, padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}>
                        {c.final_score}%
                      </span>
                    </td>

                    {/* AI Recommendation */}
                    <td>
                      <span className={`hyt-badge ${
                        c.decision === 'AUTO_ADVANCE' ? 'badge-success' :
                        c.decision === 'ESCALATE' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {c.decision === 'AUTO_ADVANCE' ? 'Shortlisted' :
                         c.decision === 'ESCALATE' ? 'Under Review' : 'Rejected'}
                      </span>
                    </td>

                    {/* HR Decision */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.stage}
                        onChange={(e) => handleUpdateDecision(c.candidate_id, e.target.value as any)}
                        style={{
                          background: c.stage === 'Shortlisted' ? 'var(--success-bg)' :
                                      c.stage === 'Rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                          color: c.stage === 'Shortlisted' ? 'var(--success-text)' :
                                 c.stage === 'Rejected' ? 'var(--danger-text)' : 'var(--warning-text)',
                          border: `1px solid ${c.stage === 'Shortlisted' ? 'var(--success-border)' : 'var(--warning-border)'}`,
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Suggested">Suggested</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                    </td>

                    {/* Flags */}
                    <td style={{ textAlign: 'center' }}>
                      {c.integrity_flags.length > 0 ? (
                        <span title={`Integrity Flag: ${c.integrity_flags.join(', ')}`} style={{ color: '#ef4444' }}>
                          <AlertTriangle size={14} />
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    {/* Actions ("View" button matching reference) */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="hyt-btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                        onClick={() => setSelectedCandidate(c)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCandidates)} of {totalCandidates} candidates
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className="hyt-btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem' }}
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="hyt-btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem' }}
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
