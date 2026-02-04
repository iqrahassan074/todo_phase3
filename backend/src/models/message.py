from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class MessageBase(SQLModel):
    role: str = Field(regex="^(user|assistant)$")  # Either 'user' or 'assistant'
    content: str


class Message(MessageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessageCreate(MessageBase):
    pass


class MessageRead(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime