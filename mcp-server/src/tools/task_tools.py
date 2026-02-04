from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, create_engine, select
from pydantic import BaseModel
import os
import sys
import inspect

# Add the parent directory to sys.path to import backend models
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(parent_dir, '..', '..'))

# Import backend models and services
from backend.src.models.task import Task, TaskCreate
from backend.src.services.task_service import TaskService
from backend.src.utils.database import get_session
from ..models.mcp_models import (
    TaskRequest, TaskUpdateRequest, TaskListRequest,
    TaskCompleteRequest, TaskDeleteRequest,
    TaskResponse, TaskListResponse, ErrorResponse
)


class TaskTools:
    """Class containing all MCP task tools"""

    def __init__(self):
        # Initialize database connection
        self.db_url = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/chat_todo_db")
        self.engine = create_engine(self.db_url)

    def add_task(self, request: TaskRequest) -> Union[TaskResponse, ErrorResponse]:
        """
        Creates a new task for the specified user.

        Args:
            request: TaskRequest containing user_id, title, and optional description

        Returns:
            TaskResponse with task_id, status, and title
        """
        try:
            # Validate user_id format
            user_id = UUID(request.user_id)

            # Validate required fields
            if not request.title.strip():
                return ErrorResponse(
                    error="validation_error",
                    message="Title is required"
                )

            with Session(self.engine) as session:
                task_data = TaskCreate(
                    title=request.title.strip(),
                    description=request.description
                )

                task = TaskService.create_task(session, user_id, task_data)

                return TaskResponse(
                    task_id=str(task.id),
                    status="created",
                    title=task.title,
                    description=task.description
                )
        except ValueError:
            return ErrorResponse(
                error="invalid_uuid",
                message="Invalid user_id format"
            )
        except Exception as e:
            return ErrorResponse(
                error="add_task_failed",
                message=str(e)
            )

    def list_tasks(self, request: TaskListRequest) -> Union[TaskListResponse, ErrorResponse]:
        """
        Lists tasks for the specified user.

        Args:
            request: TaskListRequest containing user_id and optional status filter

        Returns:
            TaskListResponse with list of tasks
        """
        try:
            # Validate user_id format
            user_id = UUID(request.user_id)

            # Validate status parameter if provided
            if request.status and request.status not in ["all", "completed", "pending"]:
                return ErrorResponse(
                    error="validation_error",
                    message="Status must be 'all', 'completed', or 'pending'"
                )

            with Session(self.engine) as session:
                # Determine completion status filter
                completed_filter = None
                if request.status == "completed":
                    completed_filter = True
                elif request.status == "pending":
                    completed_filter = False

                tasks = TaskService.get_tasks(session, user_id, completed_filter)

                task_responses = [
                    TaskResponse(
                        task_id=str(task.id),
                        status="completed" if task.completed else "pending",
                        title=task.title,
                        description=task.description
                    )
                    for task in tasks
                ]

                return TaskListResponse(tasks=task_responses)
        except ValueError:
            return ErrorResponse(
                error="invalid_uuid",
                message="Invalid user_id format"
            )
        except Exception as e:
            return ErrorResponse(
                error="list_tasks_failed",
                message=str(e)
            )

    def complete_task(self, request: TaskCompleteRequest) -> Union[TaskResponse, ErrorResponse]:
        """
        Marks a task as completed.

        Args:
            request: TaskCompleteRequest containing user_id and task_id

        Returns:
            TaskResponse with task_id, status, and title
        """
        try:
            # Validate user_id and task_id formats
            user_id = UUID(request.user_id)
            task_id = UUID(request.task_id)

            with Session(self.engine) as session:
                task = TaskService.complete_task(session, task_id, user_id)

                if not task:
                    return ErrorResponse(
                        error="task_not_found",
                        message="Task not found or access denied"
                    )

                return TaskResponse(
                    task_id=str(task.id),
                    status="completed",
                    title=task.title,
                    description=task.description
                )
        except ValueError:
            return ErrorResponse(
                error="invalid_uuid",
                message="Invalid user_id or task_id format"
            )
        except Exception as e:
            return ErrorResponse(
                error="complete_task_failed",
                message=str(e)
            )

    def delete_task(self, request: TaskDeleteRequest) -> Union[TaskResponse, ErrorResponse]:
        """
        Deletes a task.

        Args:
            request: TaskDeleteRequest containing user_id and task_id

        Returns:
            TaskResponse with task_id, status, and title of deleted task
        """
        try:
            # Validate user_id and task_id formats
            user_id = UUID(request.user_id)
            task_id = UUID(request.task_id)

            with Session(self.engine) as session:
                # Get the task first to return its details
                task = TaskService.get_task(session, task_id, user_id)
                if not task:
                    return ErrorResponse(
                        error="task_not_found",
                        message="Task not found or access denied"
                    )

                success = TaskService.delete_task(session, task_id, user_id)

                if not success:
                    return ErrorResponse(
                        error="delete_failed",
                        message="Failed to delete task"
                    )

                return TaskResponse(
                    task_id=str(task.id),
                    status="deleted",
                    title=task.title,
                    description=task.description
                )
        except ValueError:
            return ErrorResponse(
                error="invalid_uuid",
                message="Invalid user_id or task_id format"
            )
        except Exception as e:
            return ErrorResponse(
                error="delete_task_failed",
                message=str(e)
            )

    def update_task(self, request: TaskUpdateRequest) -> Union[TaskResponse, ErrorResponse]:
        """
        Updates a task.

        Args:
            request: TaskUpdateRequest containing user_id, task_id, and optional updates

        Returns:
            TaskResponse with task_id, status, and title
        """
        try:
            # Validate user_id and task_id formats
            user_id = UUID(request.user_id)
            task_id = UUID(request.task_id)

            # Validate that at least one field is provided for update
            if request.title is None and request.description is None:
                return ErrorResponse(
                    error="validation_error",
                    message="At least one field (title or description) must be provided for update"
                )

            with Session(self.engine) as session:
                # Prepare update data
                from backend.src.models.task import TaskUpdate
                task_update = TaskUpdate(
                    title=request.title,
                    description=request.description
                )

                task = TaskService.update_task(
                    session,
                    task_id,
                    user_id,
                    task_update
                )

                if not task:
                    return ErrorResponse(
                        error="task_not_found",
                        message="Task not found or access denied"
                    )

                return TaskResponse(
                    task_id=str(task.id),
                    status="updated",
                    title=task.title,
                    description=task.description
                )
        except ValueError:
            return ErrorResponse(
                error="invalid_uuid",
                message="Invalid user_id or task_id format"
            )
        except Exception as e:
            return ErrorResponse(
                error="update_task_failed",
                message=str(e)
            )


# Create a global instance of TaskTools
task_tools = TaskTools()