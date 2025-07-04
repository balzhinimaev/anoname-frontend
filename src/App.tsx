import React, { useEffect, useState } from 'react';
import SearchForm from './components/SearchForm';
import Chat from './components/Chat';
import './App.css';
import { 
  initTelegramApp, 
  getTelegramUser,
  setTelegramTheme,
  showTelegramAlert,
  hapticFeedback
} from './utils/telegram';
import anonameAPI from './services/api';
import websocketService from './services/websocket';
import { 
  TelegramWebApp, 
  TelegramUser, 
  SearchData,
  WebSocketSearchMatched,
  WebSocketSearchStats,
  WebSocketChatMessageReceived,
  WebSocketChatEnded,
  WebSocketUser
} from './types';

const App: React.FC = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStats, setSearchStats] = useState<WebSocketSearchStats | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<WebSocketUser | null>(null);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        // Инициализация Telegram WebApp
        const telegramApp = initTelegramApp();
        setTg(telegramApp);
        
        // Получение пользователя
        const telegramUser = getTelegramUser();
        setUser(telegramUser);
        
        // Применение темы
        setTelegramTheme();
        
        // Аутентификация с API
        if (telegramUser) {
          try {
            // Создаем текущего пользователя для чата заранее
            setCurrentUser({
              _id: telegramUser.id.toString(),
              telegramId: telegramUser.id,
              firstName: telegramUser.first_name,
              ...(telegramUser.last_name && { lastName: telegramUser.last_name }),
              ...(telegramUser.username && { username: telegramUser.username })
            });
            
            let authResult;
            
            // Сначала пытаемся войти
            try {
              authResult = await anonameAPI.login({
                telegramId: telegramUser.id,
                platform: 'telegram'
              });
              console.log('Пользователь вошел в систему');
            } catch (loginError: any) {
              // Если пользователь не найден (404), регистрируем его
              if (loginError.response?.status === 404) {
                console.log('Пользователь не найден, регистрируем...');
                const registerData: any = {
                  telegramId: telegramUser.id,
                  firstName: telegramUser.first_name,
                  platform: 'telegram'
                };
                
                // Добавляем опциональные поля только если они определены
                if (telegramUser.username) registerData.username = telegramUser.username;
                if (telegramUser.last_name) registerData.lastName = telegramUser.last_name;
                
                authResult = await anonameAPI.register(registerData);
                console.log('Пользователь зарегистрирован');
              } else {
                throw loginError;
              }
            }
            
            setIsAuthenticated(true);
            
            // Подключение к WebSocket после успешной аутентификации
            await setupWebSocket(authResult.token);
            
          } catch (error) {
            console.error('Ошибка аутентификации:', error);
            showTelegramAlert('Ошибка подключения к серверу. Попробуйте позже.');
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Очистка при размонтировании
    return () => {
      websocketService.forceDisconnect();
    };
  }, []);

  const setupWebSocket = async (token: string): Promise<void> => {
    try {
            // Подключение к WebSocket напрямую
      console.log('Подключаемся к WebSocket серверу...');
      await websocketService.connect(token, 'wss://anoname.xyz');
      
      // Настройка обработчиков событий
      websocketService.onSearchMatched((data: WebSocketSearchMatched) => {
        console.log('Найден партнер:', data);
        setIsSearching(false);
        setCurrentChatId(data.matchedUser.chatId);
        setPartnerInfo(data.matchedUser);
        
        hapticFeedback('success');
        showTelegramAlert(`Найден собеседник! ${data.matchedUser.gender === 'male' ? 'Мужской' : 'Женский'}, ${data.matchedUser.age} лет`);
        
        // Присоединяемся к чату
        websocketService.joinChat(data.matchedUser.chatId);
      });

      websocketService.onSearchStats((data: WebSocketSearchStats) => {
        setSearchStats(data);
      });

      websocketService.onChatMessage((data: WebSocketChatMessageReceived) => {
        console.log('Новое сообщение:', data);
        // Здесь можно добавить обработку новых сообщений
      });

      websocketService.onChatEnded((data: WebSocketChatEnded) => {
        console.log('Чат завершен:', data);
        setCurrentChatId(null);
        setPartnerInfo(null);
        hapticFeedback('warning');
        
        const reason = data.reason === 'partner_disconnected' 
          ? 'Собеседник отключился' 
          : 'Чат завершен';
        showTelegramAlert(reason);
      });

      websocketService.onError((error) => {
        console.error('WebSocket ошибка:', error);
        hapticFeedback('error');
        showTelegramAlert(`Ошибка: ${error.message}`);
      });

      websocketService.onConnected(() => {
        console.log('WebSocket подключен');
        // Подписываемся на статистику
        websocketService.subscribeToStats();
      });

      websocketService.onDisconnected(() => {
        console.log('WebSocket отключен');
        setIsSearching(false);
      });

      // Дополнительные события
      websocketService.onSearchStatus((data) => {
        console.log('Статус поиска:', data);
      });

      websocketService.onChatRead((data) => {
        console.log('Сообщения прочитаны:', data);
      });

      websocketService.onChatRated((data) => {
        console.log('Получена оценка:', data);
        hapticFeedback('success');
        showTelegramAlert(`Вы получили оценку: ${data.score}/5`);
      });

      websocketService.onContactRequest((data) => {
        console.log('Запрос контакта:', data);
        hapticFeedback('light');
        showTelegramAlert('Собеседник хочет обменяться контактами');
      });

      websocketService.onContactStatus((data) => {
        console.log('Статус контакта:', data);
        const statusText = data.status === 'accepted' ? 'принят' : 
                          data.status === 'declined' ? 'отклонен' : 'заблокирован';
        showTelegramAlert(`Запрос контакта ${statusText}`);
      });

    } catch (error) {
      console.error('Ошибка подключения WebSocket:', error);
      showTelegramAlert('Не удалось подключиться к чату. Проверьте соединение.');
    }
  };

  const handleSearchSubmit = async (searchData: SearchData): Promise<void> => {
    console.log('Данные поиска:', searchData);
    
    // Тактильная обратная связь
    hapticFeedback('light');
    
    if (!websocketService.isConnected()) {
      hapticFeedback('error');
      showTelegramAlert('Нет подключения к серверу. Попробуйте позже.');
      return;
    }

    if (tg) {
      // Показываем индикатор загрузки
      tg.MainButton.setText('Поиск собеседника...');
      tg.MainButton.show();
      tg.MainButton.showProgress();
    }
    
    try {
      setIsSearching(true);
      
      // Запускаем поиск через WebSocket
      websocketService.startSearch(searchData);
      
      console.log('Поиск запущен через WebSocket');
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
      hapticFeedback('error');
      setIsSearching(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при поиске';
      showTelegramAlert(errorMessage);
    } finally {
      if (tg) {
        tg.MainButton.hideProgress();
        tg.MainButton.hide();
      }
    }
  };

  const handleCancelSearch = (): void => {
    try {
      websocketService.cancelSearch();
      setIsSearching(false);
      hapticFeedback('light');
      showTelegramAlert('Поиск отменен');
    } catch (error) {
      console.error('Ошибка отмены поиска:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className={`container ${currentChatId ? 'chat-mode' : ''}`}>
        {/* Показываем заголовок и статистику только если нет активного чата */}
        {!currentChatId && (
          <>
            <h1 className="title">Анонимные знакомства</h1>
            
            {/* Статистика поиска */}
            {searchStats && (
              <div style={{
                fontSize: '11px',
                textAlign: 'center',
                color: 'var(--tg-theme-hint-color, #8e8e93)',
                marginBottom: '20px',
                lineHeight: '1.3'
              }}>
                👥 Онлайн: {searchStats.online.t} | 🔍 Ищут: {searchStats.t}
                {!!searchStats.inChat && searchStats.inChat > 0 && ` | 💬 В чатах: ${searchStats.inChat}`}
                {' | '}💕 Знакомств за 24ч: {searchStats.avgSearchTime.matches24h}
              </div>
            )}
          </>
        )}
        
        {!isAuthenticated && (
          <div className="info-box warning">
            ⚠️ Подключение к серверу недоступно. Некоторые функции могут не работать.
          </div>
        )}

        {/* Индикатор поиска */}
        {isSearching && (
          <div className="info-box searching-indicator">
            <div className="spinner"></div>
            <div>
              🔍 Ищем собеседника...
            </div>
            <button 
              onClick={handleCancelSearch}
              className="cancel-search-button"
            >
              Отменить поиск
            </button>
          </div>
        )}

        {/* Полноценный чат */}
        {currentChatId && partnerInfo && currentUser ? (
          <Chat
            chatId={currentChatId}
            partnerInfo={partnerInfo}
            currentUser={currentUser}
            onEndChat={() => {
              setCurrentChatId(null);
              setPartnerInfo(null);
            }}
          />
        ) : (
          /* Форма поиска, когда нет активного чата */
          <SearchForm 
            onSubmit={handleSearchSubmit} 
            user={user} 
            disabled={isSearching}
          />
        )}
      </div>
    </div>
  );
};

export default App; 