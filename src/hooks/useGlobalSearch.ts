import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export type SearchResultType = 'client' | 'document' | 'task' | 'vendor' | 'irs_notice';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  date?: string;
  icon?: string;
  url: string;
  metadata?: Record<string, any>;
}

export function useGlobalSearch() {
  const { user } = useAuthContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim() || !user) {
      setResults([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Performing global search for:', query);
      
      // Search clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email, tax_year, entity_type, created_at')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('user_id', user.id)
        .limit(5);
      
      if (clientsError) {
        console.error('Error searching clients:', clientsError);
      }
      
      // Search documents
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('id, original_filename, document_type, client_id, created_at, ocr_text')
        .or(`original_filename.ilike.%${query}%,ocr_text.ilike.%${query}%`)
        .eq('user_id', user.id)
        .limit(5);
      
      if (documentsError) {
        console.error('Error searching documents:', documentsError);
      }
      
      // Search tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, client_id, due_date, status, priority, created_at')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('user_id', user.id)
        .limit(5);
      
      if (tasksError) {
        console.error('Error searching tasks:', tasksError);
      }
      
      // Search vendors
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name, email, client_id, created_at')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('user_id', user.id)
        .limit(5);
      
      if (vendorsError) {
        console.error('Error searching vendors:', vendorsError);
      }
      
      // Search IRS notices
      const { data: irsNotices, error: irsNoticesError } = await supabase
        .from('irs_notices')
        .select('id, notice_type, notice_number, client_id, created_at, ai_summary')
        .or(`notice_type.ilike.%${query}%,notice_number.ilike.%${query}%,ai_summary.ilike.%${query}%`)
        .eq('user_id', user.id)
        .limit(5);
      
      if (irsNoticesError) {
        console.error('Error searching IRS notices:', irsNoticesError);
      }
      
      // Format results
      const formattedResults: SearchResult[] = [
        ...(clients || []).map(client => ({
          id: client.id,
          type: 'client' as SearchResultType,
          title: client.name,
          description: client.email,
          date: client.created_at,
          url: `/clients/${client.id}`,
          metadata: {
            taxYear: client.tax_year,
            entityType: client.entity_type
          }
        })),
        ...(documents || []).map(document => ({
          id: document.id,
          type: 'document' as SearchResultType,
          title: document.original_filename,
          description: document.ocr_text ? `${document.ocr_text.substring(0, 100)}...` : 'No text content',
          date: document.created_at,
          url: document.client_id ? `/clients/${document.client_id}` : '/documents',
          metadata: {
            documentType: document.document_type,
            clientId: document.client_id
          }
        })),
        ...(tasks || []).map(task => ({
          id: task.id,
          type: 'task' as SearchResultType,
          title: task.title,
          description: task.description,
          date: task.due_date || task.created_at,
          url: '/tasks',
          metadata: {
            status: task.status,
            priority: task.priority,
            clientId: task.client_id
          }
        })),
        ...(vendors || []).map(vendor => ({
          id: vendor.id,
          type: 'vendor' as SearchResultType,
          title: vendor.name,
          description: vendor.email,
          date: vendor.created_at,
          url: vendor.client_id ? `/clients/${vendor.client_id}` : '/1099-hub',
          metadata: {
            clientId: vendor.client_id
          }
        })),
        ...(irsNotices || []).map(notice => ({
          id: notice.id,
          type: 'irs_notice' as SearchResultType,
          title: `${notice.notice_type}${notice.notice_number ? ` - ${notice.notice_number}` : ''}`,
          description: notice.ai_summary ? `${notice.ai_summary.substring(0, 100)}...` : 'No summary available',
          date: notice.created_at,
          url: '/irs-notices',
          metadata: {
            clientId: notice.client_id
          }
        }))
      ];
      
      // Sort results by relevance (for now, just by date)
      formattedResults.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      console.log('✅ Search complete, found', formattedResults.length, 'results');
      
      // Save to recent searches if we have results
      if (formattedResults.length > 0 && !recentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev].slice(0, 5));
      }
      
      setResults(formattedResults);
      setLoading(false);
      return formattedResults;
    } catch (err) {
      console.error('❌ Search error:', err);
      setError('An error occurred while searching');
      setLoading(false);
      return [];
    }
  }, [user, recentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    search,
    results,
    loading,
    error,
    recentSearches,
    clearRecentSearches
  };
}