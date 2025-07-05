import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="error-display">
      <div className="error-display__icon">⚠️</div>
      <h2 className="error-display__title">Произошла ошибка</h2>
      <p className="error-display__message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-display__retry-button">
          Попробовать снова
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay; 