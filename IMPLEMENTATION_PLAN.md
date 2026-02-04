# Detailed Implementation Plan: Chat-Based Todo Management System

## Overview
This document provides detailed implementation steps for the remaining tasks to complete the chat-based todo management system.

## Phase 1: Core Backend Completion (High Priority)

### Task T004: Create Alembic Migration Scripts
**Status**: PENDING
**Files to create**:
- `backend/alembic/versions/001_initial_schema.py`
- `backend/alembic/env.py`
- `backend/alembic.ini`

**Implementation Steps**:
1. Initialize alembic in backend directory:
   ```bash
   cd backend
   alembic init alembic
   ```

2. Update `backend/alembic/env.py` to include models:
```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from sqlmodel import SQLModel

# Import your models
from src.models.user import User
from src.models.task import Task
from src.models.conversation import Conversation
from src.models.message import Message

config = context.config
fileConfig(config.config_file_name)
target_metadata = SQLModel.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

3. Update `backend/alembic.ini` with database URL

4. Generate initial migration:
```bash
cd backend
alembic revision --autogenerate -m "Initial schema"
```

### Task T013: Validate Tool Error Handling
**Status**: IN PROGRESS
**File to update**: `mcp-server/src/tools/task_tools.py`

**Implementation Steps**:
1. Add validation for user_id and task_id formats
2. Handle cases where task doesn't exist
3. Add input validation
4. Return appropriate error responses

```python
def add_task(self, request: TaskRequest) -> Union[TaskResponse, ErrorResponse]:
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
                title=request.title,
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
```

### Task T015: Register MCP Tools with OpenAI Agents SDK
**Status**: PENDING
**File to update**: `backend/src/services/ai_service.py`

**Implementation Steps**:
1. Update the AI service to register tools in the correct format for OpenAI
2. Format tools according to OpenAI function calling format

```python
def get_openai_tools():
    """Return tools in OpenAI function format"""
    return [
        {
            "type": "function",
            "function": {
                "name": "add_task",
                "description": "Create a new task for the user",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "The user's unique identifier"},
                        "title": {"type": "string", "description": "The title of the task to create"},
                        "description": {"type": "string", "description": "Optional detailed description of the task"}
                    },
                    "required": ["user_id", "title"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_tasks",
                "description": "Get the user's tasks, optionally filtered by completion status",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "The user's unique identifier"},
                        "status": {"type": "string", "enum": ["all", "completed", "pending"], "description": "Filter tasks by completion status (default: all)"}
                    },
                    "required": ["user_id"]
                }
            }
        },
        # ... add other tools similarly
    ]
```

### Task T017: Capture Tool Calls
**Status**: PENDING
**File to update**: `backend/src/services/ai_service.py`

**Implementation Steps**:
1. Extract tool_calls from AI response
2. Execute appropriate MCP tools
3. Process tool results
4. Generate final response based on tool outcomes

```python
def process_chat_message_with_tools(
    self,
    session: Session,
    user_id: UUID,
    message_content: str,
    conversation_id: UUID
):
    # ... existing message formatting ...

    try:
        # Call OpenAI API with tools
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            tools=self.get_openai_tools(),
            tool_choice="auto"
        )

        response_message = response.choices[0].message

        # Check if the model wanted to call a tool
        tool_calls = response_message.tool_calls

        if tool_calls:
            # Process tool calls
            tool_results = []
            tasks_affected = []

            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                # Execute the appropriate tool
                if function_name == "add_task":
                    # Call MCP server
                    result = self.call_mcp_tool("add_task", function_args)
                    tool_results.append(result)
                    if "task_id" in result:
                        tasks_affected.append(result)

                elif function_name == "list_tasks":
                    result = self.call_mcp_tool("list_tasks", function_args)
                    tool_results.append(result)

                # ... handle other tools

            # Generate final response based on tool results
            final_response = self.generate_response_based_on_tools(
                response_message.content,
                tool_results
            )

            return {
                "content": final_response,
                "tasks": tasks_affected
            }
        else:
            # No tool calls, return direct response
            return {
                "content": response_message.content or "I processed your request.",
                "tasks": []
            }

    except Exception as e:
        return {
            "content": f"Sorry, I encountered an error processing your request: {str(e)}",
            "tasks": []
        }
```

## Phase 2: AI Agent Integration (High Priority)

### Task T016: Implement Runner with Conversation History Hydration
**Status**: IN PROGRESS
**File to update**: `backend/src/services/ai_service.py`

**Implementation Steps**:
1. Enhance AI service to use conversation history
2. Format messages properly for AI model
3. Include system messages with current tasks
4. Process tool calls returned by AI

### Task T018: Handle Errors Gracefully
**Status**: IN PROGRESS
**File to update**: `backend/src/services/ai_service.py`

**Implementation Steps**:
1. Catch and handle API errors
2. Generate appropriate user-facing messages
3. Provide friendly confirmations after actions
4. Handle partial failures gracefully

## Phase 3: Testing & Validation (Medium Priority)

### Task T032: Set Up Neon PostgreSQL Serverless DB
**Status**: PENDING
**Action**: Infrastructure setup

**Implementation Steps**:
1. Create account on Neon.tech
2. Create a new project
3. Get the connection string
4. Configure connection pooling settings
5. Test connection from application

### Task T034: Run End-to-End Tests
**Status**: PENDING
**File to create**: `backend/tests/e2e/test_chat_flow.py`

**Implementation Steps**:
1. Create test client for FastAPI
2. Test task creation via chat
3. Test task listing via chat
4. Test task completion via chat
5. Test task deletion via chat
6. Verify conversation persistence across requests

```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_task_creation_via_chat(client):
    # Create a mock user
    user_id = "test-user-uuid"

    # Send message to create a task
    response = client.post(f"/api/chat/{user_id}", json={
        "message": "Add a task: Buy groceries"
    })

    assert response.status_code == 200
    data = response.json()

    # Verify response contains task information
    assert "content" in data
    assert "tasks" in data
    assert len(data["tasks"]) > 0

def test_conversation_persistence(client):
    user_id = "test-user-uuid"

    # Start a conversation
    response1 = client.post(f"/api/chat/{user_id}", json={
        "message": "Add a task: First task"
    })

    conversation_id = response1.json()["conversation_id"]

    # Continue the same conversation
    response2 = client.post(f"/api/chat/{user_id}", json={
        "message": "What did I ask you to do?",
        "conversation_id": conversation_id
    })

    assert response2.status_code == 200
    # Verify AI remembers the previous task
```

## Phase 4: Frontend & Deployment (Medium Priority)

### Task T019: Initialize ChatKit-Based UI
**Status**: PENDING
**Directory to create**: `frontend/`

**Implementation Steps**:
1. Create frontend directory
2. Initialize with React:
   ```bash
   npx create-react-app frontend
   cd frontend
   ```
3. Install ChatKit dependencies
4. Set up basic chat interface components

### Task T031: Test Scaling Replicas
**Status**: PENDING
**Action**: Kubernetes testing

**Implementation Steps**:
1. Deploy to Kubernetes cluster
2. Scale backend deployment:
   ```bash
   kubectl scale deployment backend --replicas=3
   ```
3. Verify conversation state persists correctly across instances
4. Test load distribution and failover

## Implementation Dependencies

### Blocking Dependencies
- T005 (Chat endpoint) depends on T004 (Migrations) - Database must exist before endpoint can work
- T017 (Capture tool calls) depends on T015 (Register tools) - Tools must be registered before they can be called
- T034 (End-to-end tests) depends on T032 (DB setup) - Tests need a database to run against

### Parallelizable Tasks
- T013 (Error handling) can be done in parallel with other MCP tasks
- Frontend tasks (T019-T023) can be done in parallel with backend improvements
- T030 (K8s scaling test) can be done after basic deployment

## Success Criteria for Each Phase

### Phase 1 Completion
- Database migrations run successfully
- MCP tools handle errors gracefully
- AI service can register and call tools
- Tool calls are properly captured and processed

### Phase 2 Completion
- AI agent can process natural language and call appropriate tools
- Conversation history is properly hydrated
- Error handling provides user-friendly messages
- All tool calls result in appropriate confirmations

### Phase 3 Completion
- All CRUD operations work via chat interface
- Conversation state persists across requests
- System handles errors gracefully
- Container restarts don't lose conversation data

### Phase 4 Completion
- Frontend provides smooth chat experience
- System scales to multiple replicas without issues
- All components work together seamlessly
- Documentation is complete and accurate