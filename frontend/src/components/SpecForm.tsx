import React from 'react';
import { ProjectType } from '../types';
import {
  Terminal,
  Server,
  Layout,
  Search,
  Check,
  FileCode,
  Flame,
  Sliders,
} from 'lucide-react';

interface SpecFormProps {
  prompt: string;
  setPrompt: (v: string) => void;
  projectType: ProjectType;
  setProjectType: (v: ProjectType) => void;
  enableResearch: boolean;
  setEnableResearch: (v: boolean) => void;
  requirePlanApproval: boolean;
  setRequirePlanApproval: (v: boolean) => void;
  maxFixIterations: number;
  setMaxFixIterations: (v: number) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onLoadSample?: () => void;
}

export const SpecForm: React.FC<SpecFormProps> = ({
  prompt,
  setPrompt,
  projectType,
  setProjectType,
  enableResearch,
  setEnableResearch,
  requirePlanApproval,
  setRequirePlanApproval,
  maxFixIterations,
  setMaxFixIterations,
  onSubmit,
  isLoading,
  onLoadSample,
}) => {
  const architectures: {
    type: ProjectType;
    title: string;
    stack: string;
    desc: string;
    icon: typeof Terminal;
  }[] = [
    {
      type: 'python_cli',
      title: 'Python CLI Tool',
      stack: 'Click • Rich • Pytest Harness',
      desc: 'Modular CLI command tree with formatted terminal output and isolated pytest assertion suite.',
      icon: Terminal,
    },
    {
      type: 'fastapi_service',
      title: 'FastAPI Microservice',
      stack: 'FastAPI • Pydantic v2 • ASGI',
      desc: 'High-throughput async API with typed request/response models and Starlette TestClient coverage.',
      icon: Server,
    },
    {
      type: 'react_component',
      title: 'React 19 Component',
      stack: 'React 19 • TypeScript • Tailwind',
      desc: 'Modular interactive UI component with typed props, state transitions, and contract verification.',
      icon: Layout,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (prompt.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const estimatedTokens = Math.max(1, Math.ceil(prompt.trim().length / 4));

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel"
      style={{
        padding: '1.75rem',
        marginBottom: '1.75rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-amber)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 24px rgba(255, 107, 26, 0.08)',
      }}
    >
      {/* Molten amber hairline top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #ff6b1a, transparent)',
        }}
      />

      {/* Step 1: Target Architecture */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="badge badge-amber"
              style={{ fontSize: '0.72rem' }}
            >
              01 // BLUEPRINT
            </span>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Target Architecture
            </label>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Defines runner harness & test suite template
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {architectures.map((arch) => {
            const Icon = arch.icon;
            const isSelected = projectType === arch.type;
            return (
              <button
                type="button"
                key={arch.type}
                disabled={isLoading}
                onClick={() => setProjectType(arch.type)}
                style={{
                  textAlign: 'left',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected
                    ? '1.5px solid var(--accent-amber)'
                    : '1px solid var(--border-default)',
                  background: isSelected
                    ? 'rgba(255, 107, 26, 0.08)'
                    : 'rgba(14, 15, 20, 0.65)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  boxShadow: isSelected
                    ? '0 0 18px rgba(255, 107, 26, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected
                          ? 'rgba(255, 107, 26, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected
                          ? '1px solid var(--accent-amber)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={16} color={isSelected ? 'var(--accent-amber-bright)' : 'var(--text-secondary)'} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        }}
                      >
                        {arch.title}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected
                        ? '1.5px solid var(--accent-amber)'
                        : '1px solid var(--border-default)',
                      background: isSelected ? 'var(--accent-amber)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Check size={11} color="#000000" strokeWidth={3.5} />}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--accent-amber-bright)' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {arch.stack}
                </div>

                <p
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {arch.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Raw Specification Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="badge badge-amber"
              style={{ fontSize: '0.72rem' }}
            >
              02 // SPECIFICATION
            </span>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Raw Requirements & Interface Contracts
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-amber)',
                  background: 'rgba(255, 107, 26, 0.08)',
                  color: 'var(--accent-amber-bright)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Sample Spec</span>
              </button>
            )}

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>{prompt.length} chars</span>
              <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>•</span>
              <span>~{estimatedTokens} tokens</span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.7)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-amber)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 107, 26, 0.2), inset 0 2px 8px rgba(0, 0, 0, 0.7)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.7)';
          }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={5}
            placeholder="Describe functionality, parameters, data transformations, and edge cases (e.g. Build an MCP 4.0 CLI tool and protocol server with data analysis tools, stateless handshake, and in-memory pytest test assertions)..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '0.95rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              minHeight: '110px',
            }}
          />

          <div
            style={{
              padding: '0.4rem 0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.015)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <FileCode size={12} />
              <span>Nemotron reasoning decomposes requirements into files and test suites</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>⌘</kbd>
              <span>+</span>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Enter</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Forge Controls & Execution Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-default)',
          background: 'rgba(10, 11, 14, 0.5)',
          margin: '0 -1.75rem -1.75rem -1.75rem',
          padding: '1.25rem 1.75rem',
        }}
      >
        {/* Toggles & Parameters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          {/* Tavily Documentation Grounding Switch */}
          <button
            type="button"
            onClick={() => !isLoading && setEnableResearch(!enableResearch)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: enableResearch
                ? '1px solid var(--border-amber)'
                : '1px solid var(--border-default)',
              background: enableResearch
                ? 'rgba(255, 107, 26, 0.08)'
                : 'rgba(255, 255, 255, 0.02)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
            }}
            title="Grounds generation using Tavily search against latest live documentation"
          >
            <div
              style={{
                width: '32px',
                height: '16px',
                borderRadius: '8px',
                background: enableResearch ? 'var(--accent-amber)' : '#1e2028',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: enableResearch ? '18px' : '2px',
                  transition: 'left 0.2s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={13} color={enableResearch ? 'var(--accent-amber-bright)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: enableResearch ? '#ffffff' : 'var(--text-secondary)' }}>
                Tavily Live Grounding
              </span>
            </div>
          </button>

          {/* Pause for Plan Approval Switch */}
          <button
            type="button"
            onClick={() => !isLoading && setRequirePlanApproval(!requirePlanApproval)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: requirePlanApproval
                ? '1px solid var(--border-amber)'
                : '1px solid var(--border-default)',
              background: requirePlanApproval
                ? 'rgba(255, 107, 26, 0.08)'
                : 'rgba(255, 255, 255, 0.02)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
            }}
            title="Pause pipeline after blueprint creation for review"
          >
            <div
              style={{
                width: '32px',
                height: '16px',
                borderRadius: '8px',
                background: requirePlanApproval ? 'var(--accent-amber)' : '#1e2028',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: requirePlanApproval ? '18px' : '2px',
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: requirePlanApproval ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Pause for Blueprint Review
            </span>
          </button>

          {/* Fixer Limit */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <Sliders size={12} color="var(--text-muted)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Fixer Loop Limit:
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={maxFixIterations}
              onChange={(e) => setMaxFixIterations(Number(e.target.value))}
              disabled={isLoading}
              style={{
                width: '65px',
                accentColor: 'var(--accent-amber)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--accent-amber-bright)',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {maxFixIterations}x
            </span>
          </div>
        </div>

        {/* Forge Codebase Submit Button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="btn-forge"
          style={{ minWidth: '180px' }}
        >
          {isLoading ? (
            <>
              <div
                className="animate-spin"
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
              <span>Forging...</span>
            </>
          ) : (
            <>
              <Flame size={16} />
              <span>Forge Codebase</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SpecForm;
