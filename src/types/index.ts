// Файл-агрегатор для всех типов в приложении.

// Внутренние типы приложения
export * from './app';

// Типы для API (REST и WebSocket)
export * from './api';

// Типы для Telegram Web App
export type { TelegramWebApp, TelegramUser as TelegramWebUser } from './telegram';

// === Недостающие типы для API ===
export interface UserProfile {
  id: number;
  gender: 'male' | 'female';
  age: number;
  created_at: string;
  updated_at: string;
}

export interface SearchPartnerResponse {
  search_id: string;
  status: 'searching' | 'found' | 'not_found';
  partner?: {
    id: string;
    age: number;
    gender: 'male' | 'female';
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  chat_id?: string;
}

export interface Chat {
  id: string;
  partner_id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
  messages: any[];
}

export interface ApiError {
  message: string;
  code: string;
  details?: object;
} 