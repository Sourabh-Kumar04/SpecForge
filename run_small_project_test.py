import asyncio
import time
import json
from pathlib import Path
from backend.config import settings
from backend.models.schemas import SpecInput, ProjectType
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator

async def main():
    job_id = "spec_small_project_eval"
    spec = SpecInput(
        prompt="Build a lightweight string and text transformer CLI tool with word count, slugify, and text wrapping operations with full pytest test coverage.",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
        max_fix_iterations=3,
    )

    print("====================================================")
    print("SPECFORGE END-TO-END SMALL PROJECT TEST EXECUTION")
    print("====================================================")
    print(f"Spec Prompt: '{spec.prompt}'")
    print(f"Project Type: {spec.project_type.value}")
    print(f"Effective Mock LLM: {settings.effective_mock_llm}")
    print(f"Nebius Base URL: {settings.nebius_base_url}")
    print(f"Has Nebius API Key: {bool(settings.nebius_api_key and len(settings.nebius_api_key) > 8)}")

    storage_service.create_job(job_id, spec)

    start_time = time.time()
    await orchestrator.start_job(job_id, spec)
    run_time = round(time.time() - start_time, 2)

    job = storage_service.get_job(job_id)
    if not job:
        print("ERROR: Job not found after execution!")
        return

    print(f"\nPipeline Status: {job.status.value}")
    print(f"Execution Run Time: {run_time}s")

    latest_test = job.latest_test
    if latest_test:
        print(f"Test Result: {latest_test.passed_tests}/{latest_test.total_tests} passed in {latest_test.duration_seconds}s (runner: {latest_test.runner})")
    else:
        print("Test Result: No test result recorded")

    cost = job.spend.total_cost_usd if job.spend else 0.0
    tokens = job.spend.total_tokens if job.spend else 0
    print(f"Estimated Cost: ${cost:.4f} USD ({tokens} tokens)")

    print(f"\nGenerated Files ({len(job.files)} total):")
    for f in job.files:
        print(f"  - {f.path} ({len(f.content.splitlines())} lines, {len(f.content)} bytes)")

    # Find COMPONENTS.md
    comp_file = next((f for f in job.files if f.path == "COMPONENTS.md"), None)
    if comp_file:
        print("\n====================================================")
        print("GENERATED REPO COMPONENT INVENTORY (COMPONENTS.md):")
        print("====================================================")
        print(comp_file.content)
    else:
        print("\nWARNING: COMPONENTS.md was not found in generated files!")

if __name__ == "__main__":
    asyncio.run(main())
