import { TelegramUser, TelegramWebApp } from '../types';

/**
 * Возвращает объект Telegram WebApp из глобального window.
 * @returns {TelegramWebApp | null} Объект WebApp или null, если он недоступен.
 */
function getTelegram(): TelegramWebApp | null {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
}

/**
 * Получает данные пользователя из Telegram Web App.
 * @returns {TelegramUser | null} Объект пользователя или null.
 */
export const getTelegramUser = (): TelegramUser | null => {
  const tg = getTelegram();
  return tg?.initDataUnsafe?.user || null;
};

/**
 * Устанавливает CSS переменные на основе темы Telegram.
 */
export const setTelegramTheme = (): void => {
  const tg = getTelegram();
  if (!tg) return;

  const root = document.documentElement;
  const theme = tg.themeParams;
  
  // Установка основных цветов
  root.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
  root.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
  root.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
  root.style.setProperty('--tg-theme-button-color', theme.button_color || '#0088cc');
  root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
  root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f8f9fa');
  
  if (theme.link_color) {
    root.style.setProperty('--tg-theme-link-color', theme.link_color);
  }
  
  // Установка класса для темной/светлой темы
  const isDark = tg.colorScheme === 'dark';
  document.body.classList.toggle('tg-dark-theme', isDark);
  document.body.classList.toggle('tg-light-theme', !isDark);
};

export const initTelegramApp = (): TelegramWebApp | null => {
  const tg = window.Telegram?.WebApp;
  
  if (!tg) {
    console.warn('Telegram WebApp недоступен');
    return null;
  }

  // Инициализация приложения
  tg.ready();
  tg.expand();

  return tg;
};

export const getTelegramInitData = (): string | null => {
  const tg = window.Telegram?.WebApp;
  return tg?.initData || null;
};

export const showTelegramAlert = (message: string, callback?: () => void): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.showAlert(message, callback);
  } else {
    alert(message);
    callback?.();
  }
};

export const showTelegramConfirm = (
  message: string, 
  callback: (confirmed: boolean) => void
): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.showConfirm(message, callback);
  } else {
    const result = confirm(message);
    callback(result);
  }
};

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'): void => {
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    switch (type) {
      case 'light':
        tg.HapticFeedback.impactOccurred('light');
        break;
      case 'medium':
        tg.HapticFeedback.impactOccurred('medium');
        break;
      case 'heavy':
        tg.HapticFeedback.impactOccurred('heavy');
        break;
      case 'success':
        tg.HapticFeedback.notificationOccurred('success');
        break;
      case 'warning':
        tg.HapticFeedback.notificationOccurred('warning');
        break;
      case 'error':
        tg.HapticFeedback.notificationOccurred('error');
        break;
      default:
        tg.HapticFeedback.impactOccurred('medium');
    }
  }
};

// Новые функции для работы с геолокацией
export const requestLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    const tg = window.Telegram?.WebApp;

    // Проверяем наличие геолокации в браузере
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается вашим устройством'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 секунд
      maximumAge: 300000 // 5 минут
    };

    // Используем стандартный API геолокации с улучшенными настройками
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Геолокация получена:', position.coords);
        resolve(position);
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
        
        let errorMessage = 'Не удалось определить местоположение';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите в настройках браузера.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMessage = 'Превышено время ожидания определения местоположения';
            break;
        }
        
        // Показываем пользователю информативное сообщение
        if (tg) {
          showTelegramAlert(errorMessage);
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

export const requestLocationWithFallback = async (): Promise<GeolocationPosition | null> => {
  try {
    // Сначала пытаемся получить текущую позицию
    const position = await requestLocation();
    return position;
  } catch (error) {
    console.warn('Основной метод геолокации не сработал, пробуем fallback');
    
    // Fallback: пытаемся получить приблизительную позицию
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const fallbackOptions: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000 // 10 минут
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Геолокация получена через fallback:', position.coords);
          resolve(position);
        },
        (error) => {
          console.error('Fallback геолокация также не сработала:', error);
          resolve(null);
        },
        fallbackOptions
      );
    });
  }
};

export const checkLocationPermission = (): Promise<PermissionState> => {
  return new Promise((resolve) => {
    if (!navigator.permissions) {
      // Если API разрешений недоступен, возвращаем 'prompt'
      resolve('prompt');
      return;
    }

    navigator.permissions.query({ name: 'geolocation' })
      .then((permission) => {
        resolve(permission.state);
      })
      .catch(() => {
        resolve('prompt');
      });
  });
};

export const setMainButton = (text: string, onClick: () => void): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }
};

export const hideMainButton = (): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.MainButton.hide();
  }
};

export const showMainButtonProgress = (): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.MainButton.showProgress();
  }
};

export const hideMainButtonProgress = (): void => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.MainButton.hideProgress();
  }
}; 