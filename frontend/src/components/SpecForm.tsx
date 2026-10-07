import React from 'react';
import { ProjectType } from '../types';
import { Terminal, Server, Layout, Search, Play, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

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
  const architectures: { type: ProjectType; title: string; desc: string; icon: any; color: string }[] = [
    {
      type: 'python_cli',
      title: 'Python CLI Tool',
      desc: 'Click 8.1+, Rich terminal formatting, Pytest',
      icon: Terminal,
      color: '#84cc16',
    },
    {
      type: 'fastapi_service',
      title: 'FastAPI Microservice',
      desc: 'FastAPI 0.110+, Pydantic v2, ASGI TestClient',
      icon: Server,
      color: '#38bdf8',
    },
    {
      type: 'react_component',
      title: 'React 19 Component',
      desc: 'TypeScript, Tailwind styling, Component contracts',
      icon: Layout,
      color: '#c084fc',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          1. Select Target Architecture Template
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: `2px solid ${isSelected ? arch.color : 'var(--border)'}`,
                  background: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-card-subtle)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Icon size={16} color={arch.color} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>
                    {arch.title}
                  </span>
                  {isSelected && (
                    <span style={{ marginLeft: 'auto' }}>
                      <CheckCircle size={15} color={arch.color} />
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {arch.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <label style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            2. Plain-English Application Specification
          </label>
          {onLoadSample && (
            <button
              type="button"
              onClick={onLoadSample}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(132, 204, 22, 0.45)',
                background: 'rgba(132, 204, 22, 0.12)',
                color: '#a3e635',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Load compelling 2026 FastMCP sample spec demonstrating Tavily grounding"
            >
              <Sparkles size={14} color="#a3e635" />
              <span>Try a sample spec →</span>
            </button>
          )}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          rows={4}
          placeholder="Describe your desired application, input flags, domain models, validations, and expected behavior in detail..."
          style={{
            width: '100%',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.9rem',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--nebius-blue)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
          {/* Explicit Tavily Research Toggle Switch */}
          <button
            type="button"
            onClick={() => !isLoading && setEnableResearch(!enableResearch)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: `1px solid ${enableResearch ? 'rgba(6, 182, 212, 0.6)' : 'var(--border)'}`,
              background: enableResearch ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card-subtle)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Tavily AI Search grounding for live API documentation"
          >
            <div style={{
              width: '32px',
              height: '18px',
              borderRadius: '10px',
              background: enableResearch ? '#06b6d4' : '#334155',
              position: 'relative',
              transition: 'background 0.2s ease',
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: enableResearch ? '16px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={14} color={enableResearch ? '#38bdf8' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: enableResearch ? '#38bdf8' : 'var(--text-secondary)' }}>
                Tavily Research Grounding: {enableResearch ? 'ON' : 'OFF'}
              </span>
              <span style={{
                fontSize: '0.68rem',
                background: enableResearch ? 'rgba(6, 182, 212, 0.25)' : 'rgba(100, 116, 139, 0.15)',
                color: enableResearch ? '#38bdf8' : '#94a3b8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}>
                Best Use of Tavily ($3k Prize)
              </span>
            </div>
          </button>


          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={requirePlanApproval}
              onChange={(e) => setRequirePlanApproval(e.target.checked)}
              disabled={isLoading}
              style={{ accentColor: '#84cc16', width: '15px', height: '15px' }}
            />
            <span>Pause for Plan Review & Edit</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>Fixer Loop Limit:</span>
            <select
              value={maxFixIterations}
              onChange={(e) => setMaxFixIterations(Number(e.target.value))}
              disabled={isLoading}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.82rem',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <option key={n} value={n}>{n} iterations</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.75rem',
            borderRadius: '10px',
            background: isLoading
              ? '#1e293b'
              : 'linear-gradient(135deg, #76b900 0%, #10b981 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.92rem',
            border: 'none',
            cursor: (!prompt.trim() || isLoading) ? 'not-allowed' : 'pointer',
            boxShadow: isLoading ? 'none' : '0 4px 16px rgba(118, 185, 0, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? (
            <>
              <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Agents Running...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="#ffffff" />
              <span>Forge Codebase</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
