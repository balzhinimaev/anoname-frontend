import { WebSocketUser } from './api';
import { TelegramUser as TelegramUserData } from './telegram';

export type Gender = 'male' | 'female' | 'any';

// Переопределяем TelegramUser для использования внутри приложения,
// чтобы избежать конфликтов и расширить его при необходимости
export type TelegramUser = TelegramUserData;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchData {
  myGender: Gender;
  myAge: number;
  targetGender: Gender;
  targetAgeMin: number;
  targetAgeMax: number;
  useLocation: boolean;
  location: Location | null;
  userId?: number | undefined;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  sender: WebSocketUser;
} 