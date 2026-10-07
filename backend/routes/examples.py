from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from backend.models.schemas import ProjectType

router = APIRouter()

class ExampleSpec(BaseModel):
    id: str
    title: str
    description: str
    project_type: ProjectType
    prompt: str
    tags: List[str]

PRESET_EXAMPLES: List[ExampleSpec] = [
    ExampleSpec(
        id="fastmcp-2026-server",
        title="FastMCP 4.0 Protocol Server (2026)",
        description="Model Context Protocol server utilizing the July 2026 FastMCP 4.0 stateless spec with tool schemas and in-memory client test suite.",
        project_type=ProjectType.PYTHON_CLI,
        prompt="Build a production Model Context Protocol (MCP) CLI tool and server using FastMCP 4.0 (July 2026 specification). The service exposes data analysis and math tools via @mcp.tool, supports stateless protocol negotiation, and includes a comprehensive pytest test suite asserting tool registration, execution, and error boundary handling.",
        tags=["FastMCP 4.0", "MCP 2026", "Tavily Grounded", "Python CLI", "Pytest"]
    ),
    ExampleSpec(
        id="fastapi-task-api",
        title="FastAPI Lifespan Microservice",
        description="Production REST API with Pydantic v2 schemas, in-memory repository, health check, and ASGI test suite.",
        project_type=ProjectType.FASTAPI_SERVICE,
        prompt="Create a production-ready FastAPI microservice with CRUD endpoints for managing items with titles, descriptions, and priorities. Include custom validation, 404 handlers, health check endpoint, and a comprehensive pytest test suite using Starlette TestClient.",
        tags=["FastAPI", "Pydantic v2", "Pytest", "REST"]
    ),
    ExampleSpec(
        id="python-cli-stats",
        title="Rich CLI Numerical Analyzer",
        description="CLI tool parsing numerical inputs with statistical metrics and colored terminal outputs.",
        project_type=ProjectType.PYTHON_CLI,
        prompt="Build a Python CLI tool using Click and Rich that parses numbers from flags/arguments, computes count, sum, mean, max, and min, formats a greeting message with shout support, and includes 100% pytest test coverage for empty and non-empty inputs.",
        tags=["Click", "Rich", "CLI", "Math", "Pytest"]
    ),
    ExampleSpec(
        id="react-task-component",
        title="React 19 Interactive Task Suite",
        description="Modern React 19 functional component with interactive state, task toggling, and clean TypeScript props.",
        project_type=ProjectType.REACT_COMPONENT,
        prompt="Build a clean, accessible React 19 task manager component in TypeScript. Features add-task form, check-to-complete toggle, empty state handling, and automated structural contract tests.",
        tags=["React 19", "TypeScript", "Tailwind", "UI"]
    )
]

@router.get("", response_model=List[ExampleSpec])
def get_examples():
    """Returns preset example project specifications."""
    return PRESET_EXAMPLES
