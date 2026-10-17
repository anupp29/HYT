import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Filter, 
  Download, 
  FileText, 
  Users, 
  Briefcase, 
  Sparkles,
  ChevronRight,
  Sliders,
  Award
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | 'quarter' | 'all'>('30d');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'benchmarks' | 'fairness'>('pipeline');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      {/* Header Row */}
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <div className="job-title-group">
            <div className="job-logo-box" style={{ background: 'linear-gradient(135deg, #0285FA 0%, #1E3A8A 100%)' }}>
              <BarChart3 size={20} color="#FFFFFF" />
            </div>
            <h1 className="page-title">AI Recruitment Pipeline Dashboard & Benchmarks</h1>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13.5, margin: '4px 0 0' }}>
            Monitor end-to-end processing volume, 12-Gate accuracy benchmarks, integrity check results, and algorithmic fairness audits.
          </p>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Time range selector */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 3,
            display: 'flex',
            gap: 2
          }}>
            {(['30d', 'quarter', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: timeRange === range ? 'var(--bg-surface)' : 'transparent',
                  color: timeRange === range ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: 12,
                  fontWeight: timeRange === range ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: timeRange === range ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {range === '30d' ? 'Last 30 Days' : range === 'quarter' ? 'This Quarter' : 'All Time'}
              </button>
            ))}
          </div>

          <button 
            className="btn-secondary" 
            onClick={handleRefresh}
            style={{ padding: '7px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh analytics and re-calculate benchmarks"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Stat Cards (Matching PDF Page 17 & Page 3) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1: Total Job Descriptions */}
        <div className="stat-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Total Job Postings
            </span>
            <Briefcase size={16} color="var(--primary-600)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            12
          </div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↑ 2 this month</span>
          </div>
        </div>

        {/* Card 2: Total Resumes Processed */}
        <div className="stat-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Resumes Processed
            </span>
            <Users size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            2,438
          </div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↑ 18% this month</span>
          </div>
        </div>

        {/* Card 3: Avg Processing Time */}
        <div className="stat-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Avg Processing Time
            </span>
            <Clock size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            14.2 sec
          </div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↓ 32% faster latency</span>
          </div>
        </div>

        {/* Card 4: Overall Match Accuracy */}
        <div className="stat-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Match Accuracy
            </span>
            <Sparkles size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            87.6%
          </div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↑ 5.3% vs TF-IDF baseline</span>
          </div>
        </div>

        {/* Card 5: Integrity Flags Detected */}
        <div className="stat-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Integrity Flags
            </span>
            <ShieldCheck size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
            186
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>
            7.6% of total resumes
          </div>
        </div>
      </div>

      {/* End-to-End Real-Time Pipeline Flow (Matching PDF Page 17 & 1) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              End-to-End Evaluation Pipeline
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              Real-time processing flow from raw resume PDF ingestion to final 12-Gate recommendation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#10B981' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              Completed (98.8%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#F59E0B' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              Flagged (186)
            </span>
          </div>
        </div>

        {/* 6 Step Horizontal Process Flow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          position: 'relative'
        }}>
          {[
            { step: '1. Data Ingestion', metric: '2,438 Resumes', sub: '12 Active JDs', pct: 100, color: '#10B981' },
            { step: '2. Text Extraction', metric: '2,410 Extracted', sub: 'OCR Used: 142', pct: 98.8, color: '#10B981' },
            { step: '3. Info Structuring', metric: '2,410 Parsed', sub: 'Skills & Experience', pct: 98.8, color: '#10B981' },
            { step: '4. Integrity Checks', metric: '186 Flagged', sub: 'Hidden text & prompt injection', pct: 92.4, color: '#F59E0B' },
            { step: '5. Fit Matching', metric: '2,410 Scored', sub: 'Avg Score: 74.8', pct: 98.8, color: '#10B981' },
            { step: '6. Decision Gate', metric: '682 Shortlisted', sub: '1,286 Review • 470 Rejected', pct: 100, color: '#0285FA' },
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {item.step}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                {item.metric}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {item.sub}
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ width: `${item.pct}%`, height: '100%', background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Evaluation Benchmarks + Fairness Audits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Left Column: Model Evaluation Benchmarks (PDF Page 3 & 17) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Evaluation Benchmark Results (N = 200 Labeled Pairs)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                Deterministic verification metrics against human recruiter gold standard.
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-600)', background: 'rgba(2,133,250,0.1)', padding: '2px 8px', borderRadius: 4 }}>
              Active Model
            </span>
          </div>

          {/* Metric Quad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Extraction F1 Score
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                0.86
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Skills: 0.89 • Experience: 0.86 • Education: 0.91
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Ranking Quality (NDCG@5)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                0.81
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Human Recruiter Agreement: κ = 0.76
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Decision Accuracy
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                84.0%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                False Negative Rate: 6.5% (Safe recall)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Explanation Quality
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                4.2 / 5.0
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Grounded quotes with character offsets
              </div>
            </div>
          </div>

          {/* Baseline Comparison Table */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Baseline Comparison (Ranking Performance)
            </div>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 0' }}>Methodology</th>
                  <th style={{ padding: '6px 8px' }}>Precision@5</th>
                  <th style={{ padding: '6px 8px' }}>Recall@5</th>
                  <th style={{ padding: '6px 8px' }}>NDCG@5</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '8px 0' }}>Keyword Overlap (Baseline 1)</td>
                  <td style={{ padding: '8px' }}>0.48</td>
                  <td style={{ padding: '8px' }}>0.38</td>
                  <td style={{ padding: '8px' }}>0.52</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '8px 0' }}>TF-IDF Similarity (Baseline 2)</td>
                  <td style={{ padding: '8px' }}>0.48</td>
                  <td style={{ padding: '8px' }}>0.44</td>
                  <td style={{ padding: '8px' }}>0.61</td>
                </tr>
                <tr style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                  <td style={{ padding: '8px 0' }}>HuntYourTribe 12-Gate (Proposed System)</td>
                  <td style={{ padding: '8px' }}>0.72</td>
                  <td style={{ padding: '8px' }}>0.66</td>
                  <td style={{ padding: '8px' }}>0.81</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Algorithmic Fairness & Perturbation Audits (PDF Page 3 & 17) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ShieldCheck size={18} color="#10B981" />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Algorithmic Fairness & Robustness Check
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 14px' }}>
              Counterfactual perturbation suite testing for gender, college, and geographic bias.
            </p>

            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 0' }}>Perturbation Type</th>
                  <th style={{ padding: '6px 8px' }}>Decision Flip Rate</th>
                  <th style={{ padding: '6px 8px' }}>Δ Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: 'Name Change (Male ↔ Female)', flip: '1.2%', delta: '+0.01' },
                  { type: 'Gender Pronoun Replacement', flip: '0.8%', delta: '0.00' },
                  { type: 'College Name (Tier 1 → Tier 3)', flip: '2.1%', delta: '-0.03' },
                  { type: 'Location & Country Indicator', flip: '1.5%', delta: '+0.01' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '8px 0' }}>{row.type}</td>
                    <td style={{ padding: '8px' }}>{row.flip}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{row.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Certification Badge */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Fairness Guarantee: </strong>
                No statistically significant demographic or institutional bias detected across perturbation testing suite (decision flip rate &lt; 2.5%).
              </div>
            </div>
          </div>

          {/* Observed Failure Modes Mitigation */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Safety Note: </strong>
            Gate 2 anonymization removes PII before text embedding to prevent latent demographic bias in scoring.
          </div>
        </div>
      </div>

      {/* Real-time Activity Stream Table (PDF Page 17 & 3) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Recent Processing Activity (Live System Stream)
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Auto-refreshed with deterministic ledger sync
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 10px' }}>Type</th>
                <th style={{ padding: '8px 10px' }}>Document / Candidate</th>
                <th style={{ padding: '8px 10px' }}>Target Job</th>
                <th style={{ padding: '8px 10px' }}>Stage</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}>Latency</th>
                <th style={{ padding: '8px 10px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Resume', doc: 'aarav_singh_resume.pdf', job: 'Senior Full Stack', stage: 'Gate 6 Evidence Ledger', status: 'Completed', latency: '11.8 sec', time: 'Just now' },
                { type: 'Resume', doc: 'neha_verma_profile.pdf', job: 'Data Analyst', stage: 'Gate 4 GitHub Audit', status: 'Completed', latency: '14.2 sec', time: '4 mins ago' },
                { type: 'Job Spec', doc: 'swe_staff_infra.md', job: 'Staff Platform Engineer', stage: 'Criteria Extraction', status: 'Completed', latency: '3.1 sec', time: '12 mins ago' },
                { type: 'Resume', doc: 'adv_injected_sample.pdf', job: 'Senior Full Stack', stage: 'Gate 0 Integrity Shield', status: 'Flagged (21:1 Contrast)', latency: '8.4 sec', time: '22 mins ago' },
                { type: 'Resume', doc: 'bhushan_mehar_dossier.pdf', job: 'Full Stack Engineer', stage: 'Gate 7 Policy Decision', status: 'Completed (Auto-Advance)', latency: '12.6 sec', time: '35 mins ago' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      fontWeight: 700,
                      background: row.type === 'Resume' ? 'rgba(2,133,250,0.1)' : 'rgba(255,201,94,0.1)',
                      color: row.type === 'Resume' ? 'var(--primary-600)' : '#B45309'
                    }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.doc}</td>
                  <td style={{ padding: '10px' }}>{row.job}</td>
                  <td style={{ padding: '10px' }}>{row.stage}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      color: row.status.includes('Flagged') ? '#EF4444' : '#10B981',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {row.status.includes('Flagged') ? '⚠' : '✓'} {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{row.latency}</td>
                  <td style={{ padding: '10px', color: 'var(--text-tertiary)' }}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
