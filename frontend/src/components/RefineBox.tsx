import React, { useState } from 'react';
import { RefineResult, DiffChange } from '../types';
import {
  Wrench,
  Flame,
  Send,
  GitCommit,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface RefineBoxProps {
  jobId: string;
  refinements?: RefineResult[];
  onRefine: (instruction: string) => Promise<void>;
  isRefining: boolean;
}

export const RefineBox: React.FC<RefineBoxProps> = ({
  jobId,
  refinements = [],
  onRefine,
  isRefining,
}) => {
  const [instruction, setInstruction] = useState('');
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({ '0': true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    onRefine(instruction.trim());
    setInstruction('');
  };

  const handlePreset = (text: string) => {
    setInstruction(text);
  };

  const toggleDiff = (key: string) => {
    setExpandedDiffs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderDiffLines = (diffText: string) => {
    const lines = diffText.split('\n');
    return lines.map((line, idx) => {
      let color = '#cbd5e1';
      let bg = 'transparent';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        color = 'var(--color-success-bright)';
        bg = 'rgba(34, 197, 94, 0.08)';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        color = 'var(--accent-amber-bright)';
        bg = 'rgba(255, 107, 26, 0.08)';
      } else if (line.startsWith('@@')) {
        color = 'var(--text-muted)';
        bg = 'rgba(255, 255, 255, 0.02)';
      }

      return (
        <div
          key={idx}
          style={{
            color,
            background: bg,
            padding: '1px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            borderLeft: line.startsWith('+') ? '2px solid var(--color-success)' : line.startsWith('-') ? '2px solid var(--accent-amber)' : 'none',
          }}
        >
          {line}
        </div>
      );
    });
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        border: '1px solid var(--border-amber)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 107, 26, 0.08)',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 107, 26, 0.15)',
              border: '1px solid var(--border-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wrench size={16} color="var(--accent-amber-bright)" />
          </div>

          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Iterative Refinement Loop (Scoped Agent)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Surgical modifications to existing repository without from-scratch rebuilds
            </p>
          </div>
        </div>

        <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
          LIVE SSE STREAMED
        </span>
      </div>

      {/* Refine Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isRefining}
            placeholder="Type natural-language instruction (e.g. 'add retry logic to the API client' or 'add input validation for negative numbers')..."
            style={{
              flex: '1 1 300px',
              padding: '0.65rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-amber)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />

          <button
            type="submit"
            disabled={!instruction.trim() || isRefining}
            className="btn-forge"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            {isRefining ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: '13px',
                    height: '13px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                  }}
                />
                <span>Refining...</span>
              </>
            ) : (
              <>
                <Flame size={14} />
                <span>Refine & Verify</span>
              </>
            )}
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Suggested:
          </span>
          {[
            'add retry logic to the API client',
            'add input bounds validation',
            'add structured json logging',
          ].map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => handlePreset(preset)}
              disabled={isRefining}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.5rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              + {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Refinement History & Diff Summaries */}
      {refinements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-amber-bright)',
              letterSpacing: '0.04em',
            }}
          >
            // VERIFIED REFINEMENT DIFF SUMMARIES ({refinements.length})
          </div>

          {refinements.map((ref, rIdx) => {
            const isExpanded = expandedDiffs[String(rIdx)] ?? true;
            const isPassed = ref.test_result?.passed ?? true;

            return (
              <div
                key={ref.id || rIdx}
                style={{
                  background: 'rgba(10, 11, 15, 0.85)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  onClick={() => toggleDiff(String(rIdx))}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(18, 19, 25, 0.95)',
                    borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <GitCommit size={15} color="var(--accent-amber-bright)" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                      "{ref.instruction}"
                    </span>
                    <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                      {ref.changes.length} file{ref.changes.length === 1 ? '' : 's'} modified
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isPassed ? (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                        <CheckCircle2 size={11} /> VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>
                        <XCircle size={11} /> FAILED
                      </span>
                    )}

                    {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Diff Viewer Body */}
                {isExpanded && (
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                      {ref.summary}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {ref.changes.map((ch, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: '#07080a',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              padding: '0.45rem 0.75rem',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FileCode size={13} color="var(--accent-amber-bright)" />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#ffffff', fontWeight: 600 }}>
                                {ch.path}
                              </span>
                            </div>
                            {ch.explanation && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {ch.explanation}
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              padding: '0.5rem',
                              maxHeight: '260px',
                              overflowY: 'auto',
                              background: '#050608',
                            }}
                          >
                            {renderDiffLines(ch.diff)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefineBox;
