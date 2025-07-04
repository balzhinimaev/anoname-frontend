// @ts-nocheck
import React from 'react';
import renderer from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Chat from './Chat';

// Мокаем утилиты, чтобы избежать ошибок в среде Vitest
vi.mock('../utils/telegram', () => ({
  hapticFeedback: vi.fn(),
}));

// Мокаем WebSocket сервис
vi.mock('../services/websocket', () => ({
  default: {
    onChatMessage: vi.fn(),
    onChatStartTyping: vi.fn(),
    onChatStopTyping: vi.fn(),
    onChatEnd: vi.fn(),
    sendChatMessage: vi.fn(),
    sendTypingStart: vi.fn(),
    sendTypingStop: vi.fn(),
    sendChatEnd: vi.fn(),
  },
}));

// Мокаем хранилища
vi.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    currentChatId: null,
    partner: null,
    messages: [],
    messageInput: '',
    isTyping: false,
    updateMessageInput: vi.fn(),
    sendMessage: vi.fn(),
    endChat: vi.fn(),
  }),
}));

describe('components/Chat', () => {
  it('renders correctly', () => {
    const { container } = render(<Chat />);
    expect(container).toMatchSnapshot();
  });
}); 