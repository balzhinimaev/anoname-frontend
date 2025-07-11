import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { useSocketStore } from './store/socketStore';
import Chat from './components/Chat';
import SearchForm from './components/SearchForm';
import ErrorDisplay from './components/ErrorDisplay';
import { setTelegramTheme } from './utils/telegram';

function App() {
  const { isAuthenticated, login, error: authError, token, isLoading } = useAuthStore();
  const { partnerInfo, error: chatError } = useChatStore();
  const { isConnected, connect } = useSocketStore();

  useEffect(() => {
    setTelegramTheme();
    
    // Получаем доступ к объекту Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Устанавливаем цвет фона
      // Можно использовать разные цвета для светлой и темной тем
      if (tg.colorScheme === 'dark') {
        tg.setBackgroundColor('#000000');
      } else {
        tg.setBackgroundColor('#f0f2f5');
      }
    }

    if (!isAuthenticated && !isLoading) {
      login();
    }
  }, [login, isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated && token && !isConnected) {
      connect(token);
    }
  }, [isAuthenticated, token, isConnected, connect]);

  const combinedError = authError || chatError;

  if (combinedError) {
    return (
      <div className="app">
        <div className="app-wrapper">
          <ErrorDisplay
            message={combinedError}
            onRetry={login}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="app-wrapper">
           <div className="app-loader">
             <div className="spinner" />
             <p>Подключаемся к серверу...</p>
           </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="app-wrapper">
          <div className="container">
            <p>Не удалось авторизоваться. Попробуйте перезагрузить приложение.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-wrapper">
        <div className={`container ${partnerInfo ? 'chat-mode' : ''}`}>
          {partnerInfo ? <Chat /> : <SearchForm />}
        </div>
      </div>
    </div>
  );
}

export default App; 