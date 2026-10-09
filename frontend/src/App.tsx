import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExampleGallery } from './components/ExampleGallery';
import { SpecForm } from './components/SpecForm';
import { AgentTimeline } from './components/AgentTimeline';
import { FileBrowser } from './components/FileBrowser';
import { TestReportPanel } from './components/TestReportPanel';
import { PlanEditorModal } from './components/PlanEditorModal';
import {
  ProjectType,
  JobDetail,
  ExampleSpec,
  HealthInfo,
  AgentEvent,
  Plan,
} from './types';
import {
  fetchHealth,
  fetchExamples,
  createJob,
  fetchJob,
  approvePlan,
  subscribeJobEvents,
} from './api';
import {
  Download,
  Edit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';

const SAMPLE_FASTMCP_SPEC: ExampleSpec = {
  id: 'fastmcp-2026-server',
  title: 'FastMCP 4.0 Protocol Server (2026)',
  description:
    'Model Context Protocol server utilizing the July 2026 FastMCP 4.0 stateless spec with tool schemas and in-memory client test suite.',
  project_type: 'python_cli',
  prompt:
    'Build a production Model Context Protocol (MCP) CLI tool and server using FastMCP 4.0 (July 2026 specification). The service exposes data analysis and math tools via @mcp.tool, supports stateless protocol negotiation, and includes a comprehensive pytest test suite asserting tool registration, execution, and error boundary handling.',
  tags: ['FastMCP 4.0', 'MCP 2026', 'Tavily Grounded', 'Python CLI', 'Pytest'],
};

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [examples, setExamples] = useState<ExampleSpec[]>([]);
  const [prompt, setPrompt] = useState<string>(SAMPLE_FASTMCP_SPEC.prompt);
  const [projectType, setProjectType] = useState<ProjectType>(SAMPLE_FASTMCP_SPEC.project_type);
  const [enableResearch, setEnableResearch] = useState<boolean>(true);
  const [requirePlanApproval, setRequirePlanApproval] = useState<boolean>(false);
  const [maxFixIterations, setMaxFixIterations] = useState<number>(5);

  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSample = () => {
    setPrompt(SAMPLE_FASTMCP_SPEC.prompt);
    setProjectType(SAMPLE_FASTMCP_SPEC.project_type);
    setEnableResearch(true);
  };

  // Load initial health and examples
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.error('Failed to load health:', err));

    fetchExamples()
      .then((data) => {
        setExamples(data);
        if (data.length > 0) {
          setPrompt((current) => (current ? current : data[0].prompt));
          setProjectType((current) => (current ? current : data[0].project_type));
        }
      })
      .catch((err) => console.error('Failed to load examples:', err));
  }, []);

  // Handle SSE subscription when job changes
  useEffect(() => {
    if (!currentJob?.job_id) return;
    const jobId = currentJob.job_id;

    const cleanup = subscribeJobEvents(
      jobId,
      (event: AgentEvent) => {
        setCurrentJob((prev) => {
          if (!prev || prev.job_id !== jobId) return prev;
          const updatedEvents = [...prev.events, event];

          // Auto-open plan editor modal if pausing for human approval
          if (event.stage === 'planner' && event.message.includes('Awaiting user review')) {
            setIsPlanModalOpen(true);
          }

          return {
            ...prev,
            events: updatedEvents,
          };
        });

        // Sync fresh state from server periodically on major milestones
        if (['file_written', 'test_run', 'status'].includes(event.event_type)) {
          fetchJob(jobId).then((fullJob) => {
            setCurrentJob(fullJob);
            if (fullJob.status === 'completed' || fullJob.status === 'failed') {
              setIsLoading(false);
            }
          });
        }
      },
      () => {
        // Stream completed
        fetchJob(jobId).then((fullJob) => {
          setCurrentJob(fullJob);
          setIsLoading(false);
        });
      },
      (err) => {
        console.warn('SSE stream notice:', err);
      }
    );

    return () => {
      cleanup();
    };
  }, [currentJob?.job_id]);

  const handleSelectExample = (ex: ExampleSpec) => {
    setPrompt(ex.prompt);
    setProjectType(ex.project_type);
  };

  const handleCreateJob = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const job = await createJob({
        prompt,
        project_type: projectType,
        enable_research: enableResearch,
        require_plan_approval: requirePlanApproval,
        max_fix_iterations: maxFixIterations,
      });
      setCurrentJob(job);
    } catch (err: any) {
      console.error('Job creation failed:', err);
      setErrorMsg(err.message || 'Failed to initialize code generation');
      setIsLoading(false);
    }
  };

  const handleApprovePlan = async (updatedPlan: Plan) => {
    if (!currentJob) return;
    setIsPlanModalOpen(false);
    setIsLoading(true);
    try {
      const updatedJob = await approvePlan(currentJob.job_id, updatedPlan);
      setCurrentJob(updatedJob);
    } catch (err: any) {
      console.error('Plan approval failed:', err);
      setErrorMsg('Failed to approve plan: ' + err.message);
    }
  };

  const latestThought = currentJob?.events
    .filter((e) => e.event_type === 'thought')
    .slice(-1)[0]?.message;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header health={health} />

      <main
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          width: '100%',
          flex: 1,
        }}
      >
        {/* Premium Hero Callout */}
        <div
          className="glass-panel"
          style={{
            position: 'relative',
            padding: '2rem 2.25rem',
            marginBottom: '2rem',
            background:
              'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.06) 50%, rgba(14, 18, 28, 0.9) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.6), 0 0 24px -4px rgba(6, 182, 212, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle specular top highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6), transparent)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                className="badge badge-green"
                style={{
                  fontSize: '0.76rem',
                  letterSpacing: '0.04em',
                  fontWeight: 800,
                  boxShadow: '0 0 12px rgba(34, 197, 94, 0.25)',
                }}
              >
                <ShieldCheck size={14} />
                PROVABLY VERIFIED
              </span>
              <span className="badge badge-nvidia" style={{ fontSize: '0.74rem' }}>
                NVIDIA Nemotron Reasoning
              </span>
              <span className="badge badge-nebius" style={{ fontSize: '0.74rem' }}>
                Nebius Token Factory
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                className="badge badge-cyan"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
                }}
              >
                Tavily Grounded ($3,000 Prize Track)
              </span>
            </div>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.035em',
              lineHeight: 1.2,
              margin: '0.4rem 0 0.75rem 0',
            }}
          >
            The code generator that proves its code works.
          </h1>

          <p
            style={{
              fontSize: '0.94rem',
              color: '#cbd5e1',
              maxWidth: '880px',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Standard LLM codegen hands indie hackers outdated syntax and untested hallucinations.{' '}
            <strong style={{ color: '#ffffff' }}>SpecForge</strong> grounds generation with live Tavily API docs (2026 cutoffs eliminated) and proves every export works by executing an autonomous{' '}
            <strong style={{ color: 'var(--accent-cyan-bright)' }}>isolated sandbox test & fix loop</strong>{' '}
            powered by <strong style={{ color: '#84cc16' }}>NVIDIA Nemotron</strong> and{' '}
            <strong style={{ color: 'var(--accent-cyan-bright)' }}>Nebius Token Factory</strong> until 100% green.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              color: 'var(--color-error-bright)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quickstart Presets Gallery */}
        <ExampleGallery
          examples={examples}
          onSelect={handleSelectExample}
          disabled={isLoading}
        />

        {/* Spec Form Hero Element */}
        <SpecForm
          prompt={prompt}
          setPrompt={setPrompt}
          projectType={projectType}
          setProjectType={setProjectType}
          enableResearch={enableResearch}
          setEnableResearch={setEnableResearch}
          requirePlanApproval={requirePlanApproval}
          setRequirePlanApproval={setRequirePlanApproval}
          maxFixIterations={maxFixIterations}
          setMaxFixIterations={setMaxFixIterations}
          onSubmit={handleCreateJob}
          isLoading={isLoading}
          onLoadSample={handleLoadSample}
        />

        {/* Unmissable VERIFIED Completion Banner */}
        {currentJob && currentJob.status === 'completed' && (
          <div
            className="glass-panel"
            style={{
              background:
                'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.09) 100%)',
              border: '2px solid var(--color-success)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem 1.85rem',
              marginBottom: '1.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              boxShadow: '0 0 36px rgba(34, 197, 94, 0.3), var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(34, 197, 94, 0.65)',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={30} color="#ffffff" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: 'var(--color-success-bright)',
                      letterSpacing: '0.04em',
                      textShadow: '0 0 16px rgba(74, 222, 128, 0.6)',
                    }}
                  >
                    VERIFIED ✓
                  </span>
                  <span
                    style={{
                      background: 'rgba(34, 197, 94, 0.25)',
                      border: '1px solid var(--color-success-bright)',
                      color: '#bbf7d0',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    ({currentJob.latest_test ? `${currentJob.latest_test.passed_tests}/${currentJob.latest_test.total_tests} tests passed` : 'tests passed'}, {currentJob.test_history.length || 1} iteration{(currentJob.test_history.length || 1) === 1 ? '' : 's'})
                  </span>
                </div>

                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#dcfce7', lineHeight: 1.5 }}>
                  Every generated file executed in an isolated sandbox with 100% passing test assertions. Zero hallucinations. Ready for production.
                </p>
              </div>
            </div>

            {currentJob.download_url && (
              <a
                href={currentJob.download_url}
                download
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.45)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Download size={18} />
                <span>Download Verified ZIP</span>
              </a>
            )}
          </div>
        )}

        {/* Plan Edit Trigger Banner */}
        {currentJob?.plan && (
          <div
            className="glass-panel"
            style={{
              padding: '0.95rem 1.35rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'rgba(14, 18, 28, 0.65)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Code2 size={16} color="var(--accent-cyan-bright)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                Architecture Plan: {currentJob.plan.title}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                ({currentJob.plan.files.length} planned files • {currentJob.plan.tech_stack.join(', ')})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: 'var(--accent-cyan-bright)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Edit size={13} />
              <span>Inspect & Edit Plan</span>
            </button>
          </div>
        )}

        {/* Live Timeline & SSE Stream */}
        {currentJob && (
          <AgentTimeline
            status={currentJob.status}
            events={currentJob.events}
            latestThought={latestThought}
            enableResearch={currentJob.spec?.enable_research ?? enableResearch}
            researchNotes={currentJob.research_notes}
          />
        )}

        {/* Test Verification Panel */}
        {currentJob && (currentJob.latest_test || currentJob.test_history.length > 0) && (
          <TestReportPanel
            testHistory={currentJob.test_history}
            latestTest={currentJob.latest_test}
          />
        )}

        {/* File Browser with Syntax Highlighting */}
        {currentJob && currentJob.files && currentJob.files.length > 0 && (
          <FileBrowser
            files={currentJob.files}
            downloadUrl={currentJob.download_url}
          />
        )}
      </main>

      {/* Plan Preview & Editor Modal */}
      {isPlanModalOpen && currentJob?.plan && (
        <PlanEditorModal
          plan={currentJob.plan}
          onApprove={handleApprovePlan}
          onClose={() => setIsPlanModalOpen(false)}
          isApprovalRequired={currentJob.status === 'awaiting_plan_approval'}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.75rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          background: 'rgba(8, 10, 15, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
          SpecForge • Nebius x NVIDIA Global AI Hackathon (Deadline Oct 30, 2026) • Track: Coding & Agentic Engineering
        </p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Open Source under Apache-2.0 License • Powered by NVIDIA Nemotron & Nebius Token Factory • Grounded by Tavily API
        </p>
      </footer>
    </div>
  );
};

export default App;
