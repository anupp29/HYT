import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Building2, 
  Briefcase, 
  Check, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { JobDescription } from '../types/ats';

interface CareersPageViewProps {
  jobs: JobDescription[];
  onApplyForJob: (job: JobDescription) => void;
}

export const CareersPageView: React.FC<CareersPageViewProps> = ({
  jobs,
  onApplyForJob
}) => {
  const [customDomain, setCustomDomain] = useState<string>('careers.huntyourtribe.com');
  const [primaryBrandColor, setPrimaryBrandColor] = useState<string>('#0285FA');
  const [companyHeadline, setCompanyHeadline] = useState<string>(
    'Build the future of proof-of-work hiring'
  );
  const [companyDescription, setCompanyDescription] = useState<string>(
    'We value verifiable engineering output, clean code craft, and demonstrated shipping velocity over static credentials.'
  );

  return (
    <div className="page-container">
      {/* Top Config Header */}
      <div className="page-header-row">
        <div>
          <div className="job-title-group">
            <div className="brand-icon" style={{ background: primaryBrandColor, width: 34, height: 34 }}>
              <Globe size={18} />
            </div>
            <h1 className="page-title">Hosted Careers Page</h1>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13.5 }}>
            Publish a custom-branded careers page hosted directly on your domain or embedded as an iframe.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a 
            href={`https://${customDomain}`} 
            target="_blank" 
            rel="noreferrer"
            onClick={e => e.preventDefault()}
            className="btn-secondary"
            style={{ fontSize: 13 }}
          >
            <span>Preview in New Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Grid: Domain Configuration & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Column: Branding & Domain Settings */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={16} />
            Careers Page Settings
          </h3>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Custom Subdomain / CNAME
            </label>
            <input 
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              className="search-input"
              style={{ border: '1px solid var(--border-subtle)', padding: '7px 10px', borderRadius: 6, background: 'var(--bg-surface-subtle)', fontSize: 12.5 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Brand Accent Color
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#0285FA', '#10B981', '#9849E8', '#FF8A33', '#191918'].map(color => (
                <div
                  key={color}
                  onClick={() => setPrimaryBrandColor(color)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: primaryBrandColor === color ? '0 0 0 2px var(--bg-surface), 0 0 0 4px ' + color : 'none'
                  }}
                >
                  {primaryBrandColor === color && <Check size={14} color="#FFF" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Hero Headline
            </label>
            <input 
              type="text"
              value={companyHeadline}
              onChange={e => setCompanyHeadline(e.target.value)}
              className="search-input"
              style={{ border: '1px solid var(--border-subtle)', padding: '7px 10px', borderRadius: 6, background: 'var(--bg-surface)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Company Subtitle
            </label>
            <textarea 
              value={companyDescription}
              onChange={e => setCompanyDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                border: '1px solid var(--border-subtle)',
                padding: '8px 10px',
                borderRadius: 6,
                fontFamily: 'inherit',
                fontSize: 12.5,
                background: 'var(--bg-surface)'
              }}
            />
          </div>

          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            lineHeight: 1.5
          }}>
            SSL certificate and DNS verification are active. Changes deploy instantly to your edge cache.
          </div>
        </div>

        {/* Right Column: Live Mockup of Public Careers Page */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Simulated Browser Bar */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 6,
              padding: '3px 14px',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-subtle)',
              flex: 1,
              maxWidth: 360
            }}>
              <Globe size={13} />
              <span>https://{customDomain}</span>
            </div>
          </div>

          {/* Careers Page Canvas */}
          <div style={{ padding: '40px 48px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 'var(--radius-full)', background: 'var(--ai-gold-bg)', border: '1px solid var(--ai-gold-border)', fontSize: 12, fontWeight: 700, color: 'var(--ai-gold-text)', marginBottom: 12 }}>
                <Sparkles size={12} color="#D97706" /> We Are Hiring Builders
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 8 }}>
                {companyHeadline}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {companyDescription}
              </p>
            </div>

            {/* Active Openings Listing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
                  Open Positions ({jobs.filter(j => j.active).length})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Evaluated with 12-Gate Proof of Work
                </span>
              </div>

              {jobs.filter(j => j.active).map(j => (
                <div
                  key={j.job_id}
                  style={{
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = primaryBrandColor}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {j.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                      <span>📍 {j.location}</span>
                      <span>•</span>
                      <span>Seniority: {j.seniority_level.toUpperCase()}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>{j.remote_policy}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {j.must_have_skills.map(sk => (
                        <span key={sk} className="skill-pill" style={{ fontSize: 11, background: 'var(--bg-surface)' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => onApplyForJob(j)}
                    style={{ background: primaryBrandColor, fontSize: 13, padding: '8px 18px' }}
                  >
                    <span>Apply with Proof</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
