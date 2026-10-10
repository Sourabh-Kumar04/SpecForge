import React, { useState, useEffect } from 'react';
import { SettingsInfo } from '../types';
import { updateSettings } from '../api';
import {
  X,
  SlidersHorizontal,
  KeyRound,
  ShieldCheck,
  DollarSign,
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsInfo | null;
  onSettingsUpdated: (updated: SettingsInfo) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}) => {
  const [nebiusKey, setNebiusKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [spendCap, setSpendCap] = useState<number>(2.0);
  const [fastModel, setFastModel] = useState('');
  const [reasoningModel, setReasoningModel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setSpendCap(settings.spend_cap_usd || 2.0);
      setFastModel(settings.nebius_model_fast || '');
      setReasoningModel(settings.nebius_model_reasoning || '');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const payload: any = {
        spend_cap_usd: Number(spendCap),
      };
      if (nebiusKey.trim()) payload.nebius_api_key = nebiusKey.trim();
      if (tavilyKey.trim()) payload.tavily_api_key = tavilyKey.trim();
      if (fastModel.trim()) payload.nebius_model_fast = fastModel.trim();
      if (reasoningModel.trim()) payload.nebius_model_reasoning = reasoningModel.trim();

      const updated = await updateSettings(payload);
      onSettingsUpdated(updated);
      setNebiusKey('');
      setTavilyKey('');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isLiveNebius = settings?.nebius_api_key_set;
  const isLiveTavily = settings?.tavily_api_key_set;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          backgroundColor: '#0d1117',
          border: '1px solid var(--border-default)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 107, 26, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 107, 26, 0.15)',
                border: '1px solid rgba(255, 107, 26, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SlidersHorizontal size={18} color="var(--accent-amber-bright)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                BYOK Settings & Spend Control
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Persisted server-side in local <code style={{ color: 'var(--accent-amber)' }}>.env</code>. Never exposed or logged.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feature Readiness Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            padding: '0.75rem',
            backgroundColor: '#161b22',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nebius Token Factory
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span
                className={`badge ${isLiveNebius ? 'badge-green' : 'badge-amber'}`}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                {isLiveNebius ? 'API KEY CONFIGURED' : 'LOCAL MOCK MODE'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {settings?.nebius_api_key_masked || 'NOT SET'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tavily Grounding ($3k Prize)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span
                className={`badge ${isLiveTavily ? 'badge-green' : 'badge-amber'}`}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                {isLiveTavily ? 'API KEY CONFIGURED' : 'OFFLINE KNOWLEDGE BASE'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {settings?.tavily_api_key_masked || 'NOT SET'}
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Nebius API Key */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={14} color="var(--accent-amber)" />
                Nebius Token Factory API Key
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isLiveNebius ? 'Configured' : 'Optional (Mock active)'}
              </span>
            </label>
            <input
              type="password"
              placeholder={isLiveNebius ? 'Leave blank to preserve current key' : 'Enter Nebius API Key (e.g. nist-...)'}
              value={nebiusKey}
              onChange={(e) => setNebiusKey(e.target.value)}
              className="input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Enables NVIDIA Nemotron inference when the key is active and the account has available budget.
            </p>
          </div>

          {/* Tavily API Key */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={14} color="var(--accent-amber)" />
                Tavily Search API Key
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isLiveTavily ? 'Configured' : 'Optional (Curated KB active)'}
              </span>
            </label>
            <input
              type="password"
              placeholder={isLiveTavily ? 'Leave blank to preserve current key' : 'Enter Tavily API Key (e.g. tvly-...)'}
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              className="input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Enables real-time 2026 API documentation grounding before code synthesis.
            </p>
          </div>

          {/* Spend Cap */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={14} color="var(--accent-amber)" />
                Per-Job Spend Cap (USD)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                Default: $2.00
              </span>
            </label>
            <input
              type="number"
              step="0.25"
              min="0.10"
              max="50.00"
              value={spendCap}
              onChange={(e) => setSpendCap(parseFloat(e.target.value) || 2.0)}
              className="input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              SpecForge automatically pauses the pipeline gracefully if estimated token spend reaches this cap.
            </p>
          </div>

          {/* Model Selection Overrides */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.9rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e6edf3', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="var(--accent-amber)" />
              Nebius Token Factory Model Identifiers
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fast Tier Model</span>
                <input
                  type="text"
                  value={fastModel}
                  onChange={(e) => setFastModel(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.2rem' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reasoning Tier Model</span>
                <input
                  type="text"
                  value={reasoningModel}
                  onChange={(e) => setReasoningModel(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.2rem' }}
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: '#f87171',
              }}
            >
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: '#4ade80',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Settings saved successfully to .env and clients reloaded!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', minWidth: '120px' }}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
