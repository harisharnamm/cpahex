import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-dot-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-dot-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-dot-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-text-secondary ml-2">AI is thinking...</span>
    </div>
  );
}