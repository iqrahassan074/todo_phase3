# Quickstart Guide: Textbook Chatbot

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Neon PostgreSQL account and connection string
- OpenAI API key (or compatible provider)
- Better Auth configured

## Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd textbook-chatbot

# Install dependencies
npm install
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
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Database Setup

Run the initial database migration:

```bash
# Using direct SQL execution
psql $DATABASE_URL < migrations/001-initial-schema.sql

# Or if using a migration tool
npm run migrate
```

### 4. Running the Application

#### Development Mode
```bash
# Start the development server
npm run dev
```

The server will be available at `http://localhost:3000`

#### Production Mode
```bash
# Build the application
npm run build

# Start the production server
npm start
```

#### Docker Deployment
```bash
# Build and start with Docker Compose
docker-compose up --build

# Or run individual containers
docker build -t textbook-chatbot .
docker run -p 3000:3000 textbook-chatbot
```

## API Endpoints

### Chat Endpoint
```
POST /api/chat
```
Body:
```json
{
  "message": "Add a todo: Buy groceries",
  "conversationId": "optional-existing-conversation-id"
}
```

Response:
```json
{
  "id": "message-id",
  "content": "I've added 'Buy groceries' to your todo list.",
  "conversationId": "new-or-existing-conversation-id",
  "todos": [
    {
      "id": "todo-id",
      "title": "Buy groceries",
      "completed": false,
      "priority": 0
    }
  ]
}
```

### Todos Endpoints
```
GET /api/todos          # Get all user todos
POST /api/todos         # Create new todo
PUT /api/todos/:id      # Update todo
DELETE /api/todos/:id   # Delete todo
```

### Conversations Endpoints
```
GET /api/conversations     # Get user's conversations
GET /api/conversations/:id # Get specific conversation
DELETE /api/conversations/:id # Delete conversation
```

## Usage Examples

### Starting a New Chat Session
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Add a todo: Finish project documentation"
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Continuing an Existing Conversation
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Show me my todos",
    conversationId: "existing-conversation-id"
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## MCP Tool Integration

The system integrates with Model Context Protocol (MCP) tools for all data operations:

- `todo.create`: Creates new todo items
- `todo.update`: Updates existing todo items
- `todo.delete`: Deletes todo items
- `todo.list`: Retrieves user's todo list
- `conversation.get`: Retrieves conversation history

These tools ensure all operations are properly audited and tracked.

## Authentication

The system uses Better Auth for user authentication. All API requests must include a valid authentication token in the Authorization header:

```javascript
headers: {
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
  "error": "Invalid input",
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
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=textbook_chatbot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
```

## Health Checks

The application provides health check endpoints:

```
GET /health     # Application health
GET /health/db  # Database connectivity
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

### Logging

The application logs to stdout in JSON format. For development, you can run with verbose logging:

```bash
DEBUG=textbook-chatbot:* npm run dev
```