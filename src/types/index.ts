// Типы для Telegram WebApp
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    chat_type?: string;
    chat_instance?: string;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: string | null, success?: boolean) => void) => void;
    getItem: (key: string, callback?: (error: string | null, value?: string) => void) => void;
    getItems: (keys: string[], callback?: (error: string | null, values?: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: string | null, success?: boolean) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, success?: boolean) => void) => void;
    getKeys: (callback?: (error: string | null, keys?: string[]) => void) => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: object, callback?: (buttonId: string) => void) => void;
  showScanQrPopup: (params: object, callback?: (text: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, chooseChatTypes?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
}

// Типы для формы поиска
export type Gender = 'male' | 'female' | 'any';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchFormData {
  myGender: Gender;
  myAge: string;
  targetGender: Gender;
  targetAgeMin: string;
  targetAgeMax: string;
  useLocation: boolean;
}

export interface SearchData {
  myGender: Gender;
  myAge: number;
  targetGender: Gender;
  targetAgeMin: number;
  targetAgeMax: number;
  useLocation: boolean;
  location: Location | null;
  userId?: number | undefined;
}

// Типы для API
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
}

export interface UserProfile {
  id: number;
  gender: Gender;
  age: number;
  created_at: string;
  updated_at: string;
}

export interface SearchPartnerResponse {
  search_id: string;
  status: 'searching' | 'found' | 'not_found';
  partner?: {
    id: string;
    age: number;
    gender: Gender;
    location?: Location;
  };
  chat_id?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface Chat {
  id: string;
  partner_id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
  messages: ChatMessage[];
}

export interface ApiError {
  message: string;
  code: string;
  details?: object;
}

// Типы для компонентов
export interface SearchFormProps {
  onSubmit: (searchData: SearchData) => Promise<void>;
  user: TelegramUser | null;
  disabled?: boolean;
}

// Глобальные типы
declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

// Типы для WebSocket API
export interface WebSocketSearchCriteria {
  gender: 'male' | 'female';
  age: number;
  rating?: number;
  desiredGender: Array<'male' | 'female' | 'any'>;
  desiredAgeMin: number;
  desiredAgeMax: number;
  minAcceptableRating?: number;
  useGeolocation: boolean;
  location?: {
    longitude: number;
    latitude: number;
  };
  maxDistance?: number;
}

export interface WebSocketSearchStart {
  criteria: WebSocketSearchCriteria;
}

export interface WebSocketMatchedUser {
  telegramId: string;
  gender: 'male' | 'female';
  age: number;
  chatId: string;
}

export interface WebSocketSearchMatched {
  matchedUser: WebSocketMatchedUser;
}

export interface WebSocketSearchStatus {
  status: 'searching' | 'cancelled' | 'expired' | 'matched';
}

export interface WebSocketSearchStats {
  t: number;      // Всего ищут
  m: number;      // Мужчин ищут
  f: number;      // Женщин ищут
  inChat?: number; // В чатах
  online: {
    t: number;    // Всего онлайн
    m: number;    // Мужчин онлайн
    f: number;    // Женщин онлайн
  };
  avgSearchTime: {
    t: number;              // Среднее время поиска (всего)
    m: number;              // Среднее время поиска (мужчины)
    f: number;              // Среднее время поиска (женщины)
    matches24h: number;     // Количество мэтчей за 24 часа
  };
}

export interface WebSocketChatMessage {
  chatId: string;
  content: string;
}

export interface WebSocketUser {
  _id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photos?: string[];
}

export interface WebSocketMessageData {
  _id: string;
  chatId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  readBy: string[];
  sender: WebSocketUser;
}

export interface WebSocketChatMessageReceived {
  chatId: string;
  message: WebSocketMessageData;
}

export interface WebSocketChatStartTyping {
  chatId: string;
  userId: string;
}

export interface WebSocketChatStopTyping {
  chatId: string;
  userId: string;
}

export interface WebSocketChatRead {
  chatId: string;
  timestamp: Date;
}

export interface WebSocketChatEnd {
  chatId: string;
  reason?: string;
}

export interface WebSocketChatEnded {
  chatId: string;
  endedBy: string;
  reason?: string;
}

export interface WebSocketChatRate {
  chatId: string;
  score: number;
  comment?: string;
}

export interface WebSocketChatRated {
  chatId: string;
  ratedBy: string;
  score: number;
}

export interface WebSocketContactRequest {
  to: string;
  chatId: string;
}

export interface WebSocketContactRequestReceived {
  from: string;
  chatId: string;
}

export interface WebSocketContactRespond {
  userId: string;
  status: 'accepted' | 'declined' | 'blocked';
}

export interface WebSocketContactStatus {
  userId: string;
  status: 'accepted' | 'declined' | 'blocked';
}

export interface WebSocketError {
  message: string;
}

// События от клиента к серверу
export interface ClientToServerEvents {
  'search:start': (data: WebSocketSearchStart) => void;
  'search:cancel': () => void;
  'search:subscribe_stats': () => void;
  'search:unsubscribe_stats': () => void;
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'chat:message': (data: WebSocketChatMessage) => void;
  'chat:start_typing': (data: { chatId: string }) => void;
  'chat:stop_typing': (data: { chatId: string }) => void;
  'chat:read': (data: WebSocketChatRead) => void;
  'chat:end': (data: WebSocketChatEnd) => void;
  'chat:rate': (data: WebSocketChatRate) => void;
  'contact:request': (data: WebSocketContactRequest) => void;
  'contact:respond': (data: WebSocketContactRespond) => void;
}

// События от сервера к клиенту
export interface ServerToClientEvents {
  'search:matched': (data: WebSocketSearchMatched) => void;
  'search:status': (data: WebSocketSearchStatus) => void;
  'search:expired': () => void;
  'search:stats': (data: WebSocketSearchStats) => void;
  'chat:message': (data: WebSocketChatMessageReceived) => void;
  'chat:start_typing': (data: WebSocketChatStartTyping) => void;
  'chat:stop_typing': (data: WebSocketChatStopTyping) => void;
  'chat:read': (data: WebSocketChatRead) => void;
  'chat:ended': (data: WebSocketChatEnded) => void;
  'chat:rated': (data: WebSocketChatRated) => void;
  'contact:request': (data: WebSocketContactRequestReceived) => void;
  'contact:status': (data: WebSocketContactStatus) => void;
  'connection:recovered': () => void;
  'error': (data: WebSocketError) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
}

// REST API Types

// === АУТЕНТИФИКАЦИЯ ===
export interface REST_RegisterRequest {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  platform?: string;
}

export interface REST_LoginRequest {
  telegramId: number;
  platform?: string;
}

export interface REST_AuthResponse {
  token: string;
  user: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    rating: number;
  };
}

// === ПОЛЬЗОВАТЕЛИ ===
export interface REST_UserProfile {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  rating: number;
  photos: string[];
  preferences: {
    gender: 'male' | 'female' | 'any';
    ageRange: {
      min: number;
      max: number;
    };
  };
  stats?: {
    totalChats: number;
    totalMessages: number;
  };
}

export interface UpdateUserRequest {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
}

export interface MatchesResponse {
  users: Array<{
    telegramId: number;
    firstName?: string;
    age?: number;
    bio?: string;
    photos: string[];
    rating: number;
  }>;
  total: number;
  pages: number;
}

export interface UpdatePreferencesRequest {
  gender: 'male' | 'female' | 'any';
  ageRange: {
    min: number;
    max: number;
  };
}

export interface PhotoUploadResponse {
  id: string;
  url: string;
  uploadedAt: string;
}

// === ЧАТЫ ===
export interface REST_CreateChatRequest {
  participants: string[];
  type?: 'anonymous' | 'permanent';
}

export interface REST_Chat {
  _id: string;
  participants: Array<{
    _id: string;
    firstName?: string;
    photos: string[];
  }>;
  lastMessage?: {
    _id: string;
    content: string;
    timestamp: string;
    sender: string;
  };
  type: 'anonymous' | 'permanent';
  isActive: boolean;
  unreadCount?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface REST_ChatMessage {
  _id: string;
  chatId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  readBy: string[];
  sender: {
    _id: string;
    telegramId: number;
    firstName?: string;
    photos: string[];
  } | string;
}

export interface REST_SendMessageRequest {
  content: string;
  sender: string;
}

export interface REST_MessagesResponse {
  messages: REST_ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

// === МОНЕТИЗАЦИЯ ===
export interface SubscriptionFeatures {
  unlimitedSearches: boolean;
  maxSearchDistance: number;
  advancedFilters: boolean;
  priorityInSearch: boolean;
  dailyHearts: number;
  dailySuperLikes: number;
  canSeeWhoLiked: boolean;
  analytics: boolean;
  videoChat: boolean;
}

export interface MonetizationStatus {
  subscription: {
    type: 'basic' | 'premium' | 'gold';
    isActive: boolean;
    expiresAt?: string;
    features: SubscriptionFeatures;
  };
  currency: {
    hearts: number;
    boosts: number;
    superLikes: number;
  };
  limits: {
    searchesToday: number;
    maxSearches: number | 'unlimited';
    resetsAt: string;
  };
  analytics: {
    profileViews: number;
    matches: number;
    likes: number;
  };
}

export interface SubscriptionTier {
  type: 'basic' | 'premium' | 'gold';
  price: number;
  duration: number;
  features: SubscriptionFeatures;
}

export interface MonetizationTiers {
  basic: SubscriptionTier;
  premium: SubscriptionTier;
  gold: SubscriptionTier;
}

export interface MonetizationItem {
  type: 'hearts' | 'boosts' | 'superLikes' | 'subscription';
  amount?: number;
  subscriptionType?: 'premium' | 'gold';
  price: number;
}

export interface MonetizationItems {
  [key: string]: MonetizationItem;
}

export interface PurchaseRequest {
  itemKey: string;
  paymentData: {
    payment_id: string;
    amount: number;
    currency: string;
    method: string;
  };
}

export interface CanSearchResponse {
  canSearch: boolean;
  reason?: string;
}

export interface SearchLimitsResponse {
  searchesToday: number;
  maxSearches: number | 'unlimited';
  unlimited: boolean;
  remaining: number;
  resetsAt: string;
  subscriptionType: 'basic' | 'premium' | 'gold';
}

export interface CanUseResponse {
  canUse: boolean;
  available: number;
}

export interface RefillResponse {
  message: string;
  added: {
    hearts: number;
    superLikes: number;
  };
}

// === МОНИТОРИНГ ===
export interface SystemMetrics {
  connections: {
    current: number;
    total: number;
    peak: number;
  };
  messages: {
    total: number;
    perMinute: number;
  };
  searches: {
    active: number;
    total: number;
    successful: number;
  };
  latency: {
    avg: number;
  };
  errors: {
    count: number;
    lastError: string;
  };
  timestamp: string;
  uptime: number;
}

export interface HealthCheck {
  status: 'OK' | 'ERROR';
  timestamp?: string;
  services?: {
    websocket: {
      status: 'OK' | 'ERROR';
      activeConnections: number;
    };
    search: {
      status: 'OK' | 'ERROR';
      activeSearches?: number;
    };
  };
  performance?: {
    messageLatency: string;
    messagesPerMinute: number;
  };
  errors?: {
    count: number;
    lastError: string;
  };
}

// === ОБЩИЕ ТИПЫ ===
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
} 