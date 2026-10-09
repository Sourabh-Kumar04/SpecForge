import React from 'react';
import { Flame, Cpu, Search, Activity, DollarSign, SlidersHorizontal } from 'lucide-react';
import { HealthInfo, JobDetail, SettingsInfo } from '../types';

interface HeaderProps {
  health: HealthInfo | null;
  currentJob?: JobDetail | null;
  onOpenSettings?: () => void;
  settings?: SettingsInfo | null;
}

export const Header: React.FC<HeaderProps> = ({ health, currentJob, onOpenSettings, settings }) => {
  const isLive = health ? !health.mock_mode : false;

  const fastModelName = health?.models?.fast
    ? health.models.fast.split('/').pop() || health.models.fast
    : 'Nemotron Fast';
  const reasoningModelName = health?.models?.reasoning
    ? health.models.reasoning.split('/').pop() || health.models.reasoning
    : 'Nemotron Reasoning';

  const spendAmount = currentJob?.spend?.total_cost_usd ?? 0.0;
  const spendCap = currentJob?.spend?.spend_cap_usd ?? (settings?.spend_cap_usd || 2.0);
  const isCapExceeded = currentJob?.spend?.is_cap_exceeded ?? false;

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
            {/* Running Spend Telemetry Badge */}
            <div
              className={`badge ${isCapExceeded ? 'badge-red' : 'badge-slate'}`}
              style={{
                padding: '0.3rem 0.65rem',
                border: isCapExceeded ? '1px solid #ef4444' : '1px solid rgba(255, 107, 26, 0.3)',
                color: isCapExceeded ? '#f87171' : 'var(--accent-amber-bright)',
                fontFamily: 'var(--font-mono)',
              }}
              title={`Estimated Nebius Token Spend for current job.\nCap: $${spendCap.toFixed(2)} USD (paused gracefully if reached).\nBased on published Token Factory rates.`}
            >
              <DollarSign size={13} color={isCapExceeded ? '#ef4444' : 'var(--accent-amber-bright)'} />
              <span>
                SPEND: ${spendAmount.toFixed(4)} / ${spendCap.toFixed(2)}
              </span>
            </div>

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

            {/* Settings Trigger Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
                title="Configure Nebius & Tavily credentials and spend caps"
              >
                <SlidersHorizontal size={13} />
                <span>Settings</span>
              </button>
            )}
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
