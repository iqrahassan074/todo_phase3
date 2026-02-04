# Database Schema & Migrations

## Database Design for Chat-Based Todo Management System

### Technology Stack
- **Database**: Neon PostgreSQL (compatible with standard PostgreSQL)
- **ORM**: SQLModel (built on SQLAlchemy and Pydantic)
- **Migration Tool**: Alembic

## Entity Relationship Diagram

```
Users (1) -----> (Many) Tasks
Users (1) -----> (Many) Conversations
Conversations (1) -----> (Many) Messages
```

## Table Definitions

### 1. users table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient user lookup by email
CREATE INDEX idx_users_email ON users(email);
```

### 2. tasks table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
```

### 3. conversations table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### 4. messages table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
```

## Alembic Migration Script

### Migration File: `alembic/versions/001_initial_schema.py`

```python
"""Initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-02-02 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
import uuid

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create UUID extension if not exists
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # Create users table
    op.create_table('users',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(),
                 server_default=sa.text('gen_random_uuid()'),
                 nullable=False),
        sa.Column('email', sa.VARCHAR(length=255), nullable=False),
        sa.Column('name', sa.VARCHAR(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create tasks table
    op.create_table('tasks',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(),
                 server_default=sa.text('gen_random_uuid()'),
                 nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('title', sa.TEXT(), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(),
                 server_default=sa.text('gen_random_uuid()'),
                 nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create messages table
    op.create_table('messages',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(),
                 server_default=sa.text('gen_random_uuid()'),
                 nullable=False),
        sa.Column('conversation_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('role', sa.VARCHAR(length=20), nullable=False),
        sa.Column('content', sa.TEXT(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                 server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("role IN ('user', 'assistant')", name='valid_role_check')
    )

    # Create indexes
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])
    op.create_index('ix_tasks_completed', 'tasks', ['completed'])
    op.create_index('ix_tasks_user_completed', 'tasks', ['user_id', 'completed'])
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_user_id', 'messages', ['user_id'])
    op.create_index('ix_messages_created_at', 'messages', ['created_at'])
    op.create_index('ix_messages_conversation_created', 'messages', ['conversation_id', 'created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_messages_conversation_created', table_name='messages')
    op.drop_index('ix_messages_created_at', table_name='messages')
    op.drop_index('ix_messages_user_id', table_name='messages')
    op.drop_index('ix_messages_conversation_id', table_name='messages')
    op.drop_index('ix_conversations_user_id', table_name='conversations')
    op.drop_index('ix_tasks_user_completed', table_name='tasks')
    op.drop_index('ix_tasks_completed', table_name='tasks')
    op.drop_index('ix_tasks_user_id', table_name='tasks')
    op.drop_index('ix_users_email', table_name='users')

    # Drop tables
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('tasks')
    op.drop_table('users')
```

## Alembic Environment Configuration

### File: `alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from sqlmodel import SQLModel

# Import your models to register them with SQLModel
from backend.src.models.user import User
from backend.src.models.task import Task
from backend.src.models.conversation import Conversation
from backend.src.models.message import Message

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## Alembic Configuration

### File: `alembic.ini`

```ini
[alembic]
# path to migration scripts
script_location = alembic

# template used to generate migration file names; The default value is %%(rev)s_%%(slug)s
# Uncomment the line below if you want the files to be prepended with date and time
# see https://alembic.sqlalchemy.org/en/latest/tutorial.html#editing-the-ini-file
# for all available tokens
file_template = %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
# defaults to the current working directory.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python>=3.6 and backports.zoneinfo>=0.1
# Or pytz.
# Leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# max_length = 40

# version number format
# version_num_format = %04d

# version path separator; As mentioned above, this is the character used to split
# version_locations. The default within new alembic.ini files is "os", which uses
# os.pathsep. If this key is omitted entirely, it falls back to the legacy
# behavior of splitting on spaces and/or commas.
# Valid values for version_path_separator are:
#
# version_path_separator = :
# version_path_separator = ;
# version_path_separator = space
version_path_separator = os

# the output encoding used when revision files
# are written from script.py.mako
output_encoding = utf-8

sqlalchemy.url = postgresql://username:password@localhost:5432/chat_todo_db


[post_write_hooks]
# post_write_hooks defines scripts or Python functions that are invoked
# automatically after the "revision" command has generated a new revision file.
# See the documentation for further detail and examples

# format using "black" - use the console_scripts runner, against the "black" entrypoint
# hooks = black
# black.type = console_scripts
# black.entrypoint = black
# black.options = -l 79 REVISION_SCRIPT_FILENAME

# lint with attempts to fix using "ruff" - use the exec runner, execute a binary
# hooks = ruff
# ruff.type = exec
# ruff.executable = %(here)s/.venv/bin/ruff
# ruff.options = --fix REVISION_SCRIPT_FILENAME


# Logging configuration
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

## Sample Data Insertion Script

### File: `scripts/seed_database.py`

```python
import asyncio
from sqlmodel import SQLModel, create_engine, Session
from backend.src.models.user import User
from backend.src.models.task import Task
from backend.src.models.conversation import Conversation
from backend.src.models.message import Message
import uuid

def seed_database():
    # Create engine
    engine = create_engine("postgresql://username:password@localhost:5432/chat_todo_db")

    # Create tables
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Create a sample user
        user = User(
            email="demo@example.com",
            name="Demo User"
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Create sample tasks
        task1 = Task(
            user_id=user.id,
            title="Buy groceries",
            description="Milk, bread, eggs",
            completed=False
        )
        task2 = Task(
            user_id=user.id,
            title="Finish report",
            description="Complete the quarterly report",
            completed=True
        )
        session.add(task1)
        session.add(task2)
        session.commit()

        # Create sample conversation
        conversation = Conversation(user_id=user.id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

        # Create sample messages
        message1 = Message(
            conversation_id=conversation.id,
            user_id=user.id,
            role="user",
            content="Add a task to buy groceries"
        )
        message2 = Message(
            conversation_id=conversation.id,
            user_id=user.id,
            role="assistant",
            content="I've added 'Buy groceries' to your task list."
        )
        session.add(message1)
        session.add(message2)
        session.commit()

        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
```

## Database Connection Pool Configuration

### File: `backend/src/utils/database.py` (Enhanced)

```python
from sqlmodel import create_engine, Session
from sqlalchemy.pool import QueuePool
import os

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/chat_todo_db")

# Create the database engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=False           # Set to True for SQL query logging
)


def get_session() -> Session:
    """Get a database session"""
    with Session(engine) as session:
        return session
```

This comprehensive database schema provides:

1. **Proper relationships** between entities
2. **Efficient indexing** for common queries
3. **Referential integrity** with foreign key constraints
4. **Automatic UUID generation** for primary keys
5. **Timestamp tracking** for all records
6. **Cascading deletes** to maintain data consistency
7. **Alembic migrations** for version control
8. **Connection pooling** for performance