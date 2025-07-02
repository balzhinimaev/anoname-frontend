import io from 'socket.io-client';
import { 
  WebSocketSearchCriteria,
  WebSocketSearchMatched,
  WebSocketSearchStats,
  WebSocketChatMessageReceived,
  WebSocketChatTyping,
  WebSocketChatEnded,
  WebSocketError,
  SearchData
} from '../types';

type SocketType = any; // Используем any временно для избежания проблем с типами Socket.IO

export class WebSocketService {
  private socket: SocketType | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private onSearchMatchedHandler?: (data: WebSocketSearchMatched) => void;
  private onSearchStatsHandler?: (data: WebSocketSearchStats) => void;
  private onSearchStatusHandler?: (data: any) => void;
  private onChatMessageHandler?: (data: WebSocketChatMessageReceived) => void;
  private onChatTypingHandler?: (data: WebSocketChatTyping) => void;
  private onChatReadHandler?: (data: any) => void;
  private onChatEndedHandler?: (data: WebSocketChatEnded) => void;
  private onChatRatedHandler?: (data: any) => void;
  private onContactRequestHandler?: (data: any) => void;
  private onContactStatusHandler?: (data: any) => void;
  private onErrorHandler?: (error: WebSocketError) => void;
  private onConnectedHandler?: () => void;
  private onDisconnectedHandler?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  // Подключение к WebSocket
  async connect(token: string, serverUrl: string = 'wss://anoname.xyz'): Promise<void> {
    if (this.socket?.connected) {
      console.log('WebSocket уже подключен к:', this.socket.io.uri);
      return;
    }
    
    if (this.isConnecting) {
      console.log('WebSocket подключение уже в процессе...');
      return;
    }

    this.isConnecting = true;

    try {
      console.log('🚀 Инициализируем подключение к WebSocket:', serverUrl);
      
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        auth: {
          token: token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true,
        upgrade: false,
        rememberUpgrade: false
      } as any);

      this.setupSocketListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Failed to create socket'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ WebSocket подключен успешно к:', serverUrl);
          console.log('📡 Фактический URI соединения:', this.socket.io.uri);
          console.log('🔌 Используемый транспорт:', this.socket.io.engine.transport.name);
          console.log('🔗 ID соединения:', this.socket.id);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onConnectedHandler?.();
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Ошибка подключения WebSocket к', serverUrl, ':', error);
          console.error('🔍 Детали ошибки:', error.description, error.context, error.type);
          console.error('🌐 Попытка:', this.reconnectAttempts + 1, 'из', this.maxReconnectAttempts);
          this.isConnecting = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Не удалось подключиться к WebSocket ${serverUrl} после ${this.maxReconnectAttempts} попыток`));
          }
        });

        // Дополнительные события для диагностики
        this.socket.on('disconnect', (reason: any) => {
          console.log('🔌 WebSocket отключен, причина:', reason);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log('🔄 WebSocket переподключен, попытка:', attemptNumber);
        });

        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
          console.log('🔄 Попытка переподключения WebSocket:', attemptNumber);
        });

        this.socket.on('reconnect_error', (error: any) => {
          console.error('❌ Ошибка переподключения WebSocket:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('💀 Не удалось переподключиться к WebSocket');
        });
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  // Отключение от WebSocket
  disconnect(): void {
    if (this.socket) {
      console.log('Отключение от WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Принудительная очистка всех соединений
  forceDisconnect(): void {
    console.log('Принудительное отключение WebSocket');
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Проверка состояния подключения
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Настройка слушателей событий Socket.IO
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Поиск
    this.socket.on('search:matched', (data: WebSocketSearchMatched) => {
      console.log('Найден партнер:', data);
      this.onSearchMatchedHandler?.(data);
    });

    this.socket.on('search:stats', (data: WebSocketSearchStats) => {
      this.onSearchStatsHandler?.(data);
    });

    this.socket.on('search:status', (data: any) => {
      console.log('Статус поиска:', data);
      this.onSearchStatusHandler?.(data);
    });

    this.socket.on('search:expired', () => {
      console.log('Время поиска истекло');
      this.onErrorHandler?.({ message: 'Время поиска истекло' });
    });

    // Чат
    this.socket.on('chat:message', (data: WebSocketChatMessageReceived) => {
      this.onChatMessageHandler?.(data);
    });

    this.socket.on('chat:typing', (data: WebSocketChatTyping) => {
      this.onChatTypingHandler?.(data);
    });

    this.socket.on('chat:read', (data: any) => {
      console.log('Сообщения прочитаны:', data);
      this.onChatReadHandler?.(data);
    });

    this.socket.on('chat:ended', (data: WebSocketChatEnded) => {
      console.log('Чат завершен:', data);
      this.onChatEndedHandler?.(data);
    });

    this.socket.on('chat:rated', (data: any) => {
      console.log('Получена оценка:', data);
      this.onChatRatedHandler?.(data);
    });

    // Контакты
    this.socket.on('contact:request', (data: any) => {
      console.log('Запрос контакта:', data);
      this.onContactRequestHandler?.(data);
    });

    this.socket.on('contact:status', (data: any) => {
      console.log('Статус контакта:', data);
      this.onContactStatusHandler?.(data);
    });

    // Системные события
    this.socket.on('error', (data: WebSocketError) => {
      console.error('WebSocket ошибка:', data);
      this.onErrorHandler?.(data);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('WebSocket отключен:', reason);
      this.onDisconnectedHandler?.();
    });

    this.socket.on('connection:recovered', () => {
      console.log('WebSocket соединение восстановлено');
      this.onConnectedHandler?.();
    });
  }

  // === ПОИСК ===

  // Начать поиск партнера
  startSearch(searchData: SearchData): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    const criteria: WebSocketSearchCriteria = {
      gender: searchData.myGender === 'any' ? 'male' : searchData.myGender, // WebSocket API не поддерживает 'any' для gender
      age: searchData.myAge,
      desiredGender: searchData.targetGender === 'any' ? ['any'] : [searchData.targetGender],
      desiredAgeMin: searchData.targetAgeMin,
      desiredAgeMax: searchData.targetAgeMax,
      useGeolocation: searchData.useLocation,
      ...(searchData.location && {
        location: {
          longitude: searchData.location.longitude,
          latitude: searchData.location.latitude
        }
      })
    };

    console.log('Начинаем поиск с параметрами:', criteria);
    this.socket.emit('search:start', { criteria });
  }

  // Отменить поиск
  cancelSearch(): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Отменяем поиск');
    this.socket.emit('search:cancel');
  }

  // Подписаться на статистику
  subscribeToStats(): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    this.socket.emit('search:subscribe_stats');
  }

  // Отписаться от статистики
  unsubscribeFromStats(): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    this.socket.emit('search:unsubscribe_stats');
  }

  // === ЧАТ ===

  // Присоединиться к чату
  joinChat(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Присоединяемся к чату:', chatId);
    this.socket.emit('chat:join', chatId);
  }

  // Покинуть чат
  leaveChat(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Покидаем чат:', chatId);
    this.socket.emit('chat:leave', chatId);
  }

  // Отправить сообщение
  sendMessage(chatId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    this.socket.emit('chat:message', { chatId, content });
  }

  // Уведомить о наборе текста
  sendTyping(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    this.socket.emit('chat:typing', chatId);
  }

  // Отметить сообщения как прочитанные
  markAsRead(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    this.socket.emit('chat:read', {
      chatId,
      timestamp: new Date()
    });
  }

  // Завершить чат
  endChat(chatId: string, reason?: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Завершаем чат:', chatId, 'причина:', reason);
    this.socket.emit('chat:end', { chatId, reason });
  }

  // Оценить собеседника
  rateChat(chatId: string, score: number, comment?: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    if (score < 1 || score > 5) {
      throw new Error('Оценка должна быть от 1 до 5');
    }

    this.socket.emit('chat:rate', { chatId, score, comment });
  }

  // === КОНТАКТЫ ===

  // Запросить контакт
  requestContact(to: string, chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Запрашиваем контакт:', { to, chatId });
    this.socket.emit('contact:request', { to, chatId });
  }

  // Ответить на запрос контакта
  respondToContact(userId: string, status: 'accepted' | 'declined' | 'blocked'): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket не подключен');
    }

    console.log('Отвечаем на запрос контакта:', { userId, status });
    this.socket.emit('contact:respond', { userId, status });
  }

  // === ОБРАБОТЧИКИ СОБЫТИЙ ===

  onSearchMatched(handler: (data: WebSocketSearchMatched) => void): void {
    this.onSearchMatchedHandler = handler;
  }

  onSearchStats(handler: (data: WebSocketSearchStats) => void): void {
    this.onSearchStatsHandler = handler;
  }

  onChatMessage(handler: (data: WebSocketChatMessageReceived) => void): void {
    this.onChatMessageHandler = handler;
  }

  onChatTyping(handler: (data: WebSocketChatTyping) => void): void {
    this.onChatTypingHandler = handler;
  }

  onChatEnded(handler: (data: WebSocketChatEnded) => void): void {
    this.onChatEndedHandler = handler;
  }

  onError(handler: (error: WebSocketError) => void): void {
    this.onErrorHandler = handler;
  }

  onConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  onDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  onSearchStatus(handler: (data: any) => void): void {
    this.onSearchStatusHandler = handler;
  }

  onChatRead(handler: (data: any) => void): void {
    this.onChatReadHandler = handler;
  }

  onChatRated(handler: (data: any) => void): void {
    this.onChatRatedHandler = handler;
  }

  onContactRequest(handler: (data: any) => void): void {
    this.onContactRequestHandler = handler;
  }

  onContactStatus(handler: (data: any) => void): void {
    this.onContactStatusHandler = handler;
  }

  // Очистка обработчиков
  private setupEventListeners(): void {
    // Обработка закрытия страницы
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    // Обработка потери фокуса
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Страница скрыта
      } else {
        // Страница видима
        if (!this.isConnected() && !this.isConnecting) {
          // Попытка переподключения при возвращении фокуса
          console.log('Попытка переподключения при возвращении фокуса');
        }
      }
    });
  }
}

// Создаем единственный экземпляр сервиса
export const websocketService = new WebSocketService();
export default websocketService; 