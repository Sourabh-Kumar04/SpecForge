import asyncio
import difflib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
from backend.config import settings
from backend.models.schemas import (
    JobDetail,
    JobStatus,
    SpecInput,
    ProjectType,
    Plan,
    PlannedFile,
    ResearchDoc,
    GeneratedFile,
    TestResult,
    DiffChange,
    RefineResult,
    JobSpend,
)
from backend.services.llm_client import llm_client
from backend.services.tavily_researcher import tavily_researcher
from backend.services.sandbox import sandbox_runner
from backend.services.storage import storage_service
from backend.services.failure_classifier import classify_failure, FailureCategory
from backend.services.pricing import calculate_llm_cost

logger = logging.getLogger("specforge.orchestrator")

class SpendCapExceededError(Exception):
    """Raised when job token spend exceeds configured NEBIUS_SPEND_CAP_USD limit."""
    pass

SYSTEM_PLANNER_PROMPT = """You are the Lead Software Architect in SpecForge, powered by NVIDIA Nemotron reasoning models.
Your role: Given a project specification and target framework, decompose it into a clean, modern, testable architecture.
Keep internal reasoning concise (under 100 words). For small or minimal specs, design a focused architecture with 2 to 4 files maximum (e.g. core logic, entrypoint, test suite).
Always produce a JSON object with:
- "title": string
- "architecture_summary": string
- "tech_stack": list of strings with exact library versions
- "files": list of objects {"path": string, "purpose": string, "is_test": boolean}
- "test_strategy": string
- "research_queries": list of strings for Tavily search (targeted search queries for modern API docs)
"""

SYSTEM_CODER_PROMPT = """You are the Principal Engineer in SpecForge, powered by NVIDIA Nemotron.
Your role: Write production-ready, clean, well-typed code for the specified files, strictly following modern best practices and the architectural plan and research notes.
Keep internal reasoning concise (under 80 words) and output the full JSON object immediately.
CODE FORMATTING RULE: In Python code, use single quotes ''' for docstrings or # comments, NEVER use triple double-quotes \"\"\". This ensures valid JSON escaping.
Return a JSON object containing:
- "files": list of objects {"path": string, "content": string, "language": string}
"""

SYSTEM_TESTER_PROMPT = """You are the Senior QA Automation Engineer in SpecForge.
Your role: Generate comprehensive pytest test suites that rigorously test edge cases, error handling, and normal operation of the code written.
Keep internal reasoning concise (under 80 words) and output the full JSON object immediately.
CODE FORMATTING RULE: In Python code, use single quotes ''' for docstrings or # comments, NEVER use triple double-quotes \"\"\". This ensures valid JSON escaping.
Return a JSON object containing:
- "test_files": list of objects {"path": string, "content": string, "language": "python"}
"""

SYSTEM_FIXER_PROMPT = """You are the Autonomous Debugging Agent in SpecForge, using NVIDIA Nemotron reasoning.
Your role: Analyze test failure logs, tracebacks, and assertion mismatches, diagnose the root cause, and produce exact file corrections to achieve 100% test pass rate.
Keep internal reasoning concise (under 100 words) and output the full JSON object immediately.
CODE FORMATTING RULE: In Python code, use single quotes ''' for docstrings or # comments, NEVER use triple double-quotes \"\"\". This ensures valid JSON escaping.
Return a JSON object containing:
- "diagnosis": string explanation of root cause
- "changes": list of objects {"path": string, "explanation": string, "content": string}
"""

SYSTEM_REFINER_PROMPT = """You are the Principal Refactoring Engineer in SpecForge, powered by NVIDIA Nemotron.
Your role: Apply targeted, surgical modifications to an existing codebase to fulfill the user's natural-language refinement instruction.
Do not rebuild the codebase from scratch. Preserve existing patterns, contracts, and working logic while cleanly integrating the requested feature.
Keep internal reasoning concise (under 80 words) and output the full JSON object immediately.
CODE FORMATTING RULE: In Python code, use single quotes ''' for docstrings or # comments, NEVER use triple double-quotes \"\"\". This ensures valid JSON escaping.
Return a JSON object containing:
- "summary": string explanation of what was changed
- "changes": list of objects {"path": string, "explanation": string, "content": string}
"""

