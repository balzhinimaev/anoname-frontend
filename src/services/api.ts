import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  // Существующие типы
  UserProfile, 
  SearchData, 
  SearchPartnerResponse, 
  Chat, 
  ChatMessage,
  ApiError,
  // Новые REST API типы
  REST_RegisterRequest,
  REST_LoginRequest,
  REST_AuthResponse,
  REST_UserProfile,
  UpdateUserRequest,
  MatchesResponse,
  UpdatePreferencesRequest,
  PhotoUploadResponse,
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
  WebSocketSearchStats
} from '../types';

const API_BASE_URL = 'https://anoname.xyz/rest_api/api';

class AnonameAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Интерцептор для добавления токена авторизации
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Удаляем невалидный токен
          localStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
      }
    );
  }

  // ======== АУТЕНТИФИКАЦИЯ ========

  // Регистрация нового пользователя
  async register(userData: REST_RegisterRequest): Promise<REST_AuthResponse> {
    try {
      const response = await this.api.post<REST_AuthResponse>('/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw this.handleApiError(error);
    }
  }

  // Вход в систему
  async login(loginData: REST_LoginRequest): Promise<REST_AuthResponse> {
    try {
      const response = await this.api.post<REST_AuthResponse>('/auth/login', loginData);
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw this.handleApiError(error);
    }
  }

  // Выход из текущей сессии
  async logout(): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/logout');
      localStorage.removeItem('auth_token');
      return response.data;
    } catch (error) {
      console.error('Ошибка выхода:', error);
      throw this.handleApiError(error);
    }
  }

  // Выход из всех сессий
  async logoutAll(): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/logout-all');
      localStorage.removeItem('auth_token');
      return response.data;
    } catch (error) {
      console.error('Ошибка выхода из всех сессий:', error);
      throw this.handleApiError(error);
    }
  }



  // ======== ПОЛЬЗОВАТЕЛИ ========

  // Создание или обновление пользователя
  async createOrUpdateUser(userData: UpdateUserRequest): Promise<REST_UserProfile> {
    try {
      const response = await this.api.post<REST_UserProfile>('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания/обновления пользователя:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение профиля пользователя
  async getUserProfile(telegramId: number): Promise<REST_UserProfile> {
    try {
      const response = await this.api.get<REST_UserProfile>(`/users/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение потенциальных партнеров
  async getMatches(telegramId: number, limit: number = 20, page: number = 1): Promise<MatchesResponse> {
    try {
      const response = await this.api.get<MatchesResponse>(`/users/${telegramId}/matches`, {
        params: { limit, page }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка получения совпадений:', error);
      throw this.handleApiError(error);
    }
  }

  // Обновление предпочтений пользователя
  async updateUserPreferences(telegramId: number, preferences: UpdatePreferencesRequest): Promise<{ telegramId: number; preferences: UpdatePreferencesRequest }> {
    try {
      const response = await this.api.put(`/users/${telegramId}/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления предпочтений:', error);
      throw this.handleApiError(error);
    }
  }

  // Загрузка фотографий
  async uploadPhotos(telegramId: number, photos: FileList): Promise<PhotoUploadResponse[]> {
    try {
      const formData = new FormData();
      Array.from(photos).forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await this.api.post<PhotoUploadResponse[]>(`/users/${telegramId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки фотографий:', error);
      throw this.handleApiError(error);
    }
  }

  // Удаление фотографии
  async deletePhoto(telegramId: number, photoId: string): Promise<{ message: string }> {
    try {
      const response = await this.api.delete(`/users/${telegramId}/photos/${photoId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления фотографии:', error);
      throw this.handleApiError(error);
    }
  }

  // ======== ЧАТЫ ========

  // Создание нового чата
  async createChat(chatData: REST_CreateChatRequest): Promise<REST_Chat> {
    try {
      const response = await this.api.post<REST_Chat>('/chats', chatData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение чатов пользователя
  async getUserChats(userId: string, type?: 'anonymous' | 'permanent' | 'all'): Promise<REST_Chat[]> {
    try {
      const params = type ? { type } : {};
      const response = await this.api.get<REST_Chat[]>(`/chats/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка получения чатов:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение сообщений чата
  async getChatMessages(chatId: string, limit: number = 50, before?: string): Promise<REST_ChatMessage[]> {
    try {
      const params: any = { limit };
      if (before) params.before = before;
      
      const response = await this.api.get<REST_ChatMessage[]>(`/chats/${chatId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      throw this.handleApiError(error);
    }
  }

  // Отправка сообщения
  async sendChatMessage(chatId: string, messageData: REST_SendMessageRequest): Promise<REST_ChatMessage> {
    try {
      const response = await this.api.post<REST_ChatMessage>(`/chats/${chatId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      throw this.handleApiError(error);
    }
  }

  // Отметить сообщения как прочитанные
  async markMessagesAsRead(chatId: string): Promise<{ message: string; markedCount: number }> {
    try {
      const response = await this.api.put(`/chats/${chatId}/messages/read`);
      return response.data;
    } catch (error) {
      console.error('Ошибка отметки сообщений как прочитанные:', error);
      throw this.handleApiError(error);
    }
  }

  // Деактивация чата
  async deactivateChat(chatId: string): Promise<{ message: string }> {
    try {
      const response = await this.api.delete(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка деактивации чата:', error);
      throw this.handleApiError(error);
    }
  }

  // ======== ПОИСК ========

  // Получение статистики поиска
  async getSearchStats(): Promise<WebSocketSearchStats> {
    try {
      const response = await this.api.get<WebSocketSearchStats>('/search/stats');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения статистики поиска:', error);
      throw this.handleApiError(error);
    }
  }

  // ======== МОНЕТИЗАЦИЯ ========

  // Получение статуса пользователя
  async getMonetizationStatus(): Promise<ApiSuccessResponse<MonetizationStatus>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<MonetizationStatus>>('/monetization/status');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения статуса монетизации:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение доступных тарифов
  async getMonetizationTiers(): Promise<ApiSuccessResponse<MonetizationTiers>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<MonetizationTiers>>('/monetization/tiers');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения тарифов:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение доступных товаров
  async getMonetizationItems(): Promise<ApiSuccessResponse<MonetizationItems>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<MonetizationItems>>('/monetization/items');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения товаров:', error);
      throw this.handleApiError(error);
    }
  }

  // Совершение покупки
  async makePurchase(purchaseData: PurchaseRequest): Promise<ApiSuccessResponse> {
    try {
      const response = await this.api.post<ApiSuccessResponse>('/monetization/purchase', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Ошибка покупки:', error);
      throw this.handleApiError(error);
    }
  }

  // Проверка возможности поиска
  async checkCanSearch(): Promise<ApiSuccessResponse<CanSearchResponse>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<CanSearchResponse>>('/monetization/check/search');
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки возможности поиска:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение лимитов поиска
  async getSearchLimits(): Promise<ApiSuccessResponse<SearchLimitsResponse>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<SearchLimitsResponse>>('/monetization/limits/search');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения лимитов поиска:', error);
      throw this.handleApiError(error);
    }
  }

  // Проверка возможности использования буста
  async checkCanUseBoost(): Promise<ApiSuccessResponse<CanUseResponse>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<CanUseResponse>>('/monetization/check/boost');
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки возможности буста:', error);
      throw this.handleApiError(error);
    }
  }

  // Проверка возможности использования супер-лайка
  async checkCanUseSuperLike(): Promise<ApiSuccessResponse<CanUseResponse>> {
    try {
      const response = await this.api.get<ApiSuccessResponse<CanUseResponse>>('/monetization/check/superlike');
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки возможности супер-лайка:', error);
      throw this.handleApiError(error);
    }
  }

  // Пополнение бесплатной валюты
  async refillFreeCurrency(): Promise<ApiSuccessResponse<RefillResponse>> {
    try {
      const response = await this.api.post<ApiSuccessResponse<RefillResponse>>('/monetization/refill');
      return response.data;
    } catch (error) {
      console.error('Ошибка пополнения валюты:', error);
      throw this.handleApiError(error);
    }
  }

  // ======== МОНИТОРИНГ ========

  // Получение метрик системы
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await this.api.get<SystemMetrics>('/monitoring/metrics');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения метрик:', error);
      throw this.handleApiError(error);
    }
  }

  // Проверка состояния системы
  async getHealthCheck(): Promise<HealthCheck> {
    try {
      const response = await this.api.get<HealthCheck>('/monitoring/health');
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки состояния:', error);
      throw this.handleApiError(error);
    }
  }

  // Базовая проверка здоровья
  async getBasicHealth(): Promise<{ status: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Ошибка базовой проверки:', error);
      throw this.handleApiError(error);
    }
  }

  // ======== СТАРЫЕ МЕТОДЫ ДЛЯ СОВМЕСТИМОСТИ ========

  // Создание профиля пользователя (старый метод)
  async createProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.api.post<UserProfile>('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания профиля:', error);
      throw this.handleApiError(error);
    }
  }

  // Обновление профиля (старый метод)
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.api.put<UserProfile>('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      throw this.handleApiError(error);
    }
  }

  // Поиск собеседника (старый метод)
  async searchPartner(searchParams: SearchData): Promise<SearchPartnerResponse> {
    try {
      const response = await this.api.post<SearchPartnerResponse>('/search/partner', {
        gender: searchParams.myGender,
        age: searchParams.myAge,
        target_gender: searchParams.targetGender,
        target_age_min: searchParams.targetAgeMin,
        target_age_max: searchParams.targetAgeMax,
        use_location: searchParams.useLocation,
        location: searchParams.location,
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка поиска:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение активных чатов (старый метод)
  async getActiveChats(): Promise<Chat[]> {
    try {
      const response = await this.api.get<Chat[]>('/chats/active');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения чатов:', error);
      throw this.handleApiError(error);
    }
  }

  // Отправка сообщения (старый метод)
  async sendMessage(chatId: string, message: string): Promise<ChatMessage> {
    try {
      const response = await this.api.post<ChatMessage>(`/chats/${chatId}/messages`, {
        content: message,
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение истории сообщений (старый метод)
  async getMessages(chatId: string, page: number = 1, limit: number = 50): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await this.api.get(`/chats/${chatId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      throw this.handleApiError(error);
    }
  }

  // Завершение чата (старый метод)
  async endChat(chatId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post(`/chats/${chatId}/end`);
      return response.data;
    } catch (error) {
      console.error('Ошибка завершения чата:', error);
      throw this.handleApiError(error);
    }
  }

  // Получение статистики пользователя (старый метод)
  async getUserStats(): Promise<{
    total_chats: number;
    active_chats: number;
    messages_sent: number;
    average_chat_duration: number;
  }> {
    try {
      const response = await this.api.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      throw this.handleApiError(error);
    }
  }

  // Обработка ошибок API
  private handleApiError(error: any): ApiError {
    if (error.response?.data) {
      return {
        message: error.response.data.error || error.response.data.message || 'Произошла ошибка API',
        code: error.response.data.code || 'UNKNOWN_ERROR',
        details: error.response.data.details,
      };
    }
    
    if (error.request) {
      return {
        message: 'Нет ответа от сервера. Проверьте подключение к интернету.',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      message: error.message || 'Неизвестная ошибка',
      code: 'UNKNOWN_ERROR',
    };
  }
}

// Создаем единственный экземпляр API сервиса
export const apiService = new AnonameAPI();
export default apiService; 