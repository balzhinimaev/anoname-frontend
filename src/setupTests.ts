// Настройки для Vitest
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Расширяем expect с матчерами jest-dom
expect.extend(matchers);

// Очищаем после каждого теста
afterEach(() => {
  cleanup();
});

// Глобальные моки для тестирования
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для Telegram WebApp API
Object.defineProperty(window, 'Telegram', {
  writable: true,
  value: {
    WebApp: {
      ready: vi.fn(),
      expand: vi.fn(),
      initDataUnsafe: {},
      themeParams: {},
      colorScheme: 'light',
      platform: 'web',
      showAlert: vi.fn(),
      showConfirm: vi.fn(),
      HapticFeedback: {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
      },
      CloudStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      MainButton: {
        setText: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        showProgress: vi.fn(),
        hideProgress: vi.fn(),
      },
    },
  },
}); 