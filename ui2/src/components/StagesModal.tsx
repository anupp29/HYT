import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  GripVertical, 
  Lock, 
  Trash2, 
  Check, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { CandidateRecord, CandidateStage } from '../types/ats';

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateRecord[];
}

export const StagesModal: React.FC<StagesModalProps> = ({
  isOpen,
  onClose,
  candidates
}) => {
  if (!isOpen) return null;

  const [stages, setStages] = useState<{ id: string; name: string; isBuiltIn: boolean; color: string }[]>([
    { id: 'stg-1', name: 'Suggested', isBuiltIn: true, color: '#D97706' },
    { id: 'stg-2', name: 'Shortlisted', isBuiltIn: true, color: '#F59E0B' },
    { id: 'stg-3', name: 'Ready to Interview', isBuiltIn: true, color: '#10B981' },
    { id: 'stg-4', name: 'Take-Home Review', isBuiltIn: false, color: '#0285FA' },
    { id: 'stg-5', name: 'Rejected', isBuiltIn: true, color: '#EF4444' },
    { id: 'stg-6', name: 'Quarantined', isBuiltIn: true, color: '#9849E8' }
  ]);

  const [newStageName, setNewStageName] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const getCandidateCount = (stageName: string) => {
    if (stageName === 'Quarantined') return candidates.filter(c => c.is_quarantined).length;
    return candidates.filter(c => c.stage === stageName).length;
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newArr = [...stages];
    const temp = newArr[idx - 1];
    newArr[idx - 1] = newArr[idx];
    newArr[idx] = temp;
    setStages(newArr);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === stages.length - 1) return;
    const newArr = [...stages];
    const temp = newArr[idx + 1];
    newArr[idx + 1] = newArr[idx];
    newArr[idx] = temp;
    setStages(newArr);
  };

  const handleAddStage = () => {
    if (newStageName.trim()) {
      setStages([
        ...stages,
        {
          id: `stg-${Date.now()}`,
          name: newStageName.trim(),
          isBuiltIn: false,
          color: '#0285FA'
        }
      ]);
      setNewStageName('');
      setShowAddForm(false);
    }
  };

  const handleDeleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 560 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 28, height: 28 }}>
              <Layers size={16} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Stages
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
        <div className="modal-body-scroll" style={{ gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              The steps applicants move through for this job. Reorder, add custom technical rounds, or manage candidate cohorts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {stages.length} active stages
            </span>

            <button 
              className="btn-secondary"
              onClick={() => setShowAddForm(true)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              <Plus size={13} />
              <span>Add stage</span>
            </button>
          </div>

          {/* Add Stage Form */}
          {showAddForm && (
            <div style={{
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              display: 'flex',
              gap: 8
            }}>
              <input 
                type="text"
                placeholder="Stage name, e.g. Technical Round 2..."
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                className="search-input"
                style={{ border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 4, background: 'var(--bg-surface)', fontSize: 13 }}
                autoFocus
              />
              <button 
                className="btn-primary" 
                onClick={handleAddStage}
                style={{ padding: '6px 14px', fontSize: 12.5 }}
              >
                Save
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowAddForm(false)}
                style={{ padding: '6px 10px', fontSize: 12.5 }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Stages List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stages.map((stg, idx) => (
              <div 
                key={stg.id}
                style={{
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GripVertical size={16} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stg.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {stg.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {getCandidateCount(stg.name)}
                  </span>

                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button 
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 2 }}
                    >
                      <ArrowUp size={13} color="var(--text-tertiary)" />
                    </button>
                    <button 
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === stages.length - 1}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: idx === stages.length - 1 ? 0.3 : 1, padding: 2 }}
                    >
                      <ArrowDown size={13} color="var(--text-tertiary)" />
                    </button>
                  </div>

                  {stg.isBuiltIn ? (
                    <span title="Built-in system stage">
                      <Lock size={13} color="var(--text-muted)" />
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleDeleteStage(stg.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
                      title="Delete stage"
                    >
                      <Trash2 size={13} color="var(--status-reject-text)" />
                    </button>
                  )}
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
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
