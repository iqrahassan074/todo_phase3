from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID

from ..models.task import TaskCreate, TaskUpdate, TaskRead
from ..services.task_service import TaskService
from ..utils.database import get_session

router = APIRouter()


@router.get("/tasks/{user_id}")
async def get_user_tasks(
    user_id: str,
    completed: bool = None,
    session: Session = Depends(get_session)
):
    """
    Get all tasks for a user.

    Args:
        user_id: ID of the user
        completed: Optional filter for task completion status
        session: Database session

    Returns:
        Dictionary with list of tasks
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    tasks = TaskService.get_tasks(session, user_uuid, completed)

    return {
        "tasks": [
            {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
            for task in tasks
        ]
    }


@router.post("/tasks/{user_id}", response_model=dict)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    session: Session = Depends(get_session)
):
    """
    Create a new task for a user.

    Args:
        user_id: ID of the user
        task_data: Task creation data
        session: Database session

    Returns:
        Dictionary with created task
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    task = TaskService.create_task(session, user_uuid, task_data)

    return {
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        },
        "message": f"Task '{task.title}' created successfully!"
    }


@router.put("/tasks/{user_id}/{task_id}", response_model=dict)
async def update_task(
    user_id: str,
    task_id: str,
    task_update: TaskUpdate,
    session: Session = Depends(get_session)
):
    """
    Update a task for a user.

    Args:
        user_id: ID of the user
        task_id: ID of the task to update
        task_update: Task update data
        session: Database session

    Returns:
        Dictionary with updated task
    """
    try:
        user_uuid = UUID(user_id)
        task_uuid = UUID(task_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or task ID format"
        )

    task = TaskService.update_task(session, task_uuid, user_uuid, task_update)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )

    status_msg = "completed" if task.completed else "updated"
    return {
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        },
        "message": f"Task '{task.title}' {status_msg} successfully!"
    }


@router.patch("/tasks/{user_id}/{task_id}/toggle", response_model=dict)
async def toggle_task_completion(
    user_id: str,
    task_id: str,
    session: Session = Depends(get_session)
):
    """
    Toggle a task's completion status.

    Args:
        user_id: ID of the user
        task_id: ID of the task to toggle
        session: Database session

    Returns:
        Dictionary with updated task
    """
    try:
        user_uuid = UUID(user_id)
        task_uuid = UUID(task_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or task ID format"
        )

    task = TaskService.complete_task(session, task_uuid, user_uuid)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )

    status = "completed" if task.completed else "marked as incomplete"
    return {
        "task": {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        },
        "message": f"Task '{task.title}' {status} successfully!"
    }


@router.delete("/tasks/{user_id}/{task_id}", response_model=dict)
async def delete_task(
    user_id: str,
    task_id: str,
    session: Session = Depends(get_session)
):
    """
    Delete a task for a user.

    Args:
        user_id: ID of the user
        task_id: ID of the task to delete
        session: Database session

    Returns:
        Dictionary with success message
    """
    try:
        user_uuid = UUID(user_id)
        task_uuid = UUID(task_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or task ID format"
        )

    success = TaskService.delete_task(session, task_uuid, user_uuid)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )

    return {
        "success": True,
        "message": "Task deleted successfully!"
    }