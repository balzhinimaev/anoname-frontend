// @ts-nocheck
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getTelegram, getTelegramUser, hapticFeedback } from './telegram';

describe('utils/telegram', () => {
  const originalTelegram = window.Telegram;

  beforeEach(() => {
    // Восстанавливаем оригинальный объект Telegram перед каждым тестом
    window.Telegram = originalTelegram;
  });

  afterAll(() => {
    // Очистка после всех тестов
    window.Telegram = originalTelegram;
  });

  describe('getTelegram', () => {
    it('should return WebApp object if window.Telegram is defined', () => {
      // Благодаря setupTests.ts, window.Telegram должен быть замокан
      expect(getTelegram()).toBeDefined();
      expect(getTelegram()).toBe(originalTelegram.WebApp);
    });

    it('should return null if window.Telegram is not defined', () => {
      // Временно удаляем объект для этого теста
      (window as any).Telegram = undefined;
      expect(getTelegram()).toBeNull();
    });
  });

  describe('getTelegramUser', () => {
    it('should return user data from initDataUnsafe', () => {
      const mockUser = {
        id: 123,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      };

      // @ts-ignore
      window.Telegram = {
        WebApp: {
          initDataUnsafe: {
            user: mockUser,
          },
        },
      };

      expect(getTelegramUser()).toEqual(mockUser);
    });

    it('should return null if no user data available', () => {
      // @ts-ignore
      window.Telegram = {
        WebApp: {
          initDataUnsafe: {},
        },
      };

      expect(getTelegramUser()).toBeNull();
    });

    it('should return null if Telegram is not available', () => {
      // @ts-ignore
      window.Telegram = undefined;

      expect(getTelegramUser()).toBeNull();
    });
  });

  describe('hapticFeedback', () => {
    let hapticMock: any;

    beforeEach(() => {
      hapticMock = {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
      };

      // @ts-ignore
      window.Telegram = {
        WebApp: {
          HapticFeedback: hapticMock,
        },
      };
    });

    it('should call impactOccurred with "light" for "light" type', () => {
      hapticFeedback('light');
      expect(hapticMock.impactOccurred).toHaveBeenCalledWith('light');
    });

    it('should call notificationOccurred with "success" for "success" type', () => {
      hapticFeedback('success');
      expect(hapticMock.notificationOccurred).toHaveBeenCalledWith('success');
    });

    it('should do nothing if HapticFeedback is not available', () => {
      // @ts-ignore
      window.Telegram = undefined;
      expect(() => hapticFeedback('light')).not.toThrow();
    });
  });
}); 