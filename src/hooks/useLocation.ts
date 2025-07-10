import { useState, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export enum LocationStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(LocationStatus.IDLE);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');

  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      return 'denied';
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        const status = permission.state as PermissionStatus;
        setPermissionStatus(status);
        return status;
      }
    } catch (error) {
      console.warn('Не удалось проверить разрешения геолокации:', error);
    }

    setPermissionStatus('unknown');
    return 'unknown';
  }, []);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      const error = 'Геолокация не поддерживается вашим браузером';
      setLocationError(error);
      setLocationStatus(LocationStatus.ERROR);
      return null;
    }

    setLocationStatus(LocationStatus.LOADING);
    setLocationError(null);

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 минут
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          setLocation(locationData);
          setLocationStatus(LocationStatus.SUCCESS);
          setPermissionStatus('granted');
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Не удалось определить местоположение';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен';
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о местоположении недоступна';
              break;
            case error.TIMEOUT:
              errorMessage = 'Время ожидания определения местоположения истекло';
              break;
            default:
              errorMessage = `Ошибка геолокации: ${error.message}`;
              break;
          }
          
          setLocationError(errorMessage);
          setLocationStatus(LocationStatus.ERROR);
          resolve(null);
        },
        options
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setLocationStatus(LocationStatus.IDLE);
    setLocationError(null);
  }, []);

  const isLocationSupported = useCallback(() => {
    return 'geolocation' in navigator;
  }, []);

  return {
    location,
    locationStatus,
    locationError,
    permissionStatus,
    requestLocation,
    clearLocation,
    checkPermissions,
    isLocationSupported
  };
}; 