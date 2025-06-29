import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string;
  user_id: string;
  client_id?: string;
  role: 'user' | 'assistant';
  content: string;
  context_documents?: string[];
  ai_model?: string;
  tokens_used?: number;
  created_at: string;
}

export interface SendMessageOptions {
  clientId?: string;
  contextDocuments?: string[];
}

export function useChat(clientId?: string) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load chat history
  const loadMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading chat messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, clientId]);

  // Send message to AI
  const sendMessage = useCallback(async (
    content: string, 
    options: SendMessageOptions = {}
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    try {
      setIsTyping(true);
      setError(null);

      // Add user message to local state immediately for better UX
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        client_id: options.clientId,
        role: 'user',
        content: content.trim(),
        context_documents: options.contextDocuments,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      // Call the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          client_id: options.clientId,
          context_documents: options.contextDocuments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { message: assistantMessage, tokens_used } = await response.json();

      // Reload messages to get the actual saved messages with proper IDs
      await loadMessages();

      return { success: true };

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      return { success: false, error: err.message };
    } finally {
      setIsTyping(false);
    }
  }, [user, loadMessages]);

  // Clear chat history
  const clearMessages = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      let query = supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { error: deleteError } = await query;

      if (deleteError) {
        throw deleteError;
      }

      setMessages([]);
      return { success: true };

    } catch (err: any) {
      console.error('Error clearing messages:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user, clientId]);

  // Load messages on mount and when dependencies change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    isTyping,
    sendMessage,
    clearMessages,
    refreshMessages: loadMessages,
    setError,
  };
}