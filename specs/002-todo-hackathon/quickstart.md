# Quickstart Guide: Chat-Based Todo Management System

## Prerequisites

- Python 3.11+ installed
- Docker and Docker Compose installed
- Kubernetes cluster (for production) or Minikube/Docker Desktop (for development)
- Neon PostgreSQL account and connection string
- OpenAI API key
- Better Auth configured

## Setup

### 1. Clone and Navigate to Project

```bash
# Clone the repository
git clone <repo-url>
cd chat-todo-management

# Navigate to backend directory
cd backend
```

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
```env
DATABASE_URL="your_neon_postgres_connection_string"
OPENAI_API_KEY="your_openai_api_key"
BETTER_AUTH_SECRET="your_auth_secret"
BETTER_AUTH_URL="http://localhost:8000"
```

### 3. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 4. Database Setup

Run the initial database migration:

```bash
# Apply database migrations
python -m alembic upgrade head

# Or if using direct SQL execution
psql $DATABASE_URL < migrations/001-initial-schema.sql
```

### 5. Running the Application

#### Development Mode (Standalone)
```bash
# Start the development server
uvicorn src.main:app --reload --port 8000
```

The server will be available at `http://localhost:8000`

#### Docker Compose Mode
```bash
# Build and start with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

#### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml  # Remember to update with actual values
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check deployment status
kubectl get pods
kubectl get services
```

## API Endpoints

### Chat Endpoint
```
POST /api/chat/{user_id}
```
Body:
```json
{
  "message": "Add a task: Buy groceries",
  "conversation_id": "optional-existing-conversation-id"
}
```

Response:
```json
{
  "id": "message-id",
  "content": "I've added 'Buy groceries' to your task list.",
  "conversation_id": "new-or-existing-conversation-id",
  "tasks": [
    {
      "id": "task-id",
      "title": "Buy groceries",
      "completed": false
    }
  ]
}
```

### Task Endpoints
```
GET /api/tasks/{user_id}          # Get all user tasks
POST /api/tasks/{user_id}         # Create new task
PUT /api/tasks/{user_id}/{id}     # Update task
DELETE /api/tasks/{user_id}/{id}  # Delete task
```

### Conversation Endpoints
```
GET /api/conversations/{user_id}     # Get user's conversations
GET /api/conversations/{user_id}/{id} # Get specific conversation
DELETE /api/conversations/{user_id}/{id} # Delete conversation
```

## Usage Examples

### Starting a New Chat Session
```python
import requests

response = requests.post('http://localhost:8000/api/chat/user-123', json={
    "message": "Add a task: Finish project documentation"
})
print(response.json())
```

### Continuing an Existing Conversation
```python
response = requests.post('http://localhost:8000/api/chat/user-123', json={
    "message": "Show me my tasks",
    "conversation_id": "existing-conversation-id"
})
print(response.json())
```

## MCP Tool Integration

The system integrates with Model Context Protocol (MCP) tools for all data operations:

- `add_task`: Creates new task items
- `list_tasks`: Retrieves user's task list
- `complete_task`: Marks tasks as completed
- `delete_task`: Deletes task items
- `update_task`: Updates existing task items

These tools ensure all operations are properly audited and tracked.

## Authentication

The system uses Better Auth for user authentication. All API requests must include a valid authentication token in the Authorization header:

```python
headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (malformed input)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (trying to access another user's data)
- `404`: Resource not found
- `500`: Internal server error

Example error response:
```json
{
  "detail": "Invalid input",
  "message": "Message field is required",
  "code": "VALIDATION_ERROR"
}
```

## Docker Configuration

The application is configured for containerized deployment with the following structure:

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - mcp-server
    networks:
      - app-network

  mcp-server:
    build:
      context: ./mcp-server
      dockerfile: docker/Dockerfile.mcp
    environment:
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - app-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=chat_todo_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

## Kubernetes Configuration

The application includes Kubernetes manifests for production deployment:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-backend
  template:
    metadata:
      labels:
        app: chat-backend
    spec:
      containers:
      - name: backend
        image: chat-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Health Checks

The application provides health check endpoints:

```
GET /health     # Application health
GET /health/db  # Database connectivity
GET /health/mcp # MCP server connectivity
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your Neon PostgreSQL connection string is correct
   - Check that the database is accessible from your network

2. **API Key Issues**
   - Ensure your OpenAI API key is valid and has sufficient quota
   - Check that the key is properly set in environment variables

3. **Authentication Issues**
   - Verify Better Auth is properly configured
   - Check that tokens are being passed correctly in requests

4. **MCP Server Issues**
   - Verify MCP server is running and accessible
   - Check that backend can communicate with MCP server

### Logging

The application logs to stdout in JSON format. For development, you can run with verbose logging:

```bash
# With Docker Compose
docker-compose logs -f backend

# With Kubernetes
kubectl logs -f deployment/chat-backend
```