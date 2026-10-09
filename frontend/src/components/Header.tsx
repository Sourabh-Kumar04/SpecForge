import React from 'react';
import { Flame, Cpu, Search, Activity } from 'lucide-react';
import { HealthInfo } from '../types';

interface HeaderProps {
  health: HealthInfo | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  const isLive = health ? !health.mock_mode : false;

  const fastModelName = health?.models?.fast
    ? health.models.fast.split('/').pop() || health.models.fast
    : 'Nemotron Fast';
  const reasoningModelName = health?.models?.reasoning
    ? health.models.reasoning.split('/').pop() || health.models.reasoning
    : 'Nemotron Reasoning';

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-default)',
        background: 'rgba(11, 12, 14, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.75rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      {/* Brand & Forge Metaphor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #ff6b1a 0%, #b84307 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(255, 107, 26, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            border: '1px solid rgba(255, 107, 26, 0.6)',
            flexShrink: 0,
          }}
        >
          <Flame size={20} color="#ffffff" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                lineHeight: 1.2,
              }}
            >
              SPEC<span style={{ color: 'var(--accent-amber)' }}>FORGE</span>
            </span>

            <span
              className="badge badge-amber"
              style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem' }}
            >
              CODE REFINERY
            </span>
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.1rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Raw specification in. Test-verified code out.
          </p>
        </div>
      </div>

      {/* Telemetry Status Readouts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {health ? (
          <>
            {/* Live Mode Telemetry */}
            <div
              className={`badge ${isLive ? 'badge-green' : 'badge-amber'}`}
              style={{ padding: '0.3rem 0.65rem' }}
              title={isLive ? 'Live Nebius inference' : 'Local deterministic test sandbox'}
            >
              <div
                className="pulse-ember"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isLive ? 'var(--color-success-bright)' : 'var(--accent-amber-bright)',
                }}
              />
              <span>{isLive ? 'NEBIUS LIVE' : 'SANDBOX MODE'}</span>
            </div>

            {/* NVIDIA Models Telemetry */}
            <div
              className="badge badge-slate"
              style={{ padding: '0.3rem 0.65rem' }}
              title={`Fast Tier: ${health.models.fast}\nReasoning Tier: ${health.models.reasoning}`}
            >
              <Cpu size={12} color="var(--accent-amber-bright)" />
              <span style={{ color: '#cbd5e1' }}>
                NEMOTRON: {fastModelName} / {reasoningModelName}
              </span>
            </div>

            {/* Tavily Grounding Telemetry */}
            <div
              className="badge badge-slate"
              style={{ padding: '0.3rem 0.65rem' }}
              title="Tavily doc search grounds generated code in latest library syntax"
            >
              <Search size={12} color="var(--accent-amber-bright)" />
              <span style={{ color: '#cbd5e1' }}>
                TAVILY: {health.tavily_enabled ? 'ONLINE' : 'FALLBACK'}
              </span>
            </div>
          </>
        ) : (
          <div className="badge badge-slate" style={{ color: 'var(--text-muted)' }}>
            <Activity size={12} className="animate-spin" />
            <span>Connecting...</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
