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
        background: 'rgba(4, 6, 12, 0.85)',
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
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 16, 26, 0.95)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top gradient highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #06b6d4, #6366f1, #8b5cf6)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} color="var(--accent-violet-bright)" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Architecture Plan Preview & Editor
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
                transition: 'all 0.15s ease',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Modal Content Scroll Area */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
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
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Architecture Title
            </label>
            <input
              type="text"
              value={editedPlan.title}
              onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
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
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Architecture & Component Summary
            </label>
            <textarea
              rows={2}
              value={editedPlan.architecture_summary}
              onChange={(e) => setEditedPlan({ ...editedPlan, architecture_summary: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
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
                marginBottom: '0.5rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                Planned Repository Files ({editedPlan.files.length})
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Target files to be generated and verified
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                maxHeight: '220px',
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
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      overflow: 'hidden',
                      marginRight: '0.5rem',
                    }}
                  >
                    {file.is_test ? (
                      <FlaskConical size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                    ) : (
                      <FileCode size={14} color="var(--accent-cyan-bright)" style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: '0.82rem',
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
                        fontSize: '0.74rem',
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
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.8,
                    }}
                    title="Remove file from plan"
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
                placeholder="Purpose / Responsibility"
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
                  gap: '0.35rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Test & Verification Strategy */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Verification & Test Assertion Strategy
            </label>
            <textarea
              rows={2}
              value={editedPlan.test_strategy}
              onChange={(e) => setEditedPlan({ ...editedPlan, test_strategy: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
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
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => onApprove(editedPlan)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={16} />
            <span>Approve & Synthesize Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanEditorModal;
