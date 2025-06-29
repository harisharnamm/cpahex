import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { TopBar } from '../components/organisms/TopBar';
import { TypingIndicator } from '../components/molecules/TypingIndicator';
import { Button } from '../components/atoms/Button';
import { Send, Sparkles, FileText, Calculator, Trash2, RefreshCw } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useClients } from '../hooks/useClients';

export function DeductionChat() {
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const { messages, loading, error, isTyping, sendMessage, clearMessages, setError } = useChat(selectedClientId);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome',
      user_id: '',
      role: 'assistant' as const,
      content: 'Hello! I\'m your AI tax assistant. I can help you identify potential deductions, analyze receipts, and answer tax-related questions. What would you like to know?',
      created_at: new Date().toISOString(),
    }
  ] : messages;

  const quickActions = [
    { 
      label: 'Analyze Receipt', 
      icon: FileText,
      prompt: 'Can you help me analyze a business receipt for potential deductions?'
    },
    { 
      label: 'Calculate Deduction', 
      icon: Calculator,
      prompt: 'I need help calculating a business deduction. Can you guide me through the process?'
    },
    { 
      label: 'Tax Question', 
      icon: Sparkles,
      prompt: 'I have a general tax question. Can you help me understand tax regulations?'
    },
  ];

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);

    const result = await sendMessage(messageContent, {
      clientId: selectedClientId,
    });

    if (!result.success) {
      console.error('Failed to send message:', result.error);
      // Restore input on error
      setInput(messageContent);
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      const result = await clearMessages();
      if (!result.success) {
        console.error('Failed to clear chat:', result.error);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="Deduction Chat" />
      
      <div className="flex-1 max-w-content mx-auto w-full flex flex-col">
        {/* Chat Header */}
        <div className="bg-surface-elevated border-b border-border-subtle p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">AI Tax Assistant</h2>
                <p className="text-sm text-text-tertiary">Ask questions about deductions, receipts, and tax strategies</p>
              </div>
            </div>
            
            {/* Client Selector */}
            <div className="flex items-center space-x-3">
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value || undefined)}
                className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">General Chat</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={handleClearChat}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Clear chat history"
                />
              )}
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
                onClick={() => handleQuickAction(action.prompt)}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">Loading chat history...</p>
              </div>
            </div>
          ) : (
            displayMessages.map((message) => (
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
                {message.created_at && (
                  <p className={`text-xs mt-3 ${
                    message.role === 'user' ? 'text-gray-700' : 'text-text-tertiary'
                  }`}>
                    {formatTimestamp(message.created_at)}
                  </p>
                )}
              </div>
            </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-elevated border border-border-subtle rounded-2xl shadow-soft">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
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
                className="w-full resize-none rounded-xl border border-border-subtle px-4 py-3 bg-surface-elevated text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 disabled:opacity-50"
                rows={1}
                style={{ minHeight: '44px' }}
                disabled={isSending || isTyping}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending || isTyping}
              icon={Send}
              aria-label="Send message"
              className="shrink-0"
            >
              {isSending ? 'Sending...' : ''}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-text-tertiary">
              Press Enter to send, Shift+Enter for new line
            </p>
            <div className="flex items-center space-x-4 text-xs text-text-tertiary">
              {selectedClientId && (
                <span>
                  Client: {clients.find(c => c.id === selectedClientId)?.name || 'Unknown'}
                </span>
              )}
              <span className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <span>{error ? 'Connection Error' : 'AI Assistant Online'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}