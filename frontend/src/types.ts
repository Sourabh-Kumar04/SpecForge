export type ProjectType = 'python_cli' | 'fastapi_service' | 'react_component';

export type JobStatus =
  | 'queued'
  | 'planning'
  | 'awaiting_plan_approval'
  | 'researching'
  | 'coding'
  | 'testing'
  | 'fixing'
  | 'completed'
  | 'failed'
  | 'paused';

export interface PlannedFile {
  path: string;
  purpose: string;
  is_test?: boolean;
}

export interface Plan {
  title: string;
  architecture_summary: string;
  tech_stack: string[];
  files: PlannedFile[];
  test_strategy: string;
  research_queries: string[];
}

export interface ResearchDoc {
  query: string;
  url?: string;
  title: string;
  summary: string;
  key_apis: string[];
  relevance?: number;
  source?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface TestResult {
  passed: boolean;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  output: string;
  iteration: number;
  duration_seconds: number;
  runner: string;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  stage: string;
  event_type: 'thought' | 'action' | 'log' | 'test_run' | 'file_written' | 'status' | 'error' | 'done';
  message: string;
  data?: any;
}

export interface DiffChange {
  path: string;
  diff: string;
  explanation?: string;
}

export interface RefineResult {
  id: string;
  instruction: string;
  timestamp: string;
  summary: string;
  changes: DiffChange[];
  test_result?: TestResult;
}

export type PreviewStatus = 'idle' | 'running' | 'stopped' | 'error' | 'completed';

export interface PreviewResponse {
  job_id: string;
  project_type: ProjectType;
  status: PreviewStatus;
  port?: number;
  url?: string;
  direct_url?: string;
  terminal_output?: string;
  message: string;
}

export interface JobSpend {
  total_cost_usd: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  spend_cap_usd: number;
  is_cap_exceeded: boolean;
  by_stage: {
    planning?: number;
    research?: number;
    coding?: number;
    testing?: number;
    fixing?: number;
    [key: string]: number | undefined;
  };
  tokens_by_stage?: Record<string, { prompt: number; completion: number; total: number }>;
}

export interface JobDetail {
  job_id: string;
  spec: {
    prompt: string;
    project_type: ProjectType;
    enable_research?: boolean;
    require_plan_approval?: boolean;
    max_fix_iterations?: number;
  };
  status: JobStatus;
  created_at: string;
  updated_at: string;
  plan?: Plan;
  research_notes: ResearchDoc[];
  files: GeneratedFile[];
  test_history: TestResult[];
  latest_test?: TestResult;
  error?: string;
  events: AgentEvent[];
  download_url?: string;
  workspace_dir?: string;
  refinements?: RefineResult[];
  spend?: JobSpend;
}

export interface ExampleSpec {
  id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  prompt: string;
  tags: string[];
}

export interface HealthInfo {
  status: string;
  service: string;
  mock_mode: boolean;
  models: {
    fast: string;
    reasoning: string;
  };
  tavily_enabled: boolean;
  tavily_status?: 'live' | 'offline_kb_fallback';
  llm_status?: 'live' | 'key_ready' | 'mock_configured' | 'mock_fallback';
}

export interface SettingsInfo {
  nebius_api_key_set: boolean;
  nebius_api_key_masked: string;
  nebius_base_url: string;
  nebius_model_fast: string;
  nebius_model_reasoning: string;
  tavily_api_key_set: boolean;
  tavily_api_key_masked: string;
  spend_cap_usd: number;
  mock_mode: boolean;
  tavily_enabled: boolean;
}
