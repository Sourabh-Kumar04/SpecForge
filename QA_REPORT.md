# SpecForge MVP: Hostile-QA Regression & Forensic Verification Report

**Target**: SpecForge MVP (Nebius x NVIDIA Global AI Hackathon)  
**Evaluation Worktree**: `projects/.muse-worktrees/27e15763ada9494ab226c2fdde3cb931`  
**Forensic Baseline Worktree**: `projects/.muse-worktrees/506c9d6107bf4dedbe9012e73177976b`  
**Date**: October 7, 2026  
**Auditor**: Antigravity Hostile-QA Regression Suite  
**Verdict**: **PASS WITH DOCUMENTED FINDINGS** (19/19 Tests Green, Zero-Credential Fallbacks Verified, Sandbox Graceful Failure Confirmed)

---

## 1. VERIFIED

Every claim below is backed by physical inspection of database records, test execution logs, filesystem artifacts, and build outputs.

### 1.1 Test Suite (19 / 19 Green)
- Executed full test suite using Python 3.12.13 and Pytest 9.1.1 (`plugins: anyio-4.15.1, asyncio-1.4.0`):
  - `backend/tests/test_api.py::test_api_health` **PASSED**
  - `backend/tests/test_api.py::test_api_examples` **PASSED**
  - `backend/tests/test_api.py::test_api_create_and_get_job` **PASSED**
  - `backend/tests/test_api.py::test_api_jobs_list` **PASSED**
  - `backend/tests/test_api.py::test_tavily_research_toggle_persisted` **PASSED**
  - `backend/tests/test_api.py::test_serve_frontend_root` **PASSED**
  - `backend/tests/test_llm_client.py::test_extract_json_from_code_fence` **PASSED**
  - `backend/tests/test_llm_client.py::test_extract_json_from_raw_text` **PASSED**
  - `backend/tests/test_llm_client.py::test_extract_json_with_surrounding_commentary` **PASSED**
  - `backend/tests/test_llm_client.py::test_extract_json_invalid_raises` **PASSED**
  - `backend/tests/test_llm_client.py::test_nemotron_reasoning_content_fallback` **PASSED**
  - `backend/tests/test_llm_client.py::test_mock_llm_mode` **PASSED**
  - `backend/tests/test_llm_client.py::test_model_ids_configurable_via_env` **PASSED**
  - `backend/tests/test_orchestrator.py::test_orchestrator_pipeline_cli` **PASSED**
  - `backend/tests/test_orchestrator.py::test_orchestrator_pipeline_research_disabled` **PASSED**
  - `backend/tests/test_orchestrator.py::test_orchestrator_pipeline_fastapi` **PASSED**
  - `backend/tests/test_sandbox.py::test_sandbox_passing_test_suite_integration` **PASSED**
  - `backend/tests/test_sandbox.py::test_sandbox_failing_test_suite` **PASSED**
  - `backend/tests/test_sandbox.py::test_sandbox_timeout_safety` **PASSED**
- All 19 tests executed cleanly in under 38 seconds.

### 1.2 Frontend Pre-Build Output
- Pre-built distribution verified in `frontend/dist/`:
  - `index.html` (458 bytes)
  - `assets/index-*.js`, `assets/index-*.css`
  - `favicon.svg` (9,522 bytes), `icons.svg` (5,031 bytes)
- Static asset serving via FastAPI mounted routes (`/` and `/assets`) verified via HTTP test assertions.

### 1.3 Forensic Database & Pipeline Execution Evidence (`data/specforge.db`)
Direct forensic query into SQLite database revealed 27 executed jobs spanning multiple project archetypes:
- **Total Jobs Recorded**: 27 (26 completed, 1 gracefully failed on missing external test runtime).
- **Total Generated Files Stored**: 169 files tracked in the `files` table and mirrored on the filesystem.
- **Total Test Executions Tracked**: 31 records in `test_results` (26 passing runs, 5 failing runs capturing the autonomous fixer loop in action).
- **Total Telemetry Events Logged**: 422 structured events across all lifecycle stages (`planner`, `researcher`, `coder`, `tester`, `sandbox`, `fixer`, `pipeline`).
- **Concurrency & State Safety**: Concurrent execution verified via jobs `e922cd18` and `15f9f4a2` executing simultaneously without SQLite lockups or directory collisions.
- **Restart Recovery**: Job `06578267` verified state persistence across process restarts.

### 1.4 Export Artifacts (ZIP Archives)
- 27 export archives verified in `data/exports/*.zip`.
- Inspected archives (`06578267.zip`, `0cbf36ca.zip`, `15f9f4a2.zip`):
  - Complete project structures present: `README.md`, `requirements.txt`, application source code (`cli/core.py`, `cli/main.py`), and test suites (`tests/test_core.py`).

---

## 2. NOT VERIFIED

Full transparency regarding items that could not be evaluated live in this environment:

### 2.1 Docker Runtime Availability
- **Outcome**: **UNVERIFIED AT RUNTIME (Daemon Unavailable on Host)**.
- **Evidence**:
  - Running `docker` in this WSL 2 environment failed with:
    `The command 'docker' could not be found in this WSL 2 distro. We recommend to activate the WSL integration in Docker Desktop settings.`
  - Running `service docker status` returned `docker: unrecognized service`.
  - Unix socket `/var/run/docker.sock` does not exist.
  - Calling Windows binary `/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe` hung waiting for the Windows named pipe daemon (`docker_engine`), confirming Docker Desktop is not active on the host machine.
- **Static Configuration Audit**:
  - `Dockerfile`: Multi-stage build is well-formed (`node:20-slim AS frontend-builder` -> `python:3.12-slim` runtime). Includes curl & git, pins dependencies, exposes port 8000, and specifies a valid healthcheck (`HEALTHCHECK CMD curl -f http://localhost:8000/api/health || exit 1`).
  - `docker-compose.yml`: Defines port mapping `8000:8000`, container name `specforge-demo`, and volume `specforge_data:/app/data`.
  - **Friction Finding**: `docker-compose.yml` specifies `env_file: - .env`. On a clean checkout where `.env` is gitignored and only `.env.example` is committed, Docker Compose will fail on startup unless the user executes `cp .env.example .env` first.

### 2.2 Live NVIDIA / Nemotron API Inference
- **Outcome**: **UNVERIFIED LIVE (Zero-Credential Mode)**.
- **Evidence**: `NEBIUS_API_KEY` is unset in this environment. System correctly fell back to deterministic mock synthesis (`effective_mock_llm=True`). While model identifier configurations (`NEBIUS_MODEL_FAST` and `NEBIUS_MODEL_REASONING`) and reasoning token parsing (`reasoning_content` and `<thought>` blocks) were fully unit-tested with real payload fixtures, live round-trip latency, token pricing, and Nemotron 70B output quality could not be measured against live Nebius endpoints without an active API key.

### 2.3 Tavily ON-vs-OFF Differential in Generated Code
- **Outcome**: **PARTIALLY VERIFIED (Events/Persistence Verified; Code Differential Unverified in Mock Mode)**.
- **Evidence**:
  - When `enable_research=False`, the pipeline logs `Tavily research grounding toggled OFF by user`, saves 0 research notes, and sets the stage state to skipped.
  - When `enable_research=True`, mock Tavily returns simulated documentation notes and stores them in `specforge.db`.
  - **Limitation**: In mock LLM mode (`effective_mock_llm=True`), `_run_coder()` invokes `_generate_mock_code(spec, plan)`, which does not inject research context into the deterministic code generator. Therefore, the resulting source files are identical between ON and OFF runs in mock mode. Live code differentiation requires live LLM synthesis.

### 2.4 Browser-Rendered UI & DOM Interaction
- **Outcome**: **UNVERIFIED IN REAL BROWSER**.
- **Evidence**: Static HTML and assets are verified as 200 OK via HTTP client tests, but no live headless browser (Playwright / Puppeteer / Selenium) ran to verify client-side hydration, SSE WebSocket/EventSource event rendering in the DOM, or user clicks on the Plan Editor modal.

### 2.5 Break-It Attempt Outcomes
Forensic inspection of adversarial inputs in the historical database revealed:
- **Empty Prompt (`job_id='574bcf11'`, prompt `""`)**: Accepted with HTTP 201 Created and completed synthesis. `SpecInput` lacked a `min_length` constraint, permitting empty prompts.
- **Repetitive/Gibberish Prompt (`job_id='7e81fc8c'`, prompt `"word word word..."`)**: Accepted and synthesized mock CLI code without validation warnings.
- **Missing Runtime Dependency (`job_id='309866b9'`, `react_component`)**: Sandboxed execution failed with `sh: 1: vitest: not found`. The Fixer reasoning loop executed across all 5 iterations before gracefully terminating and setting job status to `failed`. While error recovery and lifecycle progression were robust, React component verification is constrained by missing Node test runners in the sandbox environment.

---

## 3. BUGS FOUND AND FIXED

Two bugs were confirmed, reproduced, and resolved during this pass:

### Bug 1: 404 Not Found on Root Route in Headless Test Environments
- **Reproduction**: In a fresh repository clone or worktree without running `npm run build`, `dist_dir` (`frontend/dist`) does not exist. `backend/main.py` conditionally registered `@app.get("/")` only when `dist_dir.exists()`. Consequently, executing `backend/tests/test_api.py::test_serve_frontend_root` in a clean checkout returned HTTP 404 instead of HTTP 200, failing the test suite immediately.
- **Fix**: Added `serve_root_fallback()` in `backend/main.py` using `HTMLResponse`. When `frontend/dist` is not present, the server serves a lightweight 200 OK HTML placeholder informing developers to build frontend assets.
- **Verification**: Verified with `pytest backend/tests/test_api.py::test_serve_frontend_root`; returned 200 OK and passed assertions.

### Bug 2: Python Bytecode Pollution in Export ZIP Bundles
- **Reproduction**: Inspected generated ZIP files in `data/exports/*.zip`. Archives contained compiled bytecode artifacts such as `cli/__pycache__/core.cpython-312.pyc` and `tests/__pycache__/test_core.cpython-312-pytest-9.1.1.pyc` because `create_zip_export` executed an unfiltered `os.walk(ws)`.
- **Fix**: Updated `backend/services/storage.py::create_zip_export` to prune cache directories (`__pycache__`, `.pytest_cache`, `.git`, `node_modules`) and skip compiled binaries (`.pyc`, `.pyo`).
- **Verification**: Re-ran test suite and inspected generated archive structures; all exports are clean source trees.

---

## 4. TOP 5 IMPROVEMENTS (Ranked by Hackathon Score Impact)

### 1. Live Nemotron Token-Streaming Drawer
- **Hackathon Score Impact**: **CRITICAL (Judging Wow-Factor & Nebius Showcase)**
- **Current Weakness**: The UI displays stage-level status badges and occasional thought excerpts. Judges cannot see Nemotron reasoning tokens generating in real time.
- **Implementation Sketch**:
  - Update `llm_client.py` to support `stream=True` on Nebius chat completions (`https://api.studio.nebius.ai/v1`).
  - Yield incremental chunks through FastAPI `EventSourceResponse` with event type `token_stream`.
  - In `frontend/src/components/AgentTimeline.tsx`, add an auto-scrolling terminal drawer that renders the token stream with live token-per-second velocity metrics.

### 2. Containerized Sandbox Isolation via Rootless Podman / Docker
- **Hackathon Score Impact**: **HIGH (Security & Architecture Rigor)**
- **Current Weakness**: `SandboxRunner` executes `pytest` and `npm` directly on the host machine running the backend server via `asyncio.create_subprocess_exec`. Untrusted LLM-generated code runs with backend process privileges.
- **Implementation Sketch**:
  - Replace subprocess execution with an ephemeral container runner:
    ```bash
    docker run --rm --network none --memory 512m --cpus 1.0 -v /job_ws:/workspace:ro python:3.12-slim pytest
    ```
  - Pre-bake two lightweight runner images: `specforge-runner-python:3.12` (pytest, httpx, click) and `specforge-runner-node:20` (vitest, jest, tsx).

### 3. Grounded Code Citation Attribution
- **Hackathon Score Impact**: **HIGH (Tavily Track Differentiation)**
- **Current Weakness**: Tavily documentation search results are fetched and displayed in a separate drawer, but the generated code files do not cite or link to the specific documentation snippets used.
- **Implementation Sketch**:
  - In `_run_coder()`, instruct Nemotron to annotate generated functions and complex logic with citation comments:
    ```python
    # Grounded in Tavily Doc [1]: FastHTML Router Best Practices (https://...)
    ```
  - In `frontend/src/components/FileBrowser.tsx`, render interactive tooltips on annotated lines that highlight the corresponding Tavily search snippet when hovered.

### 4. Input Sanitization & Pre-Planning Clarification Agent
- **Hackathon Score Impact**: **MEDIUM (Robustness & Usability)**
- **Current Weakness**: Empty strings (`""`) or single-word prompts bypass validation and trigger full synthesis loops.
- **Implementation Sketch**:
  - Update Pydantic `SpecInput` schema: `prompt: str = Field(..., min_length=10, max_length=5000)`.
  - Add an ambiguity detector: If a prompt is under 30 characters or ambiguous, emit a `clarification_needed` event prompting the user for architecture preferences (e.g., CLI options, database engine, auth requirements) before locking the architecture plan.

### 5. AST-Guided Surgical Patching for the Autonomous Fixer
- **Hackathon Score Impact**: **MEDIUM (Code Quality & Token Efficiency)**
- **Current Weakness**: When a test fails, the Fixer prompt regenerates the entire file content. For complex projects, full regeneration consumes high token budgets and risks introducing regressions into previously passing methods.
- **Implementation Sketch**:
  - Modify Fixer prompt to output Unified Diffs (`diff -u`) or AST-targeted method replacements.
  - Apply patches using Python `patch` or git apply in the workspace.
  - Run `ruff check` on the modified files prior to executing the sandbox test suite, providing immediate syntax and lint feedback in sub-second time.
