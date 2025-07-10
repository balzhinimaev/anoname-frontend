import { useCallback, useEffect } from 'react';

export const useTelegramUI = () => {
  const showAlert = useCallback((message: string) => {
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      // Fallback для обычного браузера
      // eslint-disable-next-line no-alert
      alert(message);
    }
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.showConfirm) {
        window.Telegram.WebApp.showConfirm(message, resolve);
      } else {
        // Fallback для обычного браузера
        // eslint-disable-next-line no-alert, no-restricted-globals
        resolve(confirm(message));
      }
    });
  }, []);

  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }): Promise<string | null> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup(params, resolve);
      } else {
        // Fallback для обычного браузера
        // eslint-disable-next-line no-alert, no-restricted-globals
        resolve(confirm(params.message) ? 'ok' : null);
      }
    });
  }, []);

  const setMainButton = useCallback((params: {
    text: string;
    color?: string;
    textColor?: string;
    isVisible?: boolean;
    isActive?: boolean;
    onClick?: () => void;
  }) => {
    if (window.Telegram?.WebApp?.MainButton) {
      const mainButton = window.Telegram.WebApp.MainButton;
      
      mainButton.setText(params.text);
      
      if (params.color) {
        mainButton.color = params.color;
      }
      
      if (params.textColor) {
        mainButton.textColor = params.textColor;
      }
      
      if (params.onClick) {
        mainButton.onClick(params.onClick);
      }
      
      if (params.isVisible) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
      
      if (params.isActive !== undefined) {
        if (params.isActive) {
          mainButton.enable();
        } else {
          mainButton.disable();
        }
      }
    }
  }, []);

  const hideMainButton = useCallback(() => {
    if (window.Telegram?.WebApp?.MainButton) {
      window.Telegram.WebApp.MainButton.hide();
    }
  }, []);

  const ready = useCallback(() => {
    if (window.Telegram?.WebApp?.ready) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const expand = useCallback(() => {
    if (window.Telegram?.WebApp?.expand) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const close = useCallback(() => {
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    }
  }, []);

  const isWebApp = useCallback(() => {
    return Boolean(window.Telegram?.WebApp);
  }, []);

  const getWebAppData = useCallback(() => {
    if (window.Telegram?.WebApp) {
      return {
        initData: window.Telegram.WebApp.initData,
        initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
        version: window.Telegram.WebApp.version,
        platform: window.Telegram.WebApp.platform,
        colorScheme: window.Telegram.WebApp.colorScheme,
        themeParams: window.Telegram.WebApp.themeParams,
        isExpanded: window.Telegram.WebApp.isExpanded,
        viewportHeight: window.Telegram.WebApp.viewportHeight,
        viewportStableHeight: window.Telegram.WebApp.viewportStableHeight,
        headerColor: window.Telegram.WebApp.headerColor,
        backgroundColor: window.Telegram.WebApp.backgroundColor,
        isClosingConfirmationEnabled: window.Telegram.WebApp.isClosingConfirmationEnabled
      };
    }
    return null;
  }, []);

  // Инициализация WebApp при монтировании
  useEffect(() => {
    if (isWebApp()) {
      ready();
      expand();
    }
  }, [ready, expand, isWebApp]);

  return {
    showAlert,
    showConfirm,
    showPopup,
    setMainButton,
    hideMainButton,
    ready,
    expand,
    close,
    isWebApp,
    getWebAppData
  };
}; 