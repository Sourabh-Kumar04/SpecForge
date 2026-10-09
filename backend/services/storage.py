import asyncio
import json
import os
import shutil
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, AsyncGenerator
from backend.config import settings
from backend.models.schemas import (
    JobDetail,
    JobStatus,
    SpecInput,
    Plan,
    ResearchDoc,
    GeneratedFile,
    TestResult,
    AgentEvent,
    RefineResult,
    JobSpend,
)

class StorageService:
    """Manages SQLite job metadata, file persistence, ZIP generation, and SSE event streaming."""

    def __init__(self):
        self.db_path = settings.storage_dir / "specforge.db"
        self.jobs_dir = settings.storage_dir / "jobs"
        self.zips_dir = settings.storage_dir / "exports"
        self.jobs_dir.mkdir(parents=True, exist_ok=True)
        self.zips_dir.mkdir(parents=True, exist_ok=True)
        self._event_queues: Dict[str, List[asyncio.Queue]] = {}
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    plan_json TEXT,
                    research_json TEXT,
                    error TEXT,
                    workspace_dir TEXT,
                    spec_json TEXT,
                    refinements_json TEXT,
                    spend_json TEXT
                )
            """)
            # Schema migration for existing sqlite db
            cursor = conn.execute("PRAGMA table_info(jobs)")
            cols = [col[1] for col in cursor.fetchall()]
            if "spec_json" not in cols:
                conn.execute("ALTER TABLE jobs ADD COLUMN spec_json TEXT")
            if "refinements_json" not in cols:
                conn.execute("ALTER TABLE jobs ADD COLUMN refinements_json TEXT")
            if "spend_json" not in cols:
                conn.execute("ALTER TABLE jobs ADD COLUMN spend_json TEXT")

            conn.execute("""
                CREATE TABLE IF NOT EXISTS files (
                    job_id TEXT NOT NULL,
                    path TEXT NOT NULL,
                    content TEXT NOT NULL,
                    language TEXT NOT NULL,
                    PRIMARY KEY (job_id, path)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS test_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL,
                    passed INTEGER NOT NULL,
                    total_tests INTEGER NOT NULL,
                    passed_tests INTEGER NOT NULL,
                    failed_tests INTEGER NOT NULL,
                    output TEXT NOT NULL,
                    iteration INTEGER NOT NULL,
                    duration_seconds REAL NOT NULL,
                    runner TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data_json TEXT
                )
            """)
            conn.commit()

    def get_job_workspace(self, job_id: str) -> Path:
        path = self.jobs_dir / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def create_job(self, job_id: str, spec: SpecInput) -> JobDetail:
        now = datetime.now(timezone.utc).isoformat()
        workspace = self.get_job_workspace(job_id)
        default_spend = JobSpend(spend_cap_usd=settings.nebius_spend_cap_usd)

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO jobs (job_id, prompt, project_type, status, created_at, updated_at, workspace_dir, spec_json, spend_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    prompt = excluded.prompt,
                    project_type = excluded.project_type,
                    status = excluded.status,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at,
                    workspace_dir = excluded.workspace_dir,
                    spec_json = excluded.spec_json,
                    spend_json = excluded.spend_json
                """,
                (
                    job_id,
                    spec.prompt,
                    spec.project_type.value,
                    JobStatus.QUEUED.value,
                    now,
                    now,
                    str(workspace),
                    spec.model_dump_json(),
                    default_spend.model_dump_json(),
                ),
            )
            conn.commit()

        return JobDetail(
            job_id=job_id,
            spec=spec,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
            workspace_dir=str(workspace),
            spend=default_spend,
        )

    def update_job_status(self, job_id: str, status: JobStatus, error: Optional[str] = None):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE jobs SET status = ?, error = ?, updated_at = ? WHERE job_id = ?",
                (status.value, error, now, job_id),
            )
            conn.commit()

    def save_plan(self, job_id: str, plan: Plan):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE jobs SET plan_json = ?, updated_at = ? WHERE job_id = ?",
                (plan.model_dump_json(), now, job_id),
            )
            conn.commit()

    def save_research(self, job_id: str, docs: List[ResearchDoc]):
        now = datetime.now(timezone.utc).isoformat()
        docs_json = json.dumps([d.model_dump() for d in docs])
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE jobs SET research_json = ?, updated_at = ? WHERE job_id = ?",
                (docs_json, now, job_id),
            )
            conn.commit()

    def save_file(self, job_id: str, file: GeneratedFile):
        # Save to disk workspace
        ws = self.get_job_workspace(job_id)
        target = ws / file.path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(file.content, encoding="utf-8")

        # Save to DB
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO files (job_id, path, content, language)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(job_id, path) DO UPDATE SET content = excluded.content, language = excluded.language
                """,
                (job_id, file.path, file.content, file.language),
            )
            conn.commit()

    def save_test_result(self, job_id: str, result: TestResult):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO test_results (job_id, passed, total_tests, passed_tests, failed_tests, output, iteration, duration_seconds, runner, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job_id,
                    1 if result.passed else 0,
                    result.total_tests,
                    result.passed_tests,
                    result.failed_tests,
                    result.output,
                    result.iteration,
                    result.duration_seconds,
                    result.runner,
                    now,
                ),
            )
            conn.commit()

    def save_refinement(self, job_id: str, refinement: RefineResult):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            row = conn.execute("SELECT refinements_json FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
            current = []
            if row and row["refinements_json"]:
                try:
                    current = json.loads(row["refinements_json"])
                except Exception:
                    current = []
            current.append(refinement.model_dump())
            conn.execute(
                "UPDATE jobs SET refinements_json = ?, updated_at = ? WHERE job_id = ?",
                (json.dumps(current), now, job_id),
            )
    def save_spend(self, job_id: str, spend: JobSpend):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE jobs SET spend_json = ?, updated_at = ? WHERE job_id = ?",
                (spend.model_dump_json(), now, job_id),
            )
            conn.commit()

    async def emit_event(self, job_id: str, stage: str, event_type: str, message: str, data: Optional[Dict[str, Any]] = None):
        event_id = f"evt_{int(datetime.now().timestamp()*1000)}"
        now = datetime.now(timezone.utc).isoformat()
        event = AgentEvent(
            id=event_id,
            timestamp=now,
            stage=stage,
            event_type=event_type,
            message=message,
            data=data,
        )

        # Save to DB
        data_json = json.dumps(data) if data else None
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO events (id, job_id, timestamp, stage, event_type, message, data_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (event.id, job_id, event.timestamp, event.stage, event.event_type, event.message, data_json),
            )
            conn.commit()

        # Dispatch to any SSE listeners
        queues = self._event_queues.get(job_id, [])
        for q in queues:
            await q.put(event)

    def subscribe_events(self, job_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        if job_id not in self._event_queues:
            self._event_queues[job_id] = []
        self._event_queues[job_id].append(q)
        return q

    def unsubscribe_events(self, job_id: str, q: asyncio.Queue):
        if job_id in self._event_queues:
            if q in self._event_queues[job_id]:
                self._event_queues[job_id].remove(q)

    def get_job(self, job_id: str) -> Optional[JobDetail]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
            if not row:
                return None

            plan = Plan.model_validate_json(row["plan_json"]) if row["plan_json"] else None
            research_notes = [
                ResearchDoc.model_validate(d) for d in json.loads(row["research_json"])
            ] if row["research_json"] else []

            # Files
            file_rows = conn.execute("SELECT * FROM files WHERE job_id = ? ORDER BY path", (job_id,)).fetchall()
            files = [
                GeneratedFile(path=r["path"], content=r["content"], language=r["language"])
                for r in file_rows
            ]

            # Test results
            test_rows = conn.execute(
                "SELECT * FROM test_results WHERE job_id = ? ORDER BY iteration ASC", (job_id,)
            ).fetchall()
            test_history = [
                TestResult(
                    passed=bool(t["passed"]),
                    total_tests=t["total_tests"],
                    passed_tests=t["passed_tests"],
                    failed_tests=t["failed_tests"],
                    output=t["output"],
                    iteration=t["iteration"],
                    duration_seconds=t["duration_seconds"],
                    runner=t["runner"],
                )
                for t in test_rows
            ]

            # Events
            evt_rows = conn.execute("SELECT * FROM events WHERE job_id = ? ORDER BY timestamp ASC", (job_id,)).fetchall()
            events = [
                AgentEvent(
                    id=e["id"],
                    timestamp=e["timestamp"],
                    stage=e["stage"],
                    event_type=e["event_type"],
                    message=e["message"],
                    data=json.loads(e["data_json"]) if e["data_json"] else None,
                )
                for e in evt_rows
            ]

            if "spec_json" in row.keys() and row["spec_json"]:
                spec = SpecInput.model_validate_json(row["spec_json"])
            else:
                spec = SpecInput(
                    prompt=row["prompt"],
                    project_type=row["project_type"],
                )

            zip_path = self.zips_dir / f"{job_id}.zip"
            download_url = f"/api/jobs/{job_id}/download" if zip_path.exists() else None

            refinements = []
            if "refinements_json" in row.keys() and row["refinements_json"]:
                try:
                    refinements = [RefineResult.model_validate(r) for r in json.loads(row["refinements_json"])]
                except Exception:
                    refinements = []

            if "spend_json" in row.keys() and row["spend_json"]:
                try:
                    spend = JobSpend.model_validate_json(row["spend_json"])
                except Exception:
                    spend = JobSpend(spend_cap_usd=settings.nebius_spend_cap_usd)
            else:
                spend = JobSpend(spend_cap_usd=settings.nebius_spend_cap_usd)

            return JobDetail(
                job_id=job_id,
                spec=spec,
                status=JobStatus(row["status"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                plan=plan,
                research_notes=research_notes,
                files=files,
                test_history=test_history,
                latest_test=test_history[-1] if test_history else None,
                error=row["error"],
                events=events,
                download_url=download_url,
                workspace_dir=row["workspace_dir"],
                refinements=refinements,
                spend=spend,
            )

    def list_jobs(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT job_id, prompt, project_type, status, created_at, updated_at FROM jobs ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    def create_zip_export(self, job_id: str) -> Path:
        ws = self.get_job_workspace(job_id)
        zip_path = self.zips_dir / f"{job_id}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(ws):
                # Prune cache directories
                dirs[:] = [d for d in dirs if d not in ("__pycache__", ".pytest_cache", ".git", "node_modules")]
                for file in files:
                    if file.endswith((".pyc", ".pyo")):
                        continue
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(ws)
                    zipf.write(file_path, arcname)
        return zippath if (zippath := zip_path).exists() else zip_path

storage_service = StorageService()
