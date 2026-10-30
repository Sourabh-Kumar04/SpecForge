import React from 'react';
import { ExampleSpec, ProjectType } from '../types';
import { Terminal, Server, Layout, ArrowRight } from 'lucide-react';
import { Badge } from './ui/Badge';

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
          label: 'CLI ARCHITECTURE',
        };
      case 'fastapi_service':
        return {
          icon: Server,
          label: 'FASTAPI MICROSERVICE',
        };
      case 'react_component':
        return {
          icon: Layout,
          label: 'REACT 19 COMPONENT',
        };
      default:
        return {
          icon: Terminal,
          label: 'BLUEPRINT',
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
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              color: 'var(--accent-forge-bright)',
            }}
          >
            // BLUEPRINT PRESETS
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Select a template to load specification
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {examples.map((ex) => {
          const arch = getArchitectureBadge(ex.project_type);
          const Icon = arch.icon;

          return (
            <button
              type="button"
              key={ex.id}
              disabled={disabled}
              onClick={() => onSelect(ex)}
              style={{
                textAlign: 'left',
                padding: '0.95rem 1.15rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'var(--accent-forge)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
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
                  <Badge variant="amber" size="sm">
                    <Icon size={11} />
                    {arch.label}
                  </Badge>

                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    marginBottom: '0.25rem',
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.15rem' }}>
                  {ex.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
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
