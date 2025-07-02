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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxHeight: '600px',
      background: 'var(--tg-theme-bg-color, #fff)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Заголовок чата */}
      <div style={{
        padding: '16px',
        background: 'var(--tg-theme-button-color, #0088cc)',
        color: 'var(--tg-theme-button-text-color, white)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontWeight: 'bold' }}>
            💬 Анонимный чат
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            {partnerInfo.gender === 'male' ? 'Мужчина' : 'Женщина'}, {partnerInfo.age} лет
          </div>
        </div>
        <button 
          onClick={handleEndChat}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Завершить
        </button>
      </div>

      {/* Область сообщений */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--tg-theme-hint-color, #999)',
            padding: '20px'
          }}>
            💬 Начните общение! Отправьте первое сообщение.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: message.isFromMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '8px'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: message.isFromMe
                  ? 'var(--tg-theme-button-color, #0088cc)'
                  : 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
                color: message.isFromMe
                  ? 'var(--tg-theme-button-text-color, white)'
                  : 'var(--tg-theme-text-color, #000)',
                wordBreak: 'break-word'
              }}
            >
              <div>{message.content}</div>
              <div style={{
                fontSize: '12px',
                opacity: 0.7,
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--tg-theme-hint-color, #999)',
            fontSize: '14px'
          }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
              borderRadius: '12px'
            }}>
              Собеседник печатает...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--tg-theme-secondary-bg-color, #f1f1f1)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid var(--tg-theme-secondary-bg-color, #e1e1e1)',
            borderRadius: '20px',
            outline: 'none',
            background: 'var(--tg-theme-bg-color, #fff)',
            color: 'var(--tg-theme-text-color, #000)'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          style={{
            background: messageInput.trim() 
              ? 'var(--tg-theme-button-color, #0088cc)' 
              : 'var(--tg-theme-hint-color, #999)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '20px',
            cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat; 