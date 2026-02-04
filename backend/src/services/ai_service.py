import openai
import json
from typing import Dict, Any, List, Union
from sqlmodel import Session
from ..models.message import Message
from uuid import UUID
import os
import httpx


class AIService:
    def __init__(self):
        # Initialize OpenAI client
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # Base URL for MCP server
        self.mcp_base_url = os.getenv("MCP_SERVER_URL", "http://mcp-server:8001")

    def get_openai_tools(self):
        """Return tools in OpenAI function format"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "add_task",
                    "description": "Create a new task for the user",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "The user's unique identifier"},
                            "title": {"type": "string", "description": "The title of the task to create"},
                            "description": {"type": "string", "description": "Optional detailed description of the task"}
                        },
                        "required": ["user_id", "title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "Get the user's tasks, optionally filtered by completion status",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "The user's unique identifier"},
                            "status": {"type": "string", "enum": ["all", "completed", "pending"], "description": "Filter tasks by completion status (default: all)"}
                        },
                        "required": ["user_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "The user's unique identifier"},
                            "task_id": {"type": "string", "description": "The unique identifier of the task to complete"}
                        },
                        "required": ["user_id", "task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Delete a task",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "The user's unique identifier"},
                            "task_id": {"type": "string", "description": "The unique identifier of the task to delete"}
                        },
                        "required": ["user_id", "task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_task",
                    "description": "Update the details of a task",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "The user's unique identifier"},
                            "task_id": {"type": "string", "description": "The unique identifier of the task to update"},
                            "title": {"type": "string", "description": "New title for the task (optional)"},
                            "description": {"type": "string", "description": "New description for the task (optional)"}
                        },
                        "required": ["user_id", "task_id"]
                    }
                }
            }
        ]

    async def call_mcp_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool via HTTP"""
        url = f"{self.mcp_base_url}/tools/{tool_name}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=args, timeout=30.0)

                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"MCP tool {tool_name} failed",
                        "status_code": response.status_code,
                        "message": response.text
                    }
        except Exception as e:
            return {
                "error": f"Failed to call MCP tool {tool_name}",
                "details": str(e)
            }

    def generate_response_based_on_tools(self, original_content: str, tool_results: List[Dict[str, Any]]) -> str:
        """Generate a final response based on tool execution results"""
        if not tool_results:
            return original_content or "I processed your request."

        # Build a response based on tool results
        responses = []

        for result in tool_results:
            if "error" in result:
                responses.append(f"Error: {result['error']}")
            elif "task_id" in result:
                # This is a single task response
                status = result.get("status", "processed")
                title = result.get("title", "a task")
                responses.append(f"I have {status} '{title}' for you.")
            elif "tasks" in result:
                # This is a list_tasks response
                task_count = len(result["tasks"])
                responses.append(f"You have {task_count} tasks in your list.")

        # Combine the original content with tool responses
        tool_response = " ".join(responses)
        if original_content:
            return f"{original_content} {tool_response}".strip()
        else:
            return tool_response

    async def process_chat_message(
        self,
        session: Session,
        user_id: UUID,
        message_content: str,
        conversation_id: UUID
    ) -> Dict[str, Any]:
        """
        Process a chat message using OpenAI with tool calling and return a response.

        Args:
            session: Database session
            user_id: UUID of the user
            message_content: Content of the user's message
            conversation_id: UUID of the conversation

        Returns:
            Dictionary with response content and any tasks affected
        """
        # Get conversation history for context
        from .conversation_service import ConversationService
        conversation_state = ConversationService.reconstruct_conversation_state(
            session, conversation_id, user_id
        )

        if not conversation_state:
            return {
                "content": "Error: Conversation not found or access denied",
                "tasks": []
            }

        # Format messages for the AI
        messages = self._format_messages_for_ai(
            conversation_state['messages'],
            message_content,
            conversation_state['tasks']
        )

        try:
            # Call OpenAI API with tools
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Could be configurable
                messages=messages,
                tools=self.get_openai_tools(),
                tool_choice="auto",
                temperature=0.7
            )

            response_message = response.choices[0].message

            # Check if the model wanted to call a tool
            tool_calls = response_message.tool_calls

            if tool_calls:
                # Process tool calls
                tool_results = []
                tasks_affected = []

                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    # Add user_id to function args since it's needed for all tools
                    function_args["user_id"] = str(user_id)

                    # Execute the appropriate tool
                    result = await self.call_mcp_tool(function_name, function_args)
                    tool_results.append(result)

                    # Collect affected tasks
                    if "task_id" in result and "title" in result:
                        tasks_affected.append(result)
                    elif "tasks" in result:
                        # For list_tasks, we'll return the tasks
                        tasks_affected.extend(result["tasks"])

                # Generate final response based on tool results
                final_response = self.generate_response_based_on_tools(
                    response_message.content,
                    tool_results
                )

                return {
                    "content": final_response,
                    "tasks": tasks_affected,
                    "tool_calls": [tc.function.name for tc in tool_calls]  # Track which tools were called
                }
            else:
                # No tool calls, return direct response
                return {
                    "content": response_message.content or "I processed your request.",
                    "tasks": [],
                    "tool_calls": []
                }

        except Exception as e:
            return {
                "content": f"Sorry, I encountered an error processing your request: {str(e)}",
                "tasks": [],
                "tool_calls": []
            }

    def _format_messages_for_ai(
        self,
        existing_messages: List[Message],
        new_message: str,
        user_tasks: List[Any]  # Using Any since we'll define task structure elsewhere
    ) -> List[Dict[str, str]]:
        """
        Format messages for the AI model.

        Args:
            existing_messages: List of existing messages in the conversation
            new_message: The new message to process
            user_tasks: List of user's current tasks

        Returns:
            List of formatted messages for the AI
        """
        # System message with instructions
        formatted_messages = [{
            "role": "system",
            "content": (
                "You are a helpful and friendly todo management assistant. Your purpose is to help users manage their tasks using natural language.\n\n"
                "Follow these guidelines:\n"
                "1. Always be polite and friendly in your responses\n"
                "2. Interpret the user's intent from their natural language input\n"
                "3. Use the appropriate MCP tools to perform actions\n"
                "4. After performing an action, provide a clear confirmation to the user\n"
                "5. If you're unsure about what the user wants, ask for clarification\n"
                "6. Keep your responses concise but informative\n\n"
                "Available actions you can perform using MCP tools:\n"
                "- Add new tasks to the user's list\n"
                "- List all tasks or filter by completion status\n"
                "- Mark tasks as completed\n"
                "- Update task details\n"
                "- Delete tasks\n\n"
                "Remember: You must use the MCP tools for all data operations. Do not pretend to perform actions without using the tools."
            )
        }]

        # Add information about current tasks
        if user_tasks:
            tasks_info = "Current tasks:\n"
            for i, task in enumerate(user_tasks):
                status = "✓" if getattr(task, 'completed', False) else "○"
                title = getattr(task, 'title', 'Untitled')
                tasks_info += f"{i+1}. [{status}] {title}\n"
            formatted_messages.append({
                "role": "system",
                "content": tasks_info
            })

        # Add existing conversation history (limit to last 10 messages for context)
        for msg in existing_messages[-10:]:  # Last 10 messages for context
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add the new user message
        formatted_messages.append({
            "role": "user",
            "content": new_message
        })

        return formatted_messages

    def detect_intent(self, message: str) -> str:
        """
        Detect the user's intent from their message.

        Args:
            message: User's message

        Returns:
            Detected intent (e.g., 'add_task', 'list_tasks', 'complete_task', etc.)
        """
        message_lower = message.lower()

        # Simple keyword-based intent detection
        # In a real implementation, this would use more sophisticated NLP
        if any(word in message_lower for word in ['add', 'create', 'make', 'new task']):
            return 'add_task'
        elif any(word in message_lower for word in ['list', 'show', 'view', 'my tasks', 'all tasks']):
            return 'list_tasks'
        elif any(word in message_lower for word in ['complete', 'done', 'finish', 'mark']):
            return 'complete_task'
        elif any(word in message_lower for word in ['delete', 'remove', 'cancel']):
            return 'delete_task'
        elif any(word in message_lower for word in ['update', 'change', 'edit', 'modify']):
            return 'update_task'
        else:
            return 'unknown'