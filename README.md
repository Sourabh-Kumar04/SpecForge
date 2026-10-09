# SpecForge ⚡️

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Nebius Token Factory](https://img.shields.io/badge/Nebius_Token_Factory-NVIDIA_Nemotron-76B900.svg)](https://nebius.com)
[![Hackathon Track](https://img.shields.io/badge/Hackathon-Coding_&_Agentic_Engineering-purple.svg)](https://nebius.com)
[![Pytest Suite](https://img.shields.io/badge/Pytest-19_Passed_100%25-brightgreen.svg)]()

> **Verified, Research-Grounded Code Synthesis**  
> *Nebius x NVIDIA Global AI Hackathon (Deadline Oct 30, 2026)*  
> **Track:** Coding and Agentic Engineering

---

## 🎯 The Problem & Our Mission

Every developer using plain LLM codegen faces the same frustrating hurdles:
1. **Hallucinated & Broken APIs**: Generic LLMs hallucinate non-existent libraries or deprecated signatures (e.g., deprecated Pydantic v1 patterns, broken FastAPI startup handlers, outdated React lifecycle methods).
2. **Untested "Blind" Generation**: Standard LLMs output code that has never been run, never been linted, and never been verified against a real interpreter or test runner.
3. **Wasted Debugging Cycles**: Indie developers, students, and hackathon teams waste hours fixing syntax errors and runtime assertion failures that could have been caught automatically.

### The SpecForge Solution:
SpecForge transforms a plain-English app description into a **complete, test-verified code repository**. Every generated repository is backed by:
- **Real-Time Doc Grounding**: Up-to-date documentation fetched via the **Tavily Search API**.
- **Dual-Tier NVIDIA Nemotron Intelligence**: Orchestrated via **Nebius Token Factory / Nebius AI Cloud**.
- **Automated Sandbox Verification**: Executes pytest/contract tests in an isolated sandbox with a Docker container per run and an isolated subprocess fallback with strict timeouts.
- **Autonomous Fixer Loop**: When tests fail, tracebacks are fed back to Nemotron's reasoning engine to iteratively patch errors (up to 5 iterations) until all tests pass green.

---

## 🏗️ Architecture & Agentic Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │                 User App Specification                 │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   1. Planner Agent                     │
  │     (NVIDIA Nemotron 70B / 3 Ultra Reasoning Tier)     │
  │  Decomposes spec into modular architecture & test plan │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                 2. Researcher Agent                    │
  │         (Tavily Real-Time Documentation API)           │
  │   Fetches current library versions and modern APIs     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                    3. Coder Agent                      │
  │              (NVIDIA Nemotron Fast Tier)               │
  │  Generates clean, typed, modular repository files      │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                    4. Tester Agent                     │
  │     Generates comprehensive pytest unit & ASGI tests   │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │              5. Sandbox Test Verification              │
  │       (Docker Container or Subprocess Fallback)        │
  └──────────────────────────┬─────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         Tests Failed                  Tests Passed
              │                             │
              ▼                             ▼
  ┌───────────────────────┐   ┌───────────────────────────┐
  │ 6. Fixer Loop (max 5) │   │  7. Verified Green Build  │
  │  Nemotron diagnoses   │   │  - Auto-generated README  │
  │  tracebacks & patches │   │  - ZIP Project Export     │
  └───────────┬───────────┘   └───────────────────────────┘
              │                             ▲
              └─────────────────────────────┘
```

---

## 🧠 NVIDIA Nemotron & Nebius Token Factory Integration

SpecForge is engineered from the ground up to exploit open-source **NVIDIA Nemotron** models running on **Nebius Token Factory / Nebius AI Cloud**:

### 1. Dual-Tier Model Strategy
- **Reasoning Tier (`NEBIUS_MODEL_REASONING`)**: Default `nvidia/Llama-3.1-Nemotron-70B-Instruct` or `nvidia/nemotron-3-ultra`. Utilized for high-order architectural planning, decomposing ambiguous user requirements, and analyzing failure tracebacks in the Fixer loop.
- **Fast Tier (`NEBIUS_MODEL_FAST`)**: Default `nvidia/nemotron-mini-4b-instruct`. Utilized for fast file templating, doc query extraction, and rapid test suite generation.

### 2. Handling Nemotron Gotchas
Calling NVIDIA Nemotron models through Nebius Token Factory involves critical implementation details that SpecForge solves natively:
- **Reasoning Content Fallback**: Nemotron models are reasoning models where the answer can be placed in `message.reasoning_content` while `choices[0].message.content` may be empty or unpopulated. SpecForge's [`LLMClient`](backend/services/llm_client.py) inspects `content` and automatically falls back to `reasoning_content`.
- **JSON Structuring Without Tool Calling**: Open-source reasoning models on Token Factory do not support OpenAI function/tool calling schemas. SpecForge enforces strict JSON output schemas via engineered prompts and extracts valid JSON structures robustly across markdown fences and raw text.
- **Zero-Credential Mock Mode**: When `NEBIUS_API_KEY` is omitted or `MOCK_LLM=true` is set, SpecForge executes in high-fidelity mock mode so all unit tests, sandbox runs, and frontend demonstrations run without external API credentials.

### 3. Model ID Configuration & Nebius Catalog Confirmation
Every NVIDIA/Nemotron model identifier in SpecForge is fully externalized and configurable via environment variables:
- `NEBIUS_MODEL_FAST`: Identifier for the fast completion tier (default: `nvidia/nemotron-mini-4b-instruct`).
- `NEBIUS_MODEL_REASONING`: Identifier for the deep reasoning tier (default: `nvidia/Llama-3.1-Nemotron-70B-Instruct`).

> [!IMPORTANT]
> **Confirm Model IDs in Nebius Catalog Before Submission**:
> Nebius Token Factory updates its model catalog regularly, and exact model identifier strings (e.g. `nvidia/nemotron-mini-4b-instruct`, `nvidia/Llama-3.1-Nemotron-70B-Instruct`, or new Nemotron variants) can evolve between release cycles. Before final submission or running against live cloud inference, verify the exact active model strings in the [Nebius Token Factory Playground / Model Catalog](https://api.studio.nebius.ai) and set `NEBIUS_MODEL_FAST` and `NEBIUS_MODEL_REASONING` in your `.env` file accordingly. No code modifications are needed because zero model IDs are hardcoded in source.

---

## 🔍 Tavily Search API Grounding ($3,000 Best Use of Tavily Prize Track)

SpecForge actively targets the **$3,000 "Best Use of Tavily"** prize category by transforming Tavily from a general search engine into an indispensable **documentation grounding layer** for agentic code synthesis:

### Why Tavily Grounding is Essential
Standard LLMs hallucinate outdated APIs or deprecated signatures (e.g., deprecated FastAPI event handlers instead of `@asynccontextmanager lifespan`, Pydantic v1 `.dict()` instead of v2 `.model_dump()`, or deprecated Click callback patterns). SpecForge's Researcher Agent solves this by querying the **Tavily Search API** before any code is generated:
1. **Targeted Query Formulation**: The Planner agent automatically derives 2–3 precise API queries matching the user's specification (e.g. `"FastAPI 0.110+ lifespan router patterns"`).
2. **Authoritative Search & Extraction**: SpecForge queries Tavily (`POST https://api.tavily.com/search` with `search_depth="advanced"` and `include_answer=True`) to retrieve verified documentation extracts, official guidelines, and current function signatures.
3. **Coder Prompt Conditioning**: The retrieved documentation is injected directly into the Nemotron Coder's context prompt, ensuring newly generated code adheres to latest upstream production specifications.

### Explicit On/Off Toggle & Live UI Visibility
- **Frontend Spec Form Toggle**: SpecForge provides an explicit, prominent ON/OFF toggle in the web UI (`Tavily Research Grounding: ON / OFF`) featuring an interactive switch and a `$3k Prize Track` badge. Users can toggle external web research on or off at will.
- **Live Pipeline Step**: When enabled, the live agent timeline highlights a dedicated active step (`2. Tavily Docs Grounding`) with real-time SSE updates. When disabled, the timeline clearly indicates the step was skipped per user selection.
- **Dedicated Grounded Research Panel**: When research runs, a dedicated research panel in the web interface displays the retrieved documentation sources, direct official doc hyperlinks, summaries, and key API chips.
- **Zero-Credential Evaluation Fallback**: If `TAVILY_API_KEY` is not configured, SpecForge seamlessly falls back to a high-fidelity local grounded knowledge base covering Click 8.1+, FastAPI 0.110+, Pydantic v2, Pytest 8.0+, and React 19, allowing judges and developers to test the full pipeline offline with 0 credentials.


---

## 📦 Project Structure

```
specforge/
├── LICENSE                    # Apache-2.0 License
├── README.md                  # Comprehensive documentation & guide
├── Dockerfile                 # Multi-stage container build (frontend + backend)
├── docker-compose.yml         # One-command demo deployment orchestration
├── .env.example               # Environment variables template
├── pytest.ini                 # Pytest configuration
├── backend/
│   ├── config.py              # Pydantic Settings configuration
│   ├── main.py                # FastAPI entrypoint & static frontend server
│   ├── requirements.txt       # Python backend dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py         # Pydantic schemas (Specs, Plans, Events, Files)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── jobs.py            # POST/GET jobs, SSE event stream, ZIP download
│   │   └── examples.py        # Preset example specifications
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm_client.py      # Nebius client with Nemotron gotcha handling
│   │   ├── tavily_researcher.py # Real-time Tavily doc search & fallback KB
│   │   ├── sandbox.py         # Docker & Subprocess sandbox execution engine
│   │   ├── storage.py         # SQLite job store, files persistence & ZIP exporter
│   │   └── orchestrator.py    # Autonomous Planner -> Researcher -> Coder -> Fixer
│   └── tests/
│       ├── test_api.py        # REST endpoints & health check tests
│       ├── test_llm_client.py # Nemotron reasoning fallback & JSON parsing tests
│       ├── test_orchestrator.py # End-to-end pipeline integration tests
│       └── test_sandbox.py    # Sandbox execution, failure & timeout safety tests
└── frontend/
    ├── package.json           # Frontend dependencies (React 19, Lucide, PrismJS)
    ├── vite.config.ts         # Vite configuration with backend proxy
    ├── index.html             # Application HTML template
    └── src/
        ├── App.tsx            # Main application layout & state machine
        ├── api.ts             # REST & Server-Sent Events client
        ├── types.ts           # Shared TypeScript interfaces
        ├── index.css          # Modern dark developer theme
        └── components/
            ├── Header.tsx     # Branding & Nebius/NVIDIA status pills
            ├── SpecForm.tsx   # Requirements form & architecture selector
            ├── ExampleGallery.tsx # One-click preset template cards
            ├── AgentTimeline.tsx # Live SSE agent pipeline stream & thoughts
            ├── PlanEditorModal.tsx # Plan inspection and interactive editor
            ├── FileBrowser.tsx # Multi-file browser with syntax highlighting
            └── TestReportPanel.tsx # Verification badge, metrics & test terminal
```

---

## 🐳 Demo Deployment (One-Command Launch)

For hackathon judges and evaluators, SpecForge provides a **one-command zero-friction deployment** powered by Docker and Docker Compose. It runs out of the box with zero external credentials required (high-fidelity mock mode) or with live Nebius Token Factory and Tavily credentials.

The deployment uses a multi-stage `Dockerfile` that builds the React 19 frontend assets and runs the FastAPI backend serving both the REST/SSE endpoints and the compiled production web application:

```bash
# 1. Setup environment file (defaults to zero-credential evaluation mode)
cp .env.example .env

# 2. Launch the demo with a single command
docker-compose up -d --build
```

- **Instant Access**: Open **http://localhost:8000** in your web browser.
- **Judging Period Reliability**: The container is configured with `restart: unless-stopped` and an automated health check, keeping the demo alive and healthy throughout the judging period (Dec 1–15, 2026).
- **Persistent Storage**: Job history, SQLite database, and generated project zip archives are safely persisted in the `specforge_data` volume.
- **Log Streaming & Inspection**:
  ```bash
  docker-compose logs -f
  ```
- **Stopping the Demo**:
  ```bash
  docker-compose down
  ```

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ and npm

### 1. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
To enable live Nebius Token Factory and Tavily search, populate `.env`:
```env
NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
NEBIUS_API_KEY=your-nebius-token-factory-key
TAVILY_API_KEY=your-tavily-api-key
```
*(If no API keys are provided, SpecForge operates in offline mock verification mode with 100% functionality).*

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite (19 tests, 100% green)
pytest -v backend/tests
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Running the Application
Launch the unified server (serves the API and pre-compiled frontend from `frontend/dist/`):
```bash
# Recommended standard Python execution (module syntax ensures clean package imports):
python3 -m backend.main
# Or explicitly with system python:
/usr/bin/python3 -m backend.main
```
Open your browser at **http://localhost:8000**.

For interactive frontend development with Hot Module Replacement (HMR):
```bash
# In terminal 1 (backend API server):
python3 -m backend.main

# In terminal 2 (frontend Vite dev server with proxy to :8000):
cd frontend && npm run dev
```
Navigate to **http://localhost:5173**.

---

## 🛠️ Troubleshooting & Common Issues

### 1. Nebius Token Factory 404 Model Not Found
- **Symptom**: `404 Client Error: Model not found` when generating specs or refining code.
- **Cause**: Nebius model catalog names are periodically updated (e.g. `nvidia/nemotron-mini-4b-instruct` vs `nvidia/nemotron-3-super-120b-a12b` or `nvidia/Nemotron-3-Ultra-550b-a55b`).
- **Fix**: Open the in-app **BYOK Settings** panel (top right in web UI) or edit your `.env` file to set active catalog identifiers:
  ```env
  NEBIUS_MODEL_FAST=nvidia/nemotron-3-super-120b-a12b
  NEBIUS_MODEL_REASONING=nvidia/Nemotron-3-Ultra-550b-a55b
  ```
  Or leave `MOCK_LLM=true` to test offline with 0 credentials.

### 2. Tavily API Key Missing / 401 Unauthorized
- **Symptom**: Warning in logs regarding Tavily search or HTTP 401.
- **Resolution**: Tavily search is optional. If `TAVILY_API_KEY` is not provided, SpecForge seamlessly falls back to its offline grounded knowledge base (Click 8.1+, FastAPI 0.110+, Pydantic v2, Pytest 8.0+, React 19). To activate live web search, provide your key via the in-app Settings panel or set `TAVILY_API_KEY=tvly-...` in `.env`.

### 3. Port Conflicts (`8000` or `5173` already in use)
- **Symptom**: `OSError: [Errno 98] Address already in use`.
- **Fix**:
  - Check what process is occupying port 8000: `lsof -i :8000` (or `kill $(lsof -t -i:8000)`).
  - You can also run the backend on a different port:
    ```bash
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8080
    ```

### 4. Job Paused Due to Spend Cap (`PAUSED`)
- **Symptom**: Job status shows `PAUSED: Spend cap reached ($X.XX / $2.00)`.
- **Fix**: SpecForge protects against runaway token costs. To increase the limit for complex projects, click **Adjust Spend Cap** in the banner or update `NEBIUS_SPEND_CAP_USD` (e.g. `5.00`) in the in-app Settings modal or `.env`.

---

## 🧪 Testing & Verification

SpecForge includes rigorous unit and integration tests across all layers (classification, spend tracking, BYOK settings, sandbox, and orchestrator):
```bash
python3 -m pytest -v backend/tests
```
**Test Coverage Highlights:**
- `test_failure_classifier.py`: Verifies diagnosis and classification of `ModuleNotFoundError` (local file vs 3rd-party dep), `SyntaxError`, `NameError`, and assertion errors, preventing requirements.txt thrashing.
- `test_spend_tracking.py`: Tests per-job Token Factory cost estimation and graceful pause when exceeding `NEBIUS_SPEND_CAP_USD`.
- `test_settings.py`: Verifies BYOK endpoint updates, credential masking, and in-memory client reloading.
- `test_llm_client.py`: Verifies JSON extraction from code fences, raw text, and the critical Nemotron `reasoning_content` fallback when `content` is empty.
- `test_sandbox.py`: Integration tests validating that real Python pytest test suites run isolated in the sandbox, that failure tracebacks are captured, and that execution timeouts protect against infinite loops.
- `test_orchestrator.py`: Full end-to-end pipeline test generating a complete project workspace on disk, running sandbox tests, and creating downloadable ZIP packages.
- `test_api.py`: Validates FastAPI routes, health endpoint, preset examples, job creation, and SSE event streaming.

---

## 🏆 Hackathon Evaluation Criteria Mapping

| Rubric Criteria (Weight) | SpecForge Implementation |
| :--- | :--- |
| **Technological Implementation (25%)** | Native OpenAI-compatible client targeting Nebius Token Factory / AI Cloud. Dual-tier Nemotron model orchestration (`nvidia/nemotron-mini-4b-instruct` and `nvidia/Llama-3.1-Nemotron-70B-Instruct`). Addresses all Nemotron gotchas: `reasoning_content` extraction, JSON-only prompting, and catalog string configuration. Includes full Docker container sandbox with isolated subprocess fallback and timeout enforcement. |
| **Design (25%)** | Complete, coherent product experience. Polished React 19 web application featuring live Server-Sent Events (SSE) agent timeline, real-time reasoning thoughts bubble, multi-file code browser with Prism syntax highlighting, interactive plan editor modal, test metrics dashboard with green verification badge, and one-click ZIP download. |
| **Potential Impact (25%)** | Directly solves developer frustration with broken, outdated LLM code for indie hackers, students, and hackathon competitors. Guarantees that code downloaded is grounded in real API documentation and verified by green test executions. |
| **Quality of the Idea (25%)** | "Verified, research-grounded generation" — every generated repository is grounded via Tavily web search for current library documentation and verified by green sandbox test runs with an autonomous Fixer feedback loop. |

---

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.
