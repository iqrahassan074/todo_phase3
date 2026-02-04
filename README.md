# Chat-Based Todo Management System

A production-ready, chat-based todo management system with Docker and Kubernetes orchestration. The system features a stateless FastAPI server communicating with an MCP server for task operations, using OpenAI Agents SDK for natural language processing, with all state persisted in Neon PostgreSQL.

## Features

- Natural language todo management through AI chatbot
- MCP (Model Context Protocol) tool integration for all data operations
- Stateless server architecture with database-backed conversation persistence
- User authentication and data isolation
- Containerized deployment with Docker and Kubernetes
- Horizontal scaling capability
- Real-time chat interface with conversation history

## Architecture

```
┌───────────────┐    ┌──────────────────────────────────────────────────────┐    ┌───────────────┐
│   Chat UI     │────▶│            FastAPI Server (Dockerized)              │────▶│  Neon DB      │
│   (React)     │    │ • POST /api/{user_id}/chat                          │    │ PostgreSQL    │
└───────────────┘    │ • OpenAI Agents SDK with tool calling               │    └───────────────┘
                     │ • MCP Client for tool execution                     │
                     └──────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                     ┌──────────────────────────────────────────────────────┐
                     │            MCP Server (Dockerized)                  │
                     │ • Exposes tools: add/list/complete/delete/update    │
                     │ • Direct DB operations for task management          │
                     └──────────────────────────────────────────────────────┘
```

### Components

1. **Backend Service** (FastAPI): Handles user requests, authentication, and AI integration
2. **MCP Server**: Exposes standardized tools for task operations
3. **Frontend** (React): ChatKit-based UI for user interaction
4. **Neon PostgreSQL**: Persistent storage for users, tasks, conversations, and messages

## Tech Stack

- **Backend**: Python/3.11+ with FastAPI framework
- **Database**: Neon PostgreSQL with SQLModel ORM
- **Authentication**: Better Auth (planned)
- **AI Integration**: OpenAI Agents SDK with function calling
- **MCP Tools**: Custom MCP server implementation
- **Frontend**: React with ChatKit-like interface
- **Containerization**: Docker and Kubernetes
- **Architecture**: Microservices with stateless design

## Project Structure

```
├── backend/                 # Main backend service
│   ├── alembic/             # Database migrations
│   ├── src/
│   │   ├── models/         # Data models (User, Task, Conversation, Message)
│   │   ├── services/       # Business logic (TaskService, ConversationService, AIService)
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Authentication and other middleware
│   │   └── utils/          # Utilities (database, logging)
│   ├── requirements.txt
│   └── src/main.py         # Application entry point
├── mcp-server/            # MCP tool server
│   ├── src/
│   │   ├── models/         # MCP request/response models
│   │   ├── tools/          # Task tool implementations
│   │   └── server.py       # MCP server entry point
│   └── requirements.txt
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/     # UI components (ChatInterface)
│   │   ├── services/       # API clients
│   │   └── styles/         # CSS styles
│   └── package.json
├── specs/002-todo-hackathon/  # Specifications and documentation
│   ├── spec.md             # Feature specification
│   ├── plan.md             # Implementation plan
│   ├── data-model.md       # Database schema
│   ├── research.md         # Technical research
│   ├── quickstart.md       # Setup guide
│   └── tasks.md            # Implementation tasks
├── k8s/                   # Kubernetes manifests
├── docker/                # Docker configurations
├── docker-compose.yml     # Multi-service orchestration
├── test_e2e.py            # End-to-end tests
└── README.md
```

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend)
- Docker and Docker Compose
- Kubernetes cluster (for production) or Minikube/Docker Desktop (for development)
- Neon PostgreSQL account
- OpenAI API key

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-todo-management
```

2. Set up the backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt
```

3. Set up the MCP server:
```bash
cd ../mcp-server
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt
```

4. Set up the frontend:
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
```

5. Run the services:
```bash
# Terminal 1: Start the MCP server
cd mcp-server
uvicorn src.server:app --reload --port 8001

# Terminal 2: Start the backend
cd backend
uvicorn src.main:app --reload --port 8000

# Terminal 3: Start the frontend
cd frontend
npm start
```

## API Endpoints

### Backend Service (Port 8000)

- `POST /api/chat/{user_id}` - Chat with the AI assistant
- `GET /api/conversations/{user_id}` - Get user's conversations
- `GET /api/conversations/{user_id}/{conversation_id}` - Get conversation history
- `GET /api/tasks/{user_id}` - Get user's tasks
- `POST /api/tasks/{user_id}` - Create a new task
- `PUT /api/tasks/{user_id}/{task_id}` - Update a task
- `PATCH /api/tasks/{user_id}/{task_id}/toggle` - Toggle task completion
- `DELETE /api/tasks/{user_id}/{task_id}` - Delete a task
- `GET /health` - Health check

### MCP Server (Port 8001)

- `POST /tools/add_task` - Add a new task
- `POST /tools/list_tasks` - List tasks
- `POST /tools/complete_task` - Complete a task
- `POST /tools/delete_task` - Delete a task
- `POST /tools/update_task` - Update a task
- `GET /health` - Health check

## Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## Kubernetes Deployment

Apply the Kubernetes manifests:
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml  # Update with actual values
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Running Tests

Execute end-to-end tests:
```bash
python test_e2e.py
```

## Development

The project follows a spec-first, agentic workflow with comprehensive documentation in the `specs/002-todo-hackathon/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`python test_e2e.py`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT