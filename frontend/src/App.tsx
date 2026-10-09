import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExampleGallery } from './components/ExampleGallery';
import { SpecForm } from './components/SpecForm';
import { AgentTimeline } from './components/AgentTimeline';
import { FileBrowser } from './components/FileBrowser';
import { TestReportPanel } from './components/TestReportPanel';
import { PlanEditorModal } from './components/PlanEditorModal';
import { PreviewPanel } from './components/PreviewPanel';
import { RefineBox } from './components/RefineBox';
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
  updateFile,
  retestJob,
  refineJob,
} from './api';
import {
  Download,
  Edit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code2,
  Flame,
  Terminal,
  FileCode,
  FlaskConical,
} from 'lucide-react';

const SAMPLE_FASTMCP_SPEC: ExampleSpec = {
  id: 'fastmcp-2026-server',
  title: 'FastMCP 4.0 Protocol Server (2026)',
  description:
    'Model Context Protocol server utilizing the FastMCP 4.0 stateless spec with tool schemas and test suite.',
  project_type: 'python_cli',
  prompt:
    'Build a production Model Context Protocol (MCP) CLI tool and server using FastMCP 4.0. The service exposes data analysis and math tools via @mcp.tool, supports stateless protocol negotiation, and includes a comprehensive pytest test suite asserting tool registration, execution, and error boundary handling.',
  tags: ['FastMCP 4.0', 'Tavily Grounded', 'Python CLI', 'Pytest'],
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
  const [activeTab, setActiveTab] = useState<'files' | 'preview' | 'tests'>('preview');
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);

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

        // Sync fresh state from server on milestones
        if (['file_written', 'test_run', 'status'].includes(event.event_type)) {
          fetchJob(jobId).then((fullJob) => {
            setCurrentJob(fullJob);
            if (fullJob.status === 'completed' || fullJob.status === 'failed') {
              setIsLoading(false);
              setIsRefining(false);
            }
          });
        }
      },
      () => {
        // Stream completed
        fetchJob(jobId).then((fullJob) => {
          setCurrentJob(fullJob);
          setIsLoading(false);
          setIsRefining(false);
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
      setActiveTab('preview');
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

  const handleSaveFile = async (path: string, content: string) => {
    if (!currentJob) return;
    try {
      const updatedJob = await updateFile(currentJob.job_id, path, content);
      setCurrentJob(updatedJob);
    } catch (err: any) {
      setErrorMsg('Failed to save file edits: ' + err.message);
      throw err;
    }
  };

  const handleRetest = async () => {
    if (!currentJob || isRetesting) return;
    setIsRetesting(true);
    try {
      const updatedJob = await retestJob(currentJob.job_id);
      setCurrentJob(updatedJob);
    } catch (err: any) {
      setErrorMsg('Failed to run tests: ' + err.message);
    } finally {
      setIsRetesting(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!currentJob || isRefining) return;
    setIsRefining(true);
    setErrorMsg(null);
    try {
      await refineJob(currentJob.job_id, instruction);
      // Fetch latest job
      const refreshed = await fetchJob(currentJob.job_id);
      setCurrentJob(refreshed);
    } catch (err: any) {
      setErrorMsg('Refinement failed: ' + err.message);
    } finally {
      setIsRefining(false);
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
        {/* FORGE IDENTITY HERO CALLOUT */}
        <div
          className="glass-panel"
          style={{
            position: 'relative',
            padding: '2rem 2.25rem',
            marginBottom: '2rem',
            background: 'linear-gradient(145deg, rgba(18, 19, 25, 0.95) 0%, rgba(12, 13, 17, 0.98) 100%)',
            border: '1px solid var(--border-amber)',
            boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.7), 0 0 24px rgba(255, 107, 26, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Molten amber hairline top accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ff6b1a 50%, transparent)',
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
                className="badge badge-amber"
                style={{
                  fontSize: '0.74rem',
                  letterSpacing: '0.04em',
                  fontWeight: 800,
                  boxShadow: '0 0 10px rgba(255, 107, 26, 0.25)',
                }}
              >
                <Flame size={13} />
                CODE REFINERY
              </span>
              <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                NVIDIA NEMOTRON REASONING
              </span>
              <span className="badge badge-slate" style={{ fontSize: '0.72rem' }}>
                TAVILY GROUNDED
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              ISOLATED SANDBOX EXECUTION
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.035em',
              lineHeight: 1.2,
              margin: '0.4rem 0 0.75rem 0',
            }}
          >
            Raw specification in. Verified code out.
          </h1>

          <p
            style={{
              fontSize: '0.94rem',
              color: '#cbd5e1',
              maxWidth: '840px',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            <strong style={{ color: 'var(--accent-amber-bright)' }}>Describe it. Watch it build. Inspect the proof.</strong>{' '}
            SpecForge eliminates outdated syntax using Tavily documentation search, generates clean multi-file architectures with NVIDIA Nemotron, and proves every assertion works inside an isolated sandbox test and fix loop until 100% green.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 'var(--radius-sm)',
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

        {/* Presets Gallery */}
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

        {/* PROVED VERIFIED Completion Banner */}
        {currentJob && currentJob.status === 'completed' && (
          <div
            className="glass-panel"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 24, 20, 0.95) 100%)',
              border: '1.5px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.75rem',
              marginBottom: '1.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              boxShadow: '0 0 32px rgba(34, 197, 94, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(34, 197, 94, 0.4)',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={26} color="var(--color-success-bright)" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--color-success-bright)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    FORGED & VERIFIED GREEN ✓
                  </span>
                  <span
                    className="badge badge-green"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {currentJob.latest_test ? `${currentJob.latest_test.passed_tests}/${currentJob.latest_test.total_tests} assertions passed` : 'tests passed'}
                  </span>
                </div>

                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Every generated file executed in an isolated sandbox with zero assertion failures.
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
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={16} />
                <span>Export ZIP</span>
              </a>
            )}
          </div>
        )}

        {/* Blueprint Inspect Trigger Banner */}
        {currentJob?.plan && (
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'rgba(14, 15, 20, 0.75)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Code2 size={15} color="var(--accent-amber-bright)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                Blueprint: {currentJob.plan.title}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
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
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 26, 0.1)',
                border: '1px solid var(--border-amber)',
                color: 'var(--accent-amber-bright)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Edit size={12} />
              <span>Inspect Blueprint</span>
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

        {/* WORKSTREAM 3: NATURAL-LANGUAGE REFINE BOX */}
        {currentJob && currentJob.files && currentJob.files.length > 0 && (
          <RefineBox
            jobId={currentJob.job_id}
            refinements={currentJob.refinements}
            onRefine={handleRefine}
            isRefining={isRefining}
          />
        )}

        {/* OUTPUT INSPECTION & DEMO TABS */}
        {currentJob && currentJob.files && currentJob.files.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            {/* Tab Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-default)',
                paddingBottom: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTab === 'preview' ? '1px solid var(--border-amber)' : '1px solid transparent',
                  background: activeTab === 'preview' ? 'rgba(255, 107, 26, 0.15)' : 'transparent',
                  color: activeTab === 'preview' ? 'var(--accent-amber-bright)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Terminal size={14} />
                <span>[LIVE PREVIEW RUNTIME]</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('files')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTab === 'files' ? '1px solid var(--border-amber)' : '1px solid transparent',
                  background: activeTab === 'files' ? 'rgba(255, 107, 26, 0.15)' : 'transparent',
                  color: activeTab === 'files' ? 'var(--accent-amber-bright)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileCode size={14} />
                <span>[IN-BROWSER EDITOR & FILES]</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeTab === 'tests' ? '1px solid var(--border-amber)' : '1px solid transparent',
                  background: activeTab === 'tests' ? 'rgba(255, 107, 26, 0.15)' : 'transparent',
                  color: activeTab === 'tests' ? 'var(--accent-amber-bright)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FlaskConical size={14} />
                <span>[TEST VERIFICATION PROOF]</span>
              </button>
            </div>

            {/* Tab 1: Live Preview Runtime */}
            {activeTab === 'preview' && (
              <PreviewPanel job={currentJob} />
            )}

            {/* Tab 2: In-Browser File Editor */}
            {activeTab === 'files' && (
              <FileBrowser
                files={currentJob.files}
                downloadUrl={currentJob.download_url}
                jobId={currentJob.job_id}
                onSaveFile={handleSaveFile}
                onRetest={handleRetest}
                isRetesting={isRetesting}
              />
            )}

            {/* Tab 3: Test Verification Proof */}
            {activeTab === 'tests' && (
              <TestReportPanel
                testHistory={currentJob.test_history}
                latestTest={currentJob.latest_test}
              />
            )}
          </div>
        )}
      </main>

      {/* Blueprint Preview & Editor Modal */}
      {isPlanModalOpen && currentJob?.plan && (
        <PlanEditorModal
          plan={currentJob.plan}
          onApprove={handleApprovePlan}
          onClose={() => setIsPlanModalOpen(false)}
          isApprovalRequired={currentJob.status === 'awaiting_plan_approval'}
        />
      )}

      {/* Forge Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          background: 'rgba(10, 11, 14, 0.95)',
          backdropFilter: 'blur(12px)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          SPECFORGE // NEBIUS x NVIDIA GLOBAL AI HACKATHON // TRACK: CODING & AGENTIC ENGINEERING
        </p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          Apache-2.0 • NVIDIA Nemotron • Nebius Token Factory • Tavily Live Grounding
        </p>
      </footer>
    </div>
  );
};

export default App;
