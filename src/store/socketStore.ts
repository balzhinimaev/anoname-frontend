import { create } from 'zustand';
import websocketService from '../services/websocket';
import { useChatStore } from './chatStore';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  setupListeners: () => void; // Для подписки на события сокета
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
      set({ isConnected: true, isConnecting: false });
      get().setupListeners(); // Настраиваем слушателей после успешного подключения
    } catch (error) {
      console.error('Не удалось подключиться к WebSocket', error);
      set({ isConnected: false, isConnecting: false });
    }
  },

  disconnect: () => {
    websocketService.disconnect();
    set({ isConnected: false });
  },

  setupListeners: () => {
    websocketService.onConnected(() => {
      set({ isConnected: true, isConnecting: false });
    });

    websocketService.onDisconnected(() => {
      set({ isConnected: false, isConnecting: false });
    });

    websocketService.onError((error) => {
      console.error('WebSocket error:', error);
      // Здесь можно будет вызывать действия из других сторов, например, показывать уведомления
    });

    websocketService.onSearchMatched((data) => {
      useChatStore.getState()._handleSearchMatched(data);
    });

    websocketService.onChatEnded(() => {
      useChatStore.getState()._handleChatEnded();
    });

    // Пример того, как будут обрабатываться события в будущем:
    /*
    websocketService.onChatMessage((data) => {
      // Вызываем действие из chatStore
      useChatStore.getState().addMessage(data.message);
    });
    */
  },
})); 