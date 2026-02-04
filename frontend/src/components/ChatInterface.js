import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [userId, setUserId] = useState('demo-user-' + uuidv4()); // Demo user ID
  const messagesEndRef = useRef(null);

  // Load conversation from localStorage if available
  useEffect(() => {
    const savedConversation = localStorage.getItem('todoChatConversation');
    const savedMessages = localStorage.getItem('todoChatMessages');

    if (savedConversation) {
      setConversationId(savedConversation);
    }

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoChatMessages', JSON.stringify(messages));
    if (conversationId) {
      localStorage.setItem('todoChatConversation', conversationId);
    }
  }, [messages, conversationId]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/chat/${userId}`, {
        message: inputValue,
        conversation_id: conversationId || undefined
      });

      const { content, conversation_id, tasks, tool_calls } = response.data;

      // Update conversation ID if new one was created
      if (conversation_id && !conversationId) {
        setConversationId(conversation_id);
      }

      // Add AI response to the chat
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: content,
        tasks: tasks || [],
        tool_calls: tool_calls || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (message) => {
    if (message.isError) {
      return <span className="error-message">{message.content}</span>;
    }

    // If there are tool calls, show them as well
    if (message.tool_calls && message.tool_calls.length > 0) {
      return (
        <div>
          <div>{message.content}</div>
          <div className="tool-calls-info">
            Actions performed: {message.tool_calls.join(', ')}
          </div>
        </div>
      );
    }

    return <div>{message.content}</div>;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Todo Assistant</h2>
        <div className="chat-status">
          <span className="status-indicator online"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="ai-avatar">🤖</div>
            <h3>Hello! I'm your AI Todo Assistant</h3>
            <p>How can I help you manage your tasks today?</p>
            <div className="suggested-prompts">
              <button onClick={() => setInputValue("Add a task: Buy groceries")}>
                Add a task: Buy groceries
              </button>
              <button onClick={() => setInputValue("Show me my tasks")}>
                Show me my tasks
              </button>
              <button onClick={() => setInputValue("Mark task #1 as complete")}>
                Mark task #1 as complete
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {formatMessage(message)}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
          rows="1"
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          <span>➤</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;