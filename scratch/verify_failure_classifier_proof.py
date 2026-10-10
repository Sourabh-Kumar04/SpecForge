import json
import httpx

r = httpx.get("http://127.0.0.1:8001/api/jobs/4e3a6824")
job = r.json()

print(f"=== JOB ID: {job['job_id']} ===")
print(f"Status: {job['status']}")
print(f"Prompt: {job['spec']['prompt']}")
print(f"Models: Fast={job['spend'].get('models', {}).get('fast')}, Reasoning={job['spend'].get('models', {}).get('reasoning')}")
print(f"Total Spend: ${job['spend'].get('total_cost_usd', 0):.5f}")
print("\n=== CLASSIFIER & FIXER EVENTS ===")
for e in job.get("events", []):
    if e["stage"] in ("fixer", "fixing") or "classified" in e.get("message", "").lower():
        print(f"[{e['stage']}:{e['event_type']}] {e['message']}")
        if e.get("data"):
            print("  DATA:", json.dumps(e["data"], indent=4))
