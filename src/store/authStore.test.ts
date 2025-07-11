/// <reference types="jest" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import anonameAPI from '../services/api';
import { getTelegramUser } from '../utils/telegram';
import { act } from '@testing-library/react';

// Мокаем зависимости
vi.mock('../services/api');
vi.mock('../utils/telegram');
vi.mock('./socketStore', () => ({
  useSocketStore: {
    getState: () => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  },
}));

const mockApi = anonameAPI as any;
const mockGetTelegramUser = getTelegramUser as any;

describe('store/authStore', () => {
  beforeEach(() => {
    // Сбрасываем состояние хранилища перед каждым тестом
    act(() => {
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      });
    });
    vi.clearAllMocks();
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 1, first_name: 'Test' };
    const mockToken = 'test-token';
    mockGetTelegramUser.mockReturnValue(mockUser);
    mockApi.login.mockResolvedValue({ 
      token: mockToken, 
      user: { telegramId: 1, rating: 0 } 
    });

    await act(async () => {
      await useAuthStore.getState().login();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockApi.setAuthToken).toHaveBeenCalledWith(mockToken);
  });

  it('should handle registration if user is not found (404)', async () => {
    const mockUser = { id: 1, first_name: 'Test', last_name: 'User', username: 'testuser' };
    const mockToken = 'new-token';
    mockGetTelegramUser.mockReturnValue(mockUser);
    // Имитируем ошибку 404 при логине
    mockApi.login.mockRejectedValue({ response: { status: 404 } });
    // Имитируем успешную регистрацию
    mockApi.register.mockResolvedValue({ 
      token: mockToken, 
      user: { telegramId: 1, rating: 0 } 
    });

    await act(async () => {
      await useAuthStore.getState().login();
    });
    
    expect(mockApi.register).toHaveBeenCalledWith({
      telegramId: mockUser.id,
      firstName: mockUser.first_name,
      lastName: mockUser.last_name,
      username: mockUser.username,
      platform: 'telegram',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('new-token');
    expect(state.isLoading).toBe(false);
  });

  it('should handle logout', () => {
    // Сначала "войдем в систему"
    act(() => {
      useAuthStore.setState({ isAuthenticated: true, token: 'some-token' });
    });

    act(() => {
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(mockApi.setAuthToken).toHaveBeenCalledWith(null);
  });
}); 