import { create } from 'zustand';
import websocketService from '../services/websocket';
import { WEBSOCKET_EVENTS } from '../services/websocketEvents';
import { useChatStore } from './chatStore';
import { useAuthStore } from './authStore';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  isConnecting: false,

  connect: async (token: string) => {
    if (get().isConnecting || get().isConnected) {
      return;
    }
    set({ isConnecting: true });

    try {
      await websocketService.connect(token);
      // Состояние isConnected будет установлено через слушателя
    } catch (error) {
      console.error('Не удалось подключиться к WebSocket', error);
      set({ isConnected: false, isConnecting: false });
    }
  },

  disconnect: () => {
    websocketService.disconnect();
    set({ isConnected: false });
  },
}));

// --- Инициализация слушателей ---
// Этот код выполнится один раз при импорте стора
(function setupListeners() {
  websocketService.on(WEBSOCKET_EVENTS.CONNECT, () => {
    useSocketStore.setState({ isConnected: true, isConnecting: false });
  });

  websocketService.on(WEBSOCKET_EVENTS.DISCONNECT, () => {
    useSocketStore.setState({ isConnected: false, isConnecting: false });
  });

  websocketService.on(WEBSOCKET_EVENTS.ERROR, (error) => {
    console.error('WebSocket error:', error);
    if (error.message.includes('unauthorized')) {
      useAuthStore.getState().login();
    }
  });

  websocketService.on(WEBSOCKET_EVENTS.SEARCH_MATCHED, (data) => {
    useChatStore.getState()._handleSearchMatched(data);
  });

  websocketService.on(WEBSOCKET_EVENTS.CHAT_ENDED, () => {
    useChatStore.getState()._handleChatEnded();
  });

  websocketService.on(WEBSOCKET_EVENTS.SEARCH_STATS, (stats) => {
    useChatStore.getState()._updateSearchStats(stats);
  });
  
  websocketService.on(WEBSOCKET_EVENTS.CHAT_MESSAGE, (data) => {
    const state = useChatStore.getState();
    const authState = useAuthStore.getState();
    
    // Предотвращаем добавление дубликатов
    const messageExists = state.messages.some(msg => msg.id === data.message._id);
    if (messageExists) {
      return;
    }

    state._addMessage({
      id: data.message._id,
      content: data.message.content,
      timestamp: data.message.timestamp,
      isFromMe: data.message.sender.telegramId === authState.user?.id,
      sender: data.message.sender,
    });
  });
  
  websocketService.on(WEBSOCKET_EVENTS.CHAT_START_TYPING, () => {
    useChatStore.getState()._setPartnerTyping(true);
  });
  
  websocketService.on(WEBSOCKET_EVENTS.CHAT_STOP_TYPING, () => {
    useChatStore.getState()._setPartnerTyping(false);
  });
})(); 