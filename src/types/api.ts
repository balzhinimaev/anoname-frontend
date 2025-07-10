import { Location, Gender } from './app';

// === WEBSOCKET API ===

export interface WebSocketSearchCriteria {
  gender: 'male' | 'female';
  age: number;
  rating?: number;
  desiredGender: Array<'male' | 'female' | 'any'>;
  desiredAgeMin: number;
  desiredAgeMax: number;
  minAcceptableRating?: number;
  useGeolocation: boolean;
  location?: Location;
  maxDistance?: number;
}

export interface WebSocketSearchStart {
  criteria: WebSocketSearchCriteria;
}

export interface WebSocketMatchedUser {
  telegramId: string;
  gender: 'male' | 'female';
  age: number;
  rating: number;
  chatId: string;
}

export interface WebSocketSearchMatched {
  matchedUser: WebSocketMatchedUser;
}

export interface WebSocketSearchStatus {
  status: 'searching' | 'cancelled' | 'expired' | 'matched';
}

export interface WebSocketSearchStats {
  t: number;
  m: number;
  f: number;
  inChat?: number;
  online: {
    t: number;
    m: number;
    f: number;
  };
  avgSearchTime: {
    t: number;
    m: number;
    f: number;
    matches24h: number;
  };
}

export interface WebSocketChatMessage {
  chatId: string;
  content: string;
  replyTo?: string; // ID сообщения, на которое отвечаем
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
  replyTo?: {
    _id: string;
    content: string;
    sender: WebSocketUser;
  }; // Полная информация о сообщении, на которое отвечаем
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

// === REST API ===

export interface REST_RegisterRequest {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: Gender;
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

export interface REST_UserProfile {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  gender?: Gender;
  age?: number;
  rating: number;
  photos: string[];
  preferences: {
    gender: Gender;
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

// === Дополнительные типы REST API ===

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

export interface SubscriptionTier {
  type: 'basic' | 'premium' | 'gold';
  price: number;
  duration: number;
  features: SubscriptionFeatures;
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