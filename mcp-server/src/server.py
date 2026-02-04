from fastapi import FastAPI, HTTPException, status
from contextlib import asynccontextmanager
from typing import Dict, Any, Union

from .models.mcp_models import (
    TaskRequest, TaskUpdateRequest, TaskListRequest,
    TaskCompleteRequest, TaskDeleteRequest,
    TaskResponse, TaskListResponse, ErrorResponse
)
from .tools.task_tools import task_tools

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize any resources
    print("MCP Server starting up...")
    yield
    # Shutdown: Clean up resources if needed
    print("MCP Server shutting down...")


app = FastAPI(
    title="MCP Task Server",
    description="Model Context Protocol server for task management tools",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint for the MCP server."""
    return {"status": "healthy", "service": "mcp-server"}


@app.post("/tools/add_task", response_model=Union[TaskResponse, ErrorResponse])
async def add_task_endpoint(request: TaskRequest) -> Union[TaskResponse, ErrorResponse]:
    """
    MCP Tool: Add a new task

    Args:
        request: TaskRequest containing user_id, title, and optional description

    Returns:
        TaskResponse with task details or ErrorResponse on failure
    """
    try:
        result = task_tools.add_task(request)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding task: {str(e)}")


@app.post("/tools/list_tasks", response_model=Union[TaskListResponse, ErrorResponse])
async def list_tasks_endpoint(request: TaskListRequest) -> Union[TaskListResponse, ErrorResponse]:
    """
    MCP Tool: List tasks for a user

    Args:
        request: TaskListRequest containing user_id and optional status filter

    Returns:
        TaskListResponse with list of tasks or ErrorResponse on failure
    """
    try:
        result = task_tools.list_tasks(request)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing tasks: {str(e)}")


@app.post("/tools/complete_task", response_model=Union[TaskResponse, ErrorResponse])
async def complete_task_endpoint(request: TaskCompleteRequest) -> Union[TaskResponse, ErrorResponse]:
    """
    MCP Tool: Complete a task

    Args:
        request: TaskCompleteRequest containing user_id and task_id

    Returns:
        TaskResponse with task details or ErrorResponse on failure
    """
    try:
        result = task_tools.complete_task(request)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing task: {str(e)}")


@app.post("/tools/delete_task", response_model=Union[TaskResponse, ErrorResponse])
async def delete_task_endpoint(request: TaskDeleteRequest) -> Union[TaskResponse, ErrorResponse]:
    """
    MCP Tool: Delete a task

    Args:
        request: TaskDeleteRequest containing user_id and task_id

    Returns:
        TaskResponse with deleted task details or ErrorResponse on failure
    """
    try:
        result = task_tools.delete_task(request)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")


@app.post("/tools/update_task", response_model=Union[TaskResponse, ErrorResponse])
async def update_task_endpoint(request: TaskUpdateRequest) -> Union[TaskResponse, ErrorResponse]:
    """
    MCP Tool: Update a task

    Args:
        request: TaskUpdateRequest containing user_id, task_id, and optional updates

    Returns:
        TaskResponse with updated task details or ErrorResponse on failure
    """
    try:
        result = task_tools.update_task(request)
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")


# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)