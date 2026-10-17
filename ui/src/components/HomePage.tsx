import React from 'react';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Code2, 
  Layers, 
  Building2, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Globe,
  Sliders,
  Check,
  Award,
  Zap,
  Lock,
  MessageSquare
} from 'lucide-react';
import { JobDescription } from '../types/ats';

interface HomePageProps {
  onEnterRecruiter: () => void;
  onEnterCandidate: () => void;
  onOpenTour: () => void;
  onExploreJobs: () => void;
  jobs: JobDescription[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onEnterRecruiter,
  onEnterCandidate,
  onOpenTour,
  onExploreJobs,
  jobs
}) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Top Navigation */}
      <header style={{
        height: 68,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-shell-recruit)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div className="brand-icon" style={{ width: 34, height: 34 }}>
            <Layers size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#FFF', letterSpacing: -0.4 }}>
              HuntYourTribe
            </span>
            <span style={{ fontSize: 10, color: 'var(--primary-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Recruit ATS • 12-Gate Platform
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13.5, fontWeight: 500 }}>
          <button 
            onClick={onOpenTour}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              background: 'rgba(255, 201, 94, 0.12)', 
              border: '1px solid rgba(255, 201, 94, 0.3)', 
              color: '#FFC95E',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12.5
            }}
          >
            <Play size={12} fill="#FFC95E" />
            <span>Watch Product Tour</span>
          </button>

          <button 
            onClick={onExploreJobs}
            style={{ background: 'transparent', border: 'none', color: '#D1D5DB', cursor: 'pointer', fontSize: 13.5 }}
          >
            Explore Jobs ({jobs.length})
          </button>

          <button 
            onClick={onEnterRecruiter}
            style={{ background: 'transparent', border: 'none', color: '#D1D5DB', cursor: 'pointer', fontSize: 13.5 }}
          >
            Recruiter Features
          </button>
        </div>

        {/* Right Dual Login Quick-Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn-secondary"
            onClick={onEnterCandidate}
            style={{ 
              padding: '8px 16px', 
              fontSize: 13, 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: '#211F1E',
              color: '#FFF',
              borderColor: '#33312E'
            }}
          >
            <UserCheck size={14} color="#10B981" />
            <span>Candidate Portal</span>
          </button>

          <button 
            className="btn-primary"
            onClick={onEnterRecruiter}
            style={{ 
              padding: '8px 18px', 
              fontSize: 13, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}
          >
            <Users size={14} />
            <span>Recruiter Login</span>
          </button>
        </div>
      </header>

      {/* Hero Section (Matching huntyourtribe.com/ats) */}
      <section style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '68px 24px 48px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Top Eyebrow Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 20
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          <span>Recruit: Built for startups, solo recruiters, and lean engineering teams</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 900,
          letterSpacing: -1.2,
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          marginBottom: 20,
          maxWidth: 820
        }}>
          The lightweight ATS for hiring on proof of <em style={{ fontStyle: 'italic', color: 'var(--primary-600)' }}>work</em>.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          maxWidth: 680,
          lineHeight: 1.6,
          marginBottom: 36
        }}>
          Candidates apply with the projects, case studies and verifiable code that show what they can do. 
          Deterministic 12-Gate screening verifies evidence, and Signals explains each score.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
          <button 
            className="btn-primary"
            onClick={onEnterRecruiter}
            style={{ padding: '14px 28px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Briefcase size={18} />
            <span>Launch Recruiter Workspace</span>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn-secondary"
            onClick={onExploreJobs}
            style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Code2 size={18} color="var(--primary-600)" />
            <span>Explore Jobs with Proof</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={onOpenTour}
            style={{ 
              padding: '14px 24px', 
              fontSize: 15, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: 'rgba(255, 201, 94, 0.1)',
              borderColor: 'rgba(255, 201, 94, 0.35)',
              color: '#B45309'
            }}
          >
            <Play size={16} fill="#D97706" color="#D97706" />
            <span>Watch Video Tour</span>
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Free for 3 active jobs • Zero LLM hallucinations • Deterministic Evidence Ledger
        </div>
      </section>

      {/* Dual Login / Portal Choice Cards */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24
        }}>
          {/* Card 1: For Recruiters / Hiring Managers */}
          <div 
            style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
            className="hover-card"
          >
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(2, 133, 250, 0.12)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Users size={24} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                For Hiring Teams & HR
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Recruiter & Pipeline Workspace
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                Ingest proof of work, audit 12 automated gates, configure custom criteria weights in Signals, and make collaborative decisions with zero noise.
              </p>

              {/* Bullet Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                {[
                  'Gate 0 Integrity Shield detects invisible text & prompt injections',
                  'Deterministic Evidence Ledger with verbatim quote citations',
                  'Signals drawer: customize Role Fit, Tech Depth, and Ownership weights',
                  'Bulk stage email outreach with scheduling links',
                  'Team collaborative notes and consensus star ratings'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="btn-primary"
              onClick={onEnterRecruiter}
              style={{ width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 700, justifyContent: 'center' }}
            >
              <span>Enter Recruiter Workspace →</span>
            </button>
          </div>

          {/* Card 2: For Candidates & Software Builders */}
          <div 
            style={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
            className="hover-card"
          >
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Code2 size={24} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                For Candidates & Builders
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Candidate Proof-of-Work Portal
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                Never get filtered by keyword bots. Explore open roles, calculate your profile-to-job match score, submit public code repos, and track your 12-Gate audit live.
              </p>

              {/* Bullet Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                {[
                  'Live Cosine Match scoreline based on verified skills & tech stack',
                  'Gate 4 GitHub code audit (commit history & language distributions)',
                  'Live deployed application ping test (HTTP 200 OK verification)',
                  'Full application preview before submitting',
                  'Direct technical interview scheduling with hiring teams'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="btn-secondary"
              onClick={onEnterCandidate}
              style={{ 
                width: '100%', 
                padding: '12px 20px', 
                fontSize: 14, 
                fontWeight: 700, 
                justifyContent: 'center',
                borderColor: '#10B981',
                color: '#10B981'
              }}
            >
              <span>Enter Candidate Portal →</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured On Trust Section */}
      <section style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-subtle)',
        padding: '36px 24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>
          Featured on & Trusted by Builders
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: 14,
          fontWeight: 700
        }}>
          <span>PRODUCT HUNT ★ #1 Product of the Day</span>
          <span>•</span>
          <span>EIN PRESSWIRE</span>
          <span>•</span>
          <span>SOURCEFORGE</span>
          <span>•</span>
          <span>SAASHUB</span>
        </div>
      </section>

      {/* How It Works (12-Gate Architecture) */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Deterministic Architecture
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            How 12-Gate Screening Eliminates Bluffing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            {
              gate: 'Gate 0',
              title: 'Integrity Shield',
              desc: 'Deep byte frequency & font layer contrast analysis detects invisible white text and adversarial LLM prompt injections.'
            },
            {
              gate: 'Gate 2',
              title: 'Privacy PII Masking',
              desc: 'Personal identifiers are masked before scoring to enforce zero unconscious demographic or geographic bias.'
            },
            {
              gate: 'Gate 4',
              title: 'GitHub Verification',
              desc: 'Language distribution analysis and commit timestamp checks authenticate claimed production skills against actual code.'
            },
            {
              gate: 'Gate 6',
              title: 'Evidence Ledger',
              desc: 'Points are awarded strictly when corroborated by verbatim quote citations with character offsets in candidate submissions.'
            },
            {
              gate: 'Gate 7',
              title: 'Decision Policy Engine',
              desc: 'Deterministic decision rules with recall-bias recovery: a single verified must-have rescues candidates to human review.'
            },
            {
              gate: 'Gate 8',
              title: 'Recruiter Explanations',
              desc: 'Generates structured 3-sentence recruiter summaries detailing strengths, risk factors, and recommended interview probe questions.'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 20
              }}
            >
              <div style={{
                display: 'inline-block',
                background: 'rgba(2, 133, 250, 0.1)',
                color: 'var(--primary-600)',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                marginBottom: 10
              }}>
                {item.gate}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-shell-recruit)',
        padding: '30px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9CA3AF', fontSize: 13 }}>
          <Layers size={16} />
          <span>HuntYourTribe Recruit © 2026. All rights reserved.</span>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#9CA3AF' }}>
          <span style={{ cursor: 'pointer' }} onClick={onEnterRecruiter}>Recruiter Login</span>
          <span style={{ cursor: 'pointer' }} onClick={onEnterCandidate}>Candidate Portal</span>
          <span style={{ cursor: 'pointer' }} onClick={onOpenTour}>Product Tour</span>
        </div>
      </footer>
    </div>
  );
};
