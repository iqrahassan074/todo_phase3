# Data Model: Textbook Chatbot

## Overview

The data model defines the structure for storing user information, conversations, messages, and todos in the Neon PostgreSQL database. The design follows a normalized relational structure with appropriate indexes for performance.

## Entity Relationships

```
User (1) -----> (Many) Conversation
Conversation (1) -----> (Many) Message
Conversation (1) -----> (Many) Todo
```

## Entity Definitions

### User
Represents a registered user in the system

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the user |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| name | VARCHAR(255) | | User's display name |
| created_at | TIMESTAMP | DEFAULT NOW() | When the user account was created |
| updated_at | TIMESTAMP | DEFAULT NOW() | When the user account was last updated |

### Conversation
Represents a single conversation thread between user and AI

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the conversation |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to the owning user |
| title | VARCHAR(255) | | Auto-generated title based on first message |
| created_at | TIMESTAMP | DEFAULT NOW() | When the conversation was started |
| updated_at | TIMESTAMP | DEFAULT NOW() | When the conversation was last updated |

### Message
Represents an individual message in a conversation (user input or AI response)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the message |
| conversation_id | UUID | FOREIGN KEY (conversations.id), NOT NULL | Reference to the parent conversation |
| role | VARCHAR(20) | NOT NULL, CHECK | Role of the message sender ('user' or 'assistant') |
| content | TEXT | NOT NULL | The actual message content |
| timestamp | TIMESTAMP | DEFAULT NOW() | When the message was sent |
| metadata | JSONB | | Additional metadata (tokens used, model version, etc.) |

### Todo
Represents a task item managed through the chatbot

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the todo |
| conversation_id | UUID | FOREIGN KEY (conversations.id), NOT NULL | Reference to the conversation where it was created |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to the user who owns the todo |
| title | TEXT | NOT NULL | Title/description of the todo |
| completed | BOOLEAN | DEFAULT FALSE | Whether the todo is marked as completed |
| priority | INTEGER | DEFAULT 0 | Priority level (0-5 scale) |
| due_date | TIMESTAMP | | Optional due date for the todo |
| created_at | TIMESTAMP | DEFAULT NOW() | When the todo was created |
| updated_at | TIMESTAMP | DEFAULT NOW() | When the todo was last updated |

## Database Indexes

- `users_email_idx`: INDEX ON users(email) - For efficient user lookup by email
- `conversations_user_id_idx`: INDEX ON conversations(user_id) - For efficient retrieval of user's conversations
- `messages_conversation_id_idx`: INDEX ON messages(conversation_id) - For efficient retrieval of messages in a conversation
- `todos_user_id_idx`: INDEX ON todos(user_id) - For efficient retrieval of user's todos
- `todos_completed_idx`: INDEX ON todos(completed) - For efficient filtering of completed/incomplete todos
- `todos_conversation_id_idx`: INDEX ON todos(conversation_id) - For linking todos to conversations

## Data Integrity Rules

1. **Referential Integrity**: Foreign key constraints ensure related records exist
2. **User Isolation**: All queries must filter by user_id to prevent cross-user data access
3. **Timestamp Consistency**: created_at and updated_at fields automatically managed by triggers
4. **Message Ordering**: Messages retrieved with ORDER BY timestamp for chronological sequence

## Sample Queries

### Get user's active todos
```sql
SELECT id, title, completed, priority, due_date
FROM todos
WHERE user_id = $1 AND completed = FALSE
ORDER BY priority DESC, created_at ASC;
```

### Get conversation with messages
```sql
SELECT c.title, m.role, m.content, m.timestamp
FROM conversations c
JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = $1 AND c.id = $2
ORDER BY m.timestamp;
```

## Migration Strategy

### Initial Schema (001-initial-schema.sql)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create todos table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX todos_user_id_idx ON todos(user_id);
CREATE INDEX todos_completed_idx ON todos(completed);
CREATE INDEX todos_conversation_id_idx ON todos(conversation_id);
```