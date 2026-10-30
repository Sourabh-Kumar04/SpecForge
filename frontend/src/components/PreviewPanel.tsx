import React, { useState, useEffect } from 'react';
import { JobDetail, PreviewResponse } from '../types';
import { startPreview, fetchPreview, stopPreview } from '../api';
import {
  Play,
  Square,
  RefreshCw,
  Terminal,
  ExternalLink,
  Server,
  Layout,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface PreviewPanelProps {
  job: JobDetail;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ job }) => {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cliArgs, setCliArgs] = useState<string>('12 24 48 96');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const projectType = job.spec.project_type;

  // Poll or fetch initial preview state
  useEffect(() => {
    fetchPreview(job.job_id)
      .then((data) => {
        setPreview(data);
        if (data.status === 'idle') {
          // Auto-start preview on mount for high-impact demo
          handleStart();
        }
      })
      .catch(() => {
        // Not yet started, start automatically
        handleStart();
      });

    return () => {
      // Don't kill background process on unmount so user can switch tabs smoothly
    };
  }, [job.job_id]);

  const handleStart = async (customArgs?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await startPreview(job.job_id, customArgs !== undefined ? customArgs : cliArgs);
      setPreview(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start live preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const res = await stopPreview(job.job_id);
      setPreview(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to stop preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOutput = () => {
    if (!preview?.terminal_output) return;
    navigator.clipboard.writeText(preview.terminal_output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = preview?.status === 'running';

  return (
    <div
      className="glass-panel"
      style={{
        overflow: 'hidden',
        marginBottom: '1.75rem',
        border: '1px solid var(--border-amber)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 107, 26, 0.1)',
      }}
    >
      {/* Top Header / Control Toolbar */}
      <div
        style={{
          padding: '0.85rem 1.35rem',
          background: 'rgba(15, 16, 21, 0.95)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {projectType === 'python_cli' && <Terminal size={17} color="var(--accent-amber-bright)" />}
          {projectType === 'fastapi_service' && <Server size={17} color="var(--accent-amber-bright)" />}
          {projectType === 'react_component' && <Layout size={17} color="var(--accent-amber-bright)" />}

          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Live Preview Runtime
          </h3>

          <span
            className={`badge ${
              isRunning || preview?.status === 'completed' ? 'badge-amber' : 'badge-slate'
            }`}
            style={{ fontSize: '0.68rem' }}
          >
            {projectType === 'python_cli' && 'CLI TERMINAL'}
            {projectType === 'fastapi_service' && (preview?.port ? `EPHEMERAL PORT :${preview.port}` : 'FASTAPI INSTANCE')}
            {projectType === 'react_component' && 'SANDBOX IFRAME'}
          </span>

          {isRunning && (
            <div
              className="pulse-ember"
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent-amber-bright)',
              }}
              title="Process is running"
            />
          )}
        </div>

        {/* Runtime Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {projectType === 'fastapi_service' && preview?.url && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 26, 0.1)',
                border: '1px solid var(--border-amber)',
                color: 'var(--accent-amber-bright)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              <span>Open /docs</span>
            </a>
          )}

          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: 'var(--color-error-bright)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Square size={12} />
              <span>Stop Process</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStart()}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-forge)',
                border: '1px solid var(--accent-forge)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Play size={12} fill="#ffffff" />
              )}
              <span>{projectType === 'python_cli' ? 'Re-execute CLI' : 'Start Preview'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-error-bright)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode-Specific Content Layout */}

      {/* (A) PYTHON CLI PREVIEW */}
      {projectType === 'python_cli' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* CLI Arguments Input Bar */}
          <div
            style={{
              padding: '0.65rem 1.25rem',
              background: 'rgba(12, 13, 17, 0.85)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              CLI ARGUMENTS:
            </span>
            <input
              type="text"
              value={cliArgs}
              onChange={(e) => setCliArgs(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart(cliArgs)}
              placeholder="e.g. 10 20 30 or --help"
              style={{
                flex: '1 1 200px',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleStart(cliArgs)}
              disabled={isLoading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 26, 0.15)',
                border: '1px solid var(--border-amber)',
                color: 'var(--accent-amber-bright)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Run Invocation
            </button>
          </div>

          {/* Terminal CRT Output Box */}
          <div
            className="terminal-window"
            style={{
              padding: '1.25rem',
              margin: '1rem',
              minHeight: '240px',
              maxHeight: '440px',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  isolated subprocess tty
                </span>
              </div>

              {preview?.terminal_output && (
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? 'var(--color-success-bright)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <pre
              style={{
                margin: 0,
                fontSize: '0.82rem',
                lineHeight: 1.6,
                color: '#f1f5f9',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isLoading ? (
                <span style={{ color: 'var(--accent-amber-bright)' }}>
                  Executing CLI entrypoint in isolated sandbox...
                </span>
              ) : (
                preview?.terminal_output || '$ python cli/main.py\n[No output captured]'
              )}
            </pre>
          </div>
        </div>
      )}

      {/* (B) FASTAPI MICROSERVICE PREVIEW */}
      {projectType === 'fastapi_service' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {preview?.url ? (
            <div style={{ height: '540px', width: '100%', position: 'relative' }}>
              <iframe
                src={preview.url}
                title="FastAPI Interactive OpenAPI Docs"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#1a1c23',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Server size={36} color="var(--accent-amber-bright)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <p style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                {isLoading ? 'Starting Uvicorn ASGI server...' : 'FastAPI preview server is stopped'}
              </p>
              <button
                type="button"
                onClick={() => handleStart()}
                className="btn-forge"
                style={{ marginTop: '1rem', padding: '0.5rem 1.25rem' }}
              >
                Launch Live Server
              </button>
            </div>
          )}
        </div>
      )}

      {/* (C) REACT COMPONENT PREVIEW */}
      {projectType === 'react_component' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {preview?.url ? (
            <div style={{ height: '480px', width: '100%', position: 'relative' }}>
              <iframe
                src={preview.url}
                title="React Component Sandboxed Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#0b0c0e',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Layout size={36} color="var(--accent-amber-bright)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <p style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                {isLoading ? 'Mounting sandboxed React iframe...' : 'Component preview not initialized'}
              </p>
              <button
                type="button"
                onClick={() => handleStart()}
                className="btn-forge"
                style={{ marginTop: '1rem', padding: '0.5rem 1.25rem' }}
              >
                Render Component
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
