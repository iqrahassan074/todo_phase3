from typing import List, Optional
from sqlmodel import Session, select
from ..models.conversation import Conversation, ConversationCreate
from ..models.message import Message, MessageCreate
from uuid import UUID


class ConversationService:
    @staticmethod
    def create_conversation(session: Session, user_id: UUID) -> Conversation:
        """
        Creates a new conversation for the specified user.

        Args:
            session: Database session
            user_id: UUID of the user

        Returns:
            Created Conversation object
        """
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return conversation

    @staticmethod
    def get_conversation(session: Session, conversation_id: UUID, user_id: UUID) -> Optional[Conversation]:
        """
        Gets a specific conversation by ID for the specified user.

        Args:
            session: Database session
            conversation_id: UUID of the conversation
            user_id: UUID of the user

        Returns:
            Conversation object if found, None otherwise
        """
        conversation = session.get(Conversation, conversation_id)
        if conversation and conversation.user_id == user_id:
            return conversation
        return None

    @staticmethod
    def get_user_conversations(session: Session, user_id: UUID) -> List[Conversation]:
        """
        Gets all conversations for the specified user.

        Args:
            session: Database session
            user_id: UUID of the user

        Returns:
            List of Conversation objects
        """
        query = select(Conversation).where(Conversation.user_id == user_id)
        conversations = session.exec(query).all()
        return conversations

    @staticmethod
    def add_message_to_conversation(
        session: Session,
        conversation_id: UUID,
        user_id: UUID,
        role: str,
        content: str
    ) -> Optional[Message]:
        """
        Adds a message to a conversation.

        Args:
            session: Database session
            conversation_id: UUID of the conversation
            user_id: UUID of the user
            role: Role of the message sender ('user' or 'assistant')
            content: Content of the message

        Returns:
            Created Message object if successful, None otherwise
        """
        # Verify the conversation belongs to the user
        conversation = session.get(Conversation, conversation_id)
        if not conversation or conversation.user_id != user_id:
            return None

        message = Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content
        )

        session.add(message)
        session.commit()
        session.refresh(message)
        return message

    @staticmethod
    def get_conversation_messages(session: Session, conversation_id: UUID, user_id: UUID) -> List[Message]:
        """
        Gets all messages for a conversation belonging to the user.

        Args:
            session: Database session
            conversation_id: UUID of the conversation
            user_id: UUID of the user

        Returns:
            List of Message objects
        """
        # Verify the conversation belongs to the user
        conversation = session.get(Conversation, conversation_id)
        if not conversation or conversation.user_id != user_id:
            return []

        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)

        messages = session.exec(query).all()
        return messages

    @staticmethod
    def reconstruct_conversation_state(
        session: Session,
        conversation_id: UUID,
        user_id: UUID
    ) -> Optional[dict]:
        """
        Reconstructs the conversation state from the database.

        Args:
            session: Database session
            conversation_id: UUID of the conversation
            user_id: UUID of the user

        Returns:
            Dictionary with conversation state if successful, None otherwise
        """
        conversation = ConversationService.get_conversation(session, conversation_id, user_id)
        if not conversation:
            return None

        messages = ConversationService.get_conversation_messages(session, conversation_id, user_id)

        # Get user's tasks
        from .task_service import TaskService
        tasks = TaskService.get_tasks(session, user_id)

        return {
            'conversation': conversation,
            'messages': messages,
            'tasks': tasks
        }