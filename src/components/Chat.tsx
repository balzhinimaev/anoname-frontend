import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useTelegramHaptics, useTypingIndicator, useSearchStats } from '../hooks';
import EmojiPicker from './EmojiPicker';

const Chat: React.FC = () => {
  const { 
    partnerInfo, 
    endChat,
    messages,
    sendMessage,
    sendStartTyping,
    sendStopTyping,
    isPartnerTyping,
    replyingTo,
    setReplyingTo
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hapticFeedback } = useTelegramHaptics();
  const searchStats = useSearchStats();
  
  // Состояние для выпадающего меню
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Состояние для emoji picker
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  useEffect(() => {
    console.log('isEmojiPickerOpen state changed to:', isEmojiPickerOpen);
  }, [isEmojiPickerOpen]);
  
  // Состояние для swipe функционала
  const [swipeState, setSwipeState] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwiping: false,
    isSwipeActive: false, // Активируется только при значительном движении
    swipeMessageId: null as string | null
  });

  // Состояние для выделения сообщений
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Глобальные обработчики mouse событий для desktop drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!swipeState.isSwiping) return;
      
      const deltaX = e.clientX - swipeState.startX;
      const deltaY = Math.abs(e.clientY - swipeState.startY);
      
              // Если движение больше вертикально, отменяем swipe
        if (deltaY > Math.abs(deltaX)) {
          setSwipeState(prev => ({ ...prev, isSwiping: false, isSwipeActive: false }));
          return;
        }
      
      // Предотвращаем default поведение только если есть значительное движение
      if (Math.abs(deltaX) > 10 || deltaY > 10) {
        e.preventDefault();
      }
      
      // Активируем swipe только при значительном движении
      const shouldActivate = Math.abs(deltaX) > 10;
      
      setSwipeState(prev => ({ 
        ...prev, 
        currentX: e.clientX,
        isSwipeActive: shouldActivate
      }));
    };

    const handleGlobalMouseUp = () => {
      if (!swipeState.isSwiping) return;
      
      const deltaX = swipeState.currentX - swipeState.startX;
      const SWIPE_THRESHOLD = 40;
      
      if (deltaX > SWIPE_THRESHOLD && swipeState.swipeMessageId) {
        const message = messages.find(msg => msg.id === swipeState.swipeMessageId);
        if (message) {
          handleReplyToMessage(message);
        }
      }
      
      // Мгновенно сбрасываем состояние - CSS анимация сделает плавный возврат
      setSwipeState({
        startX: 0,
        startY: 0,
        currentX: 0,
        isSwiping: false,
        isSwipeActive: false,
        swipeMessageId: null
      });
    };

    if (swipeState.isSwiping) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [swipeState.isSwiping, swipeState.startX, swipeState.currentX, swipeState.swipeMessageId, messages]);

  // Обработчик для закрытия меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Обработчик для кнопки меню
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    hapticFeedback('light');
  };

  // Обработчики для пунктов меню
  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false);
    hapticFeedback('light');
    
    switch (action) {
      case 'theme':
        console.log('Переключение темы');
        break;
      case 'stickers':
        setTimeout(() => setIsEmojiPickerOpen(true), 50);
        break;
      case 'search':
        console.log('Поиск сообщений');
        break;
      case 'settings':
        console.log('Настройки чата');
        break;
      case 'report':
        console.log('Пожаловаться');
        break;
      case 'block':
        console.log('Заблокировать');
        break;
      default:
        break;
    }
  };

  // Обработчики для emoji picker
  const handleEmojiSelect = (emoji: any) => {
    if (emoji && emoji.native) {
      setMessageInput(prev => prev + emoji.native);
      setIsEmojiPickerOpen(false);
      hapticFeedback('light');
    }
  };

  const handleEmojiPickerClose = () => {
    setIsEmojiPickerOpen(false);
  };

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

  // Обработчики swipe для touch событий
  const handleTouchStart = (e: React.TouchEvent, message: any): void => {
    if (message.isFromMe) return; // Swipe только для сообщений собеседника
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isSwiping: true,
      isSwipeActive: false,
      swipeMessageId: message.id
    });
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!swipeState.isSwiping) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = Math.abs(touch.clientY - swipeState.startY);
    
    // Если вертикальное движение больше горизонтального, отменяем swipe
    if (deltaY > Math.abs(deltaX)) {
      setSwipeState(prev => ({ ...prev, isSwiping: false, isSwipeActive: false }));
      return;
    }
    
    // Предотвращаем скроллинг при horizontal swipe
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
    
    // Активируем swipe только при значительном движении
    const touchDeltaX = touch.clientX - swipeState.startX;
    const shouldActivate = Math.abs(touchDeltaX) > 10;
    
    setSwipeState(prev => ({ 
      ...prev, 
      currentX: touch.clientX,
      isSwipeActive: shouldActivate
    }));
  };

  const handleTouchEnd = (): void => {
    if (!swipeState.isSwiping) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const SWIPE_THRESHOLD = 40; // 40px для активации reply
    
    if (deltaX > SWIPE_THRESHOLD && swipeState.swipeMessageId) {
      const message = messages.find(msg => msg.id === swipeState.swipeMessageId);
      if (message) {
        handleReplyToMessage(message);
      }
    }
    
    // Мгновенно сбрасываем состояние - CSS анимация сделает плавный возврат
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      isSwiping: false,
      isSwipeActive: false,
      swipeMessageId: null
    });
  };

  // Обработчики swipe для mouse событий (для десктопа)
  const handleMouseDown = (e: React.MouseEvent, message: any): void => {
    if (message.isFromMe) return; // Swipe только для сообщений собеседника
    
    // Предотвращаем drag только для левой кнопки мыши
    if (e.button !== 0) return;
    
    e.preventDefault(); // Предотвращаем выделение текста
    
    setSwipeState({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      isSwiping: true,
      isSwipeActive: false,
      swipeMessageId: message.id
    });
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

  const handleReplyToMessage = (message: any): void => {
    setReplyingTo(message);
    hapticFeedback('light');
  };

  const handleCancelReply = (): void => {
    setReplyingTo(null);
    hapticFeedback('light');
  };

  const handleReplyInfoClick = (replyToId: string): void => {
    hapticFeedback('light');
    
    // Выделяем сообщение
    setHighlightedMessageId(replyToId);
    
    // Прокручиваем к сообщению
    const targetElement = messageRefs.current[replyToId];
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Убираем выделение через 2 секунды
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
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

  const truncateText = (text: string, maxLength = 30): string => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );

  const ReplyIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
  
  const TypingIndicator = () => (
    <div className="typing-indicator">
        <span />
        <span />
        <span />
    </div>
  );

  const getSwipeIconStyle = (messageId: string): React.CSSProperties => {
    const messageElement = messageRefs.current[messageId];
    if (!messageElement) return { opacity: 0 };

    const rect = messageElement.getBoundingClientRect();
    
    // Фиксированная позиция - всегда слева от сообщения
    const iconLeft = rect.left - 45;
    
    // Базовые стили позиционирования - всегда одинаковые
    const baseStyle = {
      top: `${rect.top + rect.height / 2}px`,
      left: `${iconLeft}px`,
      transform: `translateY(-50%)`,
    };
    
    // Если не активен swipe для этого сообщения - скрываем
    if (!swipeState.isSwipeActive || swipeState.swipeMessageId !== messageId) {
      return { ...baseStyle, opacity: 0 };
    }

    const swipeDelta = swipeState.currentX - swipeState.startX;
    
    // Показываем иконку только если свайп вправо И больше минимального расстояния
    if (swipeDelta <= 10) {
      return { ...baseStyle, opacity: 0 };
    }
    
    // Простое линейное появление для отзывчивости
    const iconOpacity = Math.min((swipeDelta - 10) / 30, 1);
    
    return {
      ...baseStyle,
      opacity: iconOpacity
    };
  };

  const getHighlightOverlayStyle = (): React.CSSProperties => {
    if (!highlightedMessageId) return { display: 'none' };
    
    const messageElement = messageRefs.current[highlightedMessageId];
    if (!messageElement) return { display: 'none' };

    const rect = messageElement.getBoundingClientRect();
    const chatContainer = messageElement.closest('.chat-container');
    if (!chatContainer) return { display: 'none' };

    const containerRect = chatContainer.getBoundingClientRect();
    
    return {
      top: `${rect.top - containerRect.top}px`,
      height: `${rect.height}px`,
    };
  };

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
      {/* Overlay для подсветки сообщений на всю ширину */}
      <div className="highlight-overlay" style={getHighlightOverlayStyle()}></div>
      
      <div className="chat-header">
        <div className="chat-header-info" onClick={() => { /* Handle user info click */ }}>
          <div className="avatar">
            {partnerInfo.gender === 'male' ? '👨' : '👩'}
          </div>
          <div className="user-info">
            <div className="username">
              {truncateUsername("anoname")}
            </div>
            <div className="user-details">
              <span className="user-age">{partnerInfo.age} лет</span>
              <span className="user-rating">
                ⭐ {partnerInfo.rating ? partnerInfo.rating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            onClick={handleEndChat}
            className="end-chat-button"
          >
            Завершить
          </button>
          <div className="chat-menu-container">
            <button 
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              className="chat-menu-button"
              title="Меню чата"
            >
              ⋮
            </button>
            {isMenuOpen && (
              <div ref={menuRef} className="chat-menu-dropdown">
                <div className="chat-menu-item" onClick={() => handleMenuAction('theme')}>
                  <span className="menu-icon">🎨</span>
                  <span>Тема</span>
                </div>
                <div className="chat-menu-item" onClick={() => handleMenuAction('stickers')}>
                  <span className="menu-icon">😀</span>
                  <span>Стикеры</span>
                </div>
                <div className="chat-menu-item" onClick={() => handleMenuAction('search')}>
                  <span className="menu-icon">🔍</span>
                  <span>Поиск</span>
                </div>
                <div className="chat-menu-item" onClick={() => handleMenuAction('settings')}>
                  <span className="menu-icon">⚙️</span>
                  <span>Настройки</span>
                </div>
                <div className="chat-menu-divider"></div>
                <div className="chat-menu-item danger" onClick={() => handleMenuAction('report')}>
                  <span className="menu-icon">⚠️</span>
                  <span>Пожаловаться</span>
                </div>
                <div className="chat-menu-item danger" onClick={() => handleMenuAction('block')}>
                  <span className="menu-icon">🚫</span>
                  <span>Заблокировать</span>
                </div>
              </div>
            )}
          </div>
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
              className="message-wrapper"
            >
              {/* Иконка ответа при swipe (теперь отображается через portal) */}
              {!message.isFromMe && (
                <div className="swipe-reply-icon" style={getSwipeIconStyle(message.id)}>
                  <ReplyIcon />
                </div>
              )}
              
              <div
                ref={el => messageRefs.current[message.id] = el}
                className={`message-bubble ${message.isFromMe ? 'my-message' : 'partner-message'} ${
                  isGroupedWithPrevious ? 'grouped-with-previous' : ''
                } ${
                  isGroupedWithNext ? 'grouped-with-next' : ''
                } ${
                  swipeState.isSwipeActive && swipeState.swipeMessageId === message.id ? 'swiping' : ''
                }`}
                style={
                  swipeState.isSwiping && swipeState.swipeMessageId === message.id
                    ? { transform: `translateX(${Math.max(0, Math.min(swipeState.currentX - swipeState.startX, 15))}px)` }
                    : { transform: 'translateX(0px)' } // Явно задаем начальную позицию
                }
                onTouchStart={(e) => handleTouchStart(e, message)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, message)}
              >
                {/* Отображение информации о сообщении, на которое отвечаем */}
                {message.replyTo && message.replyToContent && (
                  <div 
                    className="reply-info" 
                    onClick={() => message.replyTo && handleReplyInfoClick(message.replyTo)}
                    title="Перейти к исходному сообщению"
                  >
                    <div className="reply-bar"></div>
                    <div className="reply-content">
                      <div className="reply-sender">
                        {message.replyToSender?.firstName || message.replyToSender?.username || "Собеседник"}
                      </div>
                      <div className="reply-text">
                        {truncateText(message.replyToContent)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Отладочная информация для reply (удалить в продакшене) */}
                {message.replyTo && !message.replyToContent && (
                  <div style={{ fontSize: '10px', color: 'red', padding: '2px' }}>
                    DEBUG: replyTo есть ({message.replyTo}), но replyToContent отсутствует
                  </div>
                )}

                <div className="message-content-wrapper">
                  <div className="message-content">{message.content}</div>
                  <div className="message-time-spacer"></div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>

                {/* Кнопка ответа */}
                {!message.isFromMe && (
                  <button
                    className="reply-button"
                    onClick={() => handleReplyToMessage(message)}
                    title="Ответить"
                  >
                    <ReplyIcon />
                  </button>
                )}
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

      {/* Область ввода сообщения */}
      <div className="message-input-area">
        {/* Превью сообщения, на которое отвечаем */}
        {replyingTo && (
          <div className="reply-preview">
            <div className="reply-preview-bar"></div>
            <div className="reply-preview-content">
              <div className="reply-preview-sender">
                {replyingTo.isFromMe ? "Вы" : (replyingTo.sender?.firstName || replyingTo.sender?.username || "Собеседник")}
              </div>
              <div className="reply-preview-text">
                {truncateText(replyingTo.content)}
              </div>
            </div>
            <button
              className="reply-preview-close"
              onClick={handleCancelReply}
              title="Отменить ответ"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="message-input-row">
          <input
            type="text"
            placeholder={replyingTo ? "Ответить..." : "Напишите сообщение..."}
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
    </div>
    
    {/* Emoji Picker */}
    <EmojiPicker 
      isVisible={isEmojiPickerOpen}
      onEmojiSelect={handleEmojiSelect}
      onClickOutside={handleEmojiPickerClose}
    />
    {/* {isEmojiPickerOpen && <div style={{position: 'fixed', top: '10px', left: '10px', padding: '10px', background: 'red', color: 'white', zIndex: 9999}}>DEBUG: EMOJI PICKER IS OPEN</div>} */}
    </>
  );
};

export default Chat; 