import React from 'react';
import { ExampleSpec, ProjectType } from '../types';
import { Terminal, Server, Layout, ArrowRight, Sparkles } from 'lucide-react';

interface ExampleGalleryProps {
  examples: ExampleSpec[];
  onSelect: (ex: ExampleSpec) => void;
  disabled?: boolean;
}

export const ExampleGallery: React.FC<ExampleGalleryProps> = ({ examples, onSelect, disabled }) => {
  const getArchitectureBadge = (type: ProjectType) => {
    switch (type) {
      case 'python_cli':
        return {
          icon: Terminal,
          label: 'CLI Tool',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
        };
      case 'fastapi_service':
        return {
          icon: Server,
          label: 'FastAPI',
          color: '#06b6d4',
          bg: 'rgba(6, 182, 212, 0.12)',
        };
      case 'react_component':
        return {
          icon: Layout,
          label: 'React 19',
          color: '#a78bfa',
          bg: 'rgba(167, 139, 250, 0.12)',
        };
      default:
        return {
          icon: Terminal,
          label: 'Tool',
          color: '#94a3b8',
          bg: 'rgba(148, 163, 184, 0.12)',
        };
    }
  };

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Sparkles size={14} color="var(--accent-cyan-bright)" />
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
            }}
          >
            Verified Quickstart Presets
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click to populate target architecture & specification
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {examples.map((ex) => {
          const badge = getArchitectureBadge(ex.project_type);
          const Icon = badge.icon;

          return (
            <button
              type="button"
              key={ex.id}
              disabled={disabled}
              onClick={() => onSelect(ex)}
              className="glass-panel"
              style={{
                textAlign: 'left',
                padding: '1rem 1.15rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(14, 18, 28, 0.6)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 16px -2px rgba(6, 182, 212, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      <Icon size={12} color={badge.color} />
                      {badge.label}
                    </span>
                  </div>

                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    marginBottom: '0.3rem',
                  }}
                >
                  {ex.title}
                </div>

                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {ex.description}
                </p>
              </div>

              {ex.tags && ex.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
                  {ex.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.66rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExampleGallery;
