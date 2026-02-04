# Data Model: Chat-Based Todo Management System

## Overview

The data model defines the structure for storing user information, tasks, conversations, and messages in the Neon PostgreSQL database. The design follows a normalized relational structure with appropriate indexes for performance.

## Entity Relationships

```
User (1) -----> (Many) Task
User (1) -----> (Many) Conversation
Conversation (1) -----> (Many) Message
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

### Task
Represents a todo item managed through the chatbot

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the task |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to the user who owns the task |
| title | TEXT | NOT NULL | Title/description of the task |
| description | TEXT | | Optional detailed description of the task |
| completed | BOOLEAN | DEFAULT FALSE | Whether the task is marked as completed |
| created_at | TIMESTAMP | DEFAULT NOW() | When the task was created |
| updated_at | TIMESTAMP | DEFAULT NOW() | When the task was last updated |

### Conversation
Represents a single conversation thread between user and AI

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the conversation |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to the owning user |
| created_at | TIMESTAMP | DEFAULT NOW() | When the conversation was started |
| updated_at | TIMESTAMP | DEFAULT NOW() | When the conversation was last updated |

### Message
Represents an individual message in a conversation (user input or AI response)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for the message |
| conversation_id | UUID | FOREIGN KEY (conversations.id), NOT NULL | Reference to the parent conversation |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to the user who sent the message |
| role | VARCHAR(20) | NOT NULL, CHECK | Role of the message sender ('user' or 'assistant') |
| content | TEXT | NOT NULL | The actual message content |
| created_at | TIMESTAMP | DEFAULT NOW() | When the message was sent |

## Database Indexes

- `users_email_idx`: INDEX ON users(email) - For efficient user lookup by email
- `tasks_user_id_idx`: INDEX ON tasks(user_id) - For efficient retrieval of user's tasks
- `conversations_user_id_idx`: INDEX ON conversations(user_id) - For efficient retrieval of user's conversations
- `messages_conversation_id_idx`: INDEX ON messages(conversation_id) - For efficient retrieval of messages in a conversation
- `tasks_completed_idx`: INDEX ON tasks(completed) - For efficient filtering of completed/incomplete tasks

## Data Integrity Rules

1. **Referential Integrity**: Foreign key constraints ensure related records exist
2. **User Isolation**: All queries must filter by user_id to prevent cross-user data access
3. **Timestamp Consistency**: created_at and updated_at fields automatically managed by triggers
4. **Message Ordering**: Messages retrieved with ORDER BY created_at for chronological sequence

## Sample Queries

### Get user's active tasks
```sql
SELECT id, title, description, completed, created_at
FROM tasks
WHERE user_id = $1 AND completed = FALSE
ORDER BY created_at ASC;
```

### Get conversation with messages
```sql
SELECT c.id as conversation_id, m.role, m.content, m.created_at
FROM conversations c
JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = $1 AND c.id = $2
ORDER BY m.created_at;
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

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX tasks_completed_idx ON tasks(completed);
```

## API Contract for MCP Tools

### Task Creation
```python
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """
    Creates a new task for the specified user.

    Args:
        user_id: UUID of the user
        title: Title of the task
        description: Optional description of the task

    Returns:
        Dictionary with task_id, status, and title
    """
```

### Task Listing
```python
def list_tasks(user_id: str, status: str = None) -> list:
    """
    Lists tasks for the specified user.

    Args:
        user_id: UUID of the user
        status: Optional status filter ('all', 'completed', 'pending')

    Returns:
        List of task objects
    """
```

### Task Completion
```python
def complete_task(user_id: str, task_id: str) -> dict:
    """
    Marks a task as completed.

    Args:
        user_id: UUID of the user
        task_id: UUID of the task to complete

    Returns:
        Dictionary with task_id, status, and title
    """
```

### Task Deletion
```python
def delete_task(user_id: str, task_id: str) -> dict:
    """
    Deletes a task.

    Args:
        user_id: UUID of the user
        task_id: UUID of the task to delete

    Returns:
        Dictionary with task_id, status, and title
    """
```

### Task Update
```python
def update_task(user_id: str, task_id: str, title: str = None, description: str = None) -> dict:
    """
    Updates a task.

    Args:
        user_id: UUID of the user
        task_id: UUID of the task to update
        title: New title (optional)
        description: New description (optional)

    Returns:
        Dictionary with task_id, status, and title
    """
```