import React from 'react';
import { Sparkles, Cpu, Cloud, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HealthInfo } from '../types';

interface HeaderProps {
  health: HealthInfo | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '0.9rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #76b900 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(118, 185, 0, 0.4)',
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
              SpecForge
            </h1>
            <span className="badge badge-nvidia">
              NVIDIA Nemotron
            </span>
            <span className="badge badge-nebius">
              Nebius AI Cloud
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Verified, Research-Grounded Code Synthesis • Hackathon Track: Coding & Agentic Engineering
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {health && (
          <>
            <div className={`badge ${health.mock_mode ? 'badge-amber' : 'badge-green'}`} title={health.mock_mode ? "Zero-credential local verification mode" : "Live Nebius Token Factory connection"}>
              {health.mock_mode ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
              <span>{health.mock_mode ? 'Mock LLM / Offline Verified' : 'Nebius Live API'}</span>
            </div>

            <div className="badge badge-slate" title={`Fast Tier: ${health.models.fast} | Reasoning Tier: ${health.models.reasoning}`}>
              <Cpu size={12} color="#84cc16" />
              <span>{health.models.fast.split('/').pop()} / {health.models.reasoning.split('/').pop()}</span>
            </div>

            <div className={`badge ${health.tavily_enabled ? 'badge-nebius' : 'badge-slate'}`} title="Tavily Web Search Grounding">
              <Search size={12} />
              <span>{health.tavily_enabled ? 'Tavily Live Docs' : 'Grounded KB Docs'}</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
