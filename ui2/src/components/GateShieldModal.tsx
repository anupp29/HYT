import React from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  FileSearch, 
  Cpu, 
  Lock, 
  GitBranch, 
  Scale, 
  AlertTriangle 
} from 'lucide-react';

interface GateShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GateShieldModal: React.FC<GateShieldModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const gates = [
    {
      gate: "Gate 0",
      title: "Integrity Shield",
      type: "Deterministic Security",
      desc: "Scans raw PDF bytes before any text is extracted: detects white-on-white text, 0.1pt fonts, off-page coordinates, metadata stuffing, and prompt injections.",
      status: "Active (Strict)",
      rule: "2+ flags → QUARANTINE status. Forces human review regardless of score."
    },
    {
      gate: "Gate 1",
      title: "Layout-Aware Text Extraction",
      type: "Geometric Parser",
      desc: "PyMuPDF block-level sorting by vertical and horizontal coordinates. Disentangles two-column resumes and isolated tabular data.",
      status: "Active",
      rule: "Produces clean_text preserving reading flow."
    },
    {
      gate: "Gate 2",
      title: "Privacy & PII Masking Shield",
      type: "Privacy Compliance",
      desc: "Redacts candidate names, phone numbers, and email addresses. GitHub profiles are extracted and isolated. Raw contact details never reach external LLM endpoints.",
      status: "Active",
      rule: "Zero PII reaches reasoning prompts."
    },
    {
      gate: "Gate 3",
      title: "Structured Extraction (LLM Call 1)",
      type: "JSON Extractor",
      desc: "Extracts skills with verbatim quotes ('context') proving demonstration. If a skill has no quote, it is marked verified: false (primary gaming detection).",
      status: "Active (Cached)",
      rule: "Unverified skills penalized in downstream math."
    },
    {
      gate: "Gate 4",
      title: "Verification Layer (GitHub Cross-Check)",
      type: "External Grounding",
      desc: "Hits GitHub API to inspect public repo language distributions, commit frequency, and recent PR activity. Verifies claimed skills against actual codebase contributions.",
      status: "Active",
      rule: "Language mismatch > 35% triggers GITHUB_MISMATCH flag."
    },
    {
      gate: "Gate 5",
      title: "Domain Pre-Filter Funnel",
      type: "Vector Embedding",
      desc: "Sentence-transformer cosine similarity between candidate verified skills and job must-haves. Filters obvious non-technical domain mismatches at zero API cost.",
      status: "Active",
      rule: "Similarity < 0.30 → ESCALATE (never silent reject)."
    },
    {
      gate: "Gate 6",
      title: "Deterministic Scoring Engine & Evidence Ledger",
      type: "Immutable Math",
      desc: "Calculates Technical (40%), Experience (30%), Seniority (20%), Education (5%), Location (5%). Writes an immutable ledger entry for every score point awarded.",
      status: "Active",
      rule: "No ledger citation = invalid score."
    },
    {
      gate: "Gate 7",
      title: "Decision Policy Engine (8 Conditions)",
      type: "Rule Policy",
      desc: "Pure Boolean logic evaluated in priority order. Features structural recall bias: a single verified must-have match saves candidates from auto-rejection.",
      status: "Active",
      rule: "Conditions 1 to 8: Quarantine, Recall bias, Overqualified."
    },
    {
      gate: "Gate 8",
      title: "Recruiter Explanation Generator (LLM Call 2)",
      type: "Reasoning Summary",
      desc: "Runs ONLY for AUTO_ADVANCE and ESCALATE. Receives only the evidence ledger JSON (cannot hallucinate). Produces exact 3-sentence recruiter summary.",
      status: "Active (Cached)",
      rule: "Sentence 1: Strengths; Sentence 2: Gaps; Sentence 3: Interview focus."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 880 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ background: '#9333EA', width: 28, height: 28 }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                12-Gate Deterministic Screening Architecture
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                HuntYourTribe ATS Core Engine
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
          <div style={{ 
            background: 'var(--bg-surface-subtle)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: 16, 
            marginBottom: 8 
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Deterministic, Verifiable, Recall-Biased Hiring
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Every candidate evaluated by HuntYourTribe ATS moves sequentially through these automated gates. Scores are derived exclusively from verified facts and grounded evidence citations, immune to invisible keyword spamming or LLM hallucinations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {gates.map((g, idx) => (
              <div 
                key={g.gate}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: idx === 0 ? 'rgba(147, 51, 234, 0.1)' : 'var(--primary-50)',
                  color: idx === 0 ? '#9333EA' : 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)'
                }}>
                  G{idx}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {g.gate}: {g.title}
                      </span>
                      <span style={{ fontSize: 11, background: 'var(--bg-surface-subtle)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-tertiary)' }}>
                        {g.type}
                      </span>
                    </div>

                    <span style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> {g.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                    {g.desc}
                  </p>

                  <div style={{ fontSize: 12, color: 'var(--primary-700)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: 4, display: 'inline-block' }}>
                    <strong>Contract Rule:</strong> {g.rule}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '14px 20px', 
          borderTop: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
