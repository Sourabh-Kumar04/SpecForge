# CHANGELOG: Hackathon Development Period
## SpecForge — Nebius x NVIDIA AI Hackathon

This document chronicles the significant improvements, architectural upgrades, and bug fixes developed during the hackathon period in accordance with hackathon rules for pre-existing projects.

---

### Cycle 1 Upgrades & Judge Evaluation Hardening (Latest)

#### 1. Failure Classifier & "Fix the Fixer" Guardrails (Highest Priority)
- **Root Cause Solved**: Resolved the primary failure mode identified during adversarial judge evaluation where the autonomous Fixer loop repeatedly patched `requirements.txt` across all 5 iterations when confronted with internal project import bugs, missing standard libraries, or placeholder logic.
- **Traceback Classification Engine (`backend/services/failure_classifier.py`)**:
  - Implemented regex-based traceback parsing and AST/workspace local file scanning.
  - Automatically categorizes failures into:
    - `LOCAL_IMPORT_ERROR`: Identifies when a `ModuleNotFoundError` corresponds to a file that already exists in the local project workspace under an alternative path (e.g. `openjev.train` vs `openjev.training.train`). Instructs the Fixer to rewrite internal imports.
    - `MISSING_DEPENDENCY`: Verifies when a package is truly absent from the workspace. Only in this case is `requirements.txt` permitted to be modified.
    - `CODE_ERROR`: Directly routes `SyntaxError`, `NameError`, and `AttributeError` to code-level repair, strictly forbidding `requirements.txt` churn.
    - `LOGIC_ERROR`: Routes assertion errors directly to algorithm and test logic repair.
- **Fixer Guardrails (`backend/services/orchestrator.py`)**:
  - Discards unauthorized modifications to `requirements.txt` when failure classification is not `MISSING_DEPENDENCY`.
  - Emits real-time SSE diagnostic events displaying the exact diagnosis and remediation strategy.
- **Regression Test Suite (`backend/tests/test_failure_classifier.py`)**:
  - Added 7 deterministic tests asserting correct classification and file protection across simulated tracebacks.

#### 2. Nebius Token Factory Spend Transparency & Budget Caps
- **Published Token Factory Pricing Engine (`backend/services/pricing.py`)**:
  - Encodes official Nebius Token Factory pricing rates per 1M prompt and completion tokens (Ultra 550b: $3.00/$6.00, Super 120b: $1.20/$2.40, 70b: $0.35/$0.70, Nano 30b: $0.15/$0.30, 4b Mini: $0.05/$0.10).
- **Per-Job Live Spend Tracking**:
  - Tracks token usage on every LLM call across all stages (Planning, Research, Coding, Fixing, Refinement).
  - Persisted in SQLite schema and surfaced via REST API (`JobDetail.spend`).
  - Added spend breakdown by pipeline stage in the test verification panel and job completion header.
- **Graceful Spend Cap & Budget Protection**:
  - Configurable budget limit via `NEBIUS_SPEND_CAP_USD` (default $2.00).
  - Emits high-priority alert and pauses execution (`status="paused"`) before calling LLMs if spend exceeds the cap, saving judges and users from accidental runaway billing.
- **Spend Regression Tests (`backend/tests/test_spend_tracking.py`)**:
  - Added automated tests verifying accurate cost calculation and cap enforcement.

#### 3. Bring Your Own Key (BYOK) & Settings Modal
- **Server-Side Configuration API (`backend/routes/settings.py`)**:
  - `GET /api/settings`: Returns masked API keys (`sk-nebi...xyz`, `tvly-...xyz`), current spend cap, and real vs. mock execution capabilities. Keys are never logged and never exposed in plaintext.
  - `POST /api/settings`: Persists keys and spend cap to the local `.env` file and immediately triggers dynamic in-memory client reloads without requiring server restarts.
- **Frontend Settings UI (`frontend/src/components/SettingsModal.tsx`)**:
  - Sleek modal with live status indicators, key inputs, interactive spend cap slider, and customizable model identifiers.
- **Settings Tests (`backend/tests/test_settings.py`)**:
  - Validates masking security, `.env` file update integrity, and endpoint validation.

#### 4. Documentation & Submission Readiness
- **Launch Command Fixes**: Replaced invalid `.venv` execution commands in `README.md` with standard `python3 -m backend.main` and verified Docker Compose workflows.
- **Troubleshooting Guide**: Documented fixes for Nebius model catalog updates (404 model IDs), optional Tavily key configuration with offline knowledge base fallback, port binding conflicts, and spend cap adjustments.

---

### Previous Hackathon Milestones

#### Live Preview, Natural-Language Refinement & Forge Identity
- Added in-browser live HTML/CSS/JS execution sandbox (`PreviewPanel.tsx`) with sandboxed iframe rendering and sample mock datasets.
- Implemented natural-language repository refinement (`POST /api/jobs/{id}/refine`) allowing iterative user prompts on generated code.
- Added test history carousel and multi-iteration comparison.
- Revamped branding with high-contrast amber/emerald developer aesthetic and dark mode glassmorphism.

#### Tavily Live Grounding & Dual-Tier Nemotron Strategy
- Integrated Tavily Search API with advanced search depth for documentation grounding.
- Designed fallback grounded knowledge base for offline judge evaluation without credentials.
- Externalized dual-tier model orchestration (`NEBIUS_MODEL_FAST` and `NEBIUS_MODEL_REASONING`) to target NVIDIA Nemotron models.
- Handled Nemotron `reasoning_content` fallback and strict JSON schema extraction without native function calling.
