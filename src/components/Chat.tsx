import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useTelegramHaptics, useTypingIndicator, useSearchStats } from '../hooks';

const Chat: React.FC = () => {
  const { 
    partnerInfo, 
    endChat,
    messages,
    sendMessage,
    sendStartTyping,
    sendStopTyping,
    isPartnerTyping
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hapticFeedback } = useTelegramHaptics();
  const searchStats = useSearchStats();
  
  const { isTyping, startTyping, stopTyping } = useTypingIndicator(
    sendStartTyping,
    sendStopTyping,
    2000 // таймаут в мс
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (messages.length > 0 && !messages[messages.length - 1].isFromMe) {
        hapticFeedback('light');
    }
  }, [messages, hapticFeedback]);

  // Функция для определения, должны ли сообщения быть сгруппированы
  const shouldGroupWithPrevious = (currentIndex: number): boolean => {
    if (currentIndex === 0) return false;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    // Проверяем, что отправитель тот же
    if (currentMessage.isFromMe !== previousMessage.isFromMe) return false;
    
    // Проверяем временной интервал (1 минута = 60000 мс)
    const currentTime = new Date(currentMessage.timestamp).getTime();
    const previousTime = new Date(previousMessage.timestamp).getTime();
    const timeDifference = currentTime - previousTime;
    
    return timeDifference <= 60000; // 1 минута
  };

  const shouldGroupWithNext = (currentIndex: number): boolean => {
    if (currentIndex === messages.length - 1) return false;
    
    const currentMessage = messages[currentIndex];
    const nextMessage = messages[currentIndex + 1];
    
    // Проверяем, что отправитель тот же
    if (currentMessage.isFromMe !== nextMessage.isFromMe) return false;
    
    // Проверяем временной интервал (1 минута = 60000 мс)
    const currentTime = new Date(currentMessage.timestamp).getTime();
    const nextTime = new Date(nextMessage.timestamp).getTime();
    const timeDifference = nextTime - currentTime;
    
    return timeDifference <= 60000; // 1 минута
  };

  const handleSendMessage = (): void => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput);
    setMessageInput('');
    stopTyping(); // Немедленно останавливаем индикатор после отправки
    hapticFeedback('light');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setMessageInput(value);

    if (value) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndChat = (): void => {
    endChat();
    hapticFeedback('warning');
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const truncateUsername = (username: string): string => {
    return username.length > 9 ? username.slice(0, 9) + "..." : username;
  };

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
  
  const TypingIndicator = () => (
    <div className="typing-indicator">
        <span />
        <span />
        <span />
    </div>
  );

  if (!partnerInfo) {
    return (
      <>
        {searchStats && (
          <div className="compact-stats">
            онлайн: {searchStats.online.t} | ищут: {searchStats.t} | в чате: {searchStats.inChat || 0}
          </div>
        )}
        <div className="chat-container">
          <div className="chat-header">Загрузка чата...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {searchStats && (
        <div className="compact-stats">
          онлайн: {searchStats.online.t} | ищут: {searchStats.t} | в чате: {searchStats.inChat || 0}
        </div>
      )}
      <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info" onClick={() => {}}>
          <div className="avatar">
            {partnerInfo.gender === 'male' ? '👨' : '👩'}
          </div>
          <div className="user-info">
            <div className="username">
              {truncateUsername("anoname")}
            </div>
            <div className="user-age">{partnerInfo.age} лет</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            onClick={handleEndChat}
            className="end-chat-button"
          >
            Завершить
          </button>
          <button 
            onClick={() => {}}
            className="chat-menu-button"
            title="Меню чата"
          >
            ⋮
          </button>
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 && !isPartnerTyping && (
          <div className="messages-area-placeholder">
            Отправьте первое сообщение 👋
          </div>
        )}

        {messages.map((message, index) => {
          const isGroupedWithPrevious = shouldGroupWithPrevious(index);
          const isGroupedWithNext = shouldGroupWithNext(index);
          
          return (
            <div
              key={message.id}
              className={`message-bubble ${message.isFromMe ? 'my-message' : 'partner-message'} ${
                isGroupedWithPrevious ? 'grouped-with-previous' : ''
              } ${
                isGroupedWithNext ? 'grouped-with-next' : ''
              }`}
            >
              <div className="message-content-wrapper">
                <div className="message-content">{message.content}</div>
                <div className="message-time-spacer"></div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          );
        })}

        {isPartnerTyping && (
          <div className="message-bubble partner-message">
              <TypingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <input
          type="text"
          placeholder="Напишите сообщение..."
          className="message-input"
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!partnerInfo}
        />
        <button 
          onClick={handleSendMessage}
          className="send-button"
          disabled={!messageInput.trim()}
        >
          <SendIcon />
        </button>
      </div>
    </div>
    </>
  );
};

export default Chat; 