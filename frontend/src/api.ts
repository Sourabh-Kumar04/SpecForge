import {
  JobDetail,
  Plan,
  ExampleSpec,
  HealthInfo,
  AgentEvent,
  ProjectType,
  PreviewResponse,
  RefineResult,
} from './types';

const BASE_URL = '';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchExamples(): Promise<ExampleSpec[]> {
  const res = await fetch(`${BASE_URL}/api/examples`);
  if (!res.ok) throw new Error(`Failed to load examples: ${res.statusText}`);
  return res.json();
}

export async function createJob(params: {
  prompt: string;
  project_type: ProjectType;
  enable_research: boolean;
  require_plan_approval: boolean;
  max_fix_iterations: number;
}): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create job: ${err}`);
  }
  return res.json();
}

export async function fetchJob(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch job ${jobId}`);
  return res.json();
}

export async function approvePlan(jobId: string, plan: Plan): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/approve-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!res.ok) throw new Error(`Failed to approve plan`);
  return res.json();
}

export function subscribeJobEvents(
  jobId: string,
  onEvent: (event: AgentEvent) => void,
  onFinish?: () => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${BASE_URL}/api/jobs/${jobId}/events`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.event_type === 'done' || (data.stage === 'pipeline' && data.message?.includes('concluded'))) {
        if (onFinish) onFinish();
        eventSource.close();
        return;
      }
      onEvent(data as AgentEvent);
    } catch (err) {
      console.error('Error parsing SSE event', err, e.data);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

export async function startPreview(jobId: string, args?: string): Promise<PreviewResponse> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: args || null }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to start preview: ${text}`);
  }
  return res.json();
}

export async function fetchPreview(jobId: string): Promise<PreviewResponse> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/preview`);
  if (!res.ok) throw new Error(`Failed to fetch preview status`);
  return res.json();
}

export async function stopPreview(jobId: string): Promise<PreviewResponse> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/preview`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to stop preview`);
  return res.json();
}

export async function updateFile(jobId: string, path: string, content: string): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/files`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save file: ${text}`);
  }
  return res.json();
}

export async function retestJob(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/retest`, {
    method: 'POST',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to run tests: ${text}`);
  }
  return res.json();
}

export async function refineJob(jobId: string, instruction: string): Promise<RefineResult> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refine codebase: ${text}`);
  }
  return res.json();
}
