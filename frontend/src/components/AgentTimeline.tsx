import React, { useState, useEffect, useRef } from 'react';
import { AgentEvent, JobStatus, ResearchDoc } from '../types';
import {
  CheckCircle2,
  RefreshCw,
  Search,
  Code2,
  FlaskConical,
  Wrench,
  Bot,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Check,
  Radio,
} from 'lucide-react';

interface AgentTimelineProps {
  status: JobStatus;
  events: AgentEvent[];
  latestThought?: string;
  enableResearch?: boolean;
  researchNotes?: ResearchDoc[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  status,
  events,
  latestThought,
  enableResearch,
  researchNotes = [],
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const isResearchDisabled = enableResearch === false;

  const stages = [
    { key: 'planning', label: '1. Architecture Plan', icon: Bot, desc: 'Nemotron reasoning' },
    {
      key: 'researching',
      label: isResearchDisabled ? '2. Docs (Skipped)' : '2. Tavily Grounding',
      icon: Search,
      desc: isResearchDisabled ? 'Grounding disabled' : 'Live API signatures',
    },
    { key: 'coding', label: '3. Code Synthesis', icon: Code2, desc: 'Multi-file generation' },
    { key: 'testing', label: '4. Sandbox Execution', icon: FlaskConical, desc: 'Pytest assertions' },
    { key: 'fixing', label: '5. Fixer Loop', icon: Wrench, desc: 'Autonomous bugfix' },
    { key: 'completed', label: '6. VERIFIED ✓', icon: CheckCircle2, desc: '100% tests green' },
  ];

  const getStageState = (stageKey: string): 'pending' | 'current' | 'completed' | 'skipped' | 'failed' => {
    if (stageKey === 'researching' && isResearchDisabled) {
      return 'skipped';
    }
    if (status === 'completed') return 'completed';
    if (status === 'failed' && (stageKey === 'fixing' || stageKey === 'testing')) return 'failed';

    const order = ['planning', 'researching', 'coding', 'testing', 'fixing', 'completed'];
    const currentCanonical = status === 'awaiting_plan_approval' ? 'planning' : status;
    const currentIndex = order.indexOf(currentCanonical);
    const targetIndex = order.indexOf(stageKey);

    if (currentIndex === targetIndex) return 'current';
    if (currentIndex > targetIndex) return 'completed';
    return 'pending';
  };

  const getStageColor = (ev: AgentEvent) => {
    const stage = ev.stage?.toLowerCase() || '';
    const type = ev.event_type;
    if (type === 'error') return '#ef4444';
    if (type === 'thought') return '#c084fc';
    if (type === 'test_run') return ev.data?.passed ? '#4ade80' : '#f87171';
    if (stage.includes('research')) return '#06b6d4';
    if (stage.includes('plan')) return '#818cf8';
    if (stage.includes('code') || stage.includes('synth')) return '#38bdf8';
    if (stage.includes('test') || stage.includes('sandbox')) return '#fbbf24';
    if (stage.includes('fix')) return '#f43f5e';
    return '#94a3b8';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            className="pulse-dot"
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background:
                status === 'completed'
                  ? 'var(--color-success-bright)'
                  : status === 'failed'
                  ? 'var(--color-error-bright)'
                  : 'var(--accent-cyan-bright)',
              boxShadow: `0 0 10px ${
                status === 'completed' ? 'var(--color-success)' : 'var(--accent-cyan)'
              }`,
            }}
          />
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Live Agentic Synthesis Pipeline
          </h3>
          <span
            className="badge badge-slate"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              gap: '0.35rem',
            }}
          >
            <Radio size={11} color="var(--accent-cyan-bright)" />
            SSE Stream Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              background: autoScroll ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${autoScroll ? 'rgba(6, 182, 212, 0.35)' : 'var(--border-subtle)'}`,
              color: autoScroll ? 'var(--accent-cyan-bright)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            {showLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{showLogs ? 'Collapse Feed' : 'Expand Feed'}</span>
          </button>
        </div>
      </div>

      {/* Animated Pipeline Stage Flow Track */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.65rem',
          marginBottom: '1.25rem',
          position: 'relative',
        }}
      >
        {stages.map((st) => {
          const state = getStageState(st.key);
          const Icon = st.icon;

          let borderColor = 'var(--border-subtle)';
          let bgColor = 'rgba(255, 255, 255, 0.02)';
          let iconColor = 'var(--text-muted)';
          let textColor = 'var(--text-muted)';
          let boxShadow = 'none';

          if (state === 'skipped') {
            borderColor = 'rgba(100, 116, 139, 0.25)';
            bgColor = 'rgba(15, 23, 42, 0.3)';
            iconColor = 'var(--text-dim)';
            textColor = 'var(--text-dim)';
          } else if (state === 'current') {
            borderColor = 'var(--accent-cyan)';
            bgColor = 'linear-gradient(145deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 24, 40, 0.9) 100%)';
            iconColor = 'var(--accent-cyan-bright)';
            textColor = '#ffffff';
            boxShadow = '0 0 16px -2px rgba(6, 182, 212, 0.4), 0 0 0 1px rgba(6, 182, 212, 0.4)';
          } else if (state === 'completed') {
            borderColor = st.key === 'completed' ? 'var(--color-success)' : 'rgba(34, 197, 94, 0.4)';
            bgColor =
              st.key === 'completed'
                ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 32, 24, 0.9) 100%)'
                : 'rgba(34, 197, 94, 0.08)';
            iconColor = 'var(--color-success-bright)';
            textColor = st.key === 'completed' ? 'var(--color-success-bright)' : '#e2e8f0';
            if (st.key === 'completed') {
              boxShadow = '0 0 20px -2px rgba(34, 197, 94, 0.45)';
            }
          } else if (state === 'failed') {
            borderColor = 'var(--color-error)';
            bgColor = 'rgba(239, 68, 68, 0.12)';
            iconColor = 'var(--color-error-bright)';
            textColor = 'var(--color-error-bright)';
          }

          return (
            <div
              key={st.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                boxShadow: boxShadow,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {state === 'current' ? (
                    <RefreshCw size={14} color={iconColor} className="animate-spin" />
                  ) : state === 'completed' ? (
                    <Check size={14} color={iconColor} strokeWidth={3} />
                  ) : (
                    <Icon size={14} color={iconColor} />
                  )}
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: textColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {st.label}
                  </span>
                </div>

                {state === 'current' && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--accent-cyan-bright)',
                      boxShadow: '0 0 6px var(--accent-cyan)',
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  color: state === 'current' ? 'var(--accent-cyan-bright)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dominant Verification Banner (Testing / Fixing / Completed) */}
      {(status === 'completed' || status === 'testing' || status === 'fixing') && (
        <div
          style={{
            background:
              status === 'completed'
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)'
                : status === 'fixing'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
            border: `1.5px solid ${
              status === 'completed'
                ? 'var(--color-success)'
                : status === 'fixing'
                ? 'var(--color-warning)'
                : 'var(--accent-cyan)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.35rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow:
              status === 'completed'
                ? '0 0 28px -2px rgba(34, 197, 94, 0.3)'
                : '0 0 20px -4px rgba(6, 182, 212, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  status === 'completed'
                    ? 'rgba(34, 197, 94, 0.25)'
                    : status === 'fixing'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(6, 182, 212, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {status === 'completed' ? (
                <ShieldCheck size={24} color="var(--color-success-bright)" />
              ) : status === 'fixing' ? (
                <Wrench size={22} color="var(--color-warning-bright)" className="animate-spin" />
              ) : (
                <FlaskConical size={22} color="var(--accent-cyan-bright)" className="animate-spin" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color:
                      status === 'completed'
                        ? 'var(--color-success-bright)'
                        : status === 'fixing'
                        ? 'var(--color-warning-bright)'
                        : 'var(--accent-cyan-bright)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {status === 'completed'
                    ? 'VERIFIED ✓ TEST REPORT PASSED'
                    : status === 'fixing'
                    ? 'AUTONOMOUS FIXER LOOP RUNNING'
                    : 'ISOLATED SANDBOX EXECUTION IN PROGRESS'}
                </span>

                <span
                  className={`badge ${
                    status === 'completed'
                      ? 'badge-green'
                      : status === 'fixing'
                      ? 'badge-amber'
                      : 'badge-cyan'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {status === 'completed'
                    ? '100% Green Assertions'
                    : status === 'fixing'
                    ? 'Auto-Patching Codebase'
                    : 'Isolated Pytest Runner'}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.2rem', margin: 0 }}>
                {status === 'completed'
                  ? 'All unit & integration assertions successfully executed in isolated container. Zero hallucinations.'
                  : status === 'fixing'
                  ? 'NVIDIA Nemotron reasoning engine analyzing test failure output to synthesize targeted bugfixes.'
                  : 'Executing code test harness in isolated subprocess with strict assertion boundaries.'}
              </p>
            </div>
          </div>

          {status === 'completed' && (
            <div
              style={{
                background: 'var(--color-success)',
                color: '#052e16',
                fontWeight: 800,
                fontSize: '0.8rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 14px rgba(34, 197, 94, 0.5)',
              }}
            >
              VERIFIED ✓
            </div>
          )}
        </div>
      )}

      {/* Live Researching Notification Banner */}
      {status === 'researching' && (
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <RefreshCw size={17} color="var(--accent-cyan-bright)" className="animate-spin" />
          <div style={{ fontSize: '0.84rem', color: '#e0f2fe' }}>
            <strong style={{ color: 'var(--accent-cyan-bright)' }}>Tavily AI Search active:</strong>{' '}
            Retrieving latest live API documentation and official library schemas to ground generation...
          </div>
        </div>
      )}

      {/* Tavily Grounded Research Notes Card */}
      {researchNotes && researchNotes.length > 0 && (
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.22)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
          }}
        >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Search size={15} color="var(--accent-cyan-bright)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                Tavily Live Grounded Research
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                Best Use of Tavily Prize Track ($3k)
              </span>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {researchNotes.length} documentation source{researchNotes.length > 1 ? 's' : ''} grounded
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {researchNotes.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(10, 14, 22, 0.8)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.9rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan-bright)' }}>
                    {doc.title}
                  </span>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                      title="View grounded documentation source"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '0.76rem',
                    color: '#cbd5e1',
                    lineHeight: 1.45,
                    marginBottom: '0.45rem',
                    margin: 0,
                  }}
                >
                  {doc.summary}
                </p>

                {doc.key_apis && doc.key_apis.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {doc.key_apis.map((api, kIdx) => (
                      <span
                        key={kIdx}
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(6, 182, 212, 0.15)',
                          color: '#7dd3fc',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                        }}
                      >
                        {api}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nemotron Internal Thought Bubble */}
      {latestThought && (
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          <Bot size={18} color="var(--accent-violet-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-violet-bright)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.25rem',
              }}
            >
              Nemotron Reasoning Trace (Internal Thinking)
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: '#e2e8f0',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              "{latestThought}"
            </div>
          </div>
        </div>
      )}

      {/* Streaming Event Feed Console */}
      {showLogs && (
        <div
          style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-input)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            style={{
              padding: '0.55rem 0.95rem',
              background: 'rgba(15, 23, 42, 0.8)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Terminal size={13} color="var(--accent-cyan-bright)" />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                LIVE SSE EVENT STREAM
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              {events.length} event{events.length === 1 ? '' : 's'} recorded
            </span>
          </div>

          <div
            ref={logContainerRef}
            style={{
              padding: '0.85rem 1rem',
              maxHeight: '230px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
            }}
          >
            {events.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '1.25rem',
                  fontStyle: 'italic',
                }}
              >
                Waiting for agent pipeline events...
              </div>
            ) : (
              events.map((ev) => {
                const time = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '';
                const badgeColor = getStageColor(ev);

                return (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      marginBottom: '0.4rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', flexShrink: 0 }}>
                      [{time}]
                    </span>
                    <span
                      style={{
                        color: badgeColor,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        minWidth: '78px',
                        flexShrink: 0,
                      }}
                    >
                      {ev.stage}:
                    </span>
                    <span style={{ color: '#cbd5e1', wordBreak: 'break-word' }}>
                      {ev.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTimeline;
