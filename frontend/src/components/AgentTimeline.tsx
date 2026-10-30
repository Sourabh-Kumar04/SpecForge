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
  Flame,
} from 'lucide-react';

interface AgentTimelineProps {
  status: JobStatus;
  events: AgentEvent[];
  latestThought?: string;
  enableResearch?: boolean;
  researchNotes?: ResearchDoc[];
}

const getSourceHost = (url?: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  status,
  events,
  latestThought,
  enableResearch,
  researchNotes = [],
}) => {
  const liveResearchCount = researchNotes.filter((doc) => doc.source === 'tavily_live').length;
  const researchAttribution = liveResearchCount === researchNotes.length
    ? 'TAVILY LIVE SEARCH'
    : liveResearchCount === 0
      ? 'OFFLINE KNOWLEDGE BASE'
      : 'LIVE SEARCH + OFFLINE FALLBACK';
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
    { key: 'planning', label: '1. BLUEPRINT', icon: Bot, desc: 'Nemotron reasoning' },
    {
      key: 'researching',
      label: isResearchDisabled ? '2. GROUND (OFF)' : '2. TAVILY GROUND',
      icon: Search,
      desc: isResearchDisabled ? 'Grounding disabled' : 'Live API signatures',
    },
    { key: 'coding', label: '3. SYNTHESIS', icon: Code2, desc: 'Multi-file code forge' },
    { key: 'testing', label: '4. SANDBOX', icon: FlaskConical, desc: 'Isolated test run' },
    { key: 'fixing', label: '5. FIXER LOOP', icon: Wrench, desc: 'Autonomous bugfix' },
    { key: 'completed', label: '6. VERIFIED', icon: CheckCircle2, desc: '100% tests green' },
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
    if (type === 'error') return 'var(--color-error-bright)';
    if (type === 'thought') return 'var(--accent-amber-bright)';
    if (type === 'test_run') return ev.data?.passed ? 'var(--color-success-bright)' : 'var(--color-error-bright)';
    if (stage.includes('research')) return '#38bdf8';
    if (stage.includes('refin')) return 'var(--accent-amber-bright)';
    if (stage.includes('plan')) return '#a78bfa';
    if (stage.includes('code') || stage.includes('synth')) return 'var(--accent-amber-bright)';
    if (stage.includes('test') || stage.includes('sandbox')) return '#fbbf24';
    if (stage.includes('fix')) return '#f43f5e';
    return 'var(--text-secondary)';
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
            className="pulse-ember"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background:
                status === 'completed'
                  ? 'var(--color-success-bright)'
                  : status === 'failed'
                  ? 'var(--color-error-bright)'
                  : 'var(--accent-amber-bright)',
            }}
          />
          <h3
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Agentic Pipeline Telemetry
          </h3>
          <span
            className="badge badge-slate"
            style={{ fontSize: '0.68rem', gap: '0.35rem' }}
          >
            <Radio size={11} color="var(--accent-amber-bright)" />
            SSE FEED LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              background: autoScroll ? 'rgba(255, 107, 26, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${autoScroll ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
              color: autoScroll ? 'var(--accent-amber-bright)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.55rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.55rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            {showLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{showLogs ? 'COLLAPSE' : 'EXPAND'}</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stage Flow Track */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.65rem',
          marginBottom: '1.25rem',
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
            borderColor = 'rgba(255, 255, 255, 0.04)';
            bgColor = 'rgba(15, 16, 20, 0.3)';
            iconColor = 'var(--text-dim)';
            textColor = 'var(--text-dim)';
          } else if (state === 'current') {
            borderColor = 'var(--accent-amber)';
            bgColor = 'var(--accent-forge-subtle)';
            iconColor = 'var(--accent-amber-bright)';
            textColor = '#ffffff';
            boxShadow = 'none';
          } else if (state === 'completed') {
            borderColor = st.key === 'completed' ? 'var(--color-success)' : 'rgba(34, 197, 94, 0.35)';
            bgColor = st.key === 'completed' ? 'var(--color-success-subtle)' : 'rgba(34, 197, 94, 0.05)';
            iconColor = 'var(--color-success-bright)';
            textColor = st.key === 'completed' ? 'var(--color-success-bright)' : '#e2e8f0';
            boxShadow = 'none';
          } else if (state === 'failed') {
            borderColor = 'var(--color-error)';
            bgColor = 'rgba(239, 68, 68, 0.1)';
            iconColor = 'var(--color-error-bright)';
            textColor = 'var(--color-error-bright)';
          }

          return (
            <div
              key={st.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                boxShadow: boxShadow,
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {state === 'current' ? (
                    <RefreshCw size={13} color={iconColor} className="animate-spin" />
                  ) : state === 'completed' ? (
                    <Check size={13} color={iconColor} strokeWidth={3} />
                  ) : (
                    <Icon size={13} color={iconColor} />
                  )}
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: textColor,
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)',
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
                      background: 'var(--accent-amber-bright)',
                      boxShadow: '0 0 6px var(--accent-amber)',
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  color: state === 'current' ? 'var(--accent-amber-bright)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tavily Grounded Research Notes Card */}
      {researchNotes && researchNotes.length > 0 && (
        <div
          style={{
            background: 'rgba(255, 107, 26, 0.05)',
            border: '1px solid var(--border-amber)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Search size={15} color="var(--accent-amber-bright)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                Grounded Documentation
              </span>
              <span
                className="badge badge-amber"
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  background: 'rgba(255, 107, 26, 0.15)',
                  border: '1px solid rgba(255, 107, 26, 0.4)',
                  color: 'var(--accent-amber-bright)',
                }}
              >
                {researchAttribution}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {researchNotes.length} verified source{researchNotes.length > 1 ? 's' : ''} retrieved
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {researchNotes.map((doc, idx) => {
              const relevanceScore = doc.relevance == null
                ? null
                : (doc.relevance > 1 ? doc.relevance / 100 : doc.relevance);
              const isLiveDoc = doc.source === 'tavily_live';
              const sourceHost = getSourceHost(doc.url);

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(14, 15, 20, 0.85)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.8rem 0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  {/* Top Meta: Attribution + Query & Relevance */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.4rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          color: isLiveDoc ? '#34d399' : '#cbd5e1',
                          background: isLiveDoc ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          border: isLiveDoc ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-default)',
                          flexShrink: 0,
                        }}
                      >
                        {isLiveDoc ? 'TAVILY LIVE' : 'OFFLINE KB'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#94a3b8',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px',
                        }}
                        title={doc.query}
                      >
                        "{doc.query}"
                      </span>
                    </div>

                    {relevanceScore !== null && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-amber-bright)',
                          background: 'rgba(255, 107, 26, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          border: '1px solid rgba(255, 107, 26, 0.25)',
                          flexShrink: 0,
                        }}
                        title="Tavily relevance score"
                      >
                        {Math.round(relevanceScore * 100)}% relevance
                      </span>
                    )}
                  </div>

                  {/* Title & Link */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.3 }}>
                      {doc.title}
                    </span>
                    {doc.url && sourceHost && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--accent-amber)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.66rem',
                          textDecoration: 'none',
                          flexShrink: 0,
                          fontFamily: 'var(--font-mono)',
                        }}
                        title={`Open source documentation: ${doc.url}`}
                      >
                        {sourceHost}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Summary */}
                  <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
                    {doc.summary}
                  </p>

                  {/* Key APIs */}
                  {doc.key_apis && doc.key_apis.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 'auto', paddingTop: '0.2rem' }}>
                      {doc.key_apis.map((api, kIdx) => (
                        <span
                          key={kIdx}
                          style={{
                            fontSize: '0.64rem',
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: '#cbd5e1',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            border: '1px solid var(--border-default)',
                          }}
                        >
                          {api}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nemotron Internal Thought Bubble */}
      {latestThought && (
        <div
          style={{
            background: 'rgba(255, 107, 26, 0.05)',
            border: '1px solid var(--border-amber)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.65rem',
          }}
        >
          <Bot size={16} color="var(--accent-amber-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--accent-amber-bright)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                marginBottom: '0.2rem',
              }}
            >
              Nemotron Reasoning Trace
            </div>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{latestThought}"
            </div>
          </div>
        </div>
      )}

      {/* Streaming Event Feed Console */}
      {showLogs && (
        <div
          style={{
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-input)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.9rem',
              background: 'rgba(14, 15, 20, 0.9)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Terminal size={12} color="var(--accent-amber-bright)" />
              <span
                style={{
                  fontSize: '0.72rem',
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
                fontSize: '0.68rem',
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
              maxHeight: '220px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
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
                      gap: '0.6rem',
                      marginBottom: '0.35rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', flexShrink: 0 }}>
                      [{time}]
                    </span>
                    <span
                      style={{
                        color: badgeColor,
                        fontSize: '0.7rem',
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
