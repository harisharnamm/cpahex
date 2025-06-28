import React, { useState } from 'react';
import { TopBar } from '../components/organisms/TopBar';
import { TypingIndicator } from '../components/molecules/TypingIndicator';
import { Button } from '../components/atoms/Button';
import { Send, Sparkles, FileText, Calculator } from 'lucide-react';

interface DeductionChatProps {
  onMenuClick?: () => void;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function DeductionChat({ onMenuClick }: DeductionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI tax assistant. I can help you identify potential deductions, analyze receipts, and answer tax-related questions. What would you like to know?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { label: 'Analyze Receipt', icon: FileText },
    { label: 'Calculate Deduction', icon: Calculator },
    { label: 'Tax Question', icon: Sparkles },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your question about "${input}", I can help you identify several potential deductions. Business meals are typically 50% deductible, and office supplies are 100% deductible as business expenses. Would you like me to analyze specific receipts or transactions?`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="Deduction Chat" />
      
      <div className="flex-1 max-w-content mx-auto w-full flex flex-col">
        {/* Chat Header */}
        <div className="bg-surface-elevated border-b border-border-subtle p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">AI Tax Assistant</h2>
              <p className="text-sm text-text-tertiary">Ask questions about deductions, receipts, and tax strategies</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-elevated border-b border-border-subtle p-6">
          <div className="flex space-x-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="secondary"
                size="sm"
                icon={action.icon}
                onClick={() => handleQuickAction(action.label)}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-soft ${
                  message.role === 'user'
                    ? 'bg-primary text-gray-900'
                    : 'bg-surface-elevated border border-border-subtle text-text-primary'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-3 ${
                  message.role === 'user' ? 'text-gray-700' : 'text-text-tertiary'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-elevated border border-border-subtle rounded-2xl shadow-soft">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border-subtle bg-surface-elevated p-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about deductions, tax questions, or upload receipts..."
                className="w-full resize-none rounded-xl border border-border-subtle px-4 py-3 bg-surface-elevated text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                rows={1}
                style={{ minHeight: '44px' }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              icon={Send}
              aria-label="Send message"
              className="shrink-0"
            >
            </Button>
          </div>
          <p className="text-xs text-text-tertiary mt-3 flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span>AI Assistant Online</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}