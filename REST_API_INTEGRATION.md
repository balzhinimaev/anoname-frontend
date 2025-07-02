# REST API Интеграция

## Обзор

Проект полностью интегрирован с REST API `https://anoname.xyz/rest_api/api`. Все методы из официальной документации `REST_API.md` реализованы в сервисе `src/services/api.ts`.

## Структура API сервиса

### Инициализация
```typescript
import { apiService } from '../services/api';
```

### Базовый URL
```
https://anoname.xyz/rest_api/api
```

## Разделы API

### 🔐 Аутентификация (`/api/auth`)

#### Новые методы (REST API)
```typescript
// Регистрация нового пользователя
const authResponse = await apiService.register({
  telegramId: 123456789,
  username: "username",
  firstName: "Иван",
  lastName: "Иванов",
  bio: "Описание профиля",
  gender: "male",
  age: 25,
  platform: "telegram"
});

// Вход в систему
const loginResponse = await apiService.login({
  telegramId: 123456789,
  platform: "telegram"
});

// Выход из текущей сессии
await apiService.logout();

// Выход из всех сессий
await apiService.logoutAll();
```

#### Старые методы (совместимость)
```typescript
// Аутентификация через Telegram
const response = await apiService.authenticateWithTelegram(telegramData);
```

### 👤 Пользователи (`/api/users`)

```typescript
// Создание или обновление пользователя
const userProfile = await apiService.createOrUpdateUser({
  telegramId: 123456789,
  username: "username",
  firstName: "Иван",
  lastName: "Иванов",
  bio: "Новое описание профиля",
  gender: "male",
  age: 25
});

// Получение профиля пользователя
const profile = await apiService.getUserProfile(123456789);

// Получение потенциальных партнеров
const matches = await apiService.getMatches(123456789, 20, 1);

// Обновление предпочтений
await apiService.updateUserPreferences(123456789, {
  gender: "female",
  ageRange: { min: 20, max: 30 }
});

// Загрузка фотографий
const photos = await apiService.uploadPhotos(123456789, fileList);

// Удаление фотографии
await apiService.deletePhoto(123456789, "photo_id");
```

### 💬 Чаты (`/api/chats`)

```typescript
// Создание нового чата
const chat = await apiService.createChat({
  participants: ["userId1", "userId2"],
  type: "anonymous"
});

// Получение чатов пользователя
const userChats = await apiService.getUserChats("userId", "anonymous");

// Получение сообщений чата
const messages = await apiService.getChatMessages("chatId", 50);

// Отправка сообщения
const message = await apiService.sendChatMessage("chatId", {
  content: "Привет! Как дела?",
  sender: "senderId"
});

// Отметка сообщений как прочитанные
await apiService.markMessagesAsRead("chatId");

// Деактивация чата
await apiService.deactivateChat("chatId");
```

### 🔍 Поиск (`/api/search`)

```typescript
// Получение статистики поиска (публичный эндпоинт)
const searchStats = await apiService.getSearchStats();
```

### 💰 Монетизация (`/api/monetization`)

```typescript
// Получение статуса пользователя
const status = await apiService.getMonetizationStatus();

// Получение доступных тарифов
const tiers = await apiService.getMonetizationTiers();

// Получение доступных товаров
const items = await apiService.getMonetizationItems();

// Совершение покупки
await apiService.makePurchase({
  itemKey: "hearts_10",
  paymentData: {
    payment_id: "12345",
    amount: 59,
    currency: "RUB",
    method: "card"
  }
});

// Проверка возможности поиска
const canSearch = await apiService.checkCanSearch();

// Получение лимитов поиска
const limits = await apiService.getSearchLimits();

// Проверка возможности использования буста
const canBoost = await apiService.checkCanUseBoost();

// Проверка возможности использования супер-лайка
const canSuperLike = await apiService.checkCanUseSuperLike();

// Пополнение бесплатной валюты
const refill = await apiService.refillFreeCurrency();
```

### 📊 Мониторинг (`/api/monitoring`)

```typescript
// Получение метрик системы (требует авторизации)
const metrics = await apiService.getSystemMetrics();

// Проверка состояния системы
const health = await apiService.getHealthCheck();

// Базовая проверка здоровья (публичный эндпоинт)
const basicHealth = await apiService.getBasicHealth();
```

## Типы данных

### REST API типы
Все новые типы имеют префикс `REST_` для избежания конфликтов:

```typescript
import {
  REST_RegisterRequest,
  REST_LoginRequest,
  REST_AuthResponse,
  REST_UserProfile,
  REST_CreateChatRequest,
  REST_Chat,
  REST_ChatMessage,
  REST_SendMessageRequest,
  MonetizationStatus,
  MonetizationTiers,
  MonetizationItems,
  PurchaseRequest,
  CanSearchResponse,
  SearchLimitsResponse,
  CanUseResponse,
  RefillResponse,
  SystemMetrics,
  HealthCheck,
  ApiSuccessResponse,
  ApiErrorResponse
} from '../types';
```

### Структуры ответов

#### Успешные ответы
```typescript
interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}
```

#### Ошибки
```typescript
interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
```

#### Пагинация
```typescript
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
```

## Обработка ошибок

API сервис автоматически обрабатывает:

1. **401 Unauthorized** - удаляет недействительный токен
2. **Сетевые ошибки** - возвращает `NETWORK_ERROR`
3. **Ошибки валидации** - передает детали ошибок
4. **Таймауты** - 10 секунд по умолчанию

```typescript
try {
  const result = await apiService.someMethod();
  // Обработка успешного результата
} catch (error) {
  // error.message - описание ошибки
  // error.code - код ошибки
  // error.details - дополнительные детали
  console.error('API Error:', error);
}
```

## Аутентификация

### Автоматическое добавление токена
```typescript
// Токен автоматически добавляется в заголовок Authorization
localStorage.setItem('auth_token', 'your_jwt_token');
```

### Интерцепторы
- **Request Interceptor**: добавляет Bearer токен
- **Response Interceptor**: обрабатывает 401 ошибки

## Rate Limiting

API поддерживает ограничения по частоте запросов. При превышении лимита возвращается код `429`.

Лимиты указываются в заголовках:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## CORS

API поддерживает CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Совместимость

Сохранены все старые методы для обратной совместимости:
- `authenticateWithTelegram()`
- `createProfile()`
- `updateProfile()`
- `searchPartner()`
- `getActiveChats()`
- `sendMessage()`
- `getMessages()`
- `endChat()`
- `getUserStats()`

## Swagger UI

Интерактивная документация доступна по адресу: `/api-docs`

## Примеры использования

### Полный цикл аутентификации
```typescript
try {
  // Регистрация или вход
  const authResponse = await apiService.register({
    telegramId: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username
  });

  // Получение профиля
  const profile = await apiService.getUserProfile(user.id);

  // Обновление предпочтений
  await apiService.updateUserPreferences(user.id, {
    gender: "female",
    ageRange: { min: 18, max: 35 }
  });

  console.log('Аутентификация завершена успешно');
} catch (error) {
  console.error('Ошибка аутентификации:', error);
}
```

### Работа с чатами
```typescript
try {
  // Получение чатов пользователя
  const chats = await apiService.getUserChats(userId);

  for (const chat of chats) {
    // Получение сообщений каждого чата
    const messages = await apiService.getChatMessages(chat._id);
    
    // Отметка как прочитанные
    await apiService.markMessagesAsRead(chat._id);
  }
} catch (error) {
  console.error('Ошибка работы с чатами:', error);
}
```

### Проверка лимитов и покупки
```typescript
try {
  // Проверка возможности поиска
  const canSearchResponse = await apiService.checkCanSearch();
  
  if (!canSearchResponse.data.canSearch) {
    // Получение доступных тарифов
    const tiers = await apiService.getMonetizationTiers();
    
    // Показать пользователю варианты покупки
    console.log('Доступные тарифы:', tiers.data);
  }
} catch (error) {
  console.error('Ошибка проверки лимитов:', error);
}
```

## Заключение

REST API полностью интегрирован в проект и готов к использованию. Все методы из официальной документации реализованы с правильной типизацией TypeScript и обработкой ошибок. 