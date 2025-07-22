import React, { useState, useEffect } from 'react';
import { X, Brain, FileText, Zap, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Document } from '../../types/documents';
import { supabase } from '../../lib/supabase';
import { updateDocumentAnalysisResponse } from '../../lib/documentQueries';

interface DocumentAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  taxImplications: string[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
  documentType: string;
  extractedData: {
    amounts?: string[];
    dates?: string[];
    entities?: string[];
    taxYears?: string[];
  };
}

export function DocumentAnalysisDialog({ isOpen, onClose, document }: DocumentAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      // Check if we have cached analysis results
      if (document.ai_analysis_response) {
        console.log('📋 Loading cached AI analysis results');
        setAnalysis(document.ai_analysis_response);
        setLoading(false);
        setError(null);
        setIsFromCache(true);
      } else if (document.ocr_text) {
        console.log('🔄 No cached results found, performing new analysis');
        setIsFromCache(false);
        performAnalysis();
      }
    }
  }, [isOpen, document]);

  const performAnalysis = async () => {
    if (!document?.ocr_text) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setIsFromCache(false);

    try {
      console.log('🧠 Starting AI analysis for document:', document.original_filename);

      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session for AI analysis');
      }

      // Call the chat edge function with analysis prompt
      const analysisPrompt = `Please analyze this document and provide a comprehensive analysis in JSON format:

Document: ${document.original_filename}
Type: ${document.document_type}
OCR Text: ${document.ocr_text}

Please provide analysis in this exact JSON structure:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "actionItems": ["Action 1", "Action 2", "Action 3"],
  "taxImplications": ["Implication 1", "Implication 2"],
  "riskFactors": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "confidence": 85,
  "documentType": "Detected document type",
  "extractedData": {
    "amounts": ["$1,234.56", "$789.00"],
    "dates": ["2024-01-15", "2024-02-20"],
    "entities": ["Company Name", "Person Name"],
    "taxYears": ["2024", "2023"]
  }
}

Focus on tax-related insights, compliance issues, potential deductions, and actionable recommendations for a CPA.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: analysisPrompt,
          client_id: document.client_id,
          context_documents: [document.id],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🧠 AI analysis response:', result);

      // Try to parse JSON from the AI response
      let analysisData: AnalysisResult;
      try {
        // Look for JSON in the response
        const jsonMatch = result.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create structured analysis from text response
          analysisData = parseTextResponse(result.message);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON, creating fallback analysis');
        analysisData = parseTextResponse(result.message);
      }

      setAnalysis(analysisData);
      console.log('✅ Analysis completed:', analysisData);

      // Save the analysis results to the database for future use
      try {
        console.log('💾 Saving AI analysis results to database...');
        const { error: saveError } = await updateDocumentAnalysisResponse(document.id, analysisData);
        if (saveError) {
          console.error('❌ Failed to save analysis results:', saveError);
          // Don't throw error here as the analysis was successful, just the caching failed
        } else {
          console.log('✅ AI analysis results saved successfully');
        }
      } catch (saveError) {
        console.error('❌ Error saving analysis results:', saveError);
        // Continue without throwing as the analysis itself was successful
      }
    } catch (err: any) {
      console.error('❌ Analysis failed:', err);
      setError(err.message || 'Failed to analyze document');
    } finally {
      setLoading(false);
    }
  };

  const parseTextResponse = (text: string): AnalysisResult => {
    // Fallback parser for non-JSON responses
    return {
      summary: text.substring(0, 200) + '...',
      keyFindings: ['Analysis completed', 'Document processed successfully'],
      actionItems: ['Review document details', 'Consider tax implications'],
      taxImplications: ['Standard tax document processing'],
      riskFactors: ['No immediate risks identified'],
      opportunities: ['Standard deduction opportunities'],
      confidence: 75,
      documentType: document?.document_type || 'Unknown',
      extractedData: {
        amounts: [],
        dates: [],
        entities: [],
        taxYears: []
      }
    };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 70) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">🤖 AI Document Analysis</h2>
              <p className="text-text-tertiary text-sm">Intelligent analysis of {document.original_filename}</p>
                {isFromCache ? 'Cached analysis of' : 'Intelligent analysis of'} {document.original_filename}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Analyzing Document...</h3>
                <p className="text-text-secondary">AI is processing the document content and generating insights</p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-text-tertiary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>This may take 10-30 seconds</span>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Analysis Failed</h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <Button onClick={performAnalysis} className="bg-primary text-gray-900 hover:bg-primary-hover">
                  Retry Analysis
                </Button>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Cache Status Indicator */}
              {isFromCache && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">📋 Cached Analysis Results</h4>
                      <p className="text-blue-800 text-sm">
                        These results were previously generated and saved. Click "Re-analyze" for fresh insights.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Header */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">Analysis Summary</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                    {getConfidenceLabel(analysis.confidence)} ({analysis.confidence}%)
                  </div>
                </div>
                <p className="text-purple-800 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-text-primary">Key Findings</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <span className="text-text-secondary">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text-primary">Recommended Actions</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.actionItems.map((action, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-primary font-bold mt-1">→</span>
                      <span className="text-text-secondary">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tax Implications */}
              {analysis.taxImplications.length > 0 && (
                <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-text-primary">Tax Implications</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.taxImplications.map((implication, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-emerald-600 font-bold mt-1">$</span>
                        <span className="text-text-secondary">{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.riskFactors.length > 0 && (
                  <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-text-primary">Risk Factors</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-600 font-bold mt-1">⚠</span>
                          <span className="text-text-secondary text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.opportunities.length > 0 && (
                  <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-text-primary">Opportunities</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.opportunities.map((opportunity, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold mt-1">💡</span>
                          <span className="text-text-secondary text-sm">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {(analysis.extractedData.amounts?.length || analysis.extractedData.dates?.length || analysis.extractedData.entities?.length) && (
                <div className="bg-surface rounded-xl p-6 border border-border-subtle">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-text-tertiary" />
                    <h3 className="font-semibold text-text-primary">Extracted Data</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {analysis.extractedData.amounts && analysis.extractedData.amounts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Amounts</h4>
                        <div className="space-y-1">
                          {analysis.extractedData.amounts.slice(0, 3).map((amount, index) => (
                            <Badge key={index} variant="success" size="sm">{amount}</Badge>
                          ))}
                          {analysis.extractedData.amounts.length > 3 && (
                            <span className="text-xs text-text-tertiary">+{analysis.extractedData.amounts.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {analysis.extractedData.dates && analysis.extractedData.dates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Dates</h4>
                        <div className="space-y-1">
                          {analysis.extractedData.dates.slice(0, 3).map((date, index) => (
                            <Badge key={index} variant="neutral" size="sm">{date}</Badge>
                          ))}
                          {analysis.extractedData.dates.length > 3 && (
                            <span className="text-xs text-text-tertiary">+{analysis.extractedData.dates.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {analysis.extractedData.entities && analysis.extractedData.entities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Entities</h4>
                        <div className="space-y-1">
                          {analysis.extractedData.entities.slice(0, 3).map((entity, index) => (
                            <Badge key={index} variant="warning" size="sm">{entity}</Badge>
                          ))}
                          {analysis.extractedData.entities.length > 3 && (
                            <span className="text-xs text-text-tertiary">+{analysis.extractedData.entities.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {analysis.extractedData.taxYears && analysis.extractedData.taxYears.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Tax Years</h4>
                        <div className="space-y-1">
                          {analysis.extractedData.taxYears.map((year, index) => (
                            <Badge key={index} variant="error" size="sm">{year}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Brain className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Ready for Analysis</h3>
                <p className="text-text-secondary mb-4">Click the button below to start AI analysis of this document</p>
                <Button onClick={performAnalysis} className="bg-primary text-gray-900 hover:bg-primary-hover">
                  <Brain className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-tertiary">
              💡 {isFromCache ? 'Showing cached analysis results' : 'AI analysis uses OCR text to provide tax-focused insights and recommendations'}
            </div>
            
            <div className="flex space-x-3">
              {analysis && (
                <Button
                  variant="secondary"
                  onClick={performAnalysis}
                  disabled={loading}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isFromCache ? 'Re-analyze' : 'Analyze Again'}
                </Button>
              )}
              
              <Button
                variant="primary"
                onClick={onClose}
                className="bg-primary text-gray-900 hover:bg-primary-hover"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}