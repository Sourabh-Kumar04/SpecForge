import os
import re
from enum import Enum
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FailureCategory(str, Enum):
    LOCAL_IMPORT_ERROR = "local_import_error"
    MISSING_DEPENDENCY = "missing_dependency"
    CODE_ERROR = "code_error"
    LOGIC_ERROR = "logic_error"
    UNKNOWN = "unknown"

class FailureDiagnosis(BaseModel):
    category: FailureCategory
    summary: str
    strategy: str
    suggested_target: str  # "code" or "requirements"
    allow_requirements_edit: bool
    details: Dict[str, Any] = Field(default_factory=dict)
    guidance_prompt: str = ""

def _normalize_name(name: str) -> str:
    """Normalize package or module name for fuzzy comparison."""
    return re.sub(r"[-_.]+", "", name.lower())

class TupleBoolFiles:
    def __init__(self, is_local: bool, matched_files: List[str]):
        self.is_local = is_local
        self.matched_files = matched_files

def check_local_module(missing_module: str, workspace_files: List[str]) -> TupleBoolFiles:
    if not missing_module or not workspace_files:
        return TupleBoolFiles(False, [])

    clean_module = missing_module.strip().replace("'", "").replace('"', "")
    parts = clean_module.split(".")
    top_pkg = parts[0]
    leaf = parts[-1]

    norm_top = _normalize_name(top_pkg)
    norm_leaf = _normalize_name(leaf)
    norm_full = _normalize_name(clean_module)

    matched = []

    for f in workspace_files:
        f_clean = f.strip().replace("\\", "/")
        path_obj = Path(f_clean)
        path_parts = [p for p in path_obj.parts if p and p != "."]
        
        # Check if top package or leaf exists in workspace path components
        norm_parts = [_normalize_name(p.replace(".py", "")) for p in path_parts]
        
        if norm_top in norm_parts or norm_leaf in norm_parts:
            matched.append(f)
            continue
            
        # Check full module substring match (e.g. openjev/training/train.py vs openjev.train)
        path_no_ext = f_clean.replace(".py", "").replace("/", ".")
        if norm_leaf in _normalize_name(path_no_ext):
            matched.append(f)
            continue

    return TupleBoolFiles(len(matched) > 0, matched)


def classify_failure(error_output: str, workspace_files: Optional[List[str]] = None) -> FailureDiagnosis:
    """
    Parses test traceback / error output and classifies failure into:
    (a) ModuleNotFoundError: local project file (fix import in code) vs external dep (requirements.txt).
    (b) SyntaxError / NameError / AttributeError: fix code directly, never requirements.txt.
    (c) Test assertion / logic failure: fix business logic / calculation.
    """
    files = workspace_files or []
    output = error_output or ""

    # 1. Check for ModuleNotFoundError / ImportError
    # Pattern: ModuleNotFoundError: No module named 'xyz'
    mod_match = re.search(r"ModuleNotFoundError:\s+No module named ['\"]([^'\"]+)['\"]", output)
    imp_match = re.search(r"ImportError:\s+cannot import name ['\"]?([^'\"\s]+)['\"]?\s+from\s+['\"]?([^'\"\s]+)['\"]?", output)
    bare_imp_match = re.search(r"ImportError:\s+No module named ['\"]([^'\"]+)['\"]", output)

    if mod_match or imp_match or bare_imp_match:
        if mod_match:
            missing_module = mod_match.group(1).strip()
            imported_from = None
        elif imp_match:
            missing_symbol = imp_match.group(1).strip()
            imported_from = imp_match.group(2).strip()
            missing_module = f"{imported_from}.{missing_symbol}"
        else:
            missing_module = bare_imp_match.group(1).strip()
            imported_from = None

        local_check = check_local_module(missing_module, files)
        if not local_check.is_local and imported_from:
            local_check = check_local_module(imported_from, files)

        STDLIB_MODULES = {
            "os", "sys", "re", "json", "math", "time", "datetime", "typing", "pathlib",
            "collections", "functools", "itertools", "dataclasses", "abc", "copy", "uuid",
            "random", "hashlib", "io", "subprocess", "logging", "asyncio", "unittest",
            "shutil", "tempfile", "socket", "http", "urllib", "sqlite3", "csv", "xml",
            "html", "enum", "inspect", "contextlib", "threading", "multiprocessing",
            "traceback", "warnings", "glob", "fnmatch", "base64", "secrets", "platform",
            "signal", "difflib", "argparse", "string"
        }
        KNOWN_PKG_MAP = {
            "yaml": "PyYAML",
            "dotenv": "python-dotenv",
            "bs4": "beautifulsoup4",
            "PIL": "Pillow",
            "cv2": "opencv-python",
            "sklearn": "scikit-learn",
        }

        top_mod = missing_module.split(".")[0].lower()
        if top_mod in STDLIB_MODULES or top_mod.startswith("_") or top_mod in ("pytest", "_pytest"):
            summary = f"Import error on standard library or internal module '{missing_module}'."
            strategy = f"Fix the import statement or module reference in source code. Do NOT add standard or framework modules to requirements.txt."
            guidance = (
                f"CRITICAL FIXER DIRECTIVE:\n"
                f"'{missing_module}' is a Python standard library or test framework symbol, not a third-party package.\n"
                f"DO NOT add it to requirements.txt! Fix the code or import directly."
            )
            return FailureDiagnosis(
                category=FailureCategory.CODE_ERROR,
                summary=summary,
                strategy=strategy,
                suggested_target="code",
                allow_requirements_edit=False,
                details={"missing_module": missing_module, "is_stdlib_or_framework": True},
                guidance_prompt=guidance,
            )

        if local_check.is_local:
            summary = (
                f"Wrong local import path for '{missing_module}'. "
                f"Matched local files in workspace: {', '.join(local_check.matched_files[:3])}."
            )
            strategy = (
                f"Fix the import statement in your Python code to reference the correct module path "
                f"(e.g. {local_check.matched_files[0]}). DO NOT modify requirements.txt."
            )
            guidance = (
                f"CRITICAL FIXER DIRECTIVE:\n"
                f"Failure is classified as LOCAL_IMPORT_PATH_ERROR for '{missing_module}'.\n"
                f"This is a local project structure mismatch, NOT a missing third-party package.\n"
                f"Matching workspace files found: {local_check.matched_files}.\n"
                f"DO NOT add this to requirements.txt! Update the import path inside the source file directly."
            )
            return FailureDiagnosis(
                category=FailureCategory.LOCAL_IMPORT_ERROR,
                summary=summary,
                strategy=strategy,
                suggested_target="code",
                allow_requirements_edit=False,
                details={
                    "missing_module": missing_module,
                    "matched_files": local_check.matched_files,
                    "error_type": "ModuleNotFoundError",
                },
                guidance_prompt=guidance,
            )
        else:
            suggested_pkg = KNOWN_PKG_MAP.get(top_mod, missing_module)
            summary = f"Missing third-party dependency '{missing_module}' (PyPI package: {suggested_pkg})."
            strategy = f"Add '{suggested_pkg}' to requirements.txt with appropriate version pinning."
            guidance = (
                f"CRITICAL FIXER DIRECTIVE:\n"
                f"Failure is classified as MISSING_DEPENDENCY for external package '{missing_module}'.\n"
                f"This package does not exist in local project files.\n"
                f"Add '{suggested_pkg}' to requirements.txt."
            )
            return FailureDiagnosis(
                category=FailureCategory.MISSING_DEPENDENCY,
                summary=summary,
                strategy=strategy,
                suggested_target="requirements",
                allow_requirements_edit=True,
                details={
                    "missing_module": missing_module,
                    "suggested_pkg": suggested_pkg,
                    "error_type": "ModuleNotFoundError",
                },
                guidance_prompt=guidance,
            )

    # 2. SyntaxError, NameError, AttributeError, TypeError
    name_match = re.search(r"NameError:\s+name ['\"]?(\w+)['\"]? is not defined", output)
    syntax_match = re.search(r"SyntaxError:\s+(.*)", output)
    attr_match = re.search(r"AttributeError:\s+(.*)", output)
    type_match = re.search(r"TypeError:\s+(.*)", output)

    if name_match:
        missing_var = name_match.group(1).strip()
        summary = f"NameError: Name '{missing_var}' is not defined (likely missing import or typo)."
        strategy = (
            f"Add the missing import statement (e.g. 'import numpy as np' if referencing '{missing_var}') "
            f"or define variable '{missing_var}' in code. DO NOT modify requirements.txt."
        )
        guidance = (
            f"CRITICAL FIXER DIRECTIVE:\n"
            f"Failure is classified as CODE_ERROR (NameError on '{missing_var}').\n"
            f"If '{missing_var}' is an alias like 'np', 'pd', 'plt', or a missing function, "
            f"add the import statement at the top of the file or define the variable.\n"
            f"NEVER modify requirements.txt."
        )
        return FailureDiagnosis(
            category=FailureCategory.CODE_ERROR,
            summary=summary,
            strategy=strategy,
            suggested_target="code",
            allow_requirements_edit=False,
            details={"symbol": missing_var, "error_type": "NameError"},
            guidance_prompt=guidance,
        )

    if syntax_match:
        msg = syntax_match.group(1).strip()
        summary = f"SyntaxError: {msg}"
        strategy = "Fix syntax error directly in source code. DO NOT modify requirements.txt."
        guidance = (
            f"CRITICAL FIXER DIRECTIVE:\n"
            f"Failure is classified as CODE_ERROR (SyntaxError: {msg}).\n"
            f"Fix the invalid syntax directly in the target Python file. NEVER modify requirements.txt."
        )
        return FailureDiagnosis(
            category=FailureCategory.CODE_ERROR,
            summary=summary,
            strategy=strategy,
            suggested_target="code",
            allow_requirements_edit=False,
            details={"message": msg, "error_type": "SyntaxError"},
            guidance_prompt=guidance,
        )

    if attr_match:
        msg = attr_match.group(1).strip()
        summary = f"AttributeError: {msg}"
        strategy = "Fix attribute access, object initialization, or method signature in code. DO NOT modify requirements.txt."
        guidance = (
            f"CRITICAL FIXER DIRECTIVE:\n"
            f"Failure is classified as CODE_ERROR (AttributeError: {msg}).\n"
            f"Check object types, return values, and attribute names in code. NEVER modify requirements.txt."
        )
        return FailureDiagnosis(
            category=FailureCategory.CODE_ERROR,
            summary=summary,
            strategy=strategy,
            suggested_target="code",
            allow_requirements_edit=False,
            details={"message": msg, "error_type": "AttributeError"},
            guidance_prompt=guidance,
        )

    if type_match:
        msg = type_match.group(1).strip()
        summary = f"TypeError: {msg}"
        strategy = "Fix function arguments, return types, or parameter counts in code. DO NOT modify requirements.txt."
        guidance = (
            f"CRITICAL FIXER DIRECTIVE:\n"
            f"Failure is classified as CODE_ERROR (TypeError: {msg}).\n"
            f"Fix argument types/signatures directly in Python files. NEVER modify requirements.txt."
        )
        return FailureDiagnosis(
            category=FailureCategory.CODE_ERROR,
            summary=summary,
            strategy=strategy,
            suggested_target="code",
            allow_requirements_edit=False,
            details={"message": msg, "error_type": "TypeError"},
            guidance_prompt=guidance,
        )

    # 3. Test assertion failure / Logic error
    assert_match = re.search(r"AssertionError(?::\s*(.*))?", output)
    failed_test_match = re.search(r"FAILED\s+([^\s]+::[^\s]+)", output)
    placeholder_match = re.search(r"(NotImplementedError|TODO|placeholder|grad(?:ient)?.*0(?:\.0)?)", output, re.IGNORECASE)

    if assert_match or failed_test_match or "assert " in output or placeholder_match:
        detail_msg = assert_match.group(1).strip() if (assert_match and assert_match.group(1)) else "Assertion mismatch"
        summary = f"Assertion / Logic Failure: {detail_msg}."
        strategy = (
            "Fix calculation algorithm, business logic, return values, or placeholder code in implementation files. "
            "DO NOT modify requirements.txt."
        )
        guidance = (
            f"CRITICAL FIXER DIRECTIVE:\n"
            f"Failure is classified as LOGIC_ERROR (test assertion failure).\n"
            f"The packages and environment are fine. The implementation code produced an incorrect result "
            f"or contains placeholder logic. Fix the mathematical, algorithmic, or business logic.\n"
            f"DO NOT touch requirements.txt."
        )
        return FailureDiagnosis(
            category=FailureCategory.LOGIC_ERROR,
            summary=summary,
            strategy=strategy,
            suggested_target="code",
            allow_requirements_edit=False,
            details={"error_type": "AssertionError", "summary": detail_msg},
            guidance_prompt=guidance,
        )

    # Fallback: general code error
    return FailureDiagnosis(
        category=FailureCategory.UNKNOWN,
        summary="Unclassified test or execution error.",
        strategy="Inspect full traceback and patch the failing code directly.",
        suggested_target="code",
        allow_requirements_edit=False,
        details={"error_type": "Unknown"},
        guidance_prompt="Examine traceback and repair code. Avoid touching requirements.txt unless external module is explicitly missing.",
    )
