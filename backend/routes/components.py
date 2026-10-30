import json
import re
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter
from backend.services.storage import storage_service

router = APIRouter()

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
PACKAGE_JSON_PATH = FRONTEND_DIR / "package.json"
COMPONENTS_DIR = FRONTEND_DIR / "src" / "components"

def _load_package_json() -> Dict[str, Any]:
    if PACKAGE_JSON_PATH.exists():
        try:
            return json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"dependencies": {}, "devDependencies": {}}

def _extract_imports(content: str) -> List[str]:
    """Extract all import paths from TypeScript/TSX code."""
    import_regex = re.compile(r'''(?:import\s+.*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"])''')
    matches = import_regex.findall(content)
    imports = []
    for m in matches:
        target = m[0] or m[1]
        if target:
            imports.append(target)
    return imports

def _categorize_component(rel_path: str) -> str:
    if "ui/" in rel_path.replace("\\", "/"):
        return "UI Primitive (shadcn / 21st.dev style)"
    if "Modal" in rel_path:
        return "Studio Modal"
    if "Header" in rel_path:
        return "Studio Navigation"
    if "Form" in rel_path or "Gallery" in rel_path or "Timeline" in rel_path:
        return "Studio Input / Workflow"
    if "Browser" in rel_path or "Panel" in rel_path or "Box" in rel_path:
        return "Studio Workspace / Inspector"
    return "Studio Component"

def _extract_exports(content: str) -> List[str]:
    """Extract named exports."""
    export_regex = re.compile(r'export\s+(?:const|function|class|interface|type)\s+([A-Za-z0-9_]+)')
    named = export_regex.findall(content)
    if "export default" in content:
        named.append("default")
    return list(dict.fromkeys(named))

@router.get("")
def list_components() -> Dict[str, Any]:
    """
    Returns the real-time inventory of all UI components in the SpecForge app,
    including exact versions and dependencies sourced directly from package.json
    and component source files.
    """
    pkg = _load_package_json()
    deps: Dict[str, str] = pkg.get("dependencies", {})
    dev_deps: Dict[str, str] = pkg.get("devDependencies", {})
    all_pkg_deps = {**deps, **dev_deps}
    specforge_version = pkg.get("version", "1.0.0")

    components: List[Dict[str, Any]] = []

    if COMPONENTS_DIR.exists():
        for file_path in sorted(COMPONENTS_DIR.rglob("*.tsx")):
            rel_path = file_path.relative_to(FRONTEND_DIR).as_posix()
            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception:
                continue

            lines = content.splitlines()
            imports = _extract_imports(content)
            exports = _extract_exports(content)

            package_dependencies: List[Dict[str, str]] = []
            internal_dependencies: List[str] = []

            for imp in imports:
                if imp.startswith("."):
                    internal_dependencies.append(imp)
                else:
                    # External package (e.g., 'react', 'lucide-react', 'prismjs', '@types/node')
                    pkg_name = imp.split("/")[0] if not imp.startswith("@") else "/".join(imp.split("/")[:2])
                    version = all_pkg_deps.get(pkg_name, deps.get(pkg_name, dev_deps.get(pkg_name, "installed")))
                    package_dependencies.append({
                        "name": pkg_name,
                        "import_path": imp,
                        "version": version,
                    })

            # Deduplicate package dependencies by name
            unique_pkg_deps = {}
            for pd in package_dependencies:
                unique_pkg_deps[pd["name"]] = pd
            deduped_pkg_deps = list(unique_pkg_deps.values())

            component_name = file_path.stem
            components.append({
                "name": component_name,
                "file_name": file_path.name,
                "path": rel_path,
                "category": _categorize_component(rel_path),
                "version": specforge_version,
                "line_count": len(lines),
                "size_bytes": file_path.stat().st_size,
                "dependencies": deduped_pkg_deps,
                "internal_dependencies": sorted(list(set(internal_dependencies))),
                "exports": exports,
            })

    return {
        "status": "success",
        "specforge_version": specforge_version,
        "total_components": len(components),
        "package_json": {
            "dependencies": deps,
            "devDependencies": dev_deps,
        },
        "components": components,
    }

@router.get("/job/{job_id}")
def get_job_component_inventory(job_id: str) -> Dict[str, Any]:
    """
    Returns the component inventory of a generated job repository.
    """
    job = storage_service.get_job(job_id)
    if not job:
        return {"status": "error", "message": f"Job {job_id} not found", "components": []}

    # Find COMPONENTS.md or inspect files
    comp_file = next((f for f in job.files if f.path in ("COMPONENTS.md", "COMPONENTS.json")), None)
    return {
        "status": "success",
        "job_id": job_id,
        "project_type": job.spec.project_type.value,
        "inventory_file": comp_file.content if comp_file else None,
        "total_files": len(job.files),
        "files": [f.path for f in job.files],
    }
