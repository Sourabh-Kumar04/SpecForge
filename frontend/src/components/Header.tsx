import React from 'react';
import { Flame, Cpu, Search, Activity, DollarSign, SlidersHorizontal, Terminal, Boxes } from 'lucide-react';
import { HealthInfo, JobDetail, SettingsInfo } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface HeaderProps {
  health: HealthInfo | null;
  currentJob?: JobDetail | null;
  onOpenSettings?: () => void;
  settings?: SettingsInfo | null;
  activeView?: 'studio' | 'components';
  onSelectView?: (view: 'studio' | 'components') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  currentJob,
  onOpenSettings,
  settings,
  activeView = 'studio',
  onSelectView,
}) => {
  const isLive = health ? health.llm_status === 'live' : false;
  const llmStatusLabel = health?.llm_status === 'live'
    ? 'NEBIUS LIVE'
    : health?.llm_status === 'mock_fallback'
      ? 'MOCK FALLBACK'
      : health?.llm_status === 'key_ready'
        ? 'NEBIUS KEY READY'
        : 'SANDBOX MODE';

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
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.65rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      {/* Brand & Studio View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-forge)',
              border: '1px solid var(--accent-forge-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={18} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  lineHeight: 1.2,
                }}
              >
                SPEC<span style={{ color: 'var(--accent-forge-bright)' }}>FORGE</span>
              </span>

              <Badge variant="amber" size="sm">
                STUDIO
              </Badge>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: '0.1rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Specification-to-verified-repository engine
            </p>
          </div>
        </div>

        {/* View Switcher: Studio vs Component Inventory */}
        {onSelectView && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-base)',
              padding: '0.2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              gap: '0.2rem',
            }}
          >
            <button
              type="button"
              onClick={() => onSelectView('studio')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: activeView === 'studio' ? '1px solid var(--border-amber)' : '1px solid transparent',
                background: activeView === 'studio' ? 'var(--accent-forge-subtle)' : 'transparent',
                color: activeView === 'studio' ? 'var(--accent-forge-bright)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Terminal size={13} />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('components')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: activeView === 'components' ? '1px solid var(--border-amber)' : '1px solid transparent',
                background: activeView === 'components' ? 'var(--accent-forge-subtle)' : 'transparent',
                color: activeView === 'components' ? 'var(--accent-forge-bright)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Boxes size={13} />
              <span>Components</span>
            </button>
          </nav>
        )}
      </div>

      {/* Telemetry Status Readouts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
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
                padding: '0.28rem 0.6rem',
                border: isCapExceeded ? '1px solid var(--color-error)' : '1px solid var(--border-default)',
                color: isCapExceeded ? 'var(--color-error-bright)' : 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
              title={`Nebius Token Spend: $${spendAmount.toFixed(4)} USD. Spend Cap: $${spendCap.toFixed(2)} USD.`}
            >
              <DollarSign size={12} color={isCapExceeded ? 'var(--color-error-bright)' : 'var(--accent-forge-bright)'} />
              <span>
                SPEND: ${spendAmount.toFixed(4)} / ${spendCap.toFixed(2)}
              </span>
            </div>

            {/* Live Mode Telemetry */}
            <div
              className={`badge ${isLive ? 'badge-green' : 'badge-amber'}`}
              style={{ padding: '0.28rem 0.6rem' }}
              title={
                health.llm_status === 'live'
                  ? 'Active Nebius Token Factory live inference.'
                  : health.llm_status === 'mock_fallback'
                    ? 'Local deterministic mock fallback.'
                    : health.llm_status === 'key_ready'
                      ? 'Nebius API Key configured.'
                      : 'Local sandbox mode.'
              }
            >
              <span
                className={`status-dot ${isLive ? 'status-dot-active' : 'status-dot-warning'}`}
              />
              <span>{llmStatusLabel}</span>
            </div>

            {/* NVIDIA Models Telemetry */}
            <div
              className="badge badge-slate"
              style={{ padding: '0.28rem 0.6rem' }}
              title={`Fast Tier: ${health.models.fast}\nReasoning Tier: ${health.models.reasoning}`}
            >
              <Cpu size={12} color="var(--accent-forge-bright)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                {fastModelName} / {reasoningModelName}
              </span>
            </div>

            {/* Tavily Grounding Telemetry */}
            <div
              className={`badge ${health.tavily_enabled ? 'badge-green' : 'badge-slate'}`}
              style={{
                padding: '0.28rem 0.6rem',
                border: health.tavily_enabled ? '1px solid rgba(22, 163, 74, 0.4)' : undefined,
              }}
              title={
                health.tavily_enabled
                  ? 'Tavily AI Search: Live key active.'
                  : 'Tavily AI Search: Offline curated knowledge base fallback active.'
              }
            >
              <Search size={12} color={health.tavily_enabled ? 'var(--color-success-bright)' : 'var(--accent-forge-bright)'} />
              <span style={{ color: health.tavily_enabled ? 'var(--color-success-bright)' : 'var(--text-secondary)' }}>
                TAVILY: {health.tavily_enabled ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Settings Trigger Button */}
            {onOpenSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenSettings}
                title="Configure Nebius & Tavily credentials and spend caps"
              >
                <SlidersHorizontal size={13} />
                <span>Settings</span>
              </Button>
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
