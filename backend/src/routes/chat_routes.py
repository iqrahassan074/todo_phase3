from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import Optional
from uuid import UUID
import uuid

from ..models.message import MessageCreate, MessageRead
from ..services.ai_service import AIService
from ..services.conversation_service import ConversationService
from ..utils.database import get_session

router = APIRouter()


@router.post("/chat/{user_id}", response_model=dict)
async def handle_chat(
    user_id: str,
    message_data: dict,
    session: Session = Depends(get_session)
):
    """
    Handle chat messages from users.

    Args:
        user_id: ID of the user
        message_data: Dictionary containing message and optional conversation_id
        session: Database session

    Returns:
        Dictionary with response content and tasks
    """
    try:
        # Validate input
        if "message" not in message_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content is required"
            )

        message_content = message_data["message"]

        # Convert user_id to UUID
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )

        # Get or create conversation ID
        conversation_id_str = message_data.get("conversation_id")
        if conversation_id_str:
            try:
                conversation_id = UUID(conversation_id_str)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid conversation ID format"
                )
        else:
            # Create a new conversation
            conversation = ConversationService.create_conversation(session, user_uuid)
            conversation_id = conversation.id

        # Add user's message to the conversation
        user_message = ConversationService.add_message_to_conversation(
            session,
            conversation_id,
            user_uuid,
            "user",
            message_content
        )

        if not user_message:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to conversation"
            )

        # Process the message with AI
        ai_service = AIService()
        response = await ai_service.process_chat_message(  # Changed to await for async function
            session,
            user_uuid,
            message_content,
            conversation_id
        )

        # Add AI's response to the conversation
        ai_message = ConversationService.add_message_to_conversation(
            session,
            conversation_id,
            user_uuid,
            "assistant",
            response["content"]
        )

        # Return response with friendly confirmation
        return {
            "id": str(uuid.uuid4()),  # Generate a message ID
            "content": response["content"],
            "conversation_id": str(conversation_id),
            "tasks": response["tasks"],
            "tool_calls": response.get("tool_calls", []),  # Include tool calls in response
            "timestamp": user_message.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}"
        )


@router.get("/conversations/{user_id}")
async def get_user_conversations(
    user_id: str,
    session: Session = Depends(get_session)
):
    """
    Get all conversations for a user.

    Args:
        user_id: ID of the user
        session: Database session

    Returns:
        Dictionary with list of conversations
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    conversations = ConversationService.get_user_conversations(session, user_uuid)

    return {
        "conversations": [
            {
                "id": str(conv.id),
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat()
            }
            for conv in conversations
        ]
    }


@router.get("/conversations/{user_id}/{conversation_id}")
async def get_conversation_history(
    user_id: str,
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """
    Get the history of a specific conversation.

    Args:
        user_id: ID of the user
        conversation_id: ID of the conversation
        session: Database session

    Returns:
        Dictionary with conversation details and messages
    """
    try:
        user_uuid = UUID(user_id)
        conv_uuid = UUID(conversation_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or conversation ID format"
        )

    # Verify the conversation belongs to the user
    conversation = ConversationService.get_conversation(session, conv_uuid, user_uuid)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )

    messages = ConversationService.get_conversation_messages(session, conv_uuid, user_uuid)

    return {
        "conversation": {
            "id": str(conversation.id),
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        },
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }