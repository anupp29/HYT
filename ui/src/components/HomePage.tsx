import React, { useState } from 'react';
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
  MessageSquare,
  Mail,
  Eye,
  EyeOff,
  Scale,
  X
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginRole, setLoginRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loginEmail, setLoginEmail] = useState<string>('candidate@huntyourtribe.com');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            className="btn-secondary"
            onClick={() => setIsLoginModalOpen(true)}
            style={{ 
              padding: '8px 14px', 
              fontSize: 13, 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: 'transparent',
              color: '#FFF',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span>Sign In</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={onEnterCandidate}
            style={{ 
              padding: '8px 15px', 
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
              padding: '8px 16px', 
              fontSize: 13, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}
          >
            <Users size={14} />
            <span>Recruiter ATS</span>
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
                Never get filtered by keyword bots. Explore open roles, see your real-time profile match, showcase your actual code and deployed apps, and track your application status live.
              </p>

              {/* Bullet Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                {[
                  'Live Profile Match score based on your verified skills and experience',
                  'Showcase real GitHub code repositories & commit history',
                  'Verify live working web deployments in real-time',
                  'Full application scenario preview before submitting',
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

      {/* SECTION: What Makes HuntYourTribe Different? (from PDF Pages 7, 13, 15) */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Transparent AI Architecture
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            What Makes HuntYourTribe Different?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 640, margin: '8px auto 0' }}>
            We replace subjective keyword filtering with deterministic evidence verification, auditable scoring ledgers, and fairness audits.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {[
            {
              icon: ShieldCheck,
              iconColor: '#10B981',
              title: 'Resume Truth Scanner',
              desc: 'Detects hidden white text, invisible font sizes, prompt injection delimiters, and suspicious formatting artifacts.'
            },
            {
              icon: Layers,
              iconColor: '#0285FA',
              title: 'Verifiable Evidence Graph',
              desc: 'See exactly which candidate submission quote supports every awarded point with verbatim character offsets.'
            },
            {
              icon: Sliders,
              iconColor: '#8B5CF6',
              title: 'What-If Simulation Engine',
              desc: 'Simulate weight changes live (must-haves vs nice-to-haves) and audit rank shifts before finalizing hiring decisions.'
            },
            {
              icon: Scale,
              iconColor: '#EC4899',
              title: 'Fairness & Bias Testing',
              desc: 'Continuous perturbation checks across gender, names, and college tiers verify zero algorithmic disparity.'
            },
            {
              icon: Award,
              iconColor: '#F59E0B',
              title: 'Evaluation & Benchmarks',
              desc: 'Empirically tested on 200+ labelled pairs against keyword overlap and TF-IDF baselines with published F1 and NDCG scores.'
            },
            {
              icon: Zap,
              iconColor: '#3B82F6',
              title: 'Adversarial Test Suite',
              desc: 'Battle-tested against tricky adversarial resumes, jailbreak injections, and edge-case prompt manipulations.'
            }
          ].map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 22,
                  display: 'flex',
                  gap: 16
                }}
                className="hover-card"
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: `${card.iconColor}15`,
                  border: `1px solid ${card.iconColor}30`,
                  color: card.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CardIcon size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform Impact Stats Bar (from PDF Pages 7, 13, 15) */}
        <div style={{
          marginTop: 40,
          background: 'linear-gradient(135deg, rgba(2, 133, 250, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 24,
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0285FA', fontFamily: 'var(--font-mono)' }}>500+</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>Companies Hiring</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>10,000+</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>Verified Job Seekers</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8B5CF6', fontFamily: 'var(--font-mono)' }}>50,000+</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>Resumes Processed</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>150-250</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>Labelled Ground Truth Pairs</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>95%</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>Evaluation Accuracy</div>
          </div>
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
          <span style={{ cursor: 'pointer' }} onClick={() => { setLoginRole('recruiter'); setIsLoginModalOpen(true); }}>
            Recruiter Sign In
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => { setLoginRole('candidate'); setIsLoginModalOpen(true); }}>
            Candidate Portal
          </span>
          <span style={{ cursor: 'pointer' }} onClick={onOpenTour}>
            Product Tour
          </span>
        </div>
      </footer>

      {/* ROLE-BASED LOGIN MODAL (Matching PDF Pages 4, 10, 16) */}
      {isLoginModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginModalOpen(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: 460, borderRadius: 'var(--radius-xl)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Layers size={18} color="var(--primary-600)" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Login to HuntYourTribe
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                  Select your role to continue
                </div>
              </div>

              <button className="icon-button" onClick={() => setIsLoginModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body-scroll" style={{ padding: '24px 28px', gap: 18 }}>
              {/* Role Toggle Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div 
                  onClick={() => {
                    setLoginRole('candidate');
                    setLoginEmail('candidate@huntyourtribe.com');
                  }}
                  style={{
                    border: loginRole === 'candidate' ? '2px solid #0285FA' : '1px solid var(--border-subtle)',
                    background: loginRole === 'candidate' ? 'rgba(2, 133, 250, 0.08)' : 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: loginRole === 'candidate' ? '#0285FA' : 'rgba(255,255,255,0.06)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Candidate
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Looking for a job
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setLoginRole('recruiter');
                    setLoginEmail('rohan.mehta@huntyourtribe.com');
                  }}
                  style={{
                    border: loginRole === 'recruiter' ? '2px solid #0285FA' : '1px solid var(--border-subtle)',
                    background: loginRole === 'recruiter' ? 'rgba(2, 133, 250, 0.08)' : 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: loginRole === 'recruiter' ? '#0285FA' : 'rgba(255,255,255,0.06)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      HR Recruiter
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Hiring talent
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input 
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="search-input"
                    style={{ width: '100%', height: 40, paddingLeft: 36, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <a 
                    href="#" 
                    onClick={e => { e.preventDefault(); alert('Password reset link sent to ' + loginEmail); }}
                    style={{ fontSize: 11.5, color: 'var(--primary-600)', textDecoration: 'none' }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="search-input"
                    style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 36, fontSize: 13 }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  if (loginRole === 'candidate') {
                    onEnterCandidate();
                  } else {
                    onEnterRecruiter();
                  }
                }}
                style={{
                  width: '100%',
                  height: 42,
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 4
                }}
              >
                <span>Login as {loginRole === 'candidate' ? 'Candidate' : 'Recruiter'}</span>
                <ArrowRight size={15} />
              </button>

              {/* Secure & Private Guarantee */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <ShieldCheck size={18} color="#10B981" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: '#10B981' }}>Secure & Private: </strong>
                  Your credentials and candidate submissions are evaluated deterministically without sharing PII data.
                </div>
              </div>

              {/* Social Login Separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>

              {/* Social Login Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    if (loginRole === 'candidate') onEnterCandidate();
                    else onEnterRecruiter();
                  }}
                  style={{ justifyContent: 'center', fontSize: 12, padding: '8px 10px', gap: 8 }}
                >
                  <Globe size={14} color="#EA4335" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    if (loginRole === 'candidate') onEnterCandidate();
                    else onEnterRecruiter();
                  }}
                  style={{ justifyContent: 'center', fontSize: 12, padding: '8px 10px', gap: 8 }}
                >
                  <LinkedinIcon size={14} color="#0A66C2" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
