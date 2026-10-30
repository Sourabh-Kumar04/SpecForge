import React, { useState } from 'react';
import { Plan, PlannedFile } from '../types';
import { Check, X, FileCode, Plus, Trash2, Bot, FlaskConical } from 'lucide-react';

interface PlanEditorModalProps {
  plan: Plan;
  onApprove: (updatedPlan: Plan) => void;
  onClose?: () => void;
  isApprovalRequired?: boolean;
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({
  plan,
  onApprove,
  onClose,
  isApprovalRequired = false,
}) => {
  const [editedPlan, setEditedPlan] = useState<Plan>({ ...plan });
  const [newFilePath, setNewFilePath] = useState('');
  const [newFilePurpose, setNewFilePurpose] = useState('');

  const handleAddFile = () => {
    if (!newFilePath.trim()) return;
    const isTest = newFilePath.includes('test') || newFilePath.endsWith('_test.py');
    const newFile: PlannedFile = {
      path: newFilePath.trim(),
      purpose: newFilePurpose.trim() || 'Custom planned file',
      is_test: isTest,
    };
    setEditedPlan({
      ...editedPlan,
      files: [...editedPlan.files, newFile],
    });
    setNewFilePath('');
    setNewFilePurpose('');
  };

  const handleRemoveFile = (index: number) => {
    setEditedPlan({
      ...editedPlan,
      files: editedPlan.files.filter((_, i) => i !== index),
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 8, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 26, 0.15)',
                border: '1px solid var(--border-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} color="var(--accent-amber-bright)" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Architecture Blueprint Inspection
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {isApprovalRequired
                  ? 'Review and customize file contracts before code generation proceeds'
                  : 'Synthesized by NVIDIA Nemotron architecture planner'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Modal Content Scroll Area */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Plan Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              BLUEPRINT TITLE
            </label>
            <input
              type="text"
              value={editedPlan.title}
              onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Architecture Summary */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ARCHITECTURE SPECIFICATION
            </label>
            <textarea
              rows={2}
              value={editedPlan.architecture_summary}
              onChange={(e) => setEditedPlan({ ...editedPlan, architecture_summary: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                outline: 'none',
              }}
            />
          </div>

          {/* Planned Files */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.45rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                FILES IN REPOSITORY ({editedPlan.files.length})
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                marginBottom: '0.65rem',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {editedPlan.files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      overflow: 'hidden',
                      marginRight: '0.5rem',
                    }}
                  >
                    {file.is_test ? (
                      <FlaskConical size={13} color="var(--accent-amber-bright)" style={{ flexShrink: 0 }} />
                    ) : (
                      <FileCode size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#ffffff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.path}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      • {file.purpose}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-error-bright)',
                      cursor: 'pointer',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.8,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New File Row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Path (e.g. app/cli.py)"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                style={{
                  flex: '1 1 180px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Responsibility / Role"
                value={newFilePurpose}
                onChange={(e) => setNewFilePurpose(e.target.value)}
                style={{
                  flex: '2 1 240px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddFile}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 107, 26, 0.1)',
                  color: 'var(--accent-amber-bright)',
                  border: '1px solid var(--border-amber)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Test & Verification Strategy */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              VERIFICATION STRATEGY
            </label>
            <textarea
              rows={2}
              value={editedPlan.test_strategy}
              onChange={(e) => setEditedPlan({ ...editedPlan, test_strategy: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.65rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => onApprove(editedPlan)}
            className="btn-forge"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem' }}
          >
            <Check size={15} />
            <span>Approve & Synthesize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanEditorModal;
