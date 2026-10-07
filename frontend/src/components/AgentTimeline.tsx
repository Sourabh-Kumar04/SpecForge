import React, { useState, useEffect, useRef } from 'react';
import { AgentEvent, JobStatus } from '../types';
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
} from 'lucide-react';

interface AgentTimelineProps {
  status: JobStatus;
  events: AgentEvent[];
  latestThought?: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ status, events, latestThought }) => {
  const [showLogs, setShowLogs] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const stages = [
    { key: 'planning', label: '1. Nemotron Architecture', icon: Bot, activeOn: ['planning', 'awaiting_plan_approval'] },
    { key: 'researching', label: '2. Tavily Docs Grounding', icon: Search, activeOn: ['researching'] },
    { key: 'coding', label: '3. Synthesis & Code Generation', icon: Code, activeOn: ['coding'] },
    { key: 'testing', label: '4. Sandbox Execution', icon: FlaskConical, activeOn: ['testing'] },
    { key: 'fixing', label: '5. Autonomous Fixer Loop', icon: Wrench, activeOn: ['fixing'] },
    { key: 'completed', label: '6. Test-Verified', icon: CheckCircle2, activeOn: ['completed'] },
  ];

  const getStageState = (stageKey: string) => {
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

          if (state === 'current') {
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
                border: `1px solid ${border}`,
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
              if (ev.event_type === 'action') badgeColor = '#38bdf8';
              if (ev.event_type === 'file_written') badgeColor = '#84cc16';
              if (ev.event_type === 'test_run') badgeColor = ev.data?.passed ? '#4ade80' : '#f87171';
              if (ev.event_type === 'error') badgeColor = '#ef4444';
              if (ev.event_type === 'thought') badgeColor = '#c084fc';

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
