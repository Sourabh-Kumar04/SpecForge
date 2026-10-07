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
  Sparkles,
  Download,
  FileText,
  Edit,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Code2,
} from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [examples, setExamples] = useState<ExampleSpec[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [projectType, setProjectType] = useState<ProjectType>('python_cli');
  const [enableResearch, setEnableResearch] = useState<boolean>(true);
  const [requirePlanApproval, setRequirePlanApproval] = useState<boolean>(false);
  const [maxFixIterations, setMaxFixIterations] = useState<number>(5);

  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial health and examples
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.error('Failed to load health:', err));

    fetchExamples()
      .then((data) => {
        setExamples(data);
        if (data.length > 0) {
          // Preload first example into form
          setPrompt(data[0].prompt);
          setProjectType(data[0].project_type);
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

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        {/* Hackathon Hero Callout */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(118, 185, 0, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(118, 185, 0, 0.25)',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={18} color="#84cc16" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Verified, Research-Grounded Generation
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.5 }}>
              Standard LLM codegen gives indie hackers outdated syntax and untested hallucinations.
              <strong> SpecForge</strong> grounds generation with live Tavily API docs and guarantees every generated repository passes a green sandbox test suite powered by <strong>NVIDIA Nemotron</strong> and <strong>Nebius Token Factory</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-nvidia">
              Reasoning Tier: {health?.models?.reasoning ? health.models.reasoning : 'nvidia/Llama-3.1-Nemotron-70B-Instruct'}
            </span>
            <span className="badge badge-nebius">
              Fast Tier: {health?.models?.fast ? health.models.fast : 'nvidia/nemotron-mini-4b-instruct'}
            </span>
            <span className="badge badge-nebius" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', borderColor: '#06b6d4' }}>
              Tavily Grounded ($3,000 Prize Track)
            </span>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quickstart Presets */}
        <ExampleGallery
          examples={examples}
          onSelect={handleSelectExample}
          disabled={isLoading}
        />

        {/* Spec Forge Form */}
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
        />

        {/* Plan Edit Trigger Banner (if plan exists) */}
        {currentJob?.plan && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Code2 size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                Architecture Plan: {currentJob.plan.title}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ({currentJob.plan.files.length} planned files • {currentJob.plan.tech_stack.join(', ')})
              </span>
            </div>

            <button
              onClick={() => setIsPlanModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
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
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <p>
          SpecForge • Nebius x NVIDIA Global AI Hackathon (Deadline Oct 30, 2026) • Track: Coding & Agentic Engineering
        </p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Open Source under Apache-2.0 License • Powered by NVIDIA Nemotron & Nebius Token Factory
        </p>
      </footer>
    </div>
  );
};

export default App;
