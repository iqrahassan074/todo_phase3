# High-Level Execution Plan: Chat-Based Todo Management System

## Overview
This document outlines the step-by-step execution plan for implementing the chat-based todo management system with Docker and Kubernetes orchestration. The system will feature a stateless FastAPI server communicating with an MCP server for task operations, using OpenAI Agents SDK for natural language processing, with all state persisted in Neon PostgreSQL.

## Step 1: Define MCP Tool Contracts

### 1.1 Input/Output JSON Schema for MCP Tools

#### add_task
- **Endpoint**: POST /tools/add_task
- **Input**:
```json
{
  "user_id": "string (UUID)",
  "title": "string (required)",
  "description": "string (optional)"
}
```
- **Output**:
```json
{
  "task_id": "string (UUID)",
  "status": "string ('created')",
  "title": "string",
  "description": "string (optional)"
}
```

#### list_tasks
- **Endpoint**: POST /tools/list_tasks
- **Input**:
```json
{
  "user_id": "string (UUID)",
  "status": "string (optional: 'all', 'completed', 'pending')"
}
```
- **Output**:
```json
{
  "tasks": [
    {
      "task_id": "string (UUID)",
      "status": "string ('completed', 'pending')",
      "title": "string",
      "description": "string (optional)"
    }
  ]
}
```

#### complete_task
- **Endpoint**: POST /tools/complete_task
- **Input**:
```json
{
  "user_id": "string (UUID)",
  "task_id": "string (UUID)"
}
```
- **Output**:
```json
{
  "task_id": "string (UUID)",
  "status": "string ('completed')",
  "title": "string"
}
```

#### delete_task
- **Endpoint**: POST /tools/delete_task
- **Input**:
```json
{
  "user_id": "string (UUID)",
  "task_id": "string (UUID)"
}
```
- **Output**:
```json
{
  "task_id": "string (UUID)",
  "status": "string ('deleted')",
  "title": "string"
}
```

#### update_task
- **Endpoint**: POST /tools/update_task
- **Input**:
```json
{
  "user_id": "string (UUID)",
  "task_id": "string (UUID)",
  "title": "string (optional)",
  "description": "string (optional)"
}
```
- **Output**:
```json
{
  "task_id": "string (UUID)",
  "status": "string ('updated')",
  "title": "string"
}
```

### 1.2 Stateless Behavior Implementation
- All operations will be persisted in Neon PostgreSQL
- MCP server will reconstruct state from DB for each operation
- No server-side session state will be maintained

## Step 2: Design Agent Prompt & Tool Schema

### 2.1 System Prompt for AI Agent
```
You are a helpful todo management assistant. Help the user manage their tasks using natural language.
You can add, list, update, complete, and delete tasks.
Map user intent to appropriate MCP tools:
- Adding tasks → use add_task
- Listing tasks → use list_tasks
- Completing tasks → use complete_task
- Deleting tasks → use delete_task
- Updating tasks → use update_task
Always provide friendly confirmations after completing actions.
Be concise and helpful in your responses.
```

### 2.2 Tool Schema Definition
Each MCP tool will be registered with the OpenAI Agents SDK with proper function definitions that match the JSON schemas defined in Step 1.

## Step 3: Design Stateless Chat Flow

### 3.1 Chat Endpoint Design
- **Endpoint**: POST /api/chat/{user_id}
- **Request Body**:
```json
{
  "message": "string (required)",
  "conversation_id": "string (optional, UUID)"
}
```
- **Response**:
```json
{
  "id": "string (message ID)",
  "content": "string (AI response)",
  "conversation_id": "string (UUID)",
  "tasks": "array (affected tasks)",
  "timestamp": "string (ISO date)"
}
```

### 3.2 Flow Implementation Steps
1. Validate user authentication and extract user_id
2. Get or create conversation_id if not provided
3. Fetch conversation history from DB to provide context
4. Store user's message in the conversation
5. Run AI agent with conversation context and user message
6. Agent selects appropriate MCP tools based on intent
7. Execute MCP tool calls and process results
8. Generate AI response based on tool execution results
9. Store AI's response in the conversation
10. Return response with conversation_id and affected tasks

## Step 4: Define DB Schema & Migrations

### 4.1 SQLModel Models
Already defined in backend/src/models/:
- User model with id, email, name, timestamps
- Task model with id, user_id, title, description, completed, timestamps
- Conversation model with id, user_id, timestamps
- Message model with id, conversation_id, user_id, role, content, timestamp

### 4.2 Alembic Migrations
- Initial schema migration file: 001_initial_schema.sql
- Migration script to create all tables with proper relationships and indexes

## Step 5: Backend Implementation

### 5.1 FastAPI + OpenAI Agents SDK Integration
- Implement AI service in backend/src/services/ai_service.py
- Connect to OpenAI API with proper error handling
- Integrate with MCP tools via HTTP calls
- Implement intent detection and tool mapping

### 5.2 MCP Tools Integration
- Implement MCP client in backend to communicate with MCP server
- Handle tool call execution and response processing
- Map tool results back to user-friendly responses

### 5.3 Stateless Server Design
- Implement conversation state reconstruction from DB on each request
- No server-side session state storage
- All context retrieved from database as needed

## Step 6: Dockerize Components

### 6.1 Backend Dockerfile
- Multi-stage build for optimized image size
- Install Python dependencies
- Copy application code
- Run as non-root user
- Expose port 8000

### 6.2 MCP Server Dockerfile
- Multi-stage build for optimized image size
- Install Python dependencies
- Copy MCP server code
- Run as non-root user
- Expose port 8001

### 6.3 Docker Compose Configuration
- Define services for backend, MCP server, and PostgreSQL
- Set up networking between services
- Configure environment variables
- Define volume mounts for data persistence

## Step 7: Kubernetes Deployment

### 7.1 Deployment YAMLs
- Define deployments for backend and MCP server
- Set resource limits and requests
- Configure replica counts for scaling
- Add liveness and readiness probes

### 7.2 Service YAMLs
- Create ClusterIP services for internal communication
- Set up LoadBalancer for external access
- Configure service discovery

### 7.3 ConfigMaps and Secrets
- Store configuration values in ConfigMaps
- Store sensitive data (API keys, DB passwords) in Secrets
- Mount configuration into containers

## Step 8: Frontend Implementation

### 8.1 ChatKit UI Integration
- Create chat interface with message history
- Implement message input and submission
- Display both user and AI messages
- Show task status updates in real-time

### 8.2 Backend Communication
- Send messages to backend chat endpoint
- Manage conversation_id persistence
- Handle response display and error states
- Implement friendly confirmation messages

## Step 9: Testing & Validation

### 9.1 End-to-End Testing
- Test complete CRUD flows for tasks
- Verify MCP tool calls are logged and executed correctly
- Test conversation persistence across requests
- Validate user isolation and data security

### 9.2 Container Restart Validation
- Restart containers and verify conversation persistence
- Test that all state is maintained in the database
- Verify that services can be scaled up/down without data loss

### 9.3 Performance Testing
- Test system under load with multiple concurrent users
- Measure response times for different operations
- Validate horizontal scaling capabilities

## Step 10: Documentation

### 10.1 README Documentation
- Comprehensive setup instructions
- Docker and Kubernetes deployment guides
- Environment variable configuration details
- Usage examples for judges and users

### 10.2 API Documentation
- Detailed API endpoint documentation
- Example requests and responses
- Error handling and status codes
- Authentication requirements

### 10.3 Operational Documentation
- Deployment procedures
- Scaling guidelines
- Monitoring and logging setup
- Troubleshooting common issues

## Implementation Timeline

### Phase 1: Core Infrastructure (Days 1-2)
- Complete MCP tool contracts
- Finalize database schema and models
- Set up Docker configurations

### Phase 2: Backend Implementation (Days 2-4)
- Implement FastAPI backend
- Integrate OpenAI Agents SDK
- Connect to MCP tools

### Phase 3: Containerization & Deployment (Days 4-5)
- Complete Dockerization
- Create Kubernetes manifests
- Set up CI/CD pipeline

### Phase 4: Testing & Documentation (Days 5-7)
- Conduct comprehensive testing
- Validate all requirements
- Complete documentation

## Success Criteria

- ✅ All MCP tools function correctly with proper input/output schemas
- ✅ Stateless server design maintains conversation persistence
- ✅ System deploys successfully in Docker and Kubernetes
- ✅ AI agent correctly maps user intent to appropriate MCP tools
- ✅ Friendly confirmations provided after all actions
- ✅ Horizontal scaling achieved with Kubernetes
- ✅ All data properly isolated between users
- ✅ System recovers gracefully from container restarts