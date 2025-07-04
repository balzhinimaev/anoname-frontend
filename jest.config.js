module.exports = {
  // Используем настройки из react-scripts как базу
  preset: 'react-scripts',
  
  // Настраиваем трансформацию ES6-модулей
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  
  // Настройка для работы с модулями
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  
  // Настройка среды тестирования
  testEnvironment: 'jsdom',
  
  // Глобальные настройки для тестов
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Покрытие кода
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ]
}; 