// Системные события
export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',

  // События поиска от сервера
  SEARCH_MATCHED: 'search:matched',
  SEARCH_STATS: 'search:stats',
  SEARCH_EXPIRED: 'search:expired',
  
  // События чата от сервера
  CHAT_MESSAGE: 'chat:message',
  CHAT_START_TYPING: 'chat:start_typing',
  CHAT_STOP_TYPING: 'chat:stop_typing',
  CHAT_ENDED: 'chat:ended',

  // События для отправки на сервер
  EMIT_SEARCH_START: 'search:start',
  EMIT_SEARCH_CANCEL: 'search:cancel',
  EMIT_STATS_SUBSCRIBE: 'search:subscribe_stats',
  EMIT_STATS_UNSUBSCRIBE: 'search:unsubscribe_stats',
  EMIT_CHAT_JOIN: 'chat:join',
  EMIT_CHAT_MESSAGE: 'chat:message',
  EMIT_CHAT_START_TYPING: 'chat:start_typing',
  EMIT_CHAT_STOP_TYPING: 'chat:stop_typing',
  EMIT_CHAT_END: 'chat:end',
} as const; 