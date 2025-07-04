import React, { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocket';
import { hapticFeedback } from '../utils/telegram';
import {
  WebSocketChatMessageReceived,
  WebSocketChatStartTyping,
  WebSocketChatStopTyping,
  WebSocketUser
} from '../types';
import { useChatStore, ChatMessage } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

const Chat: React.FC = () => {
  const { 
    currentChatId: chatId, 
    partnerInfo, 
    endChat,
    messages,
    _addMessage
  } = useChatStore();
  
  const { user } = useAuthStore();
  const currentUser = user;

  const [messageInput, setMessageInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Настройка обработчиков WebSocket
    const handleNewMessage = (data: WebSocketChatMessageReceived) => {
      if (data.chatId === chatId) {
        const newMessage: ChatMessage = {
          id: data.message._id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          isFromMe: currentUser ? data.message.sender.telegramId === currentUser.id : false,
          sender: data.message.sender
        };
        
        _addMessage(newMessage);
        
        // Тактильная обратная связь для входящих сообщений
        if (!newMessage.isFromMe) {
          hapticFeedback('light');
        }
      }
    };
    websocketService.onChatMessage(handleNewMessage);

    const handleStartTyping = (data: WebSocketChatStartTyping) => {
      if (data.chatId === chatId && currentUser && data.userId !== currentUser.id.toString()) {
        setPartnerTyping(true);
        if (partnerTypingTimeoutRef.current) {
            clearTimeout(partnerTypingTimeoutRef.current);
        }
        partnerTypingTimeoutRef.current = setTimeout(() => {
            setPartnerTyping(false);
        }, 30000);
      }
    };
    websocketService.onChatStartTyping(handleStartTyping);

    const handleStopTyping = (data: WebSocketChatStopTyping) => {
      if (data.chatId === chatId && currentUser && data.userId !== currentUser.id.toString()) {
        setPartnerTyping(false);
        if (partnerTypingTimeoutRef.current) {
            clearTimeout(partnerTypingTimeoutRef.current);
        }
      }
    };
    websocketService.onChatStopTyping(handleStopTyping);

    // Очистка при размонтировании
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (partnerTypingTimeoutRef.current) {
        clearTimeout(partnerTypingTimeoutRef.current);
      }
    };
  }, [chatId, currentUser, _addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (): void => {
    if (!messageInput.trim() || !chatId) return;

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendStopTyping(chatId);
      }
      
      websocketService.sendMessage(chatId, messageInput.trim());
      setMessageInput('');
      hapticFeedback('light');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      hapticFeedback('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setMessageInput(value);

    if (!isTyping && value.length > 0 && chatId) {
      setIsTyping(true);
      websocketService.sendStartTyping(chatId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length === 0 && isTyping && chatId) {
      setIsTyping(false);
      websocketService.sendStopTyping(chatId);
      return;
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (chatId) {
        setIsTyping(false);
        websocketService.sendStopTyping(chatId);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndChat = (): void => {
    try {
      endChat();
      hapticFeedback('warning');
    } catch (error) {
      console.error('Ошибка завершения чата:', error);
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );

  if (!chatId || !partnerInfo || !currentUser) {
    return (
      <div className="chat-container">
        <div className="chat-header">Загрузка чата...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          {partnerInfo.gender === 'male' ? '👨 Мужской' : '👩 Женский'}, {partnerInfo.age} лет
        </div>
        <button 
          onClick={handleEndChat}
          className="end-chat-button"
        >
          Завершить
        </button>
      </div>

      <div className="messages-area">
        {messages.length === 0 && (
          <div className="messages-area-placeholder">
            Отправьте первое сообщение 👋
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-row ${message.isFromMe ? 'from-me' : ''}`}
          >
            <div
              className={`message-bubble ${message.isFromMe ? 'from-me' : 'from-partner'}`}
            >
              <div>{message.content}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div className="typing-indicator">
            <div className="typing-indicator-bubble">
              Собеседник печатает...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          className="message-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          className="send-button"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default Chat; 