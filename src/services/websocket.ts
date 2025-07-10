import io, { Socket } from 'socket.io-client';
import EventEmitter from 'eventemitter3';
import { 
  WebSocketSearchCriteria,
  WebSocketSearchMatched,
  WebSocketSearchStats,
  WebSocketChatMessageReceived,
  WebSocketChatStartTyping,
  WebSocketChatStopTyping,
  WebSocketChatEnded,
  WebSocketError,
  SearchData,
  ServerToClientEvents,
  ClientToServerEvents
} from '../types';
import { WEBSOCKET_EVENTS } from './websocketEvents';

// Определяем типы для событий, чтобы обеспечить строгую типизацию
type WebSocketEventMap = {
  [WEBSOCKET_EVENTS.CONNECT]: () => void;
  [WEBSOCKET_EVENTS.DISCONNECT]: (reason: Socket.DisconnectReason) => void;
  [WEBSOCKET_EVENTS.ERROR]: (error: WebSocketError) => void;
  [WEBSOCKET_EVENTS.SEARCH_MATCHED]: (data: WebSocketSearchMatched) => void;
  [WEBSOCKET_EVENTS.SEARCH_STATS]: (data: WebSocketSearchStats) => void;
  [WEBSOCKET_EVENTS.CHAT_MESSAGE]: (data: WebSocketChatMessageReceived) => void;
  [WEBSOCKET_EVENTS.CHAT_START_TYPING]: (data: WebSocketChatStartTyping) => void;
  [WEBSOCKET_EVENTS.CHAT_STOP_TYPING]: (data: WebSocketChatStopTyping) => void;
  [WEBSOCKET_EVENTS.CHAT_ENDED]: (data: WebSocketChatEnded) => void;
};

export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private emitter: EventEmitter<WebSocketEventMap>;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.emitter = new EventEmitter<WebSocketEventMap>();
  }

  // Подключение к WebSocket
  async connect(token: string): Promise<void> {
    const serverUrl = 'wss://anoname.xyz';
    
    if (this.socket?.connected) {
      console.log('WebSocket уже подключен.');
      return;
    }
    
    if (this.isConnecting) {
      console.log('WebSocket подключение уже в процессе...');
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true,
      });

      this.setupSocketListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          this.isConnecting = false;
          return reject(new Error('Не удалось создать сокет'));
        }

        this.socket.on(WEBSOCKET_EVENTS.CONNECT, () => {
          console.log('✅ WebSocket подключен успешно.');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emitter.emit(WEBSOCKET_EVENTS.CONNECT);
          resolve();
        });

        this.socket.on(WEBSOCKET_EVENTS.CONNECT_ERROR, (error) => {
          console.error('❌ Ошибка подключения WebSocket:', error.message);
          this.isConnecting = false;
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emitter.emit(WEBSOCKET_EVENTS.ERROR, { message: `Не удалось подключиться: ${error.message}` });
            reject(new Error(`Не удалось подключиться к WebSocket после ${this.maxReconnectAttempts} попыток`));
          }
        });
      });
    } catch (error) {
      this.isConnecting = false;
      this.emitter.emit(WEBSOCKET_EVENTS.ERROR, { message: 'Критическая ошибка при инициализации сокета' });
      throw error;
    }
  }

  // Отключение от WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  
  // Проверка состояния подключения
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Настройка слушателей событий Socket.IO
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Системные события
    this.socket.on(WEBSOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('🔌 WebSocket отключен, причина:', reason);
      this.isConnecting = false;
      this.emitter.emit(WEBSOCKET_EVENTS.DISCONNECT, reason);
    });

    this.socket.on(WEBSOCKET_EVENTS.ERROR, (data) => {
      this.emitter.emit(WEBSOCKET_EVENTS.ERROR, data);
    });

    // События поиска
    this.socket.on(WEBSOCKET_EVENTS.SEARCH_MATCHED, (data) => this.emitter.emit(WEBSOCKET_EVENTS.SEARCH_MATCHED, data));
    this.socket.on(WEBSOCKET_EVENTS.SEARCH_STATS, (data) => this.emitter.emit(WEBSOCKET_EVENTS.SEARCH_STATS, data));
    this.socket.on(WEBSOCKET_EVENTS.SEARCH_EXPIRED, () => this.emitter.emit(WEBSOCKET_EVENTS.ERROR, { message: 'Время поиска истекло' }));

    // События чата
    this.socket.on(WEBSOCKET_EVENTS.CHAT_MESSAGE, (data) => this.emitter.emit(WEBSOCKET_EVENTS.CHAT_MESSAGE, data));
    this.socket.on(WEBSOCKET_EVENTS.CHAT_START_TYPING, (data) => this.emitter.emit(WEBSOCKET_EVENTS.CHAT_START_TYPING, data));
    this.socket.on(WEBSOCKET_EVENTS.CHAT_STOP_TYPING, (data) => this.emitter.emit(WEBSOCKET_EVENTS.CHAT_STOP_TYPING, data));
    this.socket.on(WEBSOCKET_EVENTS.CHAT_ENDED, (data) => this.emitter.emit(WEBSOCKET_EVENTS.CHAT_ENDED, data));
  }

  // === Методы для отправки событий на сервер ===
  private emit<T extends keyof ClientToServerEvents>(event: T, ...args: Parameters<ClientToServerEvents[T]>) {
    if (!this.isConnected()) {
      console.error(`Не удалось отправить событие "${event}": WebSocket не подключен.`);
      this.emitter.emit(WEBSOCKET_EVENTS.ERROR, { message: 'Сокет не подключен' });
      return;
    }
    this.socket?.emit(event, ...args);
  }

  startSearch(searchData: SearchData): void {
    const criteria: WebSocketSearchCriteria = {
      gender: searchData.myGender === 'any' ? 'male' : searchData.myGender,
      age: searchData.myAge,
      desiredGender: [searchData.targetGender],
      desiredAgeMin: searchData.targetAgeMin,
      desiredAgeMax: searchData.targetAgeMax,
      useGeolocation: searchData.useLocation,
      ...(searchData.location && { location: searchData.location }),
    };
    this.emit(WEBSOCKET_EVENTS.EMIT_SEARCH_START, { criteria });
    this.subscribeToStats();
  }

  cancelSearch(): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_SEARCH_CANCEL);
    // Не отписываемся от статистики, чтобы она оставалась независимой
  }

  subscribeToStats(): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_STATS_SUBSCRIBE);
  }

  unsubscribeFromStats(): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_STATS_UNSUBSCRIBE);
  }

  joinChat(chatId: string): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_CHAT_JOIN, chatId);
  }

  sendMessage(chatId: string, content: string, replyTo?: string): void {
    const messageData = replyTo 
      ? { chatId, content, replyTo }
      : { chatId, content };
    this.emit(WEBSOCKET_EVENTS.EMIT_CHAT_MESSAGE, messageData);
  }

  sendStartTyping(chatId: string): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_CHAT_START_TYPING, { chatId });
  }

  sendStopTyping(chatId: string): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_CHAT_STOP_TYPING, { chatId });
  }

  endChat(chatId: string, reason: string): void {
    this.emit(WEBSOCKET_EVENTS.EMIT_CHAT_END, { chatId, reason });
  }

  // === Методы для подписки на события от сервера ===
  public on<T extends keyof WebSocketEventMap>(event: T, listener: (...args: Parameters<WebSocketEventMap[T]>) => void): () => void {
    this.emitter.on(event, listener as any);
    // Возвращаем функцию для отписки
    return () => this.emitter.off(event, listener as any);
  }

  public once<T extends keyof WebSocketEventMap>(event: T, listener: (...args: Parameters<WebSocketEventMap[T]>) => void): () => void {
    this.emitter.once(event, listener as any);
    return () => this.emitter.off(event, listener as any);
  }
}

const websocketService = new WebSocketService();
export default websocketService; 