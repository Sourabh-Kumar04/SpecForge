import asyncio
import json
import httpx

BASE_URL = "http://localhost:8001"

async def main():
    async with httpx.AsyncClient(timeout=300.0) as client:
        payload = {
            "prompt": "Create a Python CLI app where logic is placed in 'src/finance/tax.py'. Tests in 'tests/test_tax.py' must import 'from finance.tax import compute_tax'.",
            "project_type": "python_cli",
            "enable_research": False,
            "require_plan_approval": False,
            "max_fix_iterations": 3
        }

        resp = await client.post(f"{BASE_URL}/api/jobs", json=payload)
        job_id = resp.json()["job_id"]
        print(f"Created Job ID: {job_id}")

        for _ in range(60):
            await asyncio.sleep(5)
            detail = await client.get(f"{BASE_URL}/api/jobs/{job_id}")
            d_json = detail.json()
            status = d_json.get("status")
            events = d_json.get("events", [])
            for ev in events:
                if ev.get("event_type") == "classification":
                    print("\n!!! FOUND CLASSIFICATION EVENT !!!")
                    print(json.dumps(ev, indent=2))
            if status in ("completed", "failed", "paused"):
                print(f"Job reached terminal state: {status}")
                break

if __name__ == "__main__":
    asyncio.run(main())
