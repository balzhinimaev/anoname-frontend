import React, { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocket';
import { hapticFeedback } from '../utils/telegram';
import {
  WebSocketChatMessageReceived,
  WebSocketChatTyping,
  WebSocketUser
} from '../types';

interface ChatProps {
  chatId: string;
  partnerInfo: {
    telegramId: string;
    gender: 'male' | 'female';
    age: number;
  };
  currentUser: WebSocketUser | null;
  onEndChat: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  sender: WebSocketUser;
}

const Chat: React.FC<ChatProps> = ({ chatId, partnerInfo, currentUser, onEndChat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Настройка обработчиков WebSocket
    websocketService.onChatMessage((data: WebSocketChatMessageReceived) => {
      if (data.chatId === chatId) {
        const newMessage: ChatMessage = {
          id: data.message._id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          isFromMe: currentUser ? data.message.sender.telegramId === currentUser.telegramId : false,
          sender: data.message.sender
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Тактильная обратная связь для входящих сообщений
        if (!newMessage.isFromMe) {
          hapticFeedback('light');
        }
      }
    });

    websocketService.onChatTyping((data: WebSocketChatTyping) => {
      if (data.chatId === chatId && currentUser && data.userId !== currentUser.telegramId.toString()) {
        setPartnerTyping(true);
        
        // Убираем индикатор через 3 секунды
        setTimeout(() => setPartnerTyping(false), 3000);
      }
    });

    // Очистка при размонтировании
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    // Прокрутка к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (): void => {
    if (!messageInput.trim()) return;

    try {
      websocketService.sendMessage(chatId, messageInput.trim());
      setMessageInput('');
      setIsTyping(false);
      // Сбрасываем таймаут, чтобы индикатор "печатает" не отправился после сообщения
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      hapticFeedback('light');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      hapticFeedback('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setMessageInput(value);

    // Отправляем событие набора текста
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      websocketService.sendTyping(chatId);
    }

    // Сбрасываем флаг набора через 2 секунды бездействия
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndChat = (): void => {
    try {
      websocketService.endChat(chatId, 'user_ended');
      onEndChat();
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

  return (
    <div className="chat-container">
      {/* Заголовок чата */}
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

      {/* Область сообщений */}
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

      {/* Поле ввода */}
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