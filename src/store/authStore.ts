import { create } from 'zustand';
import anonameAPI from '../services/api';
import { getTelegramUser } from '../utils/telegram';
import { TelegramUser } from '../types';
import { useSocketStore } from './socketStore';

interface AuthState {
  token: string | null;
  user: TelegramUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const telegramUser = getTelegramUser();
      if (!telegramUser) {
        throw new Error('Не удалось получить данные пользователя Telegram');
      }

      let authResult;
      try {
        // Пытаемся войти
        authResult = await anonameAPI.login({
          telegramId: telegramUser.id,
          platform: 'telegram',
        });
      } catch (loginError: any) {
        // Если пользователь не найден (404), регистрируем его
        if (loginError.response?.status === 404) {
          const registerData: any = {
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            platform: 'telegram',
            ...(telegramUser.username && { username: telegramUser.username }),
            ...(telegramUser.last_name && { lastName: telegramUser.last_name }),
          };
          authResult = await anonameAPI.register(registerData);
        } else {
          throw loginError;
        }
      }

      const { token } = authResult;
      anonameAPI.setAuthToken(token); // Устанавливаем токен в axios

      set({ 
        token, 
        user: telegramUser, 
        isAuthenticated: true, 
        isLoading: false 
      });

      // Подключаемся к WebSocket после успешной аутентификации
      useSocketStore.getState().connect(token);

    } catch (e: any) {
      console.error('Login failed:', e);
      set({
        isAuthenticated: false,
        isLoading: false,
        error: e.message || 'Неизвестная ошибка входа',
      });
    }
  },

  logout: () => {
    anonameAPI.setAuthToken(null); // Сбрасываем токен в axios
    useSocketStore.getState().disconnect(); // Отключаемся от сокета при выходе
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },
  
  clearError: () => set({ error: null }),
})); 