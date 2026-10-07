import React from 'react';
import { ExampleSpec, ProjectType } from '../types';
import { Terminal, Server, Layout, ArrowRight } from 'lucide-react';

interface ExampleGalleryProps {
  examples: ExampleSpec[];
  onSelect: (ex: ExampleSpec) => void;
  disabled?: boolean;
}

export const ExampleGallery: React.FC<ExampleGalleryProps> = ({ examples, onSelect, disabled }) => {
  const getIcon = (type: ProjectType) => {
    switch (type) {
      case 'python_cli':
        return <Terminal size={15} color="#84cc16" />;
      case 'fastapi_service':
        return <Server size={15} color="#38bdf8" />;
      case 'react_component':
        return <Layout size={15} color="#c084fc" />;
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Quickstart Templates
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click to populate spec & architecture
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {examples.map((ex) => (
          <button
            key={ex.id}
            disabled={disabled}
            onClick={() => onSelect(ex)}
            style={{
              textAlign: 'left',
              padding: '0.85rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {getIcon(ex.project_type)}
                  {ex.title}
                </span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {ex.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
              {ex.tags.map(t => (
                <span key={t} style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  background: '#1e293b',
                  color: '#94a3b8',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
