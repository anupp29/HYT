import React, { useState } from 'react';
import { 
  Building2, 
  UploadCloud, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  ChevronRight, 
  Code2, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Clock, 
  AlertCircle,
  Briefcase,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { GithubIcon } from './Icons';
import { CandidateRecord, JobDescription } from '../types/ats';
import { CURRENT_CANDIDATE_USER } from '../data/mockdata';

interface CandidatePortalProps {
  jobs: JobDescription[];
  currentCandidate: CandidateRecord;
  onApplyNew: (data: any) => void;
  onExploreJobs: () => void;
  appliedJobsList?: JobDescription[];
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  jobs,
  currentCandidate,
  onApplyNew,
  onExploreJobs,
  appliedJobsList = [jobs[0]]
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(appliedJobsList[0]?.job_id || jobs[0]?.job_id);
  const [expandedGate, setExpandedGate] = useState<number | null>(6);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledSlot, setScheduledSlot] = useState<string>('Tomorrow at 10:00 AM IST');

  // Interactive proof artifacts state
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com/bhushanmehar/moakmate');
  const [liveUrl, setLiveUrl] = useState<string>('https://moakmate-demo.app');
  const [caseStudyText, setCaseStudyText] = useState<string>(
    'In Moakmate, stream-generating questions from Llama 8B exceeded standard HTTP timeout limits on slower client devices. I implemented Server-Sent Events (SSE) combined with client-side optimistic rendering in React.'
  );
  const [isEditProofModalOpen, setIsEditProofModalOpen] = useState<boolean>(false);
  const [isJobSpecModalOpen, setIsJobSpecModalOpen] = useState<boolean>(false);
  const [proofToast, setProofToast] = useState<string | null>(null);

  const activeJob = jobs.find(j => j.job_id === selectedJobId) || jobs[0];

  const gateDetails = [
    {
      gate: 0,
      title: "Gate 0: Security & Anti-Bluffing Integrity Shield",
      status: "PASS",
      badge: "Clean • 21.0:1 Contrast",
      summary: "Zero prompt injection payloads detected. Zero hidden 0.1pt font layers found. PDF byte structure authentic.",
      evidence: "Verified with deterministic byte frequency analysis. Clean contrast ratio 21.0:1 exceeds WCAG AA safety threshold."
    },
    {
      gate: 2,
      title: "Gate 2: Privacy & PII Sanitization",
      status: "PASS",
      badge: "Anonymized",
      summary: "Candidate phone number and physical address sanitized to protect privacy during initial algorithmic evaluation.",
      evidence: "Sanitized fields: phone_number, postal_address. Public proof artifacts preserved: GitHub handle @bhushanmehar."
    },
    {
      gate: 4,
      title: "Gate 4: GitHub Public Repository Verification",
      status: "PASS",
      badge: "Verified Code Base",
      summary: "Verified 142 public commits across TypeScript (48.2%) and Python (34.8%) matching required job skills.",
      evidence: "Primary Repository: github.com/bhushanmehar/moakmate (★ 14 stars). Recent commit activity confirmed in lookback window."
    },
    {
      gate: 6,
      title: "Gate 6: Evidence Ledger & Deterministic Fit Scoring",
      status: "PASS",
      badge: `Score: ${currentCandidate.final_score.toFixed(1)} / 100`,
      summary: "React, Node.js, and PostgreSQL verified with verbatim quotes in the Evidence Ledger. Hard failures: 0/5.",
      evidence: "Verbatim Ledger Quote: 'Developed Moakmate with React 18, Server-Sent Events, and Postgres schema design for real-time exam questions.' (Character offset [1420:1580])."
    },
    {
      gate: 7,
      title: "Gate 7: Deterministic Policy Engine",
      status: "PASS",
      badge: "AUTO_ADVANCE",
      summary: "Deterministic rule triggered: Score >= 75.0 AND Gate 0 Clean AND Must-Haves Satisfied → Decision: AUTO_ADVANCE.",
      evidence: "Candidate automatically advanced to recruiter review and technical interview invitation pipeline."
    }
  ];

  return (
    <div className="page-container" style={{ maxWidth: 1150 }}>
      {/* Top Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '30px 36px',
        color: '#FFFFFF',
        marginBottom: 24,
        boxShadow: 'var(--shadow-md)',
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
            background: 'rgba(255,255,255,0.15)', 
            padding: '3px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 8 
          }}>
            <Sparkles size={13} color="#FDE68A" /> Proof-of-Work Career Portal
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
            Welcome back, {CURRENT_CANDIDATE_USER.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, maxWidth: 620, lineHeight: 1.5 }}>
            Your applications are evaluated on tangible code, working software, and grounded proof of work — not black-box keyword bots.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Status Box */}
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
            textAlign: 'center',
            minWidth: 170
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              Current Pipeline Stage
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, color: '#10B981' }}>
              ✓ {currentCandidate.stage}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Fit Score: {currentCandidate.final_score.toFixed(1)}/100
            </div>
          </div>

          <button 
            className="btn-secondary"
            onClick={onExploreJobs}
            style={{ 
              background: '#FFFFFF', 
              color: '#1E3A8A', 
              border: 'none', 
              fontWeight: 700, 
              padding: '12px 18px',
              fontSize: 13.5
            }}
          >
            Explore Open Jobs →
          </button>
        </div>
      </div>

      {/* Main Grid: Pipeline Audit Progress & Proof Artifacts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24 }}>
        {/* Left Column: 12-Gate Audit Progress Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Job Selector Tabs (if multiple applied) */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: 'var(--shadow-sm)'
          }}>
            {appliedJobsList.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Your Applications ({appliedJobsList.length}):
                </span>
                {appliedJobsList.map(job => (
                  <button
                    key={job.job_id}
                    onClick={() => setSelectedJobId(job.job_id)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: selectedJobId === job.job_id ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                      background: selectedJobId === job.job_id ? 'rgba(2, 133, 250, 0.12)' : 'var(--bg-surface-subtle)',
                      color: selectedJobId === job.job_id ? 'var(--primary-600)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: selectedJobId === job.job_id ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {job.title}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={18} color="var(--primary-600)" />
                <div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Active Evaluation Context
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeJob.title} ({activeJob.company})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setIsJobSpecModalOpen(true)}
                  style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <FileText size={13} />
                  <span>View Full JD</span>
                </button>

                <span style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  ✓ {currentCandidate.decision}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time 12-Gate Audit Timeline */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <ShieldCheck size={18} color="#10B981" />
                  12-Gate Screening Pipeline Audit
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                  Audited automatically against your submitted code and proof artifacts.
                </p>
              </div>

              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)', padding: '3px 8px', borderRadius: 4 }}>
                All 5 Automated Gates Passed
              </span>
            </div>

            {/* Stepper Timeline with Interactive Expanders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {gateDetails.map(step => {
                const isExpanded = expandedGate === step.gate;

                return (
                  <div 
                    key={step.gate}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      background: isExpanded ? 'var(--bg-surface-subtle)' : 'transparent',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div 
                      onClick={() => setExpandedGate(isExpanded ? null : step.gate)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#10B981',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          ✓
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {step.summary}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {step.badge}
                        </span>
                        <ChevronDown 
                          size={15} 
                          color="var(--text-muted)" 
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.15s ease'
                          }} 
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        padding: '12px 16px 14px 52px',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                      }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Audit Evidence: </strong>
                        {step.evidence}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interview Invitation Action Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(2, 133, 250, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%)',
            border: '1.5px solid rgba(2, 133, 250, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', marginBottom: 6 }}>
                  <Calendar size={13} /> Next Step Available
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Ready to Interview: Technical Architecture Session
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                  The engineering team at <strong>{activeJob.company}</strong> has reviewed your proof of work and invited you to a 45-minute technical discussion.
                </p>
              </div>

              <button 
                className="btn-primary"
                onClick={() => setShowScheduleModal(true)}
                style={{ padding: '10px 18px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {isScheduled ? '✓ Interview Scheduled' : 'Pick Interview Time →'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Submitted Proof Artifacts & Case Study */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Submitted Proof Artifacts */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} color="var(--primary-600)" />
                Your Submitted Proof Artifacts
              </h4>
              <button 
                className="btn-secondary"
                onClick={() => setIsEditProofModalOpen(true)}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                Edit Proof
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* GitHub Repo */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Public Code Repository
                  </span>
                  <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                    ✓ Gate 4 Audited
                  </span>
                </div>
                <a 
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none'
                  }}
                >
                  <GithubIcon size={14} />
                  <span>{githubUrl.replace('https://', '')}</span>
                  <ExternalLink size={12} color="var(--text-tertiary)" />
                </a>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  TypeScript (48.2%) • Python (34.8%) • 142 commits
                </div>
              </div>

              {/* Live Web Demo */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Live Deployed App
                  </span>
                  <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                    ✓ 200 OK
                  </span>
                </div>
                <a 
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none'
                  }}
                >
                  <span>{liveUrl}</span>
                  <ExternalLink size={12} color="var(--text-tertiary)" />
                </a>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Fast response time: 240ms • React 18 & SSE
                </div>
              </div>

              {/* Resume Document */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Resume Document
                  </span>
                  <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                    ✓ Clean Gate 0
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  <FileText size={14} color="var(--primary-600)" />
                  <span>Bhushan_Mehar_Resume_2026.pdf</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Case Study Answer */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--primary-600)" />
              Submitted Architecture Case Study
            </h4>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Bottleneck Resolution:
            </div>
            <p style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              margin: 0
            }}>
              "{caseStudyText}"
            </p>
          </div>

          {/* Toast Notification */}
          {proofToast && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={15} />
              <span>{proofToast}</span>
            </div>
          )}

          {/* Quick CTA to explore other roles */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                Want to apply to more roles?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Browse {jobs.length} verified open positions
              </div>
            </div>

            <button 
              className="btn-secondary"
              onClick={onExploreJobs}
              style={{ fontSize: 12.5, padding: '6px 12px' }}
            >
              Explore Jobs
            </button>
          </div>
        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 520 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Schedule Technical Interview
                </h3>
              </div>
              <button className="icon-button" onClick={() => setShowScheduleModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: 20, gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Select a slot for your 45-minute technical conversation with the engineering team at <strong>{activeJob.company}</strong>:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { date: 'Tomorrow at 10:00 AM IST', interviewer: 'Sarah Jenkins (Staff Platform Engineer)' },
                  { date: 'Thursday at 3:30 PM IST', interviewer: 'David Kim (Engineering Lead)' },
                  { date: 'Friday at 11:00 AM IST', interviewer: 'Full Stack Engineering Panel' }
                ].map((slot, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setScheduledSlot(slot.date);
                      setIsScheduled(true);
                      setShowScheduleModal(false);
                      setProofToast(`Interview booked for ${slot.date}!`);
                      setTimeout(() => setProofToast(null), 3500);
                    }}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    className="hover-card"
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {slot.date}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                        With {slot.interviewer}
                      </div>
                    </div>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROOF ARTIFACTS MODAL */}
      {isEditProofModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditProofModalOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 580 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Update Your Proof Artifacts
                </h3>
              </div>
              <button className="icon-button" onClick={() => setIsEditProofModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: 24, gap: 16 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Public GitHub Repository URL:
                </label>
                <input 
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Live Deployed Web Application URL:
                </label>
                <input 
                  type="url"
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Architectural Case Study Bottleneck Resolution:
                </label>
                <textarea 
                  rows={4}
                  value={caseStudyText}
                  onChange={e => setCaseStudyText(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', height: 'auto', padding: 10, fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsEditProofModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  setIsEditProofModalOpen(false);
                  setProofToast('Proof artifacts updated and re-verified successfully!');
                  setTimeout(() => setProofToast(null), 3500);
                }}
              >
                Save & Re-Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FULL JOB SPEC MODAL */}
      {isJobSpecModalOpen && (
        <div className="modal-overlay" onClick={() => setIsJobSpecModalOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 700 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {activeJob.company} • {activeJob.location}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeJob.title}
                </h3>
              </div>
              <button className="icon-button" onClick={() => setIsJobSpecModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: 24, gap: 18 }}>
              <div>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Job Overview
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {activeJob.description}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Must-Have Non-Negotiable Skills (Gate 6 Citations)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeJob.must_have_skills.map(skill => (
                    <span 
                      key={skill}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10B981',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Experience & Education Requirements
                </h4>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Minimum {activeJob.min_years_experience}+ years practical engineering experience. {activeJob.education_requirement}.
                </div>
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
                type="button" 
                className="btn-primary"
                onClick={() => setIsJobSpecModalOpen(false)}
              >
                Close Job Spec
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
