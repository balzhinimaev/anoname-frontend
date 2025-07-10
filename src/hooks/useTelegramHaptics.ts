import { useCallback } from 'react';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'warning' | 'error' | 'success';

export const useTelegramHaptics = () => {
  const hapticFeedback = useCallback((type: HapticFeedbackType) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try {
        switch (type) {
          case 'light':
          case 'medium':
          case 'heavy':
            window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
            break;
          case 'warning':
          case 'error':
          case 'success':
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
            break;
          default:
            console.warn('Неизвестный тип тактильной обратной связи:', type);
        }
      } catch (error) {
        console.warn('Ошибка при вызове тактильной обратной связи:', error);
      }
    }
  }, []);

  const isHapticSupported = useCallback(() => {
    return Boolean(window.Telegram?.WebApp?.HapticFeedback);
  }, []);

  return {
    hapticFeedback,
    isHapticSupported
  };
}; 