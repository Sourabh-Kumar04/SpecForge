import React, { useState } from 'react';
import { TestResult } from '../types';
import {
  CheckCircle2,
  XCircle,
  Terminal,
  Clock,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';

interface TestReportPanelProps {
  testHistory: TestResult[];
  latestTest?: TestResult;
}

export const TestReportPanel: React.FC<TestReportPanelProps> = ({ testHistory, latestTest }) => {
  const [selectedIteration, setSelectedIteration] = useState<number>(
    latestTest?.iteration || (testHistory.length > 0 ? testHistory[testHistory.length - 1].iteration : 1)
  );
  const [showFullOutput, setShowFullOutput] = useState(true);

  const displayedTest = testHistory.find(t => t.iteration === selectedIteration) || latestTest;

  if (!displayedTest) {
    return null;
  }

  const isGreen = displayedTest.passed;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `2px solid ${isGreen ? '#22c55e' : 'rgba(239, 68, 68, 0.5)'}`,
      borderRadius: '14px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: isGreen ? '0 0 28px rgba(34, 197, 94, 0.22), 0 8px 24px rgba(0, 0, 0, 0.25)' : '0 8px 24px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Header with Verification Stamp */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isGreen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isGreen ? '#22c55e' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isGreen ? <CheckCircle2 size={22} color="#4ade80" /> : <XCircle size={22} color="#f87171" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Sandbox Test Verification Report
              </h3>
              {isGreen ? (
                <span className="badge badge-green" style={{
                  fontSize: '0.85rem',
                  padding: '3px 10px',
                  fontWeight: 800,
                  background: 'rgba(34, 197, 94, 0.25)',
                  border: '1px solid #4ade80',
                  color: '#86efac',
                  letterSpacing: '0.02em',
                }}>
                  VERIFIED ✓ ({displayedTest.passed_tests}/{displayedTest.total_tests} tests passed, {testHistory.length || 1} iteration{(testHistory.length || 1) === 1 ? '' : 's'})
                </span>
              ) : (
                <span className="badge badge-red" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  TEST FAILURES DETECTED ({displayedTest.failed_tests} failed)
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Execution verified in isolated sandbox with strict assertion boundaries
            </p>
          </div>
        </div>

        {/* Iteration Selector Pill Tabs */}
        {testHistory.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-main)', padding: '0.2rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 0.4rem' }}>
              Iteration:
            </span>
            {testHistory.map((t) => (
              <button
                key={t.iteration}
                onClick={() => setSelectedIteration(t.iteration)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedIteration === t.iteration ? (t.passed ? '#15803d' : '#991b1b') : 'transparent',
                  color: selectedIteration === t.iteration ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                #{t.iteration} {t.passed ? '✓' : '✗'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Tests</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{displayedTest.total_tests}</div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Passed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>{displayedTest.passed_tests}</div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Failed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: displayedTest.failed_tests > 0 ? '#f87171' : 'var(--text-muted)' }}>
            {displayedTest.failed_tests}
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Execution Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{displayedTest.duration_seconds}s</div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Sandbox Isolation</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#c084fc', textTransform: 'capitalize', marginTop: '0.25rem' }}>
            {displayedTest.runner} Engine
          </div>
        </div>
      </div>

      {/* Test Output Terminal */}
      <div style={{
        background: '#090d16',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '0.5rem 0.85rem',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <Terminal size={13} />
            <span>Sandbox Runner Stdout / Pytest Log</span>
          </div>

          <button
            onClick={() => setShowFullOutput(!showFullOutput)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            {showFullOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showFullOutput ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        {showFullOutput && (
          <div style={{
            padding: '0.85rem 1rem',
            maxHeight: '260px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            lineHeight: 1.45,
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap',
          }}>
            {displayedTest.output || 'No test log output captured.'}
          </div>
        )}
      </div>
    </div>
  );
};
