import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { TopBar } from '../components/organisms/TopBar';
import { TypingIndicator } from '../components/molecules/TypingIndicator';
import { Button } from '../components/atoms/Button';
import { Send, Sparkles, FileText, Calculator, Trash2, RefreshCw, Paperclip, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useClients } from '../hooks/useClients';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { formatFileSize } from '../lib/uploadUtils';

export function DeductionChat() {
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const { messages, loading, error, isTyping, sendMessage, clearMessages, setError } = useChat(selectedClientId);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadSingleDocument } = useDocumentUpload();

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
      content: 'Hello! I\'m your AI tax assistant. I can help you identify potential deductions, analyze receipts, and answer tax-related questions. You can also upload documents for analysis. What would you like to know?',
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (uploadedFiles.length === 0) return [];

    const uploadedDocumentIds: string[] = [];
    setUploadingFiles([...uploadedFiles]);

    try {
      for (const file of uploadedFiles) {
        const result = await uploadSingleDocument(file, {
          clientId: selectedClientId,
          documentType: 'other', // Default type for chat uploads
          tags: ['chat-upload'],
          processingOptions: {
            enableOCR: true,
            enableAI: true,
            autoClassify: true,
          },
        });

        if (result.data) {
          uploadedDocumentIds.push(result.data.id);
        }
      }

      setUploadedFiles([]);
      setUploadingFiles([]);
      return uploadedDocumentIds;
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadingFiles([]);
      throw error;
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isSending) return;

    let messageContent = input.trim();
    let contextDocuments: string[] = [];

    setIsSending(true);

    try {
      // Upload files if any
      if (uploadedFiles.length > 0) {
        contextDocuments = await handleUploadFiles();
        
        // Add file context to message
        if (messageContent) {
          messageContent += '\n\n';
        }
        messageContent += `I've uploaded ${uploadedFiles.length} document(s) for analysis. Please review and provide insights.`;
      }

      if (!messageContent.trim()) {
        messageContent = 'Please analyze the uploaded documents.';
      }

      setInput('');

      const result = await sendMessage(messageContent, {
        clientId: selectedClientId,
        contextDocuments: contextDocuments.length > 0 ? contextDocuments : undefined,
      });

      if (!result.success) {
        console.error('Failed to send message:', result.error);
        // Restore input on error
        setInput(messageContent);
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      setInput(messageContent);
    } finally {
      setIsSending(false);
    }
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
          <div className="flex flex-wrap gap-3">
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
                
                {/* Show context documents if any */}
                {message.context_documents && message.context_documents.length > 0 && (
                  <div className={`mt-3 pt-3 border-t ${
                    message.role === 'user' ? 'border-gray-700' : 'border-border-subtle'
                  }`}>
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-gray-700' : 'text-text-tertiary'
                    }`}>
                      📎 {message.context_documents.length} document(s) attached
                    </p>
                  </div>
                )}
                
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
          {/* File Upload Section - Show when files are selected */}
          {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
            <div className="mb-4 p-4 bg-surface rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-text-primary text-sm">
                  📎 Attached Files ({uploadedFiles.length + uploadingFiles.length})
                </h4>
                {uploadedFiles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                    className="text-text-secondary hover:text-red-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {/* Uploaded Files */}
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-surface-elevated rounded-lg border border-border-subtle">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                        <p className="text-xs text-text-tertiary">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={() => handleRemoveFile(index)}
                      className="text-text-secondary hover:text-red-600 flex-shrink-0 ml-2"
                    />
                  </div>
                ))}
                
                {/* Uploading Files */}
                {uploadingFiles.map((file, index) => (
                  <div key={`uploading-${index}`} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                      <p className="text-xs text-blue-700">Uploading...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex space-x-3">
            {/* File Upload Button */}
            <div className="flex-shrink-0 relative z-10">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Paperclip}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isTyping || uploadingFiles.length > 0}
                className="h-11 w-11 text-text-secondary hover:text-primary hover:bg-primary/10 border border-border-subtle hover:border-primary/30 transition-all duration-200"
                title="Attach documents"
              />
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about deductions, tax questions, or attach documents for analysis..."
                className="w-full resize-none rounded-xl border border-border-subtle px-4 py-3 bg-surface-elevated text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 disabled:opacity-50 pr-12"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isSending || isTyping || uploadingFiles.length > 0}
              />
              
              {/* File count indicator */}
              {uploadedFiles.length > 0 && (
                <div className="absolute bottom-2 right-12 flex items-center space-x-1 text-xs text-primary bg-primary/20 px-2 py-1 rounded-md border border-primary/30 z-20">
                  <Paperclip className="w-3 h-3" />
                  <span>{uploadedFiles.length}</span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="flex-shrink-0 relative z-10">
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isSending || isTyping || uploadingFiles.length > 0}
                icon={Send}
                className="h-11 w-11 bg-primary text-gray-900 hover:bg-primary-hover shadow-medium relative z-30"
                title="Send message"
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4 text-xs text-text-tertiary">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {uploadedFiles.length > 0 && (
                <span className="text-primary font-medium">
                  {uploadedFiles.length} file(s) ready to upload
                </span>
              )}
            </div>
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