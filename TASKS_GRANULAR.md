# Granular, Executable Tasks: Chat-Based Todo Management System

## Backend Tasks

### [ ] T001: Create FastAPI project skeleton
- **Status**: ✅ COMPLETED
- **Files**: `backend/src/main.py`, `backend/requirements.txt`
- **Details**: FastAPI app with proper routing and dependencies installed

### [ ] T002: Configure Better Auth middleware
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/middleware/auth_middleware.py`
- **Details**:
  - Implement JWT token verification
  - Extract user info from token
  - Add user info to request context
  - Handle auth errors gracefully

### [ ] T003: Define SQLModel models: Task, Conversation, Message
- **Status**: ✅ COMPLETED
- **Files**: `backend/src/models/task.py`, `backend/src/models/conversation.py`, `backend/src/models/message.py`, `backend/src/models/user.py`
- **Details**: Complete SQLModel models with proper relationships and constraints

### [ ] T004: Create Alembic migration scripts for Neon PostgreSQL
- **Status**: 🆕 PENDING
- **Files**: `backend/alembic/versions/001_initial_schema.py`, `backend/alembic/env.py`, `backend/alembic.ini`
- **Details**:
  - Initialize Alembic in backend directory
  - Create migration script for initial schema
  - Configure database connection for migrations
  - Test migration up/down

### [ ] T005: Implement `/api/{user_id}/chat` endpoint
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/routes/chat_routes.py`
- **Details**:
  - Handle POST requests to `/api/chat/{user_id}`
  - Validate user_id format
  - Parse message and conversation_id from request
  - Implement conversation creation if needed
  - Store user message in DB
  - Process with AI agent
  - Store AI response in DB
  - Return structured response with conversation_id, response content, and tasks

### [ ] T006: Persist user messages and assistant responses
- **Status**: 🔄 IN PROGRESS
- **Files**: `backend/src/services/conversation_service.py`, `backend/src/routes/chat_routes.py`
- **Details**:
  - Store user messages when received
  - Store AI responses after generation
  - Link messages to appropriate conversation
  - Include role (user/assistant) and timestamp

### [ ] T007: Rehydrate conversation history for each request
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/services/conversation_service.py`
- **Details**:
  - Fetch conversation state from DB before AI processing
  - Limit history to last 10 messages for context
  - Include user's current tasks in context
  - Format messages appropriately for AI model

### [ ] T008: Return `{conversation_id, response, tool_calls}` in response
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/routes/chat_routes.py`
- **Details**:
  - Format response to include conversation_id
  - Include AI-generated response content
  - Include any tool calls that were executed
  - Add timestamp information

## MCP Server Tasks

### [ ] T009: Initialize Official MCP SDK
- **Status**: 🔄 IN PROGRESS
- **Files**: `mcp-server/src/server.py`, `mcp-server/requirements.txt`
- **Details**:
  - Add MCP SDK to requirements if needed
  - Initialize MCP server framework
  - Set up proper endpoints for tools
  - Configure error handling

### [ ] T010: Define tool schemas (add/list/complete/delete/update)
- **Status**: ✅ COMPLETED
- **Files**: `mcp-server/src/models/mcp_models.py`
- **Details**: Complete Pydantic models for all MCP tools with proper validation

### [ ] T011: Implement stateless handlers with DB persistence
- **Status**: ✅ COMPLETED
- **Files**: `mcp-server/src/tools/task_tools.py`
- **Details**:
  - Implement add_task handler with DB persistence
  - Implement list_tasks handler with DB query
  - Implement complete_task handler with DB update
  - Implement delete_task handler with DB deletion
  - Implement update_task handler with DB update
  - All handlers are stateless and use DB for persistence

### [ ] T012: Return structured JSON as per contracts
- **Status**: ✅ COMPLETED
- **Files**: `mcp-server/src/tools/task_tools.py`, `mcp-server/src/models/mcp_models.py`
- **Details**: All tools return properly structured JSON responses according to defined contracts

### [ ] T013: Validate tool error handling (task not found, invalid input)
- **Status**: 🔄 IN PROGRESS
- **Files**: `mcp-server/src/tools/task_tools.py`
- **Details**:
  - Add validation for user_id and task_id formats
  - Handle cases where task doesn't exist
  - Validate input parameters
  - Return appropriate error responses
  - Test error scenarios

## Agent Tasks

### [ ] T014: Write system prompt for intent → MCP tool mapping
- **Status**: ✅ COMPLETED
- **File**: `AGENT_PROMPT.md`
- **Details**: Comprehensive system prompt that maps user intent to appropriate MCP tools

### [ ] T015: Register MCP tools with OpenAI Agents SDK
- **Status**: 🆕 PENDING
- **File**: `backend/src/services/ai_service.py`
- **Details**:
  - Update AI service to register tools with OpenAI API
  - Format tools according to OpenAI function calling format
  - Ensure tools match MCP contracts
  - Test tool registration

### [ ] T016: Implement runner with conversation history hydration
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/services/ai_service.py`
- **Details**:
  - Enhance AI service to use conversation history
  - Format messages properly for AI model
  - Include system messages with current tasks
  - Process tool calls returned by AI

### [ ] T017: Capture `tool_calls` for each response
- **Status**: 🆕 PENDING
- **File**: `backend/src/services/ai_service.py`
- **Details**:
  - Extract tool_calls from AI response
  - Execute appropriate MCP tools
  - Process tool results
  - Generate final response based on tool outcomes

### [ ] T018: Handle errors gracefully and respond with confirmations
- **Status**: 🔄 IN PROGRESS
- **File**: `backend/src/services/ai_service.py`
- **Details**:
  - Catch and handle API errors
  - Generate appropriate user-facing messages
  - Provide friendly confirmations after actions
  - Handle partial failures gracefully

## Frontend Tasks

### [ ] T019: Initialize ChatKit-based UI
- **Status**: 🆕 PENDING
- **Directory**: `frontend/`
- **Details**:
  - Create frontend directory
  - Initialize with appropriate framework (React/Vue)
  - Set up ChatKit UI components
  - Configure build tools

### [ ] T020: Configure domain allowlist and domain key
- **Status**: 🆕 PENDING
- **File**: `frontend/.env`, `frontend/src/config.js`
- **Details**:
  - Add domain configuration for API access
  - Configure CORS settings
  - Set up API endpoints
  - Add authentication configuration

### [ ] T021: Implement chat UI with conversation_id persistence
- **Status**: 🆕 PENDING
- **Files**: `frontend/src/components/ChatInterface.jsx`, `frontend/src/utils/storage.js`
- **Details**:
  - Create chat message display area
  - Implement message input field
  - Store conversation_id in local storage
  - Maintain conversation context between page loads

### [ ] T022: Display assistant responses and tool call confirmations
- **Status**: 🆕 PENDING
- **Files**: `frontend/src/components/ChatMessage.jsx`, `frontend/src/services/chatService.js`
- **Details**:
  - Format and display user messages
  - Format and display AI responses
  - Show tool execution confirmations
  - Handle different message types appropriately

### [ ] T023: Handle loading states and errors
- **Status**: 🆕 PENDING
- **Files**: `frontend/src/components/ChatInterface.jsx`, `frontend/src/hooks/useChat.js`
- **Details**:
  - Show loading indicators during AI processing
  - Display error messages when requests fail
  - Handle network timeouts
  - Provide retry mechanisms

## Docker & Kubernetes Tasks

### [ ] T024: Create Dockerfile for backend
- **Status**: ✅ COMPLETED
- **File**: `docker/Dockerfile.backend`
- **Details**: Multi-stage Dockerfile for backend service

### [ ] T025: Create Dockerfile for MCP server
- **Status**: ✅ COMPLETED
- **File**: `docker/Dockerfile.mcp`
- **Details**: Multi-stage Dockerfile for MCP server

### [ ] T026: Multi-stage builds for optimized images
- **Status**: ✅ COMPLETED
- **Files**: Both Dockerfiles implement multi-stage builds
- **Details**: Optimized images with separate build and production stages

### [ ] T027: Create docker-compose.yml for local development
- **Status**: ✅ COMPLETED
- **File**: `docker-compose.yml`
- **Details**: Complete compose file with all services and networking

### [ ] T028: Create Kubernetes Deployment YAMLs for backend and MCP
- **Status**: ✅ COMPLETED
- **File**: `k8s/deployment.yaml`
- **Details**: Deployments for both backend and MCP server with resource limits

### [ ] T029: Create Kubernetes Service YAMLs for internal and external communication
- **Status**: ✅ COMPLETED
- **File**: `k8s/service.yaml`
- **Details**: Services for internal communication and external access

### [ ] T030: Configure ConfigMaps/Secrets for env variables
- **Status**: ✅ COMPLETED
- **Files**: `k8s/configmap.yaml`, `k8s/secret.yaml`
- **Details**: Configuration for environment variables and sensitive data

### [ ] T031: Test scaling replicas → stateless behavior verified
- **Status**: 🆕 PENDING
- **Action**: Kubernetes testing
- **Details**:
  - Scale backend deployment to multiple replicas
  - Verify conversation state persists correctly
  - Test load distribution
  - Validate no session affinity needed

## DevOps & Testing Tasks

### [ ] T032: Set up Neon PostgreSQL serverless DB
- **Status**: 🆕 PENDING
- **Action**: Infrastructure setup
- **Details**:
  - Create Neon PostgreSQL database
  - Configure connection settings
  - Set up proper credentials
  - Test connection from application

### [ ] T033: Configure environment variables
- **Status**: 🔄 IN PROGRESS
- **File**: `.env.example`
- **Details**:
  - Update with actual database URL
  - Add OpenAI API key
  - Configure authentication settings
  - Set up proper values for production

### [ ] T034: Run end-to-end tests (CRUD + conversation persistence)
- **Status**: 🆕 PENDING
- **Files**: `backend/tests/e2e/test_chat_flow.py`
- **Details**:
  - Test task creation via chat
  - Test task listing via chat
  - Test task completion via chat
  - Test task deletion via chat
  - Verify conversation persistence across requests

### [ ] T035: Verify container restart → state persists in DB
- **Status**: 🆕 PENDING
- **Action**: Testing procedure
- **Details**:
  - Start application and create conversation
  - Restart containers
  - Verify conversation history is preserved
  - Continue conversation to confirm functionality

### [ ] T036: Document setup, deployment, and usage in README
- **Status**: 🔄 IN PROGRESS
- **File**: `README.md`
- **Details**:
  - Update with current setup instructions
  - Add deployment procedures
  - Include usage examples
  - Document troubleshooting steps

## Priority Implementation Order

### Phase 1: Core Backend Completion (High Priority)
1. T004: Create Alembic migration scripts
2. T013: Validate tool error handling
3. T015: Register MCP tools with OpenAI Agents SDK
4. T017: Capture `tool_calls` for each response

### Phase 2: AI Agent Integration (High Priority)
1. T016: Implement runner with conversation history hydration
2. T018: Handle errors gracefully and respond with confirmations
3. T005: Implement `/api/{user_id}/chat` endpoint (complete)

### Phase 3: Testing & Validation (Medium Priority)
1. T032: Set up Neon PostgreSQL serverless DB
2. T033: Configure environment variables
3. T034: Run end-to-end tests
4. T035: Verify container restart persistence

### Phase 4: Frontend & Deployment (Medium Priority)
1. T019: Initialize ChatKit-based UI
2. T020-T023: Complete frontend implementation
3. T031: Test scaling replicas

### Phase 5: Documentation & Finalization (Low Priority)
1. T036: Complete documentation
2. Final testing and validation
3. Deployment preparation

## Dependencies
- T005 depends on T004 (migrations needed before chat endpoint)
- T015 depends on T010 (tools must be defined before registration)
- T017 depends on T015 (tools must be registered before capture)
- T034 depends on T032-T033 (testing needs infrastructure setup)