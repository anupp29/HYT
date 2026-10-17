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
  X,
  User,
  Edit3,
  Download,
  Lightbulb,
  BookOpen,
  Target
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
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(3);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledSlot, setScheduledSlot] = useState<string>('Tomorrow at 10:00 AM IST');

  // Candidate Profile State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(CURRENT_CANDIDATE_USER.name || 'Bhushan Subhash Mehar');
  const [profileEmail, setProfileEmail] = useState<string>(CURRENT_CANDIDATE_USER.email || 'bhushan.mehar@gmail.com');
  const [resumeFileName, setResumeFileName] = useState<string>('bhushan_mehar_resume_2026.pdf');
  const [resumeFileSize, setResumeFileSize] = useState<string>('1.2 MB');

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

  const applicationMilestones = [
    {
      id: 0,
      title: "1. Application & Proof Submitted",
      status: "COMPLETED",
      badge: "Received",
      summary: "Your resume, GitHub code repository, and live web demo link were successfully received.",
      details: "All submitted documents and proof links are attached to your application profile."
    },
    {
      id: 1,
      title: "2. Technical Review & Verification",
      status: "COMPLETED",
      badge: "Verified",
      summary: "Your GitHub repository code activity and live web deployment have been authenticated.",
      details: "Code repository commits and live deployment responsiveness verified."
    },
    {
      id: 2,
      title: "3. Hiring Team Review",
      status: "COMPLETED",
      badge: "Shortlisted",
      summary: "The engineering team evaluated your profile and shortlisted you for technical discussion.",
      details: "Your technical depth and project implementation match the role criteria."
    },
    {
      id: 3,
      title: "4. Technical Interview",
      status: isScheduled ? "SCHEDULED" : "READY",
      badge: isScheduled ? "Confirmed" : "Action Required",
      summary: isScheduled
        ? `Confirmed for ${scheduledSlot}. Calendar invitation sent to your email.`
        : "You are invited for a 45-minute technical conversation. Select your preferred interview slot below.",
      details: "A 45-minute architectural walkthrough and deep-dive into your submitted case study."
    },
    {
      id: 4,
      title: "5. Final Decision & Offer",
      status: "UPCOMING",
      badge: "Pending Interview",
      summary: "Final evaluation and offer decision following your technical interview.",
      details: "Expect an update from the hiring team within 48 business hours after the interview."
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
              Application Status
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4, color: '#10B981' }}>
              ✓ Shortlisted for Interview
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Stage: {isScheduled ? 'Interview Confirmed' : 'Ready to Schedule'}
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

      {/* Candidate 4 Stat Cards (Matching PDF Page 5, 6, 18) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
            Total Applications
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            5
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Across 5 companies
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px', borderLeft: '3px solid #10B981' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: 4 }}>
            Shortlisted
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
            2
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Ready for technical interview
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px', borderLeft: '3px solid #F59E0B' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 4 }}>
            Under Review
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
            2
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Engineering evaluation in progress
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px', borderLeft: '3px solid #EF4444' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>
            Not Shortlisted
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
            1
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Criteria mismatch feedback shared
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Audit Progress & Proof Artifacts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, marginBottom: 28 }}>
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

          {/* Real-time Application Status & Milestones */}
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
                  <CheckCircle2 size={18} color="#10B981" />
                  Application Progress & Status
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                  Track your hiring milestones, verification, and interview schedule.
                </p>
              </div>

              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)', padding: '3px 8px', borderRadius: 4 }}>
                Status: Shortlisted for Interview
              </span>
            </div>

            {/* Stepper Timeline with Interactive Expanders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applicationMilestones.map(milestone => {
                const isExpanded = expandedMilestone === milestone.id;
                const isDone = milestone.status === 'COMPLETED';
                const isActive = milestone.status === 'READY' || milestone.status === 'SCHEDULED';

                return (
                  <div 
                    key={milestone.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      background: isExpanded ? 'var(--bg-surface-subtle)' : 'transparent',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div 
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
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
                          background: isDone ? '#10B981' : isActive ? 'var(--primary-600)' : 'var(--bg-surface-subtle)',
                          color: isDone || isActive ? '#FFF' : 'var(--text-muted)',
                          border: isDone || isActive ? 'none' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {isDone ? '✓' : milestone.id + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {milestone.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {milestone.summary}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: isDone ? 'rgba(16, 185, 129, 0.1)' : isActive ? 'rgba(2, 133, 250, 0.1)' : 'var(--bg-surface-subtle)',
                          color: isDone ? '#10B981' : isActive ? 'var(--primary-600)' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {milestone.badge}
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
                        <strong style={{ color: 'var(--text-primary)' }}>Stage Details: </strong>
                        {milestone.details}
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
                    ✓ Verified Code
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
                    ✓ Uploaded & Verified
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

      {/* SECTION: My Applications (from PDF Page 6 & 18) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 28,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            My Applications
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
            Track the status of your applications and see where you stand across hiring pipelines.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Job Title</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Applied On</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Match Score</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'app-1', jobId: jobs[0]?.job_id || 'job-swe-01', title: 'Software Engineer', company: 'TechNova Solutions', date: '12 Nov 2024', status: 'Shortlisted', color: '#10B981', score: 92 },
                { id: 'app-2', jobId: 'job-da-02', title: 'Data Analyst', company: 'DataSense Analytics', date: '10 Nov 2024', status: 'Under Review', color: '#F59E0B', score: 76 },
                { id: 'app-3', jobId: 'job-pm-03', title: 'Product Manager', company: 'InnoTech Labs', date: '05 Nov 2024', status: 'Not Shortlisted', color: '#EF4444', score: 35 },
                { id: 'app-4', jobId: 'job-ml-04', title: 'Machine Learning Engineer', company: 'AIWorks', date: '28 Oct 2024', status: 'Shortlisted', color: '#10B981', score: 88 },
                { id: 'app-5', jobId: 'job-be-05', title: 'Backend Developer', company: 'CloudTech', date: '20 Oct 2024', status: 'Under Review', color: '#F59E0B', score: 68 }
              ].map(app => {
                const isSelected = selectedJobId === app.jobId;
                return (
                  <tr 
                    key={app.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(2, 133, 250, 0.04)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    className="hover-card"
                  >
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={14} color="var(--primary-600)" />
                        <span>{app.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                      {app.company}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-tertiary)', fontSize: 12.5 }}>
                      {app.date}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        fontWeight: 700,
                        background: `${app.color}18`,
                        color: app.color,
                        border: `1px solid ${app.color}35`
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: app.color }} />
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 36, 
                          height: 24, 
                          borderRadius: 4, 
                          background: app.score >= 80 ? 'rgba(16, 185, 129, 0.15)' : app.score >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: app.score >= 80 ? '#10B981' : app.score >= 60 ? '#F59E0B' : '#EF4444',
                          fontWeight: 800,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {app.score}%
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {app.score >= 80 ? 'High Match' : app.score >= 60 ? 'Moderate' : 'Low Match'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          const targetJob = jobs.find(j => j.job_id === app.jobId);
                          if (targetJob) {
                            setSelectedJobId(targetJob.job_id);
                          }
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                          setProofToast(`Viewing ${app.title} at ${app.company}`);
                          setTimeout(() => setProofToast(null), 3000);
                        }}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600 }}
                      >
                        {isSelected ? 'Currently Viewing' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Profile & Resume Management (from PDF Page 6 & 18) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 28,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Candidate Profile
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              Keep your profile and verified resume updated to get grounded job recommendations.
            </p>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => setIsEditProfileModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* User Bio Card */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}>
              {profileName.charAt(0)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                {profileName}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {profileEmail}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                <span>Bengaluru, India</span>
                <span>•</span>
                <span>Full Stack & AI Engineer</span>
              </div>
            </div>
          </div>

          {/* Uploaded Resume Card */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 42,
                height: 42,
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

              <div style={{ minWidth: 0 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: 200
                }}>
                  {resumeFileName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#10B981', marginTop: 2 }}>
                  <CheckCircle2 size={12} />
                  <span>{resumeFileSize} • ATS Verified</span>
                </div>
              </div>
            </div>

            <div>
              <label 
                className="btn-secondary"
                style={{
                  cursor: 'pointer',
                  padding: '7px 14px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <UploadCloud size={13} />
                <span>Replace Resume</span>
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setResumeFileName(file.name);
                      setResumeFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                      setProofToast(`Resume "${file.name}" uploaded & parsed!`);
                      setTimeout(() => setProofToast(null), 3500);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Tips to Get Hired Faster (from PDF Page 6 & 18) */}
      <div style={{
        marginBottom: 32
      }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Tips to Get Hired Faster
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: 0 }}>
            Improve your application profile and pass deterministic verification checks.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16
        }}>
          {[
            {
              icon: FileText,
              iconColor: '#0285FA',
              title: 'Keep Your Resume Updated',
              desc: 'Showcase your latest skills, verified projects, and measurable impact metrics.'
            },
            {
              icon: User,
              iconColor: '#8B5CF6',
              title: 'Complete Your Profile',
              desc: 'Add verified GitHub commits, live demo URLs, and comprehensive education background.'
            },
            {
              icon: Target,
              iconColor: '#10B981',
              title: 'Apply to Relevant Jobs',
              desc: 'Use role requirements to focus on positions where your skills align 80%+.'
            },
            {
              icon: Clock,
              iconColor: '#F59E0B',
              title: 'Track Your Status',
              desc: 'Stay informed about your progress in real time as hiring teams advance evaluations.'
            }
          ].map((tip, idx) => {
            const TipIcon = tip.icon;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: `${tip.iconColor}15`,
                  border: `1px solid ${tip.iconColor}30`,
                  color: tip.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TipIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {tip.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {tip.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditProfileModalOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 480 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={17} color="var(--primary-600)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Edit Candidate Profile
                </h3>
              </div>
              <button className="icon-button" onClick={() => setIsEditProfileModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: 22, gap: 16 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Full Name:
                </label>
                <input 
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Email Address:
                </label>
                <input 
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                />
              </div>

              <div style={{ 
                background: 'var(--bg-surface-subtle)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-md)', 
                padding: 12,
                fontSize: 12,
                color: 'var(--text-tertiary)'
              }}>
                ℹ️ Note: Profile edits sync automatically with all your active and pending job applications.
              </div>
            </div>

            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsEditProfileModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  setIsEditProfileModalOpen(false);
                  setProofToast('Profile updated successfully!');
                  setTimeout(() => setProofToast(null), 3500);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