class AgenticOrchestrator:
    """Coordinates Planner -> Researcher -> Coder -> Tester -> Sandbox Fixer Loop."""

    def check_spend_cap_before_call(self, job_id: str):
        job = storage_service.get_job(job_id)
        if job and job.spend and job.spend.total_cost_usd >= job.spend.spend_cap_usd:
            job.spend.is_cap_exceeded = True
            storage_service.save_spend(job_id, job.spend)
            storage_service.update_job_status(job_id, JobStatus.PAUSED, error=f"Spend cap of ${job.spend.spend_cap_usd:.2f} reached.")
            raise SpendCapExceededError(f"Job {job_id} spend cap already reached: ${job.spend.total_cost_usd:.4f} >= ${job.spend.spend_cap_usd:.2f}")

    async def record_llm_spend(self, job_id: str, stage: str):
        usage = getattr(llm_client, "last_call_usage", {})
        if not usage:
            return
        p_tokens = usage.get("prompt_tokens", 0)
        c_tokens = usage.get("completion_tokens", 0)
        t_tokens = usage.get("total_tokens", 0)
        model_id = usage.get("model_id") or settings.nebius_model_reasoning
        call_cost = calculate_llm_cost(model_id, p_tokens, c_tokens)

        job = storage_service.get_job(job_id)
        if not job:
            return
        spend = job.spend or JobSpend(spend_cap_usd=settings.nebius_spend_cap_usd)
        spend.total_prompt_tokens += p_tokens
        spend.total_completion_tokens += c_tokens
        spend.total_tokens += t_tokens
        spend.total_cost_usd = round(spend.total_cost_usd + call_cost, 6)
        spend.spend_cap_usd = settings.nebius_spend_cap_usd

        stage_key = stage.lower()
        if stage_key not in spend.by_stage:
            spend.by_stage[stage_key] = 0.0
        spend.by_stage[stage_key] = round(spend.by_stage[stage_key] + call_cost, 6)

        if stage_key not in spend.tokens_by_stage:
            spend.tokens_by_stage[stage_key] = {"prompt": 0, "completion": 0, "total": 0}
        spend.tokens_by_stage[stage_key]["prompt"] += p_tokens
        spend.tokens_by_stage[stage_key]["completion"] += c_tokens
        spend.tokens_by_stage[stage_key]["total"] += t_tokens

        # Check spend cap threshold
        if spend.total_cost_usd >= spend.spend_cap_usd:
            spend.is_cap_exceeded = True
            storage_service.save_spend(job_id, spend)
            storage_service.update_job_status(job_id, JobStatus.PAUSED, error=f"Spend cap of ${spend.spend_cap_usd:.2f} reached.")
            await storage_service.emit_event(
                job_id, "pipeline", "status",
                f"Pipeline paused: spend cap exceeded (${spend.total_cost_usd:.4f} >= ${spend.spend_cap_usd:.2f}). Pausing further generation to prevent runaway costs.",
                {"spend": spend.model_dump(), "paused": True}
            )
            raise SpendCapExceededError(f"Job {job_id} spend cap exceeded: ${spend.total_cost_usd:.4f} >= ${spend.spend_cap_usd:.2f}")

        storage_service.save_spend(job_id, spend)
        await storage_service.emit_event(
            job_id, stage, "log",
            f"Nebius usage: {t_tokens} tokens (${call_cost:.5f}). Running spend: ${spend.total_cost_usd:.4f} / ${spend.spend_cap_usd:.2f}",
            {
                "call_cost_usd": call_cost,
                "running_spend_usd": spend.total_cost_usd,
                "spend_cap_usd": spend.spend_cap_usd,
                "stage_cost_usd": spend.by_stage[stage_key],
                "model": model_id,
            }
        )

    async def start_job(self, job_id: str, spec: SpecInput):
        """Entry point for executing a SpecForge job asynchronously."""
        try:
            # 1. PLANNING STAGE
            plan = await self._run_planner(job_id, spec)
            if spec.require_plan_approval:
                storage_service.update_job_status(job_id, JobStatus.AWAITING_PLAN_APPROVAL)
                await storage_service.emit_event(
                    job_id, "planner", "status", "Plan generated. Awaiting user review/approval to proceed."
                )
                return

            await self.resume_job_after_plan(job_id, plan)

        except SpendCapExceededError as sce:
            logger.warning(f"Job {job_id} paused due to spend cap: {sce}")
            storage_service.update_job_status(job_id, JobStatus.PAUSED, error=str(sce))
            return
        except Exception as e:
            logger.exception(f"Job {job_id} encountered fatal error: {e}")
            storage_service.update_job_status(job_id, JobStatus.FAILED, error=str(e))
            await storage_service.emit_event(
                job_id, "pipeline", "error", f"Pipeline failed: {str(e)}"
            )

    async def resume_job_after_plan(self, job_id: str, plan: Plan):
        """Continues execution after plan is created/approved."""
        try:
            job = storage_service.get_job(job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")

            spec = job.spec
            storage_service.save_plan(job_id, plan)

            # 2. RESEARCHER STAGE (Tavily doc grounding)
            research_docs: List[ResearchDoc] = []
            if spec.enable_research:
                queries = plan.research_queries if plan.research_queries else [f"{spec.project_type.value} modern best practices 2026"]
                storage_service.update_job_status(job_id, JobStatus.RESEARCHING)
                await storage_service.emit_event(
                    job_id, "researcher", "action", f"Researching latest API docs via Tavily AI Search for {len(queries)} queries...",
                    {"queries": queries}
                )
                research_docs = await tavily_researcher.search_documentation(queries)
                storage_service.save_research(job_id, research_docs)
                for doc in research_docs:
                    await storage_service.emit_event(
                        job_id, "researcher", "log", f"Grounded research: {doc.title}",
                        {"url": doc.url, "summary": doc.summary[:200], "key_apis": doc.key_apis}
                    )
            else:
                await storage_service.emit_event(
                    job_id, "researcher", "log", "Tavily research grounding toggled OFF by user. Proceeding directly to code synthesis."
                )

            # 3. CODER STAGE
            storage_service.update_job_status(job_id, JobStatus.CODING)
            await storage_service.emit_event(
                job_id, "coder", "action", "Synthesizing project files using NVIDIA Nemotron..."
            )
            files = await self._run_coder(job_id, spec, plan, research_docs)
            for f in files:
                storage_service.save_file(job_id, f)
                await storage_service.emit_event(
                    job_id, "coder", "file_written", f"Generated: {f.path} ({len(f.content.splitlines())} lines)"
                )

            # 4. TEST GENERATION STAGE
            storage_service.update_job_status(job_id, JobStatus.TESTING)
            await storage_service.emit_event(
                job_id, "tester", "action", "Generating comprehensive unit & integration test suites..."
            )
            test_files = await self._run_tester(job_id, spec, plan, files)
            for tf in test_files:
                storage_service.save_file(job_id, tf)
                await storage_service.emit_event(
                    job_id, "tester", "file_written", f"Generated test suite: {tf.path}"
                )

            # 5. SANDBOX & FIXER LOOP (up to max_fix_iterations)
            ws = storage_service.get_job_workspace(job_id)
            max_iters = spec.max_fix_iterations or settings.max_fix_iterations
            current_iter = 1
            all_passed = False

            while current_iter <= max_iters:
                storage_service.update_job_status(job_id, JobStatus.TESTING if current_iter == 1 else JobStatus.FIXING)
                await storage_service.emit_event(
                    job_id, "sandbox", "action", f"Running sandbox test verification (Iteration {current_iter}/{max_iters})..."
                )

                test_result = await sandbox_runner.run_tests(ws, spec.project_type, iteration=current_iter)
                storage_service.save_test_result(job_id, test_result)

                if test_result.passed:
                    all_passed = True
                    await storage_service.emit_event(
                        job_id, "sandbox", "test_run",
                        f"All tests passed successfully ({test_result.passed_tests}/{test_result.total_tests} passed in {test_result.duration_seconds}s)!",
                        {"iteration": current_iter, "passed": True, "output": test_result.output}
                    )
                    break
                else:
                    await storage_service.emit_event(
                        job_id, "fixer", "test_run",
                        f"Sandbox tests failed ({test_result.failed_tests} failed). Triggering Nemotron Fixer reasoning loop...",
                        {"iteration": current_iter, "passed": False, "output": test_result.output[:600]}
                    )

                    if current_iter >= max_iters:
                        await storage_service.emit_event(
                            job_id, "fixer", "error", f"Reached maximum fixer iterations ({max_iters}). Stopping loop."
                        )
                        break

                    # Run Fixer Agent
                    storage_service.update_job_status(job_id, JobStatus.FIXING)
                    await self._run_fixer(job_id, spec, plan, test_result.output, current_iter)
                    current_iter += 1

            # 6. AUTO-README & PACKAGING
            readme_file = self._generate_readme(job_id, spec, plan, all_passed, current_iter)
            storage_service.save_file(job_id, readme_file)
            storage_service.create_zip_export(job_id)

            final_status = JobStatus.COMPLETED if all_passed else JobStatus.FAILED
            storage_service.update_job_status(job_id, final_status)
            await storage_service.emit_event(
                job_id, "pipeline", "status",
                f"SpecForge repository generation completed with status: {final_status.value}. ZIP bundle ready.",
                {"all_passed": all_passed, "iterations": current_iter}
            )

        except SpendCapExceededError as sce:
            logger.warning(f"Job {job_id} paused due to spend cap: {sce}")
            storage_service.update_job_status(job_id, JobStatus.PAUSED, error=str(sce))
            return
        except Exception as e:
            logger.exception(f"Job {job_id} encountered error during execution: {e}")
            storage_service.update_job_status(job_id, JobStatus.FAILED, error=str(e))
            await storage_service.emit_event(
                job_id, "pipeline", "error", f"Pipeline failed: {str(e)}"
            )

    async def _run_planner(self, job_id: str, spec: SpecInput) -> Plan:
        storage_service.update_job_status(job_id, JobStatus.PLANNING)
        await storage_service.emit_event(
            job_id, "planner", "thought",
            "Synthesizing specifications using NVIDIA Nemotron 3 Reasoning Tier..."
        )

        user_prompt = f"App Specification: {spec.prompt}\nProject Target Architecture: {spec.project_type.value}"

        if settings.effective_mock_llm:
            # Deterministic, high quality plan based on spec
            plan = self._generate_mock_plan(spec)
        else:
            self.check_spend_cap_before_call(job_id)
            data, reasoning = llm_client.complete_json(
                system_prompt=SYSTEM_PLANNER_PROMPT,
                user_prompt=user_prompt,
                tier="reasoning",
            )
            if reasoning:
                await storage_service.emit_event(
                    job_id, "planner", "thought", f"Nemotron Reasoning: {reasoning[:300]}..."
                )
            plan = Plan.model_validate(data)

        await self.record_llm_spend(job_id, "planning")
        storage_service.save_plan(job_id, plan)
        await storage_service.emit_event(
            job_id, "planner", "action", f"Architecture plan created: {plan.title} ({len(plan.files)} files planned)"
        )
        return plan

    async def _run_coder(
        self,
        job_id: str,
        spec: SpecInput,
        plan: Plan,
        research_docs: List[ResearchDoc]
    ) -> List[GeneratedFile]:
        if settings.effective_mock_llm:
            files = self._generate_mock_code(spec, plan)
        else:
            self.check_spend_cap_before_call(job_id)
            research_text = "\n\n".join(
                [f"Doc: {d.title}\nSummary: {d.summary}\nKey APIs: {', '.join(d.key_apis)}" for d in research_docs]
            )
            non_test_files = [f.path for f in plan.files if not f.is_test]
            user_prompt = (
                f"Generate implementation for files: {', '.join(non_test_files)}\n"
                f"Architecture: {plan.architecture_summary}\n"
                f"Tech stack: {', '.join(plan.tech_stack)}\n"
                f"Research Notes:\n{research_text}"
            )

            data, reasoning = llm_client.complete_json(
                system_prompt=SYSTEM_CODER_PROMPT,
                user_prompt=user_prompt,
                tier="fast"
            )
            files = []
            for f in (data.get("files", []) if isinstance(data, dict) else []):
                if isinstance(f, dict) and "path" in f:
                    content = f.get("content") or f.get("code") or f.get("source") or ""
                    files.append(GeneratedFile(
                        path=f["path"],
                        content=content,
                        language=f.get("language", "python")
                    ))

        await self.record_llm_spend(job_id, "coding")
        return files

    async def _run_tester(
        self,
        job_id: str,
        spec: SpecInput,
        plan: Plan,
        code_files: List[GeneratedFile]
    ) -> List[GeneratedFile]:
        if settings.effective_mock_llm:
            tests = self._generate_mock_tests(spec, plan)
        else:
            self.check_spend_cap_before_call(job_id)
            code_summary = "\n\n".join([f"File: {f.path}\n```{f.language}\n{f.content}\n```" for f in code_files])
            user_prompt = (
                f"Target Test Strategy: {plan.test_strategy}\n"
                f"Codebase:\n{code_summary}\n"
                "Generate complete test suites targeting pytest."
            )

            data, _ = llm_client.complete_json(
                system_prompt=SYSTEM_TESTER_PROMPT,
                user_prompt=user_prompt,
                tier="fast"
            )
            tests = []
            for tf in (data.get("test_files", []) if isinstance(data, dict) else []):
                if isinstance(tf, dict) and "path" in tf:
                    content = tf.get("content") or tf.get("code") or tf.get("source") or ""
                    tests.append(GeneratedFile(
                        path=tf["path"],
                        content=content,
                        language="python"
                    ))

        await self.record_llm_spend(job_id, "testing")
        return tests

    async def _run_fixer(
        self,
        job_id: str,
        spec: SpecInput,
        plan: Plan,
        error_output: str,
        iteration: int
    ):
        await storage_service.emit_event(
            job_id, "fixer", "thought",
            f"Analyzing failure traceback using Nemotron Reasoning Tier (Iteration {iteration})..."
        )

        # 1. Failure classification before fixing
        job = storage_service.get_job(job_id)
        current_files = job.files if job else []
        ws_file_paths = [f.path for f in current_files]
        diagnosis = classify_failure(error_output, ws_file_paths)

        # 2. Log classification in job events
        await storage_service.emit_event(
            job_id, "fixer", "classification",
            f"Failure classified as [{diagnosis.category.value.upper()}]: {diagnosis.summary} Strategy: {diagnosis.strategy}",
            diagnosis.model_dump()
        )

        if settings.effective_mock_llm:
            await self.record_llm_spend(job_id, "fixing")
            fixed_files = self._get_mock_fix(spec)
            for f in fixed_files:
                if f.path == "requirements.txt" and not diagnosis.allow_requirements_edit:
                    continue
                storage_service.save_file(job_id, f)
                await storage_service.emit_event(
                    job_id, "fixer", "action", f"Patched file: {f.path} ({diagnosis.summary})"
                )
            return

        self.check_spend_cap_before_call(job_id)
        user_prompt = (
            f"Failed Test Output:\n{error_output}\n\n"
            f"{diagnosis.guidance_prompt}\n\n"
            f"Plan:\n{plan.model_dump_json()}"
        )
        data, reasoning = llm_client.complete_json(
            system_prompt=SYSTEM_FIXER_PROMPT,
            user_prompt=user_prompt,
            tier="reasoning"
        )
        await self.record_llm_spend(job_id, "fixing")

        for ch in (data.get("changes", []) if isinstance(data, dict) else []):
            if isinstance(ch, dict) and "path" in ch:
                path = ch["path"]
                if path == "requirements.txt" and not diagnosis.allow_requirements_edit:
                    await storage_service.emit_event(
                        job_id, "fixer", "log",
                        f"Blocked invalid modification to requirements.txt (failure is {diagnosis.category.value}, not an external dependency)."
                    )
                    continue
                content = ch.get("content") or ch.get("code") or ch.get("source") or ""
                storage_service.save_file(job_id, GeneratedFile(path=path, content=content, language="python"))
                await storage_service.emit_event(
                    job_id, "fixer", "action", f"Patched {path}: {ch.get('explanation', 'applied fixes')}"
                )

    def _generate_readme(
        self,
        job_id: str,
        spec: SpecInput,
        plan: Plan,
        passed: bool,
        iterations: int
    ) -> GeneratedFile:
        badge = "![Verification](https://img.shields.io/badge/SpecForge-VERIFIED_GREEN-brightgreen)" if passed else "![Verification](https://img.shields.io/badge/SpecForge-TESTS_FAILING-red)"
        readme_content = f"""# {plan.title}

{badge}
![Powered by Nebius](https://img.shields.io/badge/Nebius_Token_Factory-NVIDIA_Nemotron-76B900)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)

Generated and verified autonomously by **SpecForge** — The research-grounded, test-verified software generation engine for the Nebius x NVIDIA Global AI Hackathon.

## 🚀 Specification
> "{spec.prompt}"

- **Target Architecture**: `{spec.project_type.value}`
- **Verification Status**: `{'PASSED (100% green)' if passed else 'FAILED'}`
- **Fixer Iterations Run**: `{iterations}`
- **NVIDIA Models Used**:
  - `Fast Tier`: `{settings.nebius_model_fast}`
  - `Reasoning Tier`: `{settings.nebius_model_reasoning}` via Nebius Token Factory

## 📐 Architecture
{plan.architecture_summary}

### Tech Stack
{chr(10).join([f'- {t}' for t in plan.tech_stack])}

## 🧪 Testing & Verification
{plan.test_strategy}

### How to Run Tests
```bash
# Setup environment
python -m venv .venv
source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt

# Run test suite
pytest -v
```

## 📂 Project Structure
```
{chr(10).join([f'├── {f.path} - {f.purpose}' for f in plan.files])}
```

## 💰 Nebius Token Factory Spend Summary
- **Estimated Total Spend**: `${(storage_service.get_job(job_id).spend.total_cost_usd if storage_service.get_job(job_id) and storage_service.get_job(job_id).spend else 0.0):.4f} USD`
- **Configured Spend Cap**: `${settings.nebius_spend_cap_usd:.2f} USD`
- **Total Tokens Used**: `{storage_service.get_job(job_id).spend.total_tokens if storage_service.get_job(job_id) and storage_service.get_job(job_id).spend else 0}`
*(Estimates calculated via published Nebius Token Factory rates)*

---
*Created with SpecForge • Verified with NVIDIA Nemotron & Nebius AI Cloud*
"""
        return GeneratedFile(path="README.md", content=readme_content, language="markdown")

    # MOCK GENERATORS FOR OFFLINE / ZERO-CREDENTIAL DEMO
    def _generate_mock_plan(self, spec: SpecInput) -> Plan:
        if spec.project_type == ProjectType.PYTHON_CLI:
            return Plan(
                title="Verified Python CLI Tool",
                architecture_summary="Modular Click CLI application with Rich terminal formatting, typed services, and deterministic pytest validation.",
                tech_stack=["Python 3.12", "Click 8.1+", "Rich 13.7+", "Pytest 8.0+"],
                files=[
                    PlannedFile(path="cli/core.py", purpose="Core math and string transformation utilities"),
                    PlannedFile(path="cli/main.py", purpose="Click CLI interface and command declarations"),
                    PlannedFile(path="tests/test_core.py", purpose="Unit tests with edge-case validation", is_test=True),
                    PlannedFile(path="requirements.txt", purpose="Project dependencies"),
                ],
                test_strategy="Pytest covering normal execution, negative values, and zero edge cases.",
                research_queries=["Click 8.1 CLI context commands", "Rich terminal table and panel display", "Pytest unit testing best practices"]
            )
        elif spec.project_type == ProjectType.REACT_COMPONENT:
            return Plan(
                title="Verified React Component Suite",
                architecture_summary="Modern React 19 functional component with TypeScript, modular state hooks, accessible DOM attributes, and unit tests.",
                tech_stack=["React 19", "TypeScript", "Tailwind CSS", "Pytest verification"],
                files=[
                    PlannedFile(path="src/Component.tsx", purpose="Main interactive React UI component"),
                    PlannedFile(path="src/types.ts", purpose="TypeScript type definitions and props"),
                    PlannedFile(path="tests/test_component_structure.py", purpose="Static AST and contract verification test", is_test=True),
                    PlannedFile(path="package.json", purpose="Package configuration and scripts"),
                ],
                test_strategy="AST and structural contract verification validating exports and types.",
                research_queries=["React 19 hooks and typed props", "Tailwind styling patterns"]
            )
        else: # FASTAPI_SERVICE
            return Plan(
                title="Verified FastAPI Microservice",
                architecture_summary="Clean-architecture REST microservice utilizing FastAPI 0.110+, Pydantic v2 schemas, in-memory domain repository, and full pytest ASGI coverage.",
                tech_stack=["Python 3.12", "FastAPI 0.110+", "Pydantic v2", "Pytest 8.0+", "Uvicorn"],
                files=[
                    PlannedFile(path="app/models.py", purpose="Pydantic v2 domain schemas and request models"),
                    PlannedFile(path="app/service.py", purpose="Business logic and stateful repository"),
                    PlannedFile(path="app/main.py", purpose="FastAPI app factory and HTTP routing"),
                    PlannedFile(path="tests/test_service.py", purpose="Unit tests for domain logic", is_test=True),
                    PlannedFile(path="tests/test_api.py", purpose="Integration tests with Starlette TestClient", is_test=True),
                    PlannedFile(path="requirements.txt", purpose="Project dependencies"),
                ],
                test_strategy="100% test coverage using FastAPI TestClient and pytest fixtures.",
                research_queries=["FastAPI 0.110 lifespan router patterns", "Pydantic v2 model_validate serialization", "Pytest TestClient ASGI integration"]
            )

    def _generate_mock_code(self, spec: SpecInput, plan: Plan) -> List[GeneratedFile]:
        if spec.project_type == ProjectType.PYTHON_CLI:
            return [
                GeneratedFile(
                    path="requirements.txt",
                    content="click>=8.1.0\nrich>=13.7.0\npytest>=8.0.0\n",
                    language="text"
                ),
                GeneratedFile(
                    path="cli/__init__.py",
                    content='"""CLI package initialization."""\n',
                    language="python"
                ),
                GeneratedFile(
                    path="cli/core.py",
                    content='''"""Core business logic for CLI application."""
from typing import List, Dict, Any

class DataProcessor:
    @staticmethod
    def process_numbers(numbers: List[float]) -> Dict[str, Any]:
        """Calculates statistical summary for numbers list."""
        if not numbers:
            return {"count": 0, "sum": 0.0, "mean": 0.0, "max": 0.0, "min": 0.0}
        total = sum(numbers)
        return {
            "count": len(numbers),
            "sum": total,
            "mean": total / len(numbers),
            "max": max(numbers),
            "min": min(numbers)
        }

    @staticmethod
    def format_greeting(name: str, shout: bool = False) -> str:
        clean = name.strip() or "World"
        msg = f"Hello, {clean}!"
        return msg.upper() if shout else msg
''',
                    language="python"
                ),
                GeneratedFile(
                    path="cli/main.py",
                    content='''"""SpecForge Generated CLI Entrypoint."""
import sys
from typing import List
from cli.core import DataProcessor

def run_cli(args: List[str] = None) -> int:
    args = args or sys.argv[1:]
    if not args or args[0] in ["--help", "-h"]:
        print("SpecForge CLI Tool - Usage: cli <numbers...>")
        return 0
    try:
        nums = [float(x) for x in args]
        stats = DataProcessor.process_numbers(nums)
        print(f"Count: {stats['count']}, Sum: {stats['sum']}, Mean: {stats['mean']}")
        return 0
    except ValueError as e:
        print(f"Error parsing numbers: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(run_cli())
''',
                    language="python"
                )
            ]
        elif spec.project_type == ProjectType.REACT_COMPONENT:
            return [
                GeneratedFile(
                    path="package.json",
                    content='''{
  "name": "specforge-verified-component",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}''',
                    language="json"
                ),
                GeneratedFile(
                    path="src/types.ts",
                    content='''export interface ItemRecord {
  id: string;
  title: string;
  completed: boolean;
  timestamp: string;
}

export interface ComponentProps {
  initialItems?: ItemRecord[];
  title?: string;
  onItemToggle?: (id: string) => void;
}
''',
                    language="typescript"
                ),
                GeneratedFile(
                    path="src/Component.tsx",
                    content='''import React, { useState } from 'react';
import { ItemRecord, ComponentProps } from './types';

export const SpecForgeComponent: React.FC<ComponentProps> = ({
  initialItems = [],
  title = "SpecForge Task Manager",
  onItemToggle
}) => {
  const [items, setItems] = useState<ItemRecord[]>(initialItems);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: ItemRecord = {
      id: "item-" + Date.now(),
      title: newTitle.trim(),
      completed: false,
      timestamp: new Date().toISOString()
    };
    setItems(prev => [...prev, item]);
    setNewTitle("");
  };

  const handleToggle = (id: string) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
    if (onItemToggle) onItemToggle(id);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-md border border-slate-700">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 text-sm focus:outline-none"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggle(item.id)}
              className="rounded"
            />
            <span className={item.completed ? "line-through text-slate-400" : ""}>{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
''',
                    language="typescript"
                )
            ]
        else: # FASTAPI_SERVICE
            return [
                GeneratedFile(
                    path="requirements.txt",
                    content="fastapi>=0.110.0\npydantic>=2.6.0\npytest>=8.0.0\nhttpx>=0.27.0\n",
                    language="text"
                ),
                GeneratedFile(
                    path="app/__init__.py",
                    content='"""FastAPI app package."""\n',
                    language="python"
                ),
                GeneratedFile(
                    path="app/models.py",
                    content='''"""Domain schemas for FastAPI service."""
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    priority: int = Field(default=1, ge=1, le=5)

class ItemResponse(BaseModel):
    id: str
    title: str
    description: str
    priority: int
    created_at: str
''',
                    language="python"
                ),
                GeneratedFile(
                    path="app/service.py",
                    content='''"""In-memory domain repository and business logic."""
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.models import ItemCreate, ItemResponse

class ItemRepository:
    def __init__(self):
        self._store: Dict[str, ItemResponse] = {}

    def create(self, data: ItemCreate) -> ItemResponse:
        item_id = str(uuid.uuid4())
        record = ItemResponse(
            id=item_id,
            title=data.title,
            description=data.description or "",
            priority=data.priority,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        self._store[item_id] = record
        return record

    def get(self, item_id: str) -> Optional[ItemResponse]:
        return self._store.get(item_id)

    def list_all(self) -> List[ItemResponse]:
        return list(self._store.values())

    def delete(self, item_id: str) -> bool:
        if item_id in self._store:
            del self._store[item_id]
            return True
        return False

repo = ItemRepository()
''',
                    language="python"
                ),
                GeneratedFile(
                    path="app/main.py",
                    content='''"""FastAPI application factory and endpoints."""
from typing import List
from fastapi import FastAPI, HTTPException, status
from app.models import ItemCreate, ItemResponse
from app.service import repo

app = FastAPI(title="SpecForge Verified API", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "specforge-verified"}

@app.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate):
    return repo.create(payload)

@app.get("/items", response_model=List[ItemResponse])
def get_items():
    return repo.list_all()

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: str):
    item = repo.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str):
    deleted = repo.delete(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return None
''',
                    language="python"
                )
            ]

    def _generate_mock_tests(self, spec: SpecInput, plan: Plan) -> List[GeneratedFile]:
        if spec.project_type == ProjectType.PYTHON_CLI:
            return [
                GeneratedFile(
                    path="tests/test_core.py",
                    content='''"""Unit test suite for CLI data processor."""
import pytest
from cli.core import DataProcessor

def test_data_processor_empty():
    stats = DataProcessor.process_numbers([])
    assert stats["count"] == 0
    assert stats["sum"] == 0.0

def test_data_processor_numbers():
    stats = DataProcessor.process_numbers([10.0, 20.0, 30.0])
    assert stats["count"] == 3
    assert stats["sum"] == 60.0
    assert stats["mean"] == 20.0
    assert stats["max"] == 30.0
    assert stats["min"] == 10.0

def test_greeting_format():
    assert DataProcessor.format_greeting("Alice") == "Hello, Alice!"
    assert DataProcessor.format_greeting("Bob", shout=True) == "HELLO, BOB!"
    assert DataProcessor.format_greeting("") == "Hello, World!"
''',
                    language="python"
                )
            ]
        elif spec.project_type == ProjectType.REACT_COMPONENT:
            return [
                GeneratedFile(
                    path="tests/test_component_structure.py",
                    content='''"""Static analysis test verifying React Component structure and contracts."""
from pathlib import Path

def test_component_files_exist():
    src_dir = Path("src")
    assert (src_dir / "Component.tsx").exists()
    assert (src_dir / "types.ts").exists()

def test_types_contract():
    content = Path("src/types.ts").read_text(encoding="utf-8")
    assert "ItemRecord" in content
    assert "ComponentProps" in content

def test_component_exports():
    content = Path("src/Component.tsx").read_text(encoding="utf-8")
    assert "export const SpecForgeComponent" in content
    assert "useState" in content
''',
                    language="python"
                )
            ]
        else: # FASTAPI_SERVICE
            return [
                GeneratedFile(
                    path="tests/test_service.py",
                    content='''"""Unit tests for ItemRepository."""
from app.models import ItemCreate
from app.service import ItemRepository

def test_repository_lifecycle():
    repo = ItemRepository()
    item = repo.create(ItemCreate(title="Test Task", priority=3))
    assert item.id is not None
    assert item.title == "Test Task"
    assert repo.get(item.id) == item
    assert len(repo.list_all()) == 1
    assert repo.delete(item.id) is True
    assert repo.get(item.id) is None
''',
                    language="python"
                ),
                GeneratedFile(
                    path="tests/test_api.py",
                    content='''"""Integration tests for FastAPI endpoints."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_get_item():
    payload = {"title": "Hackathon Demo", "description": "Verify green test", "priority": 5}
    create_resp = client.post("/items", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "Hackathon Demo"
    item_id = created["id"]

    get_resp = client.get(f"/items/{item_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == item_id

def test_get_nonexistent_item():
    resp = client.get("/items/nonexistent-id-999")
    assert resp.status_code == 404
''',
                    language="python"
                )
            ]

    def _get_mock_fix(self, spec: SpecInput) -> List[GeneratedFile]:
        """Provides corrected file if fixer loop was activated."""
        if spec.project_type == ProjectType.PYTHON_CLI:
            return [
                GeneratedFile(
                    path="cli/core.py",
                    content='''"""Core business logic for CLI application (fixed)."""
from typing import List, Dict, Any

class DataProcessor:
    @staticmethod
    def process_numbers(numbers: List[float]) -> Dict[str, Any]:
        if not numbers:
            return {"count": 0, "sum": 0.0, "mean": 0.0, "max": 0.0, "min": 0.0}
        total = sum(numbers)
        return {
            "count": len(numbers),
            "sum": total,
            "mean": total / len(numbers),
            "max": max(numbers),
            "min": min(numbers)
        }

    @staticmethod
    def format_greeting(name: str, shout: bool = False) -> str:
        clean = name.strip() or "World"
        msg = f"Hello, {clean}!"
        return msg.upper() if shout else msg
''',
                    language="python"
                )
            ]
        return []

    async def refine_job(self, job_id: str, instruction: str) -> RefineResult:
        """Applies a targeted, iterative natural-language refinement to an existing repository."""
        job = storage_service.get_job(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        refine_id = f"ref_{int(datetime.now().timestamp()*1000)}"
        now = datetime.now(timezone.utc).isoformat()

        await storage_service.emit_event(
            job_id, "refiner", "action", f"Initiating targeted refinement: '{instruction}'"
        )

        ws = storage_service.get_job_workspace(job_id)
        current_files = {f.path: f.content for f in job.files}

        summary = ""
        modified_files: List[Dict[str, str]] = []

        if settings.effective_mock_llm:
            summary, modified_files = self._generate_mock_refinement(job.spec, instruction, current_files)
        else:
            self.check_spend_cap_before_call(job_id)
            files_context = "\n\n".join([f"--- {p} ---\n{c}" for p, c in current_files.items()])
            user_prompt = (
                f"Target Refinement Instruction: {instruction}\n"
                f"Project Type: {job.spec.project_type.value}\n\n"
                f"Current Repository Files:\n{files_context}"
            )
            data, reasoning = llm_client.complete_json(
                system_prompt=SYSTEM_REFINER_PROMPT,
                user_prompt=user_prompt,
                tier="reasoning",
            )
            if reasoning:
                await storage_service.emit_event(
                    job_id, "refiner", "thought", f"Nemotron Reasoning: {reasoning[:200]}..."
                )
            summary = data.get("summary", f"Applied refinement: {instruction}") if isinstance(data, dict) else f"Applied refinement: {instruction}"
            for ch in (data.get("changes", []) if isinstance(data, dict) else []):
                if isinstance(ch, dict) and "path" in ch:
                    modified_files.append({
                        "path": ch["path"],
                        "content": ch.get("content") or ch.get("code") or "",
                        "explanation": ch.get("explanation", "Updated file"),
                    })

        await self.record_llm_spend(job_id, "coding")

        diff_changes: List[DiffChange] = []
        for mf in modified_files:
            path = mf["path"]
            new_content = mf["content"]
            old_content = current_files.get(path, "")

            # Compute unified diff
            diff_lines = list(difflib.unified_diff(
                old_content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"a/{path}",
                tofile=f"b/{path}",
            ))
            diff_text = "".join(diff_lines) if diff_lines else f"# Modified {path}"

            diff_changes.append(DiffChange(
                path=path,
                diff=diff_text,
                explanation=mf.get("explanation")
            ))

            # Determine language
            lang = "python"
            if path.endswith((".ts", ".tsx")):
                lang = "typescript"
            elif path.endswith(".js"):
                lang = "javascript"
            elif path.endswith(".json"):
                lang = "json"
            elif path.endswith(".md"):
                lang = "markdown"

            storage_service.save_file(job_id, GeneratedFile(
                path=path,
                content=new_content,
                language=lang
            ))
            await storage_service.emit_event(
                job_id, "refiner", "file_written", f"Refined {path}: {mf.get('explanation', 'applied update')}"
            )

        # Run sandbox tests
        iter_num = len(job.test_history) + 1
        await storage_service.emit_event(
            job_id, "refiner", "action", f"Running sandbox verification suite for refinement (Iteration {iter_num})..."
        )
        test_result = await sandbox_runner.run_tests(ws, job.spec.project_type, iteration=iter_num)
        storage_service.save_test_result(job_id, test_result)

        if not test_result.passed:
            await storage_service.emit_event(
                job_id, "refiner", "test_run", f"Tests failed after refinement ({test_result.failed_tests} failed). Triggering fixer loop..."
            )
            await self._run_fixer(job_id, job.spec, job.plan, test_result.output, iter_num)
            test_result = await sandbox_runner.run_tests(ws, job.spec.project_type, iteration=iter_num + 1)
            storage_service.save_test_result(job_id, test_result)
        else:
            await storage_service.emit_event(
                job_id, "refiner", "test_run", f"All tests passed ({test_result.passed_tests}/{test_result.total_tests} green)!"
            )

        # Repackage zip export
        storage_service.create_zip_export(job_id)

        refine_result = RefineResult(
            id=refine_id,
            instruction=instruction,
            timestamp=now,
            summary=summary,
            changes=diff_changes,
            test_result=test_result,
        )
        storage_service.save_refinement(job_id, refine_result)

        status_msg = f"Refinement completed: {summary} ({test_result.passed_tests}/{test_result.total_tests} passed)."
        storage_service.update_job_status(job_id, JobStatus.COMPLETED if test_result.passed else JobStatus.FAILED)
        await storage_service.emit_event(
            job_id, "pipeline", "status", status_msg, {"passed": test_result.passed, "changes_count": len(diff_changes)}
        )

        return refine_result

    def _generate_mock_refinement(
        self, spec: SpecInput, instruction: str, current_files: Dict[str, str]
    ) -> tuple[str, List[Dict[str, str]]]:
        """Provides deterministic, test-passing refinements for offline/mock demo."""
        modified: List[Dict[str, str]] = []
        is_retry = "retry" in instruction.lower()

        if spec.project_type == ProjectType.PYTHON_CLI:
            summary = "Added exponential retry mechanism and enhanced error tolerance to CLI core." if is_retry else f"Integrated '{instruction}' into CLI core logic."
            core_code = '''"""Core business logic for CLI application with retry logic."""
from typing import List, Dict, Any, Callable
import time

class DataProcessor:
    @staticmethod
    def process_numbers(numbers: List[float]) -> Dict[str, Any]:
        """Calculates statistical summary for numbers list."""
        if not numbers:
            return {"count": 0, "sum": 0.0, "mean": 0.0, "max": 0.0, "min": 0.0}
        total = sum(numbers)
        return {
            "count": len(numbers),
            "sum": total,
            "mean": total / len(numbers),
            "max": max(numbers),
            "min": min(numbers)
        }

    @staticmethod
    def format_greeting(name: str, shout: bool = False) -> str:
        clean = name.strip() or "World"
        msg = f"Hello, {clean}!"
        return msg.upper() if shout else msg

    @staticmethod
    def execute_with_retry(fn: Callable[[], Any], max_attempts: int = 3, delay: float = 0.01) -> Any:
        """Executes a callable with automatic retries on failure."""
        last_error = None
        for attempt in range(max_attempts):
            try:
                return fn()
            except Exception as e:
                last_error = e
                if attempt < max_attempts - 1 and delay > 0:
                    time.sleep(delay)
        raise last_error or RuntimeError("Retry attempts exhausted")
'''
            test_code = '''"""Unit test suite for CLI data processor including retry verification."""
import pytest
from cli.core import DataProcessor

def test_data_processor_empty():
    stats = DataProcessor.process_numbers([])
    assert stats["count"] == 0
    assert stats["sum"] == 0.0

def test_data_processor_numbers():
    stats = DataProcessor.process_numbers([10.0, 20.0, 30.0])
    assert stats["count"] == 3
    assert stats["sum"] == 60.0
    assert stats["mean"] == 20.0
    assert stats["max"] == 30.0
    assert stats["min"] == 10.0

def test_greeting_format():
    assert DataProcessor.format_greeting("Alice") == "Hello, Alice!"
    assert DataProcessor.format_greeting("Bob", shout=True) == "HELLO, BOB!"
    assert DataProcessor.format_greeting("") == "Hello, World!"

def test_execute_with_retry_success():
    attempts = 0
    def flaky():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise ValueError("Temporary failure")
        return "success"

    result = DataProcessor.execute_with_retry(flaky, max_attempts=3, delay=0.001)
    assert result == "success"
    assert attempts == 2

def test_execute_with_retry_failure():
    def always_fails():
        raise RuntimeError("Permanent failure")

    with pytest.raises(RuntimeError):
        DataProcessor.execute_with_retry(always_fails, max_attempts=2, delay=0.001)
'''
            modified.append({
                "path": "cli/core.py",
                "content": core_code,
                "explanation": "Added execute_with_retry helper and resilient execution logic"
            })
            modified.append({
                "path": "tests/test_core.py",
                "content": test_code,
                "explanation": "Added comprehensive test cases for retry logic"
            })
            return summary, modified

        elif spec.project_type == ProjectType.FASTAPI_SERVICE:
            summary = "Added resilient retry middleware and client execution logic to FastAPI microservice." if is_retry else f"Added '{instruction}' capability to FastAPI microservice."
            service_code = '''"""In-memory domain repository and business logic with retry handling."""
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Callable, Any
from app.models import ItemCreate, ItemResponse

class ItemRepository:
    def __init__(self):
        self._store: Dict[str, ItemResponse] = {}

    def create(self, data: ItemCreate) -> ItemResponse:
        item_id = str(uuid.uuid4())
        record = ItemResponse(
            id=item_id,
            title=data.title,
            description=data.description or "",
            priority=data.priority,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        self._store[item_id] = record
        return record

    def get(self, item_id: str) -> Optional[ItemResponse]:
        return self._store.get(item_id)

    def list_all(self) -> List[ItemResponse]:
        return list(self._store.values())

    def delete(self, item_id: str) -> bool:
        if item_id in self._store:
            del self._store[item_id]
            return True
        return False

    def execute_with_retry(self, action: Callable[[], Any], max_retries: int = 3) -> Any:
        """Executes operations with retry resilience."""
        last_exc = None
        for attempt in range(max_retries):
            try:
                return action()
            except Exception as e:
                last_exc = e
                time.sleep(0.005)
        raise last_exc or RuntimeError("Max retries exceeded")

repo = ItemRepository()
'''
            api_test_code = '''"""Integration tests for FastAPI endpoints with retry verification."""
from fastapi.testclient import TestClient
from app.main import app
from app.service import repo

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_get_item():
    payload = {"title": "Hackathon Demo", "description": "Verify green test", "priority": 5}
    create_resp = client.post("/items", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "Hackathon Demo"
    item_id = created["id"]

    get_resp = client.get(f"/items/{item_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == item_id

def test_get_nonexistent_item():
    resp = client.get("/items/nonexistent-id-999")
    assert resp.status_code == 404

def test_service_retry_mechanism():
    call_count = 0
    def operation():
        nonlocal call_count
        call_count += 1
        if call_count < 2:
            raise ConnectionError("Transient network drop")
        return "reconnected"

    res = repo.execute_with_retry(operation, max_retries=3)
    assert res == "reconnected"
    assert call_count == 2
'''
            modified.append({
                "path": "app/service.py",
                "content": service_code,
                "explanation": "Added execute_with_retry resilience handler"
            })
            modified.append({
                "path": "tests/test_api.py",
                "content": api_test_code,
                "explanation": "Added integration test for retry behavior"
            })
            return summary, modified

        else: # REACT_COMPONENT
            summary = f"Refined React component to support {instruction}."
            comp_code = '''import React, { useState } from 'react';
import { ItemRecord, ComponentProps } from './types';

export const SpecForgeComponent: React.FC<ComponentProps> = ({
  initialItems = [],
  title = "SpecForge Task Manager (Refined)",
  onItemToggle
}) => {
  const [items, setItems] = useState<ItemRecord[]>(initialItems);
  const [newTitle, setNewTitle] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: ItemRecord = {
      id: "item-" + Date.now(),
      title: newTitle.trim(),
      completed: false,
      timestamp: new Date().toISOString()
    };
    setItems(prev => [...prev, item]);
    setNewTitle("");
  };

  const handleToggle = (id: string) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
    if (onItemToggle) onItemToggle(id);
  };

  const handleRetrySync = () => {
    setIsRetrying(true);
    setTimeout(() => setIsRetrying(false), 600);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-md border border-amber-600/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-amber-500">{title}</h2>
        <button
          onClick={handleRetrySync}
          className="text-xs px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-600/30"
        >
          {isRetrying ? "Syncing..." : "Sync Retry"}
        </button>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 text-sm focus:outline-none"
        />
        <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggle(item.id)}
              className="rounded accent-amber-500"
            />
            <span className={item.completed ? "line-through text-slate-400" : ""}>{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
'''
            modified.append({
                "path": "src/Component.tsx",
                "content": comp_code,
                "explanation": "Added sync retry action and refined styles"
            })
            return summary, modified

orchestrator = AgenticOrchestrator()

