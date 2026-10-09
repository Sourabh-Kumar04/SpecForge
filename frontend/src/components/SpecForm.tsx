import React from 'react';
import { ProjectType } from '../types';
import {
  Terminal,
  Server,
  Layout,
  Search,
  Sparkles,
  Sliders,
  Check,
  FileCode,
  Zap,
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
    accentColor: string;
  }[] = [
    {
      type: 'python_cli',
      title: 'Python CLI Tool',
      stack: 'Click 8.1+ • Rich • Pytest',
      desc: 'Production CLI with robust command flags, formatted tables, and automated assertion test suite.',
      icon: Terminal,
      accentColor: '#38bdf8',
    },
    {
      type: 'fastapi_service',
      title: 'FastAPI Microservice',
      stack: 'FastAPI 0.110+ • Pydantic v2 • ASGI',
      desc: 'High-throughput async REST service with typed schemas, health probes, and TestClient test coverage.',
      icon: Server,
      accentColor: '#06b6d4',
    },
    {
      type: 'react_component',
      title: 'React 19 Component',
      stack: 'React 19 • TypeScript • Tailwind',
      desc: 'Accessible UI component with verified property contracts, state handlers, and synthetic DOM tests.',
      icon: Layout,
      accentColor: '#a78bfa',
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
      }}
    >
      {/* Decorative top ambient bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 50%, #8b5cf6 100%)',
        }}
      />

      {/* Step 1: Target Architecture */}
      <div style={{ marginBottom: '1.75rem' }}>
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
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan-bright)',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
              }}
            >
              01
            </span>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Select Target Architecture
            </label>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Configures sandbox runner & test harnesses
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.85rem',
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
                  padding: '1.1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? `1.5px solid ${arch.accentColor}`
                    : '1px solid var(--border-default)',
                  background: isSelected
                    ? 'linear-gradient(145deg, rgba(14, 22, 38, 0.95) 0%, rgba(10, 16, 28, 0.85) 100%)'
                    : 'rgba(10, 13, 22, 0.65)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected
                    ? `0 0 20px -2px rgba(6, 182, 212, 0.25), 0 4px 12px rgba(0, 0, 0, 0.4)`
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected
                          ? 'rgba(6, 182, 212, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected
                          ? `1px solid ${arch.accentColor}`
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={17} color={isSelected ? arch.accentColor : 'var(--text-secondary)'} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        }}
                      >
                        {arch.title}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected
                        ? `2px solid ${arch.accentColor}`
                        : '1.5px solid var(--border-default)',
                      background: isSelected ? arch.accentColor : 'transparent',
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
                    color: isSelected ? arch.accentColor : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {arch.stack}
                </div>

                <p
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
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

      {/* Step 2: Spec Prompt Hero Input */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan-bright)',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
              }}
            >
              02
            </span>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Plain-English Application Specification
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.32rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent-cyan-bright)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Load sample 2026 FastMCP spec"
              >
                <Sparkles size={13} color="var(--accent-cyan-bright)" />
                <span>Load 2026 FastMCP Sample</span>
              </button>
            )}

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.2rem 0.55rem',
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
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15), inset 0 2px 8px rgba(0, 0, 0, 0.5)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.5)';
          }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={5}
            placeholder="Describe your desired application, input flags, domain models, validations, and expected behavior in detail (e.g. Build an MCP 4.0 CLI and server with data analysis tools, stateless handshake, and in-memory pytest assertions)..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '1rem',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              minHeight: '120px',
            }}
          />

          <div
            style={{
              padding: '0.45rem 0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.015)',
              borderBottomLeftRadius: 'var(--radius-md)',
              borderBottomRightRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
              <FileCode size={12} />
              <span>Nemotron prompts are conditioned with architectural standards and test patterns</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>⌘</kbd>
              <span>+</span>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>Enter</kbd>
              <span>to run</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Pipeline Controls & Execution Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(10, 13, 20, 0.4)',
          margin: '0 -1.75rem -1.75rem -1.75rem',
          padding: '1.25rem 1.75rem',
        }}
      >
        {/* Left: Toggles & Parameters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
          {/* Tavily Research Grounding Switch */}
          <button
            type="button"
            onClick={() => !isLoading && setEnableResearch(!enableResearch)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: enableResearch
                ? '1px solid rgba(6, 182, 212, 0.5)'
                : '1px solid var(--border-default)',
              background: enableResearch
                ? 'rgba(6, 182, 212, 0.1)'
                : 'rgba(255, 255, 255, 0.02)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Tavily AI live search grounding for recent API documentation"
          >
            <div
              style={{
                width: '34px',
                height: '18px',
                borderRadius: '10px',
                background: enableResearch ? '#06b6d4' : '#1e2638',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: enableResearch ? '18px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Search size={14} color={enableResearch ? 'var(--accent-cyan-bright)' : 'var(--text-muted)'} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: enableResearch ? '#ffffff' : 'var(--text-secondary)' }}>
                  Tavily Live Grounding
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  background: enableResearch ? 'rgba(6, 182, 212, 0.25)' : 'rgba(100, 116, 139, 0.2)',
                  color: enableResearch ? 'var(--accent-cyan-bright)' : 'var(--text-muted)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                $3k Prize Track
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
              gap: '0.65rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: requirePlanApproval
                ? '1px solid rgba(139, 92, 246, 0.5)'
                : '1px solid var(--border-default)',
              background: requirePlanApproval
                ? 'rgba(139, 92, 246, 0.1)'
                : 'rgba(255, 255, 255, 0.02)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Pause pipeline after planning to allow file structure inspection and editing"
          >
            <div
              style={{
                width: '34px',
                height: '18px',
                borderRadius: '10px',
                background: requirePlanApproval ? '#8b5cf6' : '#1e2638',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: requirePlanApproval ? '18px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
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
              Pause for Plan Approval
            </span>
          </button>

          {/* Fixer Loop Slider / Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <Sliders size={13} color="var(--text-muted)" />
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
                width: '70px',
                accentColor: 'var(--accent-cyan)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--accent-cyan-bright)',
                minWidth: '22px',
                textAlign: 'center',
              }}
            >
              {maxFixIterations}x
            </span>
          </div>
        </div>

        {/* Right: Submit Button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            padding: '0.8rem 1.9rem',
            borderRadius: 'var(--radius-md)',
            background: isLoading
              ? 'rgba(30, 41, 59, 0.7)'
              : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.92rem',
            letterSpacing: '-0.01em',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            cursor: (!prompt.trim() || isLoading) ? 'not-allowed' : 'pointer',
            boxShadow: isLoading
              ? 'none'
              : '0 4px 20px rgba(6, 182, 212, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '180px',
          }}
        >
          {isLoading ? (
            <>
              <div
                className="animate-spin"
                style={{
                  width: '15px',
                  height: '15px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
              <span>Agents Running...</span>
            </>
          ) : (
            <>
              <Zap size={16} fill="#ffffff" />
              <span>Forge Codebase</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SpecForm;
