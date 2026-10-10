import asyncio
import json
import httpx

BASE_URL = "http://localhost:8001"

async def main():
    async with httpx.AsyncClient(timeout=300.0) as client:
        # Check health first
        h = await client.get(f"{BASE_URL}/api/health")
        print("Health:", h.json())

        # Craft spec prone to wrong-import-path or missing dependency:
        # Prompt explicitly specifies complex multi-folder package layout where
        # tests and implementation use nested modules (e.g. data_pipeline/transformers/normalize.py)
        # and third party library 'tabulate'
        payload = {
            "prompt": "Create a modular Python CLI data transformer package 'dataprep'. Implementation in 'dataprep/transformers/normalizer.py' using tabulate for tables. Tests in 'tests/test_normalizer.py' asserting tabular output.",
            "project_type": "python_cli",
            "enable_research": True,
            "require_plan_approval": False,
            "max_fix_iterations": 3
        }

        print("Submitting job...")
        resp = await client.post(f"{BASE_URL}/api/jobs", json=payload)
        assert resp.status_code == 201, f"Failed: {resp.text}"
        job_data = resp.json()
        job_id = job_data["job_id"]
        print(f"Created Job ID: {job_id}")

        # Poll job status and events
        print("Polling job events...")
        classification_found = False
        for _ in range(60):
            await asyncio.sleep(5)
            detail = await client.get(f"{BASE_URL}/api/jobs/{job_id}")
            d_json = detail.json()
            status = d_json.get("status")
            events = d_json.get("events", [])
            print(f"Status: {status}, Total events: {len(events)}")
            
            for ev in events:
                if ev.get("event_type") == "classification" or "Failure classified as" in ev.get("message", ""):
                    print("\n!!! FOUND CLASSIFICATION EVENT !!!")
                    print(json.dumps(ev, indent=2))
                    classification_found = True

            if status in ("completed", "failed", "paused"):
                print(f"Job reached terminal state: {status}")
                break

        print(f"Final Status: {status}, Classification Found: {classification_found}")

if __name__ == "__main__":
    asyncio.run(main())
