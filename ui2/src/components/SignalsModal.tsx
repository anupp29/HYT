import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Minus, 
  Edit3, 
  Trash2, 
  Check, 
  Zap, 
  HelpCircle 
} from 'lucide-react';
import { SignalCriterion } from '../types/ats';
import { MOCK_SIGNAL_CRITERIA } from '../data/mockdata';

interface SignalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSignals: (target: 'suggested' | 'all') => void;
}

export const SignalsModal: React.FC<SignalsModalProps> = ({
  isOpen,
  onClose,
  onRunSignals
}) => {
  if (!isOpen) return null;

  const [criteria, setCriteria] = useState<SignalCriterion[]>(MOCK_SIGNAL_CRITERIA);
  const [editingId, setEditingId] = useState<string | null>('sig-proof-work');
  const [targetScope, setTargetScope] = useState<'suggested' | 'all'>('suggested');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const totalPoints = criteria.reduce((sum, c) => sum + c.points, 0);

  const handleUpdatePoints = (id: string, delta: number) => {
    setCriteria(prev => prev.map(c => {
      if (c.id === id) {
        const newPts = Math.max(1, c.points + delta);
        return { ...c, points: newPts };
      }
      return c;
    }));
  };

  const handleAddSignal = (name: string, description: string, rule: string) => {
    const newSig: SignalCriterion = {
      id: `sig-${Date.now()}`,
      name,
      description,
      high_score_rule: rule,
      points: 5,
      percentage: 15
    };
    setCriteria([...criteria, newSig]);
    setEditingId(newSig.id);
  };

  const handleRemoveSignal = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      onRunSignals(targetScope);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="signals-drawer" 
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              background: 'var(--ai-gold-bg)', 
              color: 'var(--ai-gold-text)', 
              border: '1px solid var(--ai-gold-border)',
              padding: '2px 8px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: 12, 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Sparkles size={12} color="#D97706" /> Signals
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Custom Evaluation Criteria
            </span>
          </div>

          <button 
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-body">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              Score every applicant on what matters to you
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Write the signals you care about, like role fit, technical depth or ownership, and weight each one. Signals reads every application and explains each score.
            </p>
          </div>

          {/* Criteria Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Criteria: {criteria.length} signals • {totalPoints} points
            </div>

            <button 
              className="btn-secondary"
              onClick={() => handleAddSignal('New Custom Signal', 'Describe candidate evaluation rule', 'Evidence of production proficiency')}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              <Plus size={13} />
              <span>Add signal</span>
            </button>
          </div>

          {/* Signal Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {criteria.map(crit => {
              const isEditing = editingId === crit.id;
              const pct = Math.round((crit.points / totalPoints) * 100) || 0;

              return (
                <div 
                  key={crit.id}
                  style={{
                    background: isEditing ? 'var(--bg-surface)' : 'var(--bg-surface-subtle)',
                    border: isEditing ? '1.5px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {crit.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
                        {crit.points} pts
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                      <button 
                        onClick={() => setEditingId(isEditing ? null : crit.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
                        title="Edit signal"
                      >
                        <Edit3 size={13} color="var(--text-tertiary)" />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                    {crit.description}
                  </div>

                  {/* Inline Editor Drawer when Selected */}
                  {isEditing && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          Name
                        </label>
                        <input 
                          type="text"
                          value={crit.name}
                          onChange={e => {
                            const val = e.target.value;
                            setCriteria(prev => prev.map(c => c.id === crit.id ? { ...c, name: val } : c));
                          }}
                          className="search-input"
                          style={{ border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 4, background: 'var(--bg-surface)' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            What earns a high score
                          </label>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {crit.high_score_rule.length} / 250
                          </span>
                        </div>
                        <textarea 
                          value={crit.high_score_rule}
                          onChange={e => {
                            const val = e.target.value;
                            setCriteria(prev => prev.map(c => c.id === crit.id ? { ...c, high_score_rule: val } : c));
                          }}
                          rows={2}
                          style={{ width: '100%', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12.5 }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Points:</span>
                          <button 
                            className="icon-button"
                            onClick={() => handleUpdatePoints(crit.id, -1)}
                            style={{ padding: 4 }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {crit.points}
                          </span>
                          <button 
                            className="icon-button"
                            onClick={() => handleUpdatePoints(crit.id, 1)}
                            style={{ padding: 4 }}
                          >
                            <Plus size={12} />
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                            {pct}% of the total score
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => handleRemoveSignal(crit.id)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--status-reject-text)', fontSize: 12, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                          <button 
                            className="btn-secondary"
                            onClick={() => setEditingId(null)}
                            style={{ padding: '4px 12px', fontSize: 12 }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Common Suggestions */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Common signals:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button 
                className="skill-pill"
                onClick={() => handleAddSignal('Problem solving', 'Algorithmic efficiency and resolving complex production blockers', 'Clear demonstration of resolving ambiguous technical roadblocks')}
                style={{ cursor: 'pointer' }}
              >
                + Problem solving
              </button>
              <button 
                className="skill-pill"
                onClick={() => handleAddSignal('Product sense', 'Understanding business impact, UX polish and metrics', 'Prioritizes user journey and metrics over unnecessary engineering complexity')}
                style={{ cursor: 'pointer' }}
              >
                + Product sense
              </button>
              <button 
                className="skill-pill"
                onClick={() => handleAddSignal('Leadership', 'Mentoring junior devs and driving technical RFC standards', 'Led engineering consensus and mentored team members')}
                style={{ cursor: 'pointer' }}
              >
                + Leadership
              </button>
            </div>
          </div>

          {/* Collapsible Evaluator Instructions */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Evaluator Instructions (Default)</span>
            </div>

            {showInstructions && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, padding: 10, background: 'var(--bg-surface-subtle)', borderRadius: 6, lineHeight: 1.5 }}>
                Evaluate each candidate against the signals defined above. For each signal, cite verbatim quotes from the candidate's resume or project repository. Under no circumstance may a score be awarded without an evidence ledger entry.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer with Execution Scope & Trigger Button */}
        <div className="drawer-footer">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Who to score
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 2 }}>
              <button
                onClick={() => setTargetScope('suggested')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: targetScope === 'suggested' ? 600 : 400,
                  background: targetScope === 'suggested' ? 'var(--primary-50)' : 'transparent',
                  color: targetScope === 'suggested' ? 'var(--primary-700)' : 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                Suggested view 9
              </button>
              <button
                onClick={() => setTargetScope('all')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: targetScope === 'all' ? 600 : 400,
                  background: targetScope === 'all' ? 'var(--primary-50)' : 'transparent',
                  color: targetScope === 'all' ? 'var(--primary-700)' : 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                All applicants 51
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--text-muted)' }}>
              9 credits • 191 left after
            </div>

            <button 
              className="btn-primary"
              onClick={handleRun}
              disabled={isRunning}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
            >
              <Zap size={14} color="#FDE68A" />
              <span>{isRunning ? 'Scoring...' : 'Run signals'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
