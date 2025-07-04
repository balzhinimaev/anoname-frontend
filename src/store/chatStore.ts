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
}

interface ChatState {
  isSearching: boolean;
  searchStats: WebSocketSearchStats | null;
  currentChatId: string | null;
  partnerInfo: WebSocketSearchMatched['matchedUser'] | null;
  messages: ChatMessage[];
  
  startSearch: (searchData: SearchData) => void;
  cancelSearch: () => void;
  endChat: () => void;
  
  // Внутренние методы для обновления состояния из socketStore
  _handleSearchMatched: (data: WebSocketSearchMatched) => void;
  _handleChatEnded: () => void;
  _addMessage: (message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isSearching: false,
  searchStats: null,
  currentChatId: null,
  partnerInfo: null,
  messages: [],

  startSearch: (searchData) => {
    if (!get().isSearching) {
      set({ isSearching: true });
      websocketService.startSearch(searchData);
    }
  },

  cancelSearch: () => {
    set({ isSearching: false });
    websocketService.cancelSearch();
  },

  endChat: () => {
    const chatId = get().currentChatId;
    if (chatId) {
      websocketService.endChat(chatId, 'user_ended');
      set({ currentChatId: null, partnerInfo: null, messages: [] });
    }
  },

  _handleSearchMatched: (data) => {
    set({
      isSearching: false,
      currentChatId: data.matchedUser.chatId,
      partnerInfo: data.matchedUser,
      messages: []
    });
    websocketService.joinChat(data.matchedUser.chatId);
  },

  _handleChatEnded: () => {
    set({ currentChatId: null, partnerInfo: null, messages: [], isSearching: false });
  },

  _addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  }
})); 