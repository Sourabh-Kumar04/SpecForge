# Live Nebius classifier proof

Date: 2026-10-10 (UTC)

## Run

- Job: `e8035d7f` (`python_cli`, OpenJEV training CLI)
- Submitted with `POST /api/jobs` to the running SpecForge backend.
- `/api/health` reported `mock_mode: false`, `llm_status: key_ready`, and active NVIDIA Nemotron models `nvidia/nemotron-3-super-120b-a12b` and `nvidia/Nemotron-3-Ultra-550b-a55b`.
- Initial generated repository passed its sandbox suite: 5/5 tests.
- To reliably exercise the classifier, the generated job was refined through the application API after changing its generated test import to reproduce the historic `openjev.train` versus `openjev/training/train.py` mismatch. The run emitted a real `fixer/classification` event.

## Classifier evidence

### Wrong local import

Failure: `ModuleNotFoundError: No module named 'openjev.train'`, while the workspace contained `openjev/training/train.py`.

Observed classification event:

- `category`: `local_import_error`
- `suggested_target`: `code`
- `allow_requirements_edit`: `false`
- Summary: `Wrong local import path for 'openjev.train'. Matched local files in workspace: openjev/__init__.py, openjev/cli.py, openjev/training/train.py.`
- Fixer action: added a local `openjev.train` alias in `openjev/__init__.py`; it did not edit requirements.

This correctly routes the OpenJev blind-spot failure to source code.

### Missing third-party dependency

A separate failure in the same live job exercised an absent `humanize` import.

Observed classification event:

- `category`: `missing_dependency`
- `suggested_target`: `requirements`
- `allow_requirements_edit`: `true`
- Summary: `Missing third-party dependency 'humanize' (PyPI package: humanize).`
- Strategy: add `humanize` to `requirements.txt`.

Nemotron chose to remove the optional formatting dependency and implement equivalent number formatting with Python's standard library. That was a valid code-level resolution for this optional formatter; no requirements edit was needed. The final refined suite passed 10/10 tests. The classifier's target correctly distinguishes this external dependency from the local import path, while the fixer can select a simpler implementation when equivalent behavior is available.

## Evidence limits

The initial model generation repaired the deliberately specified bad import, so the reproducible mismatch was introduced through the generated job's editor API before invoking the real refinement/fixer flow. Both failure classifications and fixer actions came from live backend events; this is not a mock or unit-test-only result. The classification events and job artifacts are in the running backend's local job store and are intentionally not committed because `data/` is ignored.
