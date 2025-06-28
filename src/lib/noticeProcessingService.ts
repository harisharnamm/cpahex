import { supabase } from './supabase';
import { 
  createIRSNoticeRecord, 
  updateIRSNotice, 
  updateDocumentProcessing 
} from './documentQueries';
import { Document, IRSNotice } from '../types/documents';

interface NoticeExtractionResult {
  noticeType: string;
  noticeNumber?: string;
  taxYear?: number;
  amountOwed?: number;
  deadlineDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations: string[];
}

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
      // Get the document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        return { data: null, error: docError || new Error('Document not found') };
      }

      // Extract text from document (this would normally use OCR service)
      const extractedText = await this.extractTextFromDocument(document);
      
      // Analyze the notice content
      const analysisResult = await this.analyzeNoticeContent(extractedText, document.original_filename);

      // Check if an IRS notice record already exists for this document
      const { data: existingNotice } = await supabase
        .from('irs_notices')
        .select('id')
        .eq('document_id', documentId)
        .single();

      let notice;
      
      if (existingNotice) {
        // Update existing notice with AI analysis
        const { data: updatedNotice, error: updateError } = await updateIRSNotice(existingNotice.id, {
          notice_type: analysisResult.noticeType,
          notice_number: analysisResult.noticeNumber,
          tax_year: analysisResult.taxYear,
          amount_owed: analysisResult.amountOwed,
          deadline_date: analysisResult.deadlineDate?.toISOString(),
          priority: analysisResult.priority,
          ai_summary: analysisResult.summary,
          ai_recommendations: analysisResult.recommendations.join('\n'),
        });

        if (updateError) {
          return { data: null, error: updateError };
        }
        
        notice = updatedNotice;
      } else {
        // Create new IRS notice record only if none exists
        const { data: newNotice, error: noticeError } = await createIRSNoticeRecord({
          user_id: userId,
          client_id: clientId,
          document_id: documentId,
          notice_type: analysisResult.noticeType,
          notice_number: analysisResult.noticeNumber,
          tax_year: analysisResult.taxYear,
          amount_owed: analysisResult.amountOwed,
          deadline_date: analysisResult.deadlineDate?.toISOString(),
          priority: analysisResult.priority,
        });

        if (noticeError) {
          return { data: null, error: noticeError };
        }

        // Update notice with AI analysis
        const { data: updatedNotice, error: updateError } = await updateIRSNotice(newNotice!.id, {
          ai_summary: analysisResult.summary,
          ai_recommendations: analysisResult.recommendations.join('\n'),
        });

        if (updateError) {
          return { data: newNotice, error: updateError };
        }
        
        notice = updatedNotice;
      }

      // Update document with extracted text and processing status
      await updateDocumentProcessing(documentId, {
        ocr_text: extractedText,
        ai_summary: analysisResult.summary,
        is_processed: true,
      });

      return { data: notice, error: null };

    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Extracts text content from document
   * In a real implementation, this would use OCR services
   */
  private async extractTextFromDocument(document: Document): Promise<string> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock OCR result based on document type and filename
    const filename = document.original_filename.toLowerCase();
    
    if (filename.includes('cp2000')) {
      return `
        DEPARTMENT OF THE TREASURY
        INTERNAL REVENUE SERVICE
        
        NOTICE CP2000
        
        We have information that doesn't match what you reported on your tax return.
        
        Tax Year: 2023
        Notice Date: January 15, 2024
        
        PROPOSED CHANGES TO YOUR 2023 FORM 1040
        
        Income not reported on your return:
        1099-MISC from ACME Corporation - $5,200.00
        
        Proposed additional tax: $1,456.00
        Interest: $123.00
        Penalty: $111.00
        
        Total amount due: $1,690.00
        
        WHAT YOU NEED TO DO:
        If you agree with our proposed changes, sign and return this notice with your payment by March 15, 2024.
        
        If you disagree, you have 30 days from the date of this notice to respond.
      `;
    }
    
    if (filename.includes('cp14')) {
      return `
        DEPARTMENT OF THE TREASURY
        INTERNAL REVENUE SERVICE
        
        NOTICE CP14
        
        You have an unpaid balance on your account.
        
        Tax Year: 2023
        Notice Date: January 10, 2024
        
        Balance due: $2,847.00
        
        Interest and penalties continue to accrue until the full amount is paid.
        
        Pay immediately to avoid additional interest and penalties.
        Payment due date: February 28, 2024
      `;
    }

    // Generic IRS notice text
    return `
      DEPARTMENT OF THE TREASURY
      INTERNAL REVENUE SERVICE
      
      This is an official notice regarding your tax account.
      Please review the information carefully and respond as necessary.
      
      Tax Year: 2023
      Notice Date: ${new Date().toLocaleDateString()}
    `;
  }

  /**
   * Analyzes notice content and extracts key information using AI
   */
  private async analyzeNoticeContent(
    text: string, 
    filename: string
  ): Promise<NoticeExtractionResult> {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Determine notice type
    let noticeType = 'Unknown';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (lowerText.includes('cp2000') || lowerFilename.includes('cp2000')) {
      noticeType = 'CP2000 - Proposed Changes to Tax Return';
      priority = 'high';
    } else if (lowerText.includes('cp14') || lowerFilename.includes('cp14')) {
      noticeType = 'CP14 - Balance Due Notice';
      priority = 'medium';
    } else if (lowerText.includes('cp90') || lowerFilename.includes('cp90')) {
      noticeType = 'CP90 - Final Notice of Intent to Levy';
      priority = 'critical';
    } else if (lowerText.includes('cp504') || lowerFilename.includes('cp504')) {
      noticeType = 'CP504 - Intent to Levy Notice';
      priority = 'critical';
    }

    // Extract notice number
    const noticeNumberMatch = text.match(/(?:notice|cp)\s*(\w*\d+)/i);
    const noticeNumber = noticeNumberMatch ? noticeNumberMatch[1] : undefined;

    // Extract tax year
    const taxYearMatch = text.match(/tax year:?\s*(\d{4})/i);
    const taxYear = taxYearMatch ? parseInt(taxYearMatch[1]) : undefined;

    // Extract amount owed
    const amountMatch = text.match(/(?:amount due|balance due|total.*due):?\s*\$?([\d,]+\.?\d*)/i);
    const amountOwed = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;

    // Extract deadline
    let deadlineDate: Date | undefined;
    const deadlineMatch = text.match(/(?:payment due date|respond by|due date):?\s*([\w\s,]+\d{4})/i);
    if (deadlineMatch) {
      const dateStr = deadlineMatch[1].trim();
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        deadlineDate = parsedDate;
      }
    }

    // Generate AI summary based on notice type
    let summary = '';
    let recommendations: string[] = [];

    if (noticeType.includes('CP2000')) {
      summary = `The IRS has identified unreported income on your 2023 tax return. They are proposing additional tax of $${amountOwed?.toLocaleString() || 'TBD'} due to income discrepancies. This is typically caused by missing 1099 forms or other income documents that the IRS received but weren't reported on your return.`;
      
      recommendations = [
        'Review all 1099 forms and income documents for the tax year',
        'Gather supporting documentation for any disputed amounts',
        'Consider filing an amended return if the proposed changes are correct',
        'Respond within 30 days to avoid automatic assessment',
        'Consult with a tax professional if you disagree with the proposed changes'
      ];
    } else if (noticeType.includes('CP14')) {
      summary = `You have an outstanding balance of $${amountOwed?.toLocaleString() || 'TBD'} on your tax account. Interest and penalties will continue to accrue until the balance is paid in full.`;
      
      recommendations = [
        'Pay the full amount immediately to stop interest and penalty accrual',
        'Set up a payment plan if you cannot pay the full amount',
        'Verify the balance is correct by reviewing your account transcript',
        'Consider making a partial payment to reduce interest charges',
        'Contact the IRS if you believe the balance is incorrect'
      ];
    } else {
      summary = `This IRS notice requires your attention regarding your tax account. Please review the details carefully and take appropriate action within the specified timeframe.`;
      
      recommendations = [
        'Read the notice carefully and understand what action is required',
        'Gather any supporting documentation mentioned in the notice',
        'Respond by the deadline specified in the notice',
        'Contact a tax professional if you need assistance',
        'Keep a copy of the notice and any correspondence for your records'
      ];
    }

    return {
      noticeType,
      noticeNumber,
      taxYear,
      amountOwed,
      deadlineDate,
      priority,
      summary,
      recommendations,
    };
  }

  /**
   * Gets processing status for a document
   */
  async getProcessingStatus(documentId: string): Promise<{
    isProcessing: boolean;
    progress: number;
    status: string;
  }> {
    // In a real implementation, this would check the status of background processing
    return {
      isProcessing: false,
      progress: 100,
      status: 'completed',
    };
  }

  /**
   * Reprocesses a notice with updated AI models
   */
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
        return { success: false, error: 'Notice not found' };
      }

      // Reprocess the document
      const result = await this.processIRSNotice(
        notice.document_id!, 
        notice.user_id, 
        notice.client_id
      );

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const noticeProcessingService = new NoticeProcessingService();
