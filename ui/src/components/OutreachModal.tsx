import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  CheckCircle2, 
  Users, 
  Eye, 
  Sparkles, 
  FileText,
  ChevronDown
} from 'lucide-react';
import { CandidateRecord, CandidateStage, JobDescription } from '../types/ats';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDescription;
  candidates: CandidateRecord[];
}

export const OutreachModal: React.FC<OutreachModalProps> = ({
  isOpen,
  onClose,
  job,
  candidates
}) => {
  if (!isOpen) return null;

  const [selectedStage, setSelectedStage] = useState<CandidateStage>('Ready to Interview');
  const [templateType, setTemplateType] = useState<string>('interview');
  const [subject, setSubject] = useState<string>('Interview Invitation: {{job_title}} at {{company}}');
  const [body, setBody] = useState<string>(
`Hi {{candidate_name}},

Thank you for applying for the {{job_title}} position at {{company}}.

We thoroughly reviewed your proof of work and code repositories. We were impressed by your demonstrated technical depth and verified project implementations.

We would love to invite you for a 45-minute technical conversation with our engineering team to discuss your architecture, past projects, and role expectations.

Please choose a slot on our scheduling link:
https://cal.com/huntyourtribe/technical-interview

Looking forward to speaking with you!

Best regards,
Vishal Joshi
Technical Talent Lead | HuntYourTribe`
  );
  const [isSent, setIsSent] = useState<boolean>(false);

  const stageCandidates = candidates.filter(c => c.stage === selectedStage);
  const previewCandidate = stageCandidates[0] || candidates[0];

  const handleTemplateChange = (tmpl: string) => {
    setTemplateType(tmpl);
    if (tmpl === 'interview') {
      setSubject('Interview Invitation: {{job_title}} at {{company}}');
      setBody(
`Hi {{candidate_name}},

Thank you for applying for the {{job_title}} position at {{company}}.

We thoroughly reviewed your proof of work and code repositories. We were impressed by your demonstrated technical depth and verified project implementations.

We would love to invite you for a 45-minute technical conversation with our engineering team to discuss your architecture, past projects, and role expectations.

Please choose a slot on our scheduling link:
https://cal.com/huntyourtribe/technical-interview

Looking forward to speaking with you!

Best regards,
Vishal Joshi
Technical Talent Lead | HuntYourTribe`
      );
    } else if (tmpl === 'shortlist') {
      setSubject('Update on your application for {{job_title}} at {{company}}');
      setBody(
`Hi {{candidate_name}},

Your application for {{job_title}} has been shortlisted by our engineering leadership.

We are currently reviewing candidate cohorts and finalizing the interview schedule. You will hear back from us within the next 48 hours with next steps.

Thank you for sharing your public proof of work with us!

Best regards,
The Hiring Team at {{company}}`
      );
    } else if (tmpl === 'rejection') {
      setSubject('Application update for {{job_title}} at {{company}}');
      setBody(
`Hi {{candidate_name}},

Thank you for taking the time to share your background and proof of work for the {{job_title}} role at {{company}}.

While we appreciated reviewing your projects, we have chosen to proceed with candidates whose current production stack more closely aligns with our immediate requirements for this specific opening.

We will keep your profile in our startup talent pool for future openings that match your skills.

We wish you the very best in your search!

Sincerely,
The Recruitment Team at {{company}}`
      );
    }
  };

  const getPersonalizedText = (text: string, cand?: CandidateRecord) => {
    if (!cand) return text;
    return text
      .replace(/\{\{candidate_name\}\}/g, cand.name)
      .replace(/\{\{job_title\}\}/g, job.title)
      .replace(/\{\{company\}\}/g, job.company);
  };

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 940 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 28, height: 28, background: 'var(--hyt-blue)' }}>
              <Mail size={16} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Email a Whole Stage at Once (Bulk Outreach)
              </span>
            </div>
          </div>

          <button 
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-scroll">
          {/* Top Stage & Template Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                Recipient Stage *
              </label>
              <select 
                className="filter-select"
                value={selectedStage}
                onChange={e => setSelectedStage(e.target.value as any)}
                style={{ padding: '8px 12px' }}
              >
                <option value="Ready to Interview">Ready to Interview ({candidates.filter(c => c.stage === 'Ready to Interview').length} applicants)</option>
                <option value="Shortlisted">Shortlisted ({candidates.filter(c => c.stage === 'Shortlisted').length} applicants)</option>
                <option value="Suggested">Suggested ({candidates.filter(c => c.stage === 'Suggested').length} applicants)</option>
                <option value="Rejected">Rejected ({candidates.filter(c => c.stage === 'Rejected').length} applicants)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                Email Template *
              </label>
              <select 
                className="filter-select"
                value={templateType}
                onChange={e => handleTemplateChange(e.target.value)}
                style={{ padding: '8px 12px' }}
              >
                <option value="interview">Interview Invitation</option>
                <option value="shortlist">Shortlist Acknowledgement</option>
                <option value="rejection">Respectful Closeout</option>
              </select>
            </div>
          </div>

          {/* Email Subject Line */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
              Subject Line
            </label>
            <input 
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="search-input"
              style={{ border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}
            />
          </div>

          {/* Editor & Preview Split View */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Template Editor */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Message Template
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Tags: <code>{'{{candidate_name}}'}</code>, <code>{'{{job_title}}'}</code>
                </span>
              </div>
              <textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={11}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-surface)',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Live Recipient Preview */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} color="var(--hyt-blue)" />
                  Live Preview: {previewCandidate?.name}
                </label>
                <span style={{ fontSize: 11.5, color: 'var(--hyt-blue)', fontWeight: 600 }}>
                  To: {previewCandidate?.email}
                </span>
              </div>

              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
                height: 'calc(100% - 28px)',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 10 }}>
                  {getPersonalizedText(subject, previewCandidate)}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {getPersonalizedText(body, previewCandidate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '14px 22px', 
          borderTop: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Sending to <strong>{stageCandidates.length}</strong> applicant{stageCandidates.length === 1 ? '' : 's'} in <strong>{selectedStage}</strong>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSend}
              disabled={isSent || stageCandidates.length === 0}
            >
              {isSent ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Emails Dispatched!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send to {stageCandidates.length} Applicants</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
