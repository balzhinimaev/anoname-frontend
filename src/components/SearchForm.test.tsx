// @ts-nocheck
import React from 'react';
import renderer from 'react-test-renderer';
import SearchForm from './SearchForm';

// Мокаем утилиты, чтобы избежать ошибок в среде Jest
jest.mock('../utils/telegram', () => ({
  hapticFeedback: jest.fn(),
  requestLocationWithFallback: jest.fn(),
  checkLocationPermission: jest.fn(),
  showTelegramAlert: jest.fn(),
  getTelegram: jest.fn().mockReturnValue({
    CloudStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
    }
  }),
}));

describe('components/SearchForm', () => {
  it('renders correctly', () => {
    const mockProps = {
      onSubmit: jest.fn(),
      user: { id: 123, first_name: 'Test' },
      disabled: false,
    };

    const tree = renderer
      .create(<SearchForm {...mockProps} />)
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });
}); 