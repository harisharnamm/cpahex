import { supabase } from './supabase';
import { updateIRSNotice } from './documentQueries';
import { Document, IRSNotice } from '../types/documents';

export class NoticeProcessingService {
  /**
   * Processes an IRS notice document and extracts key information
   */
  async processIRSNotice(
    documentId: string, 
    userId: string, 
    clientId?: string
  ): Promise<{ data: IRSNotice | null; error: any }> {
    try {
      console.log('🔄 Processing IRS notice for document:', documentId);
      console.log('🔄 User ID:', userId);
      console.log('🔄 Client ID:', clientId);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔄 Session check:', !!session?.access_token);
      if (!session?.access_token) {
        return { data: null, error: new Error('No valid session') };
      }

      // Call the process-document-ai Edge Function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document-ai`;
      console.log('🔄 Calling edge function:', functionUrl);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          user_id: userId,
          client_id: clientId,
        }),
      });

      console.log('🔄 Edge function response status:', response.status);
      console.log('🔄 Edge function response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Edge function error:', errorData);
        return { data: null, error: new Error(errorData.error || 'Processing failed') };
      }

      const result = await response.json();
      console.log('✅ Edge function result:', result);
      
      // Get the updated notice from the database
      if (result.notice_id) {
        const { data: notice, error: fetchError } = await supabase
          .from('irs_notices')
          .select('*')
          .eq('id', result.notice_id)
          .single();

        console.log('✅ Updated notice from DB:', notice);
        return { data: notice, error: fetchError };
      } else {
        // If no notice was created, return success but no data
        console.log('ℹ️ No notice created by edge function');
        return { data: null, error: null };
      }

    } catch (error) {
      console.error('❌ Exception in processIRSNotice:', error);
      return { data: null, error };
    }
  }

  /**
   * Gets processing status for a document
   */
  async getProcessingStatus(documentId: string): Promise<{
    isProcessing: boolean;
    progress: number;
    status: string;
  }> {
    try {
      // Check if document is processed
      const { data: document } = await supabase
        .from('documents')
        .select('is_processed')
        .eq('id', documentId)
        .single();

      return {
        isProcessing: !document?.is_processed,
        progress: document?.is_processed ? 100 : 0,
        status: document?.is_processed ? 'completed' : 'processing'
      };
    } catch (error) {
      console.error('❌ Document not found:', error);
      return {
        isProcessing: false,
        progress: 0,
        status: 'error'
      };
    }
  }

  async reprocessNotice(noticeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the notice and its document
      const { data: notice, error: noticeError } = await supabase
        .from('irs_notices')
        .select(`
          *,
          documents:document_id (*)
        `)
        .eq('id', noticeId)
        .single();

      if (noticeError || !notice) {
        console.error('❌ Error creating notice:', noticeError);
        return { success: false, error: 'Notice not found' };
      }

      // Reprocess the document
      const result = await this.processIRSNotice(
        notice.document_id!, 
        notice.user_id, 
        notice.client_id
      );

      if (result.error) {
        console.warn('⚠️ Error updating notice with AI analysis:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('✅ IRS notice processing completed successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ IRS notice processing failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const noticeProcessingService = new NoticeProcessingService();
