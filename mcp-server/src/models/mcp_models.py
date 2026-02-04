from pydantic import BaseModel
from typing import List, Optional, Union
from uuid import UUID


class TaskRequest(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    user_id: str
    task_id: str
    title: Optional[str] = None
    description: Optional[str] = None


class TaskListRequest(BaseModel):
    user_id: str
    status: Optional[str] = None  # 'all', 'completed', 'pending'


class TaskCompleteRequest(BaseModel):
    user_id: str
    task_id: str


class TaskDeleteRequest(BaseModel):
    user_id: str
    task_id: str


class TaskResponse(BaseModel):
    task_id: str
    status: str
    title: str
    description: Optional[str] = None


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]


class ErrorResponse(BaseModel):
    error: str
    message: str


# Unified response model
MCPResponse = Union[TaskResponse, TaskListResponse, ErrorResponse]