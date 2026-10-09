from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProjectType(str, Enum):
    PYTHON_CLI = "python_cli"
    FASTAPI_SERVICE = "fastapi_service"
    REACT_COMPONENT = "react_component"

class JobStatus(str, Enum):
    QUEUED = "queued"
    PLANNING = "planning"
    AWAITING_PLAN_APPROVAL = "awaiting_plan_approval"
    RESEARCHING = "researching"
    CODING = "coding"
    TESTING = "testing"
    FIXING = "fixing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class SpecInput(BaseModel):
    prompt: str = Field(..., description="Plain-English project requirement or specification")
    project_type: ProjectType = Field(default=ProjectType.PYTHON_CLI, description="Target architecture template")
    enable_research: bool = Field(default=True, description="Enable Tavily doc grounding")
    require_plan_approval: bool = Field(default=False, description="Pause after planning for human review/edit")
    max_fix_iterations: int = Field(default=5, ge=1, le=10, description="Max fixer loop attempts upon failing tests")

class PlannedFile(BaseModel):
    path: str
    purpose: str
    is_test: bool = False

class Plan(BaseModel):
    title: str
    architecture_summary: str
    tech_stack: List[str] = []
    files: List[PlannedFile] = []
    test_strategy: str = ""
    research_queries: List[str] = []

class ResearchDoc(BaseModel):
    query: str
    url: Optional[str] = None
    title: str
    summary: str
    key_apis: List[str] = []

class GeneratedFile(BaseModel):
    path: str
    content: str
    language: str

class TestResult(BaseModel):
    passed: bool
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    output: str = ""
    iteration: int = 1
    duration_seconds: float = 0.0
    runner: str = "subprocess"

class AgentEvent(BaseModel):
    id: str
    timestamp: str
    stage: str
    event_type: str  # thought, action, log, test_run, file_written, status, error
    message: str
    data: Optional[Dict[str, Any]] = None

class FileUpdateInput(BaseModel):
    path: str
    content: str

class RefineInput(BaseModel):
    instruction: str = Field(..., description="Targeted natural language refinement instruction")

class DiffChange(BaseModel):
    path: str
    diff: str
    explanation: Optional[str] = None

class RefineResult(BaseModel):
    id: str
    instruction: str
    timestamp: str
    summary: str
    changes: List[DiffChange] = []
    test_result: Optional[TestResult] = None

class PreviewStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    COMPLETED = "completed"

class PreviewRequest(BaseModel):
    args: Optional[str] = None

class PreviewResponse(BaseModel):
    job_id: str
    project_type: ProjectType
    status: PreviewStatus
    port: Optional[int] = None
    url: Optional[str] = None
    direct_url: Optional[str] = None
    terminal_output: Optional[str] = None
    message: str

class JobSpend(BaseModel):
    total_cost_usd: float = 0.0
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_tokens: int = 0
    spend_cap_usd: float = 2.00
    is_cap_exceeded: bool = False
    by_stage: Dict[str, float] = Field(default_factory=lambda: {
        "planning": 0.0,
        "research": 0.0,
        "coding": 0.0,
        "testing": 0.0,
        "fixing": 0.0,
    })
    tokens_by_stage: Dict[str, Dict[str, int]] = Field(default_factory=dict)

class JobDetail(BaseModel):
    job_id: str
    spec: SpecInput
    status: JobStatus
    created_at: str
    updated_at: str
    plan: Optional[Plan] = None
    research_notes: List[ResearchDoc] = []
    files: List[GeneratedFile] = []
    test_history: List[TestResult] = []
    latest_test: Optional[TestResult] = None
    error: Optional[str] = None
    events: List[AgentEvent] = []
    download_url: Optional[str] = None
    workspace_dir: Optional[str] = None
    refinements: List[RefineResult] = []
    spend: JobSpend = Field(default_factory=JobSpend)

class SettingsResponse(BaseModel):
    nebius_api_key_set: bool
    nebius_api_key_masked: str
    nebius_base_url: str
    nebius_model_fast: str
    nebius_model_reasoning: str
    tavily_api_key_set: bool
    tavily_api_key_masked: str
    spend_cap_usd: float
    mock_mode: bool
    tavily_enabled: bool

class SettingsUpdateRequest(BaseModel):
    nebius_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    spend_cap_usd: Optional[float] = None
    nebius_model_fast: Optional[str] = None
    nebius_model_reasoning: Optional[str] = None

