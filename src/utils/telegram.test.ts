// @ts-nocheck
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
    it('should return null if user data is not available', () => {
      window.Telegram = {
        WebApp: {
          initDataUnsafe: {},
        },
      };
      expect(getTelegramUser()).toBeNull();
    });

    it('should return user object if it exists', () => {
      const mockUser = { id: 123, first_name: 'Test' };
      window.Telegram = {
        WebApp: {
          initDataUnsafe: {
            user: mockUser,
          },
        },
      };
      expect(getTelegramUser()).toBe(mockUser);
    });
  });

  describe('hapticFeedback', () => {
    let hapticMock;

    beforeEach(() => {
      hapticMock = {
        impactOccurred: jest.fn(),
        notificationOccurred: jest.fn(),
      };
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
        window.Telegram.WebApp.HapticFeedback = undefined;
        expect(() => hapticFeedback('light')).not.toThrow();
        expect(hapticMock.impactOccurred).not.toHaveBeenCalled();
    });
  });
}); 