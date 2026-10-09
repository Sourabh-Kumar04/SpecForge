import React, { useState } from 'react';
import { TestResult } from '../types';
import {
  XCircle,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
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

  const displayedTest = testHistory.find((t) => t.iteration === selectedIteration) || latestTest;

  if (!displayedTest) {
    return null;
  }

  const isGreen = displayedTest.passed;
  const passPercentage = displayedTest.total_tests > 0
    ? Math.round((displayedTest.passed_tests / displayedTest.total_tests) * 100)
    : (isGreen ? 100 : 0);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        border: `1.5px solid ${isGreen ? 'var(--color-success)' : 'rgba(239, 68, 68, 0.45)'}`,
        boxShadow: isGreen
          ? '0 0 32px -4px rgba(34, 197, 94, 0.25), var(--shadow-md)'
          : '0 0 24px -4px rgba(239, 68, 68, 0.2), var(--shadow-md)',
      }}
    >
      {/* Header with Verification Stamp */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isGreen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isGreen ? 'var(--color-success)' : 'var(--color-error)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isGreen ? '0 0 16px rgba(34, 197, 94, 0.35)' : 'none',
              flexShrink: 0,
            }}
          >
            {isGreen ? (
              <ShieldCheck size={26} color="var(--color-success-bright)" />
            ) : (
              <XCircle size={26} color="var(--color-error-bright)" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Sandbox Test Verification Report
              </h3>

              {isGreen ? (
                <span
                  className="badge badge-green"
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  PROVABLY VERIFIED ✓ ({displayedTest.passed_tests}/{displayedTest.total_tests} passed)
                </span>
              ) : (
                <span
                  className="badge badge-red"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.75rem',
                    fontWeight: 700,
                  }}
                >
                  FAILURES DETECTED ({displayedTest.failed_tests} failed)
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Autonomous assertions executed inside isolated sandbox with strict exit code bounds
            </p>
          </div>
        </div>

        {/* Iteration Selector Pill Tabs */}
        {testHistory.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(10, 13, 20, 0.8)',
              padding: '0.25rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                padding: '0 0.4rem',
                fontWeight: 600,
              }}
            >
              Iteration:
            </span>
            {testHistory.map((t) => (
              <button
                type="button"
                key={t.iteration}
                onClick={() => setSelectedIteration(t.iteration)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background:
                    selectedIteration === t.iteration
                      ? t.passed
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                      : 'transparent',
                  color:
                    selectedIteration === t.iteration
                      ? t.passed
                        ? 'var(--color-success-bright)'
                        : 'var(--color-error-bright)'
                      : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>#{t.iteration}</span>
                <span>{t.passed ? '✓' : '✗'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.35rem',
          }}
        >
          <span>Assertion Pass Rate</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isGreen ? 'var(--color-success-bright)' : '#cbd5e1' }}>
            {passPercentage}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${passPercentage}%`,
              background: isGreen
                ? 'linear-gradient(90deg, #10b981, #22c55e)'
                : 'linear-gradient(90deg, #ef4444, #f59e0b)',
              boxShadow: isGreen ? '0 0 12px rgba(34, 197, 94, 0.6)' : 'none',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            background: 'rgba(10, 13, 20, 0.6)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Total Tests
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {displayedTest.total_tests}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(10, 13, 20, 0.6)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Passed
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success-bright)', fontFamily: 'var(--font-mono)' }}>
            {displayedTest.passed_tests}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(10, 13, 20, 0.6)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Failed
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: displayedTest.failed_tests > 0 ? 'var(--color-error-bright)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {displayedTest.failed_tests}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(10, 13, 20, 0.6)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Execution Time
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)' }}>
            {displayedTest.duration_seconds}s
          </div>
        </div>

        <div
          style={{
            background: 'rgba(10, 13, 20, 0.6)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Runner Sandbox
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--accent-violet-bright)',
              textTransform: 'capitalize',
              marginTop: '0.35rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {displayedTest.runner}
          </div>
        </div>
      </div>

      {/* Pytest Output Console */}
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-input)',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            padding: '0.55rem 0.95rem',
            background: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: '#94a3b8' }}>
            <Terminal size={13} color="var(--accent-cyan-bright)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              PYTEST STDOUT & TEST HARNESS LOGS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowFullOutput(!showFullOutput)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 600,
            }}
          >
            {showFullOutput ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{showFullOutput ? 'Collapse Output' : 'Expand Output'}</span>
          </button>
        </div>

        {showFullOutput && (
          <div
            style={{
              padding: '1rem',
              maxHeight: '260px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              lineHeight: 1.5,
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayedTest.output || 'No test log output captured.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReportPanel;
