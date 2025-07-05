// Файл-агрегатор для всех типов в приложении.

// Внутренние типы приложения
export * from './app';

// Типы для API (REST и WebSocket)
export * from './api';

// Типы для Telegram Web App
export type { TelegramWebApp, TelegramUser as TelegramWebUser } from './telegram'; 