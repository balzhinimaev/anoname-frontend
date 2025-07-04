// @ts-nocheck
import React from 'react';
import renderer from 'react-test-renderer';
import Chat from './Chat';

// Мокаем WebSocket сервис
jest.mock('../services/websocket', () => ({
  onChatMessage: jest.fn(),
  onChatStartTyping: jest.fn(),
  onChatStopTyping: jest.fn(),
}));

// Мокаем утилиты
jest.mock('../utils/telegram', () => ({
  hapticFeedback: jest.fn(),
}));

describe('components/Chat', () => {
  it('renders correctly', () => {
    const mockProps = {
      chatId: 'chat-123',
      partnerInfo: {
        telegramId: 'partner-456',
        gender: 'female',
        age: 25,
      },
      currentUser: {
        _id: 'user-789',
        telegramId: 789,
        firstName: 'Current',
        lastName: 'User',
      },
      onEndChat: jest.fn(),
    };

    const tree = renderer
      .create(<Chat {...mockProps} />)
      .toJSON();
      
    expect(tree).toMatchSnapshot();
  });
}); 