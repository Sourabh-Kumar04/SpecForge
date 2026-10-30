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
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

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
      stack: 'Click / Rich / Pytest',
      desc: 'Modular CLI command tree with formatted terminal output and isolated pytest test assertions.',
      icon: Terminal,
    },
    {
      type: 'fastapi_service',
      title: 'FastAPI Microservice',
      stack: 'FastAPI / Pydantic v2 / ASGI',
      desc: 'High-throughput async API with typed request/response models and Starlette TestClient coverage.',
      icon: Server,
    },
    {
      type: 'react_component',
      title: 'React 19 Component',
      stack: 'React 19 / TypeScript',
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
        padding: '1.5rem',
        marginBottom: '1.75rem',
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
      }}
    >
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
            <Badge variant="amber" size="sm">
              01 // BLUEPRINT
            </Badge>
            <label
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Target Architecture
            </label>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Defines runner harness and test suite template
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
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected
                    ? '1.5px solid var(--accent-forge)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected
                    ? 'var(--accent-forge-subtle)'
                    : 'var(--bg-surface)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected
                          ? 'var(--accent-forge-subtle)'
                          : 'var(--bg-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected
                          ? '1px solid var(--accent-forge)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={15} color={isSelected ? 'var(--accent-forge-bright)' : 'var(--text-secondary)'} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.86rem',
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
                        ? '1.5px solid var(--accent-forge)'
                        : '1px solid var(--border-default)',
                      background: isSelected ? 'var(--accent-forge)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--accent-forge-bright)' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {arch.stack}
                </div>

                <p
                  style={{
                    fontSize: '0.75rem',
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
            <Badge variant="amber" size="sm">
              02 // SPECIFICATION
            </Badge>
            <label
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Requirements and Interface Contracts
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {onLoadSample && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLoadSample}
                disabled={isLoading}
              >
                Sample Spec
              </Button>
            )}

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>{prompt.length} chars</span>
              <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>|</span>
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
              padding: '0.85rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
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
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <FileCode size={12} />
              <span>Nemotron reasoning decomposes requirements into files and test suites</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <kbd style={{ background: 'var(--bg-surface-elevated)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Ctrl</kbd>
              <span>+</span>
              <kbd style={{ background: 'var(--bg-surface-elevated)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Enter</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Studio Controls and Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          margin: '0 -1.5rem -1.5rem -1.5rem',
          padding: '1.25rem 1.5rem',
          background: 'var(--bg-surface)',
        }}
      >
        {/* Toggles & Parameters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
          {/* Tavily Documentation Grounding Switch */}
          <button
            type="button"
            onClick={() => !isLoading && setEnableResearch(!enableResearch)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: enableResearch
                ? '1px solid var(--border-amber)'
                : '1px solid var(--border-default)',
              background: enableResearch
                ? 'var(--accent-forge-subtle)'
                : 'var(--bg-surface-elevated)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Grounds generation using Tavily search against latest live documentation"
          >
            <div
              style={{
                width: '28px',
                height: '14px',
                borderRadius: '7px',
                background: enableResearch ? 'var(--accent-forge)' : '#1e2028',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: enableResearch ? '16px' : '2px',
                  transition: 'left 0.2s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={13} color={enableResearch ? 'var(--accent-forge-bright)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: enableResearch ? '#ffffff' : 'var(--text-secondary)' }}>
                Tavily Grounding
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
              gap: '0.55rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: requirePlanApproval
                ? '1px solid var(--border-amber)'
                : '1px solid var(--border-default)',
              background: requirePlanApproval
                ? 'var(--accent-forge-subtle)'
                : 'var(--bg-surface-elevated)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Pause pipeline after blueprint creation for review"
          >
            <div
              style={{
                width: '28px',
                height: '14px',
                borderRadius: '7px',
                background: requirePlanApproval ? 'var(--accent-forge)' : '#1e2028',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: requirePlanApproval ? '16px' : '2px',
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
              background: 'var(--bg-surface-elevated)',
            }}
          >
            <Sliders size={12} color="var(--text-muted)" />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
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
                width: '60px',
                accentColor: 'var(--accent-forge)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--accent-forge-bright)',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {maxFixIterations}x
            </span>
          </div>
        </div>

        {/* Forge Codebase Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="md"
          disabled={!prompt.trim() || isLoading}
          isLoading={isLoading}
          style={{ minWidth: '170px' }}
        >
          <Flame size={15} />
          <span>Forge Codebase</span>
        </Button>
      </div>
    </form>
  );
};

export default SpecForm;
