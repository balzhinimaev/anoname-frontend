import { create } from 'zustand';
import websocketService from '../services/websocket';
import { 
  WebSocketSearchStats, 
  SearchData, 
  WebSocketUser,
  WebSocketSearchMatched,
//   WebSocketChatMessageReceived
} from '../types';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  sender: WebSocketUser;
  replyTo?: string; // ID сообщения, на которое отвечаем
  replyToContent?: string; // Содержимое исходного сообщения для отображения
  replyToSender?: WebSocketUser; // Отправитель исходного сообщения
}

interface ChatState {
  isSearching: boolean;
  searchStats: WebSocketSearchStats | null;
  currentChatId: string | null;
  partnerInfo: WebSocketSearchMatched['matchedUser'] | null;
  messages: ChatMessage[];
  isPartnerTyping: boolean;
  error: string | null;
  replyingTo: ChatMessage | null; // Сообщение, на которое отвечаем
  
  startSearch: (searchData: SearchData) => void;
  cancelSearch: () => void;
  endChat: () => void;
  sendMessage: (content: string) => void;
  sendStartTyping: () => void;
  sendStopTyping: () => void;
  setReplyingTo: (message: ChatMessage | null) => void;
  
  // Внутренние методы для обновления состояния из socketStore
  _handleSearchMatched: (data: WebSocketSearchMatched) => void;
  _handleChatEnded: () => void;
  _addMessage: (message: ChatMessage) => void;
  _updateSearchStats: (stats: WebSocketSearchStats) => void;
  _setPartnerTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isSearching: false,
  searchStats: null,
  currentChatId: null,
  partnerInfo: null,
  messages: [],
  isPartnerTyping: false,
  error: null,
  replyingTo: null,

  startSearch: (searchData) => {
    if (!get().isSearching) {
      set({ isSearching: true });
      websocketService.startSearch(searchData);
    }
  },

  cancelSearch: () => {
    set({ isSearching: false, searchStats: null });
    websocketService.cancelSearch();
  },

  endChat: () => {
    const chatId = get().currentChatId;
    if (chatId) {
      websocketService.endChat(chatId, 'user_ended');
      set({ currentChatId: null, partnerInfo: null, messages: [], isPartnerTyping: false, replyingTo: null });
    }
  },

  sendMessage: (content) => {
    const chatId = get().currentChatId;
    const replyingTo = get().replyingTo;
    
    if (chatId && content.trim()) {
      // Если отвечаем на сообщение, добавляем информацию о reply
      if (replyingTo) {
        websocketService.sendMessage(chatId, content.trim(), replyingTo.id);
        // Сбрасываем состояние ответа после отправки
        set({ replyingTo: null });
      } else {
        websocketService.sendMessage(chatId, content.trim());
      }
    }
  },

  sendStartTyping: () => {
    const chatId = get().currentChatId;
    if (chatId) {
      websocketService.sendStartTyping(chatId);
    }
  },

  sendStopTyping: () => {
    const chatId = get().currentChatId;
    if (chatId) {
      websocketService.sendStopTyping(chatId);
    }
  },

  setReplyingTo: (message) => {
    set({ replyingTo: message });
  },

  _handleSearchMatched: (data) => {
    set({
      isSearching: false,
      currentChatId: data.matchedUser.chatId,
      partnerInfo: data.matchedUser,
      messages: [],
      error: null,
      replyingTo: null,
    });
    websocketService.joinChat(data.matchedUser.chatId);
  },

  _handleChatEnded: () => {
    set({ currentChatId: null, partnerInfo: null, messages: [], isSearching: false, isPartnerTyping: false, searchStats: null, error: null, replyingTo: null });
  },

  _addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  _updateSearchStats: (stats) => {
    set({ searchStats: stats });
  },

  _setPartnerTyping: (isTyping) => {
    set({ isPartnerTyping: isTyping });
  }
})); 