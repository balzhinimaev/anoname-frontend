import React, { useEffect } from 'react';
import SearchForm from './components/SearchForm';
import Chat from './components/Chat';
import './styles/main.scss';
import { 
  initTelegramApp,
  setTelegramTheme,
  showTelegramAlert
} from './utils/telegram';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';

const App: React.FC = () => {
  const { login, isAuthenticated, isLoading, user, error } = useAuthStore();
  const { currentChatId } = useChatStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initTelegramApp();
        setTelegramTheme();
        await login();
      } catch (e: any) {
        showTelegramAlert(e.message || 'Произошла критическая ошибка');
      }
    };

    initializeApp();
  }, [login]);

  if (isLoading) {
    return (
      <div className="app-loader">
        <div className="spinner"></div>
        <p>Подключаемся к серверу...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Не удалось аутентифицироваться.</div>;
  }
  
  return (
    <div className="app">
      {!currentChatId ? (
        <SearchForm />
      ) : (
        <Chat />
      )}
    </div>
  );
};

export default App; 