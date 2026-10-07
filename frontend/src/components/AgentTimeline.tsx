import React, { useState, useEffect, useRef } from 'react';
import { AgentEvent, JobStatus, ResearchDoc } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Code,
  FlaskConical,
  Wrench,
  Bot,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
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
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const isResearchDisabled = enableResearch === false;
  const stages = [
    { key: 'planning', label: '1. Nemotron Architecture', icon: Bot },
    {
      key: 'researching',
      label: isResearchDisabled ? '2. Tavily Docs (Disabled)' : '2. Tavily Docs Grounding',
      icon: Search,
    },
    { key: 'coding', label: '3. Synthesis & Code Generation', icon: Code },
    { key: 'testing', label: '4. Sandbox Execution', icon: FlaskConical },
    { key: 'fixing', label: '5. Autonomous Fixer Loop', icon: Wrench },
    { key: 'completed', label: '6. Test-Verified', icon: CheckCircle2 },
  ];

  const getStageState = (stageKey: string) => {
    if (stageKey === 'researching' && isResearchDisabled) {
      return 'skipped';
    }
    if (status === 'completed') return 'completed';
    if (status === 'failed' && stageKey === 'fixing') return 'failed';

    const order = ['planning', 'researching', 'coding', 'testing', 'fixing', 'completed'];
    const currentIndex = order.indexOf(status === 'awaiting_plan_approval' ? 'planning' : status);
    const targetIndex = order.indexOf(stageKey);

    if (currentIndex === targetIndex) return 'current';
    if (currentIndex > targetIndex) return 'completed';
    return 'pending';
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: status === 'completed' ? '#4ade80' : (status === 'failed' ? '#ef4444' : '#38bdf8'),
            boxShadow: `0 0 10px ${status === 'completed' ? '#4ade80' : '#38bdf8'}`,
          }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
            Live Agentic Synthesis Pipeline
          </h3>
          <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
            SSE Real-Time Stream
          </span>
          <span className="badge" style={{
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            fontSize: '0.68rem',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 600,
          }}>
            Tavily Research Grounding
          </span>
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem',
          }}
        >
          {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{showLogs ? 'Collapse Stream' : 'Expand Stream'}</span>
        </button>
      </div>

      {/* Stage Flow Indicator */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        {stages.map((st) => {
          const state = getStageState(st.key);
          const Icon = st.icon;

          let color = 'var(--text-muted)';
          let bg = 'rgba(255, 255, 255, 0.02)';
          let border = 'var(--border)';

          if (state === 'skipped') {
            color = '#64748b';
            bg = 'rgba(15, 23, 42, 0.4)';
            border = 'dashed 1px #475569';
          } else if (state === 'current') {
            color = '#38bdf8';
            bg = 'rgba(6, 182, 212, 0.1)';
            border = '#06b6d4';
          } else if (state === 'completed') {
            color = '#84cc16';
            bg = 'rgba(118, 185, 0, 0.08)';
            border = 'rgba(118, 185, 0, 0.3)';
          } else if (state === 'failed') {
            color = '#f87171';
            bg = 'rgba(239, 68, 68, 0.1)';
            border = 'rgba(239, 68, 68, 0.4)';
          }

          return (
            <div
              key={st.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                background: bg,
                border: border.startsWith('dashed') ? border : `1px solid ${border}`,
                transition: 'all 0.2s ease',
              }}
            >
              {state === 'current' ? (
                <RefreshCw size={14} color={color} className="animate-spin" />
              ) : (
                <Icon size={14} color={color} />
              )}
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Researching Indicator Banner */}
      {status === 'researching' && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <RefreshCw size={16} color="#38bdf8" className="animate-spin" />
          <div style={{ fontSize: '0.84rem', color: '#e0f2fe' }}>
            <strong>Tavily Search API active:</strong> Grounding architecture specification against latest production documentation and API signatures in real-time...
          </div>
        </div>
      )}

      {/* Tavily Research Grounding Results Card */}
      {researchNotes && researchNotes.length > 0 && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '10px',
          padding: '0.85rem 1.1rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                Tavily Live Grounded Research
              </span>
              <span style={{
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}>
                Best Use of Tavily Prize Track ($3k)
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {researchNotes.length} documentation source{researchNotes.length > 1 ? 's' : ''} grounded
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
            {researchNotes.map((doc, idx) => (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(51, 65, 85, 0.6)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                    {doc.title}
                  </span>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                      title="Open documentation link"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                  {doc.summary}
                </p>
                {doc.key_apis && doc.key_apis.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {doc.key_apis.map((api, kIdx) => (
                      <span key={kIdx} style={{
                        fontSize: '0.66rem',
                        fontFamily: 'monospace',
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: '#7dd3fc',
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}>
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

      {/* Latest Agent Thought Bubble */}
      {latestThought && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          gap: '0.6rem',
        }}>
          <Bot size={18} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Nemotron Reasoning Trace (Internal Thinking)
            </div>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.45, fontStyle: 'italic' }}>
              "{latestThought}"
            </div>
          </div>
        </div>
      )}

      {/* Live SSE Logs Stream */}
      {showLogs && (
        <div
          ref={logContainerRef}
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            maxHeight: '220px',
            overflowY: 'auto',
            fontSize: '0.8rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              Waiting for agent pipeline events...
            </div>
          ) : (
            events.map((ev) => {
              const time = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '';
              let badgeColor = '#94a3b8';
              if (ev.stage === 'researcher') badgeColor = '#06b6d4';
              else if (ev.event_type === 'action') badgeColor = '#38bdf8';
              else if (ev.event_type === 'file_written') badgeColor = '#84cc16';
              else if (ev.event_type === 'test_run') badgeColor = ev.data?.passed ? '#4ade80' : '#f87171';
              else if (ev.event_type === 'error') badgeColor = '#ef4444';
              else if (ev.event_type === 'thought') badgeColor = '#c084fc';

              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.35rem', lineHeight: 1.4 }}>
                  <span style={{ color: '#475569', fontSize: '0.72rem', flexShrink: 0 }}>
                    [{time}]
                  </span>
                  <span style={{
                    color: badgeColor,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    minWidth: '70px',
                    flexShrink: 0,
                  }}>
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
      )}
    </div>
  );
};

