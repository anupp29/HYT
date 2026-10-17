import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Film,
  Compass
} from 'lucide-react';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourModal: React.FC<TourModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [tourMode, setTourMode] = useState<'video' | 'guide'>('video');
  const [activeStep, setActiveStep] = useState<number>(1);

  const tourSteps = [
    {
      step: 1,
      title: "Ask for Proof: Eliminate Resume Bluffing",
      subtitle: "Set up roles based on personas (Developer, Designer, PM). Candidates apply with live deployed URLs, public GitHub repositories, and architectural case studies.",
      badge: "Step 1 • Ingestion",
      details: [
        "Select job persona to auto-configure proof requirements",
        "Mandatory public code repo with Git commit inspection",
        "Live web deployment URL verification for working software"
      ]
    },
    {
      step: 2,
      title: "12-Gate Deterministic Screening & Evidence Ledger",
      subtitle: "Every candidate is evaluated through an automated 12-gate pipeline with zero LLM hallucination and strict evidence citation.",
      badge: "Step 2 • Verification",
      details: [
        "Gate 0 Integrity Shield detects invisible 0pt white text and prompt injection attacks",
        "Gate 4 audits GitHub language distributions against claimed skills",
        "Gate 6 awards points ONLY when grounded by verbatim citations in the Evidence Ledger"
      ]
    },
    {
      step: 3,
      title: "Signals: Score Every Applicant on What Matters",
      subtitle: "Write the signals you care about: Role fit, Technical depth, Ownership, Proof of work. Signals reads every application and explains each score.",
      badge: "Step 3 • Decision",
      details: [
        "Structural recall bias: a single verified must-have rescues candidates to ESCALATE",
        "Structured 3-sentence recruiter explanations generated exclusively from evidence ledgers",
        "Move candidates forward into customizable stages or trigger one-click bulk stage outreach"
      ]
    }
  ];

  const currentTour = tourSteps[activeStep - 1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 920, maxHeight: '92vh' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 28, height: 28, background: '#FFC95E' }}>
              <Play size={15} fill="#191918" color="#191918" />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                Product Tour: See HuntYourTribe Recruit in Action
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View Mode Toggle */}
            <div className="role-switcher" style={{ background: 'var(--bg-surface-subtle)' }}>
              <button
                className={`role-switch-btn ${tourMode === 'video' ? 'active' : ''}`}
                onClick={() => setTourMode('video')}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                <Film size={13} />
                <span>Video Demo</span>
              </button>
              <button
                className={`role-switch-btn ${tourMode === 'guide' ? 'active' : ''}`}
                onClick={() => setTourMode('guide')}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                <Compass size={13} />
                <span>Feature Guide</span>
              </button>
            </div>

            <button 
              className="icon-button"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tour Body */}
        <div className="modal-body-scroll" style={{ gap: 20 }}>
          {tourMode === 'video' ? (
            /* VIDEO TOUR VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Responsive 16:9 YouTube Player */}
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                background: '#000',
                boxShadow: 'var(--shadow-md)'
              }}>
                <iframe
                  src="https://www.youtube-nocookie.com/embed/hByF3NshSJo?autoplay=1&rel=0&modestbranding=1"
                  title="HuntYourTribe Recruit Product Tour"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Video Chapters & Features Card */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Key Architecture Moments in this Walkthrough
                  </span>
                  <a
                    href="https://www.youtube.com/watch?v=hByF3NshSJo"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { time: '0:00', title: 'Ask for Proof', desc: 'Job personas & public proof ingestion' },
                    { time: '0:45', title: '12-Gate Integrity', desc: 'Zero prompt-injection & Gate 4 GitHub audit' },
                    { time: '1:30', title: 'Signals Scoring', desc: 'Custom weights & deterministic ledgers' },
                    { time: '2:15', title: 'Hire as a Team', desc: 'Recruiter notes, consensus stars & outreach' }
                  ].map((ch, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          background: 'rgba(2, 133, 250, 0.1)',
                          color: 'var(--primary-600)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {ch.time}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ch.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                        {ch.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STEP-BY-STEP FEATURE GUIDE VIEW */
            <>
              {/* Step Selector Pills */}
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
                {tourSteps.map(s => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: activeStep === s.step ? '1.5px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                      background: activeStep === s.step ? 'rgba(2, 133, 250, 0.08)' : 'var(--bg-surface)',
                      color: activeStep === s.step ? 'var(--primary-600)' : 'var(--text-secondary)',
                      fontWeight: activeStep === s.step ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: activeStep === s.step ? 'var(--primary-600)' : 'var(--border-subtle)',
                      color: activeStep === s.step ? '#FFF' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800
                    }}>
                      {s.step}
                    </span>
                    <span>{s.title.split(':')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Interactive Feature Display */}
              <div style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'var(--ai-gold-bg)',
                    color: 'var(--ai-gold-text)',
                    border: '1px solid var(--ai-gold-border)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {currentTour.badge}
                  </span>

                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Step {activeStep} of 3
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {currentTour.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {currentTour.subtitle}
                  </p>
                </div>

                {/* Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {currentTour.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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
          {tourMode === 'video' ? (
            <>
              <button 
                className="btn-secondary" 
                onClick={() => setTourMode('guide')}
                style={{ fontSize: 13 }}
              >
                Explore Step-by-Step Guide →
              </button>

              <button className="btn-primary" onClick={onClose} style={{ padding: '8px 20px', fontSize: 13 }}>
                Got it, Take Me to ATS
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-secondary" 
                onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                disabled={activeStep === 1}
                style={{ opacity: activeStep === 1 ? 0.4 : 1 }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {activeStep < 3 ? (
                  <button 
                    className="btn-primary" 
                    onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
                  >
                    <span>Next Feature</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button className="btn-primary" onClick={onClose}>
                    <span>Explore Recruit Dashboard</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
