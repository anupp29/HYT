import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  ArrowUpDown, 
  Building2, 
  Check, 
  X, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Layers,
  Edit,
  Sliders,
  Mail
} from 'lucide-react';
import { CandidateRecord, CandidateStage, DecisionType, JobDescription } from '../types/ats';

interface ApplicantsDashboardProps {
  job: JobDescription;
  candidates: CandidateRecord[];
  onSelectCandidate: (candidate: CandidateRecord) => void;
  onUpdateStage: (candidateId: string, stage: CandidateStage) => void;
  onOpenSignals: () => void;
  onEditJob: () => void;
  onOpenStages?: () => void;
  onOpenOutreach?: () => void;
}

export const ApplicantsDashboard: React.FC<ApplicantsDashboardProps> = ({
  job,
  candidates,
  onSelectCandidate,
  onUpdateStage,
  onOpenSignals,
  onEditJob,
  onOpenStages,
  onOpenOutreach
}) => {
  // State
  const [activeTab, setActiveTab] = useState<string>('Suggested');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [minExpFilter, setMinExpFilter] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDecision, setSelectedDecision] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'name'>('score');
  const [openMoveDropdownId, setOpenMoveDropdownId] = useState<string | null>(null);

  // Available skills list for filter
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => c.skills.forEach(s => set.add(s.name)));
    return Array.from(set).sort();
  }, [candidates]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      suggested: candidates.filter(c => c.stage === 'Suggested').length,
      all: candidates.length,
      shortlisted: candidates.filter(c => c.stage === 'Shortlisted').length,
      interview: candidates.filter(c => c.stage === 'Ready to Interview').length,
      rejected: candidates.filter(c => c.stage === 'Rejected').length,
      quarantined: candidates.filter(c => c.is_quarantined).length
    };
  }, [candidates]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Tab filter
      if (activeTab === 'Suggested' && c.stage !== 'Suggested') return false;
      if (activeTab === 'Shortlisted' && c.stage !== 'Shortlisted') return false;
      if (activeTab === 'Ready to Interview' && c.stage !== 'Ready to Interview') return false;
      if (activeTab === 'Rejected' && c.stage !== 'Rejected') return false;
      if (activeTab === 'Quarantined' && !c.is_quarantined) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesHeadline = c.headline.toLowerCase().includes(q);
        const matchesSkill = c.skills.some(s => s.name.toLowerCase().includes(q));
        if (!matchesName && !matchesHeadline && !matchesSkill) return false;
      }

      // Skill Filter
      if (selectedSkill !== 'All') {
        if (!c.skills.some(s => s.name.toLowerCase() === selectedSkill.toLowerCase())) return false;
      }

      // Decision Filter
      if (selectedDecision !== 'All') {
        if (c.decision !== selectedDecision) return false;
      }

      // Location Filter
      if (selectedLocation !== 'All') {
        if (!c.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') return b.final_score - a.final_score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [candidates, activeTab, searchQuery, selectedSkill, selectedDecision, selectedLocation, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSkill('All');
    setMinExpFilter(0);
    setSelectedLocation('All');
    setSelectedDecision('All');
    setActiveTab('Suggested');
  };

  const getStageDot = (stage: CandidateStage) => {
    switch (stage) {
      case 'Shortlisted': return '#F59E0B';
      case 'Ready to Interview': return '#10B981';
      case 'Rejected': return '#EF4444';
      case 'Quarantined': return '#9333EA';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className="page-container">
      {/* Top Header Row Matching Screenshot (303) and 013310 */}
      <div className="page-header-row">
        <div>
          <div className="job-title-group">
            <div className="job-logo-box">
              <Building2 size={20} />
            </div>
            <h1 className="page-title">{job.title}</h1>
          </div>

          <div className="job-meta-row">
            <span className="badge-active">Active</span>
            <span>Posted {job.posted_at}</span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>{candidates.length} Applications</span>
            <span>•</span>
            <span className="edit-job-link" onClick={onEditJob}>
              <Edit size={13} /> Edit job
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onOpenOutreach && (
            <button 
              className="btn-secondary"
              onClick={onOpenOutreach}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Bulk Email Candidates in Current Stage"
            >
              <Mail size={14} color="#0285FA" />
              <span>Outreach ({filteredCandidates.length})</span>
            </button>
          )}

          <button 
            className="btn-secondary" 
            onClick={onOpenSignals}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} color="#D97706" />
            <span>Signals</span>
          </button>

          <button className="icon-button">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="tabs-nav-bar">
        <div className="tabs-group">
          <button 
            className={`tab-btn ${activeTab === 'Suggested' ? 'active' : ''}`}
            onClick={() => setActiveTab('Suggested')}
          >
            <Sparkles size={15} color={activeTab === 'Suggested' ? '#F59E0B' : 'var(--text-tertiary)'} />
            <span>Suggested</span>
            <span className="tab-badge">{tabCounts.suggested}</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}
            onClick={() => setActiveTab('All')}
          >
            <span>All</span>
            <span className="tab-badge">{tabCounts.all}</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'Shortlisted' ? 'active' : ''}`}
            onClick={() => setActiveTab('Shortlisted')}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B' }} />
            <span>Shortlisted</span>
            <span className="tab-badge">{tabCounts.shortlisted}</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'Ready to Interview' ? 'active' : ''}`}
            onClick={() => setActiveTab('Ready to Interview')}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
            <span>Ready to Interview</span>
            <span className="tab-badge">{tabCounts.interview}</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'Rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('Rejected')}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
            <span>Rejected</span>
            <span className="tab-badge">{tabCounts.rejected}</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'Quarantined' ? 'active' : ''}`}
            onClick={() => setActiveTab('Quarantined')}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9333EA' }} />
            <span>Quarantined</span>
            <span className="tab-badge">{tabCounts.quarantined}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="btn-secondary" 
            onClick={onOpenStages || onOpenSignals}
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <Sliders size={14} />
            <span>Manage stages</span>
          </button>
        </div>
      </div>

      {/* AI Suggested Banner Card (Screenshot 298) */}
      <div className="ai-suggested-card">
        <div className="ai-card-top">
          <div>
            <div className="ai-header-badge">
              <Sparkles size={13} color="#D97706" /> AI SUGGESTED
            </div>
            <h2 className="ai-card-title">
              Candidates tuned for "{job.title}"
            </h2>
            <p className="ai-card-desc">
              Ranked automatically to your job description, 12-gate evidence ledger, and verified skills.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              className="btn-secondary"
              onClick={handleResetFilters}
              style={{ fontSize: 12.5, padding: '5px 12px' }}
            >
              Reset filters
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('All')}
              style={{ fontSize: 12.5, padding: '5px 12px' }}
            >
              View all
            </button>
          </div>
        </div>

        <div className="ai-subcards-grid">
          <div className="ai-subcard">
            <div className="ai-subcard-tag">SUGGESTED POOL</div>
            <div className="ai-subcard-val">{tabCounts.suggested} candidates</div>
            <div className="ai-subcard-note">Smart shortlist ready to review</div>
          </div>

          <div className="ai-subcard">
            <div className="ai-subcard-tag">READINESS</div>
            <div className="ai-subcard-val">Priority to interview</div>
            <div className="ai-subcard-note">Sorted by fit and recency</div>
          </div>

          <div className="ai-subcard">
            <div className="ai-subcard-tag">FILTERS</div>
            <div className="ai-subcard-val">
              {selectedSkill === 'All' && selectedDecision === 'All' ? 'No filters applied' : 'Active filters applied'}
            </div>
            <div className="ai-subcard-note">Use filters to nudge the AI picks</div>
          </div>
        </div>
      </div>

      {/* Search & Control Bar */}
      <div className="search-control-bar">
        <div className="search-input-group">
          <Search size={16} color="var(--text-tertiary)" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search applicants by name, title, or skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X 
              size={14} 
              style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }}
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        <div className="view-controls">
          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <ArrowUpDown size={14} />
            <span>Sort:</span>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              style={{ 
                border: '1px solid var(--border-subtle)', 
                background: 'var(--bg-surface)', 
                padding: '5px 8px', 
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="score">Best score</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          {/* View Mode Toggle (Card vs Table) */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-sm)',
            padding: 2
          }}>
            <button
              onClick={() => setViewMode('card')}
              className="icon-button"
              style={{
                border: 'none',
                background: viewMode === 'card' ? 'var(--bg-surface-subtle)' : 'transparent',
                color: viewMode === 'card' ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
              title="Card View (Screenshot 298)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="icon-button"
              style={{
                border: 'none',
                background: viewMode === 'table' ? 'var(--bg-surface-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
              title="Table View (Screenshot 013310)"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid / Content Layout */}
      <div className="candidate-grid-layout">
        {/* Left Column: Candidates (Cards or Table) */}
        <div className="candidate-list-col">
          {filteredCandidates.length === 0 ? (
            <div style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-lg)',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No candidates found</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 16 }}>
                Try adjusting your search criteria or resetting filters.
              </p>
              <button className="btn-secondary" onClick={handleResetFilters}>
                Reset all filters
              </button>
            </div>
          ) : viewMode === 'card' ? (
            /* Card View (Mirroring Screenshot 298) */
            filteredCandidates.map(cand => (
              <div 
                key={cand.candidate_id}
                className={`candidate-card ${cand.is_quarantined ? 'border-quarantined' : 'border-gold'}`}
                onClick={() => onSelectCandidate(cand)}
              >
                <div className="candidate-card-header">
                  <img 
                    src={cand.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                    alt={cand.name}
                    className="candidate-avatar"
                  />

                  <div className="candidate-meta-info">
                    <div className="candidate-name-row">
                      <span className="candidate-name">{cand.name}</span>
                      <span className="badge-ai-pick">
                        <Sparkles size={11} color="#D97706" /> AI PICK FOR THIS ROLE
                      </span>
                    </div>

                    <div className="candidate-headline">
                      {cand.headline}
                    </div>
                  </div>
                </div>

                <p className="candidate-bio-summary">
                  {cand.bio}
                </p>

                {/* Skill Pills */}
                <div className="skill-pill-container">
                  {cand.skills.slice(0, 10).map(skill => (
                    <span 
                      key={skill.name} 
                      className={`skill-pill ${skill.is_verified ? 'verified' : ''}`}
                    >
                      {skill.name}
                    </span>
                  ))}
                  {cand.skills.length > 10 && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{cand.skills.length - 10} more
                    </span>
                  )}
                </div>

                {/* Card Footer with Fit Score & Move Button */}
                <div className="candidate-card-footer" onClick={e => e.stopPropagation()}>
                  <div className="score-badge-circle">
                    <span className="score-number">{cand.final_score.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Fit Score</span>
                    
                    {cand.decision === 'AUTO_ADVANCE' && (
                      <span className="decision-pill advance">Auto Advance</span>
                    )}
                    {cand.decision === 'ESCALATE' && (
                      <span className="decision-pill escalate">Escalate</span>
                    )}
                    {cand.decision === 'AUTO_REJECT' && (
                      <span className="decision-pill reject">Auto Reject</span>
                    )}
                    {cand.is_quarantined && (
                      <span className="decision-pill quarantine">Quarantined</span>
                    )}
                  </div>

                  {/* Move Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="btn-primary"
                      onClick={() => setOpenMoveDropdownId(openMoveDropdownId === cand.candidate_id ? null : cand.candidate_id)}
                      style={{ padding: '6px 14px', fontSize: 12.5 }}
                    >
                      <span>Move</span>
                      <ChevronDown size={12} />
                    </button>

                    {openMoveDropdownId === cand.candidate_id && (
                      <div style={{
                        position: 'absolute',
                        bottom: '110%',
                        right: 0,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 20,
                        minWidth: 170,
                        overflow: 'hidden'
                      }}>
                        {(['Shortlisted', 'Ready to Interview', 'Rejected', 'Quarantined'] as CandidateStage[]).map(stg => (
                          <div 
                            key={stg}
                            onClick={() => {
                              onUpdateStage(cand.candidate_id, stg);
                              setOpenMoveDropdownId(null);
                            }}
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 12.5, 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStageDot(stg) }} />
                            <span>{stg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Table View (Mirroring Screenshot 013310) */
            <div className="table-container">
              <table className="ats-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Skills</th>
                    <th>Applied</th>
                    <th>Stage</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map(cand => (
                    <tr key={cand.candidate_id} onClick={() => onSelectCandidate(cand)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img 
                            src={cand.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                            alt={cand.name}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {cand.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              {cand.headline}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {cand.skills.slice(0, 3).map(sk => (
                            <span key={sk.name} className="skill-pill" style={{ fontSize: 11 }}>
                              {sk.name}
                            </span>
                          ))}
                          {cand.skills.length > 3 && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{cand.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        {cand.applied_at}
                      </td>

                      <td>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          fontSize: 12.5, 
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: getStageDot(cand.stage) }} />
                          {cand.stage}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => onSelectCandidate(cand)}
                          >
                            <span>Move</span>
                            <ChevronDown size={12} />
                          </button>
                          <button className="icon-button" style={{ padding: 4 }}>
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Filter Sidebar Panel (Mirroring Screenshot 298 / 303) */}
        <aside className="filter-panel">
          <div className="filter-heading-row">
            <Filter size={16} />
            <span>Filters</span>
          </div>

          {/* Search by in Filter */}
          <div className="filter-section">
            <div className="filter-section-title">
              <span>Search in</span>
            </div>
            <select 
              className="filter-select"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              <option value="India">India</option>
              <option value="Remote">Remote</option>
              <option value="Colombia">Colombia</option>
            </select>
          </div>

          {/* Skills Accordion Dropdown (Screenshot 303) */}
          <div className="filter-section">
            <div className="filter-section-title">
              <span>Skills</span>
              <ChevronDown size={14} color="var(--text-tertiary)" />
            </div>
            <select 
              className="filter-select"
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value)}
            >
              <option value="All">Choose required skills...</option>
              {allSkills.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Years of Experience Slider */}
          <div className="filter-section">
            <div className="filter-section-title">
              <span>Years of Experience</span>
              <span style={{ fontSize: 12, color: 'var(--primary-600)', fontWeight: 600 }}>
                {minExpFilter}+ yrs
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="10"
              step="1"
              value={minExpFilter}
              onChange={e => setMinExpFilter(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
              <span>0+ years</span>
              <span>10+ years</span>
            </div>
          </div>

          {/* Decision Filter */}
          <div className="filter-section">
            <div className="filter-section-title">
              <span>Decision Policy</span>
            </div>
            <select 
              className="filter-select"
              value={selectedDecision}
              onChange={e => setSelectedDecision(e.target.value)}
            >
              <option value="All">All Decisions</option>
              <option value="AUTO_ADVANCE">Auto Advance Only</option>
              <option value="ESCALATE">Escalate (Human Review)</option>
              <option value="AUTO_REJECT">Auto Reject Only</option>
            </select>
          </div>

          {/* Reset All Filters Button */}
          <button 
            className="btn-secondary"
            onClick={handleResetFilters}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              marginTop: 10,
              padding: '8px' 
            }}
          >
            <RotateCcw size={14} />
            <span>Reset All</span>
          </button>
        </aside>
      </div>
    </div>
  );
};
