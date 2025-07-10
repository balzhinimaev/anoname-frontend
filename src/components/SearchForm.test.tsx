// @ts-nocheck
import React from 'react';
import renderer from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SearchForm from './SearchForm';

// Мокаем утилиты, чтобы избежать ошибок в среде Vitest
vi.mock('../utils/telegram', () => ({
  hapticFeedback: vi.fn(),
  requestLocationWithFallback: vi.fn(),
  checkLocationPermission: vi.fn(),
  showTelegramAlert: vi.fn(),
  getTelegramUser: vi.fn(() => ({ id: 123, first_name: 'Test' })),
}));

// Мокаем хранилища
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
  }),
}));

vi.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    isSearching: false,
    searchForm: {
      myGender: '',
      myAge: '',
      targetGender: '',
      targetAgeMin: '',
      targetAgeMax: '',
      useLocation: false,
    },
    updateSearchForm: vi.fn(),
    startSearch: vi.fn(),
  }),
}));

describe('components/SearchForm', () => {
  it('renders correctly', () => {
    const { container } = render(<SearchForm />);
    expect(container).toMatchSnapshot();
  });
}); 