import { useState, useEffect, useCallback } from 'react';
import { 
  getUserIRSNotices, 
  getClientIRSNotices, 
  updateIRSNotice,
  createIRSNoticeRecord,
  deleteIRSNoticeWithDocument
} from '../lib/documentQueries';
import { useAuth } from './useAuth';
import { IRSNotice, EnrichedIRSNotice } from '../types/documents';

export function useIRSNotices(clientId?: string) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<EnrichedIRSNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (clientId) {
        result = await getClientIRSNotices(clientId);
      } else {
        result = await getUserIRSNotices(user.id);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setNotices(result.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, clientId]);

  const refreshNotices = useCallback(() => {
    fetchNotices();
  }, [fetchNotices]);

  const updateNoticeStatus = useCallback(async (
    noticeId: string, 
    updates: Partial<IRSNotice>
  ) => {
    try {
      const { data, error } = await updateIRSNotice(noticeId, updates);
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotices(prev => prev.map(notice => 
        notice.id === noticeId ? { ...notice, ...updates } : notice
      ));
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const createNotice = useCallback(async (noticeData: {
    client_id?: string;
    document_id?: string;
    notice_type: string;
    notice_number?: string;
    tax_year?: number;
    amount_owed?: number;
    deadline_date?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data, error } = await createIRSNoticeRecord({
        user_id: user.id,
        ...noticeData,
      });

      if (error) {
        throw error;
      }

      // Add to local state
      if (data) {
        setNotices(prev => [data, ...prev]);
      }

      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  const deleteNotice = useCallback(async (noticeId: string) => {
    try {
      const { error } = await deleteIRSNoticeWithDocument(noticeId);
      if (error) {
        throw error;
      }
      
      // Remove from local state
      setNotices(prev => prev.filter(notice => notice.id !== noticeId));
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Load notices on mount
  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return {
    notices,
    loading,
    error,
    refreshNotices,
    updateNoticeStatus,
    createNotice,
    deleteNotice,
    setError,
  };
}
