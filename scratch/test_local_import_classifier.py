import asyncio
import json
import httpx

BASE_URL = "http://localhost:8001"

async def main():
    async with httpx.AsyncClient(timeout=300.0) as client:
        payload = {
            "prompt": "Create a multi-file Python CLI in 'src/inventory_mgr/core.py' with functions add_item and list_items. Tests in 'tests/test_mgr.py' importing from 'inventory_mgr.core'.",
            "project_type": "python_cli",
            "enable_research": False,
            "require_plan_approval": False,
            "max_fix_iterations": 3
        }

        print("Submitting job...")
        resp = await client.post(f"{BASE_URL}/api/jobs", json=payload)
        assert resp.status_code == 201, f"Failed: {resp.text}"
        job_id = resp.json()["job_id"]
        print(f"Created Job ID: {job_id}")

        for _ in range(60):
            await asyncio.sleep(5)
            detail = await client.get(f"{BASE_URL}/api/jobs/{job_id}")
            d_json = detail.json()
            status = d_json.get("status")
            events = d_json.get("events", [])
            print(f"Status: {status}, Total events: {len(events)}")
            
            for ev in events:
                if ev.get("event_type") == "classification":
                    print("\n!!! FOUND CLASSIFICATION EVENT !!!")
                    print(json.dumps(ev, indent=2))

            if status in ("completed", "failed", "paused"):
                print(f"Job reached terminal state: {status}")
                break

if __name__ == "__main__":
    asyncio.run(main())
