import { useState, useEffect } from 'react';
import websocketService from '../services/websocket';
import { WebSocketSearchStats } from '../types';

export const useSearchStats = () => {
  const [searchStats, setSearchStats] = useState<WebSocketSearchStats | null>(null);

  useEffect(() => {
    // Подписываемся на статистику при монтировании
    const handleStats = (stats: WebSocketSearchStats) => {
      setSearchStats(stats);
    };

    // Подписываемся на событие статистики
    const unsubscribeStats = websocketService.on('search:stats', handleStats);

    // Запрашиваем статистику при подключении
    if (websocketService.isConnected()) {
      websocketService.subscribeToStats();
    }

    // Слушаем подключение
    const handleConnect = () => {
      websocketService.subscribeToStats();
    };

    const unsubscribeConnect = websocketService.on('connect', handleConnect);

    return () => {
      unsubscribeStats();
      unsubscribeConnect();
      websocketService.unsubscribeFromStats();
    };
  }, []);

  return searchStats;
}; 