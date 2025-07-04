// jest-dom добавляет пользовательские матчеры jest для проверки DOM-узлов.
// позволяет делать такие вещи:
// expect(element).toHaveTextContent(/react/i)
// узнать больше: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Глобальные моки для тестирования
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Мок для Telegram WebApp API
Object.defineProperty(window, 'Telegram', {
  writable: true,
  value: {
    WebApp: {
      ready: jest.fn(),
      expand: jest.fn(),
      initDataUnsafe: {},
      themeParams: {},
      colorScheme: 'light',
      platform: 'web',
      showAlert: jest.fn(),
      showConfirm: jest.fn(),
      HapticFeedback: {
        impactOccurred: jest.fn(),
        notificationOccurred: jest.fn(),
      },
      CloudStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      MainButton: {
        setText: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        showProgress: jest.fn(),
        hideProgress: jest.fn(),
      },
    },
  },
}); 