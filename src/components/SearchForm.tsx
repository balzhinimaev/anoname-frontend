import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { hapticFeedback, requestLocationWithFallback, checkLocationPermission, showTelegramAlert, getTelegram } from '../utils/telegram';
import { 
  SearchFormProps, 
  SearchFormData, 
  Gender, 
  Location, 
  SearchData 
} from '../types';

const LocationStatus = {
  IDLE: 'idle' as const,
  LOADING: 'loading' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
} as const;

type LocationStatus = typeof LocationStatus[keyof typeof LocationStatus];

const STORAGE_KEY = 'searchFormParams';

const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, user, disabled = false }) => {
  const [formData, setFormData] = useState<SearchFormData>({
    myGender: '' as Gender,
    myAge: '',
    targetGender: '' as Gender,
    targetAgeMin: '',
    targetAgeMax: '',
    useLocation: false
  });

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(LocationStatus.IDLE);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const isInitialLoad = useRef(true);

  // Загрузка сохраненных данных при инициализации
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const tg = getTelegram();
        if (tg && tg.CloudStorage) {
          tg.CloudStorage.getItem(STORAGE_KEY, (error: string | null, value?: string) => {
            if (error) {
              console.error('Ошибка загрузки данных из CloudStorage:', error);
              return;
            }
            if (value) {
              try {
                const savedData = JSON.parse(value);
                setFormData(savedData);
                console.log('Данные формы успешно загружены из CloudStorage');
              } catch (e) {
                console.error('Ошибка парсинга данных из CloudStorage:', e);
              }
            }
          });
        }
      } catch (error) {
        console.error('Не удалось получить доступ к CloudStorage:', error);
      }
    };
    
    loadSavedData();
  }, []);

  // Сохранение данных при изменении
  useEffect(() => {
    // Не сохраняем при первом рендере, чтобы не перезаписать загруженные данные дефолтными
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const saveData = () => {
      try {
        const tg = getTelegram();
        if (tg && tg.CloudStorage) {
          tg.CloudStorage.setItem(STORAGE_KEY, JSON.stringify(formData), (error: string | null, success?: boolean) => {
            if (error) {
              console.error('Ошибка сохранения данных в CloudStorage:', error);
            } else if (success) {
              // console.log('Данные формы успешно сохранены в CloudStorage');
            }
          });
        }
      } catch (error) {
        console.error('Не удалось сохранить данные в CloudStorage:', error);
      }
    };

    saveData();
  }, [formData]);

  // Проверяем разрешения при загрузке
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await checkLocationPermission();
        setPermissionStatus(permission);
        console.log('Статус разрешения геолокации:', permission);
      } catch (error) {
        console.warn('Не удалось проверить разрешения геолокации:', error);
      }
    };

    checkPermissions();
  }, []);

  // Функция для запроса геолокации
  const requestLocation = async (): Promise<void> => {
    setLocationStatus(LocationStatus.LOADING);
    setLocationError(null);

    try {
      const position = await requestLocationWithFallback();
      
      if (position) {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus(LocationStatus.SUCCESS);
        hapticFeedback('success');
        console.log('Геолокация успешно получена:', position.coords);
      } else {
        throw new Error('Не удалось получить геолокацию');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка определения местоположения';
      setLocationError(errorMessage);
      setLocationStatus(LocationStatus.ERROR);
      hapticFeedback('error');
      console.error('Ошибка получения геолокации:', error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    
    // Тактильная обратная связь при изменении значений
    if (type === 'radio' || type === 'checkbox') {
      hapticFeedback('light');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Если включили использование геолокации и её ещё нет - запрашиваем
    if (name === 'useLocation' && checked && !location && locationStatus === LocationStatus.IDLE) {
      setTimeout(() => {
        requestLocation();
      }, 100);
    }
  };

  const handleLocationRequest = async (): Promise<void> => {
    hapticFeedback('light');
    await requestLocation();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Валидация формы
    if (!formData.myGender || !formData.myAge || !formData.targetGender || 
        !formData.targetAgeMin || !formData.targetAgeMax) {
      hapticFeedback('error');
      showTelegramAlert('Пожалуйста, заполните все поля');
      return;
    }

    const myAge = parseInt(formData.myAge);
    const targetAgeMin = parseInt(formData.targetAgeMin);
    const targetAgeMax = parseInt(formData.targetAgeMax);

    if (targetAgeMin > targetAgeMax) {
      hapticFeedback('error');
      showTelegramAlert('Минимальный возраст не может быть больше максимального');
      return;
    }

    if (myAge < 18) {
      hapticFeedback('error');
      showTelegramAlert('Минимальный возраст для использования приложения: 18 лет');
      return;
    }

    if (targetAgeMin < 18 || targetAgeMax < 18) {
      hapticFeedback('error');
      showTelegramAlert('Минимальный возраст для поиска: 18 лет');
      return;
    }

    // Проверка геолокации если она включена
    if (formData.useLocation && !location) {
      hapticFeedback('warning');
      showTelegramAlert('Геолокация включена, но местоположение не определено. Попробуйте обновить местоположение или отключите геолокацию.');
      return;
    }

    setIsLoading(true);

    const searchData: SearchData = {
      myGender: formData.myGender,
      myAge,
      targetGender: formData.targetGender,
      targetAgeMin,
      targetAgeMax,
      useLocation: formData.useLocation,
      location: formData.useLocation ? location : null,
      userId: user?.id
    };

    try {
      await onSubmit(searchData);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Boolean(
    formData.myGender && 
    formData.myAge && 
    formData.targetGender && 
    formData.targetAgeMin && 
    formData.targetAgeMax
  );

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case LocationStatus.LOADING:
        return '🔄 Определяем местоположение...';
      case LocationStatus.SUCCESS:
        return '✅ Местоположение определено';
      case LocationStatus.ERROR:
        return '❌ Ошибка определения местоположения';
      default:
        return '📍 Искать ближайших собеседников';
    }
  };

  const getLocationStatusColor = () => {
    switch (locationStatus) {
      case LocationStatus.LOADING:
        return 'var(--tg-theme-hint-color, #999)';
      case LocationStatus.SUCCESS:
        return 'var(--tg-theme-button-color, #0088cc)';
      case LocationStatus.ERROR:
        return 'var(--tg-theme-destructive-text-color, #ff3b30)';
      default:
        return 'var(--tg-theme-text-color, #000)';
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="form-container"
      style={{ 
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      {/* Выбор своего пола */}
      <div className="form-group">
        <label className="form-label">Ваш пол</label>
        <div className="radio-group">
          <label className={`radio-item ${formData.myGender === 'male' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="myGender"
              value="male"
              checked={formData.myGender === 'male'}
              onChange={handleInputChange}
              disabled={disabled}
            />
            👨 Мужчина
          </label>
          <label className={`radio-item ${formData.myGender === 'female' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="myGender"
              value="female"
              checked={formData.myGender === 'female'}
              onChange={handleInputChange}
              disabled={disabled}
            />
            👩 Женщина
          </label>
        </div>
      </div>

      {/* Свой возраст */}
      <div className="form-group">
        <label htmlFor="myAge" className="form-label">Ваш возраст</label>
        <input
          type="number"
          id="myAge"
          name="myAge"
          value={formData.myAge}
          onChange={handleInputChange}
          className="form-input"
          placeholder="Введите ваш возраст"
          min="18"
          max="100"
          disabled={disabled}
        />
      </div>

      {/* Выбор пола собеседника */}
      <div className="form-group">
        <label className="form-label">Пол собеседника</label>
        <div className="radio-group">
          <label className={`radio-item ${formData.targetGender === 'male' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="targetGender"
              value="male"
              checked={formData.targetGender === 'male'}
              onChange={handleInputChange}
              disabled={disabled}
            />
            👨 Мужчина
          </label>
          <label className={`radio-item ${formData.targetGender === 'female' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="targetGender"
              value="female"
              checked={formData.targetGender === 'female'}
              onChange={handleInputChange}
              disabled={disabled}
            />
            👩 Женщина
          </label>
          <label className={`radio-item ${formData.targetGender === 'any' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="targetGender"
              value="any"
              checked={formData.targetGender === 'any'}
              onChange={handleInputChange}
              disabled={disabled}
            />
            🤝 Любой
          </label>
        </div>
      </div>

      {/* Возрастной диапазон собеседника */}
      <div className="form-group">
        <label className="form-label">Возраст собеседника</label>
        <div className="age-range">
          <div>
            <input
              type="number"
              name="targetAgeMin"
              value={formData.targetAgeMin}
              onChange={handleInputChange}
              className="form-input"
              placeholder="От"
              min="18"
              max="100"
              disabled={disabled}
            />
          </div>
          <div>
            <input
              type="number"
              name="targetAgeMax"
              value={formData.targetAgeMax}
              onChange={handleInputChange}
              className="form-input"
              placeholder="До"
              min="18"
              max="100"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Геолокация с улучшенным интерфейсом */}
      <div className="form-group">
        <label className={`checkbox-item ${formData.useLocation ? 'checked' : ''}`}>
          <input
            type="checkbox"
            name="useLocation"
            checked={formData.useLocation}
            onChange={handleInputChange}
            disabled={disabled}
          />
          <span style={{ color: getLocationStatusColor() }}>
            {getLocationStatusText()}
          </span>
        </label>
        
        {formData.useLocation && (
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            {locationStatus === LocationStatus.ERROR && locationError && (
              <div style={{ 
                color: 'var(--tg-theme-destructive-text-color, #ff3b30)',
                marginBottom: '8px'
              }}>
                {locationError}
              </div>
            )}
            
            {permissionStatus === 'denied' && (
              <div style={{ 
                color: 'var(--tg-theme-hint-color, #999)',
                marginBottom: '8px'
              }}>
                💡 Разрешите геолокацию в настройках браузера
              </div>
            )}
            
            {(locationStatus === LocationStatus.ERROR || (!location && locationStatus !== LocationStatus.LOADING)) && (
              <button
                type="button"
                onClick={handleLocationRequest}
                disabled={disabled}
                style={{
                  background: 'var(--tg-theme-button-color, #0088cc)',
                  color: 'var(--tg-theme-button-text-color, white)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: 1
                }}
              >
                🔄 Обновить местоположение
              </button>
            )}
            
            {location && locationStatus === LocationStatus.SUCCESS && (
              <div style={{ 
                color: 'var(--tg-theme-hint-color, #999)',
                fontSize: '12px'
              }}>
                Координаты: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка отправки */}
      <button
        type="submit"
        className="submit-button"
        disabled={!isFormValid || isLoading || disabled}
      >
        {disabled 
          ? '⏸️ Поиск недоступен' 
          : isLoading 
            ? '🔍 Ищем собеседника...' 
            : '💬 Начать поиск'
        }
      </button>

      {user && (
        <div style={{ 
          marginTop: '16px', 
          fontSize: '14px', 
          color: 'var(--tg-theme-hint-color, #999)', 
          textAlign: 'center' 
        }}>
          Привет, {user.first_name}! 👋
        </div>
      )}
      
      {!user && (
        <div style={{ 
          marginTop: '16px', 
          fontSize: '14px', 
          color: 'var(--tg-theme-hint-color, #999)', 
          textAlign: 'center' 
        }}>
          Запустите через Telegram для полного функционала
        </div>
      )}
    </form>
  );
};

export default SearchForm; 