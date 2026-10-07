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
  | 'failed';

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
}
