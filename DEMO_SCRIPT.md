# SpecForge: 3-Minute Demo Video Shot List & Director's Notes
**Event**: Nebius x NVIDIA Global AI Hackathon (Deadline: October 30, 2026)  
**Track**: Coding & Agentic Engineering ($3,000 Best Use of Tavily Prize Track)  
**Total Running Time**: ≤ 3:00 (180 Seconds)  
**Tone**: Fast-paced, developer-first, high conviction, zero fluff.

---

## Shot List & Sequence Breakdown

### [0:00 – 0:30] ACT 1: THE PROBLEM — "The Unverified Hallucination Trap"
*Goal: Hook judges in 30 seconds by exposing why mainstream LLM code generation fails.*

* **[0:00 – 0:10] Shot 1.1: The Frustration**
  * **Visual**: Screen capture of a generic chatbot (ChatGPT / Claude) generating Python code for a library released in 2026 (e.g. FastMCP 4.0). Red callout boxes highlight nonexistent imports, deprecated syntax, and missing error handlers.
  * **Audio (VO)**: "Every developer knows this pain: you ask an LLM for code, it generates 200 lines with confident swagger—and the moment you run it, it immediately blows up with `ImportError` or outdated 2023 syntax."
  * **Director's Cue**: Rapid cut. Zoom in on terminal traceback error: `ModuleNotFoundError: No module named 'mcp.server.legacy'`.

* **[0:10 – 0:20] Shot 1.2: The Knowledge Cutoff & Verification Void**
  * **Visual**: Split screen comparing "Knowledge Cutoff Date" vs "Modern 2026 Production Libraries". An unverified code snippet has a large red "UNVERIFIED HALLUCINATION" stamp.
  * **Audio (VO)**: "Why? Two fatal flaws: static model knowledge cutoffs that cannot know new 2026 APIs, and zero execution verification. Current codegen never proves its code actually runs."
  * **Director's Cue**: Glitch effect transition into high-contrast dark theme.

* **[0:20 – 0:30] Shot 1.3: The Solution Hook**
  * **Visual**: Cut to SpecForge UI hero section in full 4K resolution. The camera pans across the headline: **"The code generator that proves its code works."** Glowing green badges highlight "VERIFIED AI CODEGEN" and "NVIDIA Nemotron Reasoning".
  * **Audio (VO)**: "Meet SpecForge: the code generator that proves its code works. We ground every spec with live Tavily research and prove every file runs in an isolated sandbox before you ever touch a line."
  * **Director's Cue**: Sound effect: clean tech riser / whoosh. Mouse cursor hovers over the landing page.

---

### [0:30 – 2:00] ACT 2: LIVE DEMO — "One-Click Spec to 100% Green Codebase"
*Goal: Flawless end-to-end execution showing every step of the agentic synthesis pipeline.*

* **[0:30 – 0:45] Shot 2.1: The Spec & 2026 API Cutoff Challenge**
  * **Visual**: Screen recording of SpecForge spec form. Presenter clicks the prominent green button: `Try a sample spec →`.
  * **Action**: Form instantly populates with the FastMCP 4.0 Protocol Server (July 2026 specification) targeting a Python CLI. Presenter highlights the "Tavily Research Grounding: ON" toggle switch ($3,000 prize track).
  * **Audio (VO)**: "Watch. With one click, we load a specification for FastMCP 4.0—released in July 2026, well after common training cutoffs. Tavily research grounding is toggled on. We hit 'Forge Codebase'."
  * **Director's Cue**: Click sound on 'Forge Codebase'. Spinner activates into live SSE stream.

* **[0:45 – 1:05] Shot 2.2: Architecture Plan Preview & Tavily Grounding**
  * **Visual**: Agent timeline springs to life. Stage 1 (Nemotron Architecture) completes.
  * **Action**: Presenter clicks `Inspect & Edit Plan`. Modal shows full architectural breakdown: file manifests (`cli/core.py`, `cli/main.py`, `tests/test_core.py`), tech stack, and targeted Tavily queries. Modal closes.
  * **Audio (VO)**: "NVIDIA Nemotron 70B synthesizes the architectural blueprint. Then, our Tavily researcher agent executes targeted web queries to extract live 2026 API signatures, eliminating hallucinations before a single line is written."
  * **Director's Cue**: Camera zooms into Tavily Research Notes card showing real live doc URLs and key API tags (`@mcp.tool`, `FastMCP.Client`).

* **[1:05 – 1:35] Shot 2.3: Live Synthesis & Sandbox Execution**
  * **Visual**: Stage 3 (Synthesis) pulses cyan; file generation events stream over SSE. Stage 4 (Sandbox Execution) triggers with animated test runner indicators.
  * **Audio (VO)**: "Nemotron writes the full multi-file implementation and generates strict test suites. Now comes the critical difference: SpecForge immediately mounts the code into an isolated execution sandbox and executes pytest."
  * **Director's Cue**: Highlight the live SSE terminal showing real pytest output streaming line by line.

* **[1:35 – 1:50] Shot 2.4: Autonomous Fixer Loop (Self-Healing)**
  * **Visual**: If tests encounter an edge case, timeline shifts to Stage 5 (Autonomous Fixer Loop). Nemotron analyzes traceback, patches the exact offending function, and re-executes tests in iteration 2.
  * **Audio (VO)**: "If an assertion fails, Nemotron's reasoning engine analyzes the traceback, diagnoses the defect, and autonomously hot-patches the file without human intervention until the tests pass."
  * **Director's Cue**: Show iteration tab switching from `#1 ✗` to `#2 ✓`.

* **[1:50 – 2:00] Shot 2.5: The Unmissable "VERIFIED ✓" Stamp & ZIP Export**
  * **Visual**: Big green glowing banner drops in: `VERIFIED ✓ (All tests passed, N iterations)`. Test Report Panel shows 100% green metrics. File browser displays syntax-highlighted code. Presenter clicks `Download Verified ZIP`.
  * **Audio (VO)**: "Boom. 100% green verified. A complete, tested, production repository ready to download as a ZIP or deploy to Docker."
  * **Director's Cue**: Zoom in on the green `VERIFIED ✓` badge and browser download drawer opening with `specforge-export.zip`.

---

### [2:00 – 2:30] ACT 3: ARCHITECTURE — "Under the Hood"
*Goal: Demonstrate technical excellence and rigorous hackathon alignment.*

* **[2:00 – 2:15] Shot 3.1: Dual-Tier Nemotron via Nebius Token Factory**
  * **Visual**: Clean architectural diagram showing:
    * **Fast Tier**: `nvidia/nemotron-mini-4b-instruct` (streaming events, fast test suite generation).
    * **Reasoning Tier**: `nvidia/Llama-3.1-Nemotron-70B-Instruct` (architecture decomposition & fixer diagnostics).
    * **Inference Cloud**: Nebius Token Factory with OpenAI-compatible endpoint.
  * **Audio (VO)**: "Under the hood, SpecForge uses a cost-optimized two-tier model hierarchy on Nebius AI Cloud. Fast 4B Nemotron handles high-speed streaming events and tests, while Nemotron 70B supplies heavy reasoning for system architecture and bug diagnostics."
  * **Director's Cue**: Animated neon flow lines connecting Nebius Token Factory to the SpecForge orchestrator.

* **[2:15 – 2:30] Shot 3.2: Tavily Grounding & Sandbox Isolation**
  * **Visual**: Diagram connecting Tavily Search API → Context Injection → Dockerized Subprocess Sandbox with strict memory/timeout limits.
  * **Audio (VO)**: "Tavily AI Search supplies current ground truth documentation. And our containerized runner guarantees sandbox safety with hard execution timeouts and process isolation."
  * **Director's Cue**: Highlight security boundary around sandbox execution.

---

### [2:30 – 3:00] ACT 4: IMPACT & CLOSING — "Ship Code That Works"
*Goal: Memorable wrap-up; call to action for judges.*

* **[2:30 – 2:45] Shot 4.1: Production Readiness & Portability**
  * **Visual**: Fast montage showing the three templates: Python CLI, FastAPI Microservice, and React 19 UI component running in terminal and browser. Terminal runs `pytest -v` inside the unzipped repo: all tests passing green.
  * **Audio (VO)**: "SpecForge turns ambiguous ideas into verified software. No broken dependencies. No syntax hallucinations. Just code you can deploy right now."
  * **Director's Cue**: Quick-cut rhythm matching upbeat background track.

* **[2:45 – 3:00] Shot 4.2: Final Screen & Hackathon Submission Callout**
  * **Visual**: SpecForge landing screen with final slate overlay:
    * **Headline**: "The code generator that proves its code works."
    * **Logos**: Nebius AI Cloud • NVIDIA Nemotron • Tavily AI Search
    * **Repository**: Private GitHub repo `specforge`
    * **Track**: Nebius x NVIDIA Global AI Hackathon (Oct 30, 2026)
  * **Audio (VO)**: "Stop guessing if AI code works. Prove it. SpecForge: built for the Nebius and NVIDIA Global Hackathon. Thank you."
  * **Director's Cue**: Music swell, fade to black on the glowing green SpecForge logo.

---

## Technical Setup & Recording Checklist for Presenter
1. **Pre-flight Checks**:
   * Ensure backend is running: `uvicorn backend.main:app --port 8000`
   * Ensure frontend is running: `npm --prefix frontend run dev`
   * Screen resolution set to 1920x1080 or 4K with 125% scale for crisp UI readability.
2. **Preset Cue**:
   * Click `Try a sample spec →` on first load to demonstrate the 2026 FastMCP prompt.
   * Verify Tavily toggle is active.
3. **Pacing**:
   * Keep narration energetic and assertive.
   * Total video length must not exceed 180 seconds.
