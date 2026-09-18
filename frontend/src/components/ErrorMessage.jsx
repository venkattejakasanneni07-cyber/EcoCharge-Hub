import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="error-container">
      <p className="error-message">⚠️ {message || 'Something went wrong!'}</p>
    </div>
  );
};

export default ErrorMessage;