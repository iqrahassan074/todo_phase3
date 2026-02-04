# Textbook Chatbot

A production-ready, AI-native Todo chatbot using MCP and OpenAI Agents with stateless backend, conversation persistence, and containerized deployment.

## Features

- Natural language todo management through AI chatbot
- MCP (Model Context Protocol) tool integration for all data operations
- Stateless server architecture with database-backed conversation persistence
- User authentication and data isolation
- Containerized deployment with Docker

## Tech Stack

- **Backend**: TypeScript/Node.js with Hono framework
- **Database**: Neon PostgreSQL
- **Authentication**: Better Auth
- **AI Integration**: OpenAI API
- **Containerization**: Docker
- **Architecture**: Stateless design with MCP tool integration

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd textbook-chatbot/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `BETTER_AUTH_SECRET` - Secret for authentication

4. Run the application:
```bash
npm run dev  # Development mode
npm run build && npm start  # Production mode
```

## API Endpoints

### Chat
- `POST /api/chat` - Send a message to the chatbot
- `GET /api/chat/:id` - Get conversation history
- `GET /api/chat` - Get all user conversations

### Todos
- `GET /api/todos` - Get all user todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `PATCH /api/todos/:id/toggle` - Toggle todo completion
- `DELETE /api/todos/:id` - Delete a todo

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

## MCP Tool Integration

The system integrates with Model Context Protocol (MCP) tools for all data operations:

- `todo.create`: Creates new todo items
- `todo.update`: Updates existing todo items
- `todo.delete`: Deletes todo items
- `todo.list`: Retrieves user's todo list

## Architecture

The application follows a stateless server design where conversation state is reconstructed from the database on each request. This enables horizontal scaling and fault tolerance.

Key components:
- **Models**: Define data structures and database operations
- **Services**: Business logic and data processing
- **Controllers**: Handle API requests and responses
- **Routes**: Define API endpoints
- **Middleware**: Authentication and other cross-cutting concerns

## Docker Deployment

Build and run with Docker:
```bash
docker build -t textbook-chatbot .
docker run -p 3000:3000 textbook-chatbot
```

Or with Docker Compose:
```bash
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT