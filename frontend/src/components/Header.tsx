import {
  Sparkles,
  Cpu,
  Search,
  Activity,
} from 'lucide-react';
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
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8, 10, 15, 0.82)',
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
        transition: 'all 0.2s ease',
      }}
    >
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} color="#ffffff" />
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4), transparent)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '1.28rem',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              SpecForge
            </span>

            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan-bright)',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}
            >
              v1.0 • AGENTIC ENGINE
            </span>

            <span className="badge badge-nvidia" style={{ fontSize: '0.7rem' }}>
              NVIDIA Nemotron
            </span>
            <span className="badge badge-nebius" style={{ fontSize: '0.7rem' }}>
              Nebius AI Cloud
            </span>
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '0.15rem',
              letterSpacing: '-0.01em',
            }}
          >
            Autonomous Spec-to-Code Pipeline with Isolated Sandbox Test Verification
          </p>
        </div>
      </div>

      {/* Live Backend Status Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {health ? (
          <>
            {/* Live / Mock Connection Pill */}
            <div
              className={`badge ${isLive ? 'badge-green' : 'badge-amber'}`}
              style={{
                boxShadow: isLive ? '0 0 14px rgba(34, 197, 94, 0.2)' : 'none',
                padding: '0.3rem 0.75rem',
              }}
              title={
                isLive
                  ? 'Connected to live Nebius Token Factory inference'
                  : 'Zero-credential local verification mode enabled'
              }
            >
              <div
                className="pulse-dot"
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isLive ? 'var(--color-success-bright)' : 'var(--color-warning-bright)',
                  boxShadow: `0 0 8px ${isLive ? 'var(--color-success)' : 'var(--color-warning)'}`,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>
                {isLive ? 'Nebius Live API' : 'Mock Mode (Verified)'}
              </span>
            </div>

            {/* Model Dual-Tier Badge */}
            <div
              className="badge badge-slate"
              style={{
                padding: '0.3rem 0.7rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              title={`Fast Tier: ${health.models.fast}\nReasoning Tier: ${health.models.reasoning}`}
            >
              <Cpu size={13} color="var(--accent-cyan-bright)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1' }}>
                {fastModelName} / {reasoningModelName}
              </span>
            </div>

            {/* Tavily Grounding Status */}
            <div
              className={`badge ${health.tavily_enabled ? 'badge-cyan' : 'badge-slate'}`}
              style={{
                padding: '0.3rem 0.7rem',
              }}
              title={
                health.tavily_enabled
                  ? 'Tavily Search API actively grounding generation against live documentation'
                  : 'Grounded KB fallback docs'
              }
            >
              <Search size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {health.tavily_enabled ? 'Tavily Live Docs Grounding' : 'KB Grounding'}
              </span>
            </div>
          </>
        ) : (
          <div
            className="badge badge-slate"
            style={{ padding: '0.3rem 0.75rem', color: 'var(--text-muted)' }}
          >
            <Activity size={13} className="animate-spin" />
            <span>Connecting to backend...</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
