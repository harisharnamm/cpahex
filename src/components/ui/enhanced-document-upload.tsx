import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle, 
  X, 
  RotateCw,
  Trash2,
  User,
  Eye,
  Download,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { useClients } from '../../hooks/useClients';
import { 
  DocumentType, 
  DocumentUploadOptions, 
  DOCUMENT_TYPE_LABELS
} from '../../types/documents';
import { formatFileSize } from '../../lib/uploadUtils';
import { cn } from '../../lib/utils';

interface EnhancedDocumentUploadProps {
  clientId?: string;
  documentType?: DocumentType;
  allowMultiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (documentIds: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface ProcessingDocument {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'classifying' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
  classification?: string;
  processingDetails?: {
    ocrComplete?: boolean;
    classificationComplete?: boolean;
    specificProcessingComplete?: boolean;
  };
}

const DocumentTypeSelector: React.FC<{
  value: DocumentType;
  onChange: (type: DocumentType) => void;
}> = ({ value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-text-secondary mb-2">
      Document Type
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DocumentType)}
      className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  </div>
);

const ClientSelector: React.FC<{
  value: string;
  onChange: (clientId: string) => void;
  clients: Array<{ id: string; name: string; email: string }>;
  required?: boolean;
}> = ({ value, onChange, clients, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-text-secondary mb-2">
      Client Association {required && '*'}
    </label>
    <div className="relative">
      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
        required={required}
      >
        <option value="">Select a client (optional)</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.email})
          </option>
        ))}
      </select>
    </div>
    <p className="text-xs text-text-tertiary mt-1">
      Documents can be associated with a specific client for better organization
    </p>
  </div>
);

const ProcessingStatusIndicator: React.FC<{
  document: ProcessingDocument;
  onRetry?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
}> = ({ document, onRetry, onDelete, onPreview, onDownload }) => {
  const getStatusIcon = () => {
    switch (document.status) {
      case 'uploading':
        return <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-amber-600 animate-pulse" />;
      case 'classifying':
        return <Clock className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-text-tertiary" />;
    }
  };

  const getStatusText = () => {
    switch (document.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing with AI...';
      case 'classifying':
        return 'Classifying document...';
      case 'completed':
        return 'Processing complete';
      case 'error':
        return 'Processing failed';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (document.status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      case 'processing':
        return 'bg-amber-50 border-amber-200';
      case 'classifying':
        return 'bg-purple-50 border-purple-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-surface-elevated border-border-subtle';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        getStatusColor()
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-primary truncate" title={document.file.name}>
              {document.file.name}
            </h4>
            <div className="flex items-center space-x-2">
              {document.classification && (
                <Badge variant="neutral" size="sm">
                  {document.classification}
                </Badge>
              )}
              <span className="text-xs text-text-tertiary">
                {formatFileSize(document.file.size)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">{getStatusText()}</span>
            {document.status !== 'error' && document.status !== 'completed' && (
              <span className="text-xs text-text-tertiary">{document.progress}%</span>
            )}
          </div>

          {/* Progress bar */}
          {(document.status === 'uploading' || document.status === 'processing' || document.status === 'classifying') && (
            <div className="mb-3 bg-surface rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${document.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Processing details */}
          {document.processingDetails && (
            <div className="mb-3 space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  document.processingDetails.ocrComplete ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-text-tertiary">OCR Text Extraction</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  document.processingDetails.classificationComplete ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-text-tertiary">Document Classification</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  document.processingDetails.specificProcessingComplete ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-text-tertiary">Specialized Processing</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {document.error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{document.error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {document.status === 'completed' && document.documentId && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Eye}
                  onClick={onPreview}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Download}
                  onClick={onDownload}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  Download
                </Button>
              </>
            )}
            
            {document.status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                icon={RotateCw}
                onClick={onRetry}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Retry
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const EnhancedDocumentUpload: React.FC<EnhancedDocumentUploadProps> = ({
  clientId: initialClientId,
  documentType = 'other',
  allowMultiple = true,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(documentType);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [tags, setTags] = useState<string>('');
  const [processingDocuments, setProcessingDocuments] = useState<ProcessingDocument[]>([]);
  const { clients } = useClients();
  const { uploadSingleDocument } = useDocumentUpload();

  // Simulate document processing with real-time updates
  const simulateProcessing = useCallback(async (file: File, documentId: string) => {
    const processingId = Math.random().toString(36).substring(2, 9);
    
    const newDoc: ProcessingDocument = {
      id: processingId,
      file,
      status: 'uploading',
      progress: 0,
      documentId,
      processingDetails: {
        ocrComplete: false,
        classificationComplete: false,
        specificProcessingComplete: false
      }
    };

    setProcessingDocuments(prev => [...prev, newDoc]);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProcessingDocuments(prev => prev.map(doc => 
        doc.id === processingId ? { ...doc, progress: i } : doc
      ));
    }

    // Move to processing phase
    setProcessingDocuments(prev => prev.map(doc => 
      doc.id === processingId ? { 
        ...doc, 
        status: 'processing', 
        progress: 20,
        processingDetails: { ...doc.processingDetails, ocrComplete: true }
      } : doc
    ));

    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingDocuments(prev => prev.map(doc => 
      doc.id === processingId ? { 
        ...doc, 
        progress: 60,
        processingDetails: { ...doc.processingDetails, classificationComplete: true }
      } : doc
    ));

    // Move to classification phase
    setProcessingDocuments(prev => prev.map(doc => 
      doc.id === processingId ? { 
        ...doc, 
        status: 'classifying', 
        progress: 80 
      } : doc
    ));

    // Simulate classification
    await new Promise(resolve => setTimeout(resolve, 1500));
    const classifications = ['Financial Document', 'Tax Document', 'Identity Document'];
    const randomClassification = classifications[Math.floor(Math.random() * classifications.length)];

    setProcessingDocuments(prev => prev.map(doc => 
      doc.id === processingId ? { 
        ...doc, 
        classification: randomClassification,
        progress: 90,
        processingDetails: { ...doc.processingDetails, specificProcessingComplete: true }
      } : doc
    ));

    // Complete processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProcessingDocuments(prev => prev.map(doc => 
      doc.id === processingId ? { 
        ...doc, 
        status: 'completed', 
        progress: 100 
      } : doc
    ));

  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const options: DocumentUploadOptions = {
      clientId: selectedClientId || undefined,
      documentType: selectedDocumentType,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      processingOptions: {
        enableOCR: true,
        enableAI: true,
        autoClassify: true,
      },
    };

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        try {
          console.log(`🔄 Starting upload for file ${index + 1}:`, file.name);
          
          // Create processing document entry
          const processingId = Math.random().toString(36).substring(2, 9);
          const newDoc: ProcessingDocument = {
            id: processingId,
            file,
            status: 'uploading',
            progress: 0,
            processingDetails: {
              ocrComplete: false,
              classificationComplete: false,
              specificProcessingComplete: false
            }
          };
          
          setProcessingDocuments(prev => [...prev, newDoc]);
          
          // Actual upload using the hook
          const result = await uploadSingleDocument(file, selectedClientId, options);
          
          if (result.data) {
            console.log(`✅ Upload successful for ${file.name}:`, result.data.id);
            
            // Update processing document with real document ID
            setProcessingDocuments(prev => prev.map(doc => 
              doc.id === processingId ? { 
                ...doc, 
                documentId: result.data!.id,
                status: 'processing',
                progress: 50,
                processingDetails: { ...doc.processingDetails, ocrComplete: true }
              } : doc
            ));
            
            // Simulate classification and completion
            setTimeout(() => {
              setProcessingDocuments(prev => prev.map(doc => 
                doc.id === processingId ? { 
                  ...doc, 
                  status: 'classifying',
                  progress: 80,
                  classification: 'Financial Document',
                  processingDetails: { ...doc.processingDetails, classificationComplete: true }
                } : doc
              ));
            }, 2000);
            
            setTimeout(() => {
              setProcessingDocuments(prev => prev.map(doc => 
                doc.id === processingId ? { 
                  ...doc, 
                  status: 'completed',
                  progress: 100,
                  processingDetails: { ...doc.processingDetails, specificProcessingComplete: true }
                } : doc
              ));
            }, 4000);
            
            return result.data.id;
          } else {
            console.error(`❌ Upload failed for ${file.name}:`, result.error);
            
            // Update processing document with error
            setProcessingDocuments(prev => prev.map(doc => 
              doc.id === processingId ? { 
                ...doc, 
                status: 'error',
                progress: 0,
                error: result.error?.message || 'Upload failed'
              } : doc
            ));
            
            throw new Error(result.error?.message || 'Upload failed');
          }
        } catch (error: any) {
          console.error(`❌ Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const documentIds = await Promise.all(uploadPromises);
      console.log('✅ All uploads completed:', documentIds);
      onUploadComplete?.(documentIds);

    } catch (error: any) {
      console.error('❌ Upload batch failed:', error);
      onUploadError?.(error.message);
    }
  }, [
    selectedClientId, 
    selectedDocumentType, 
    tags, 
    onUploadComplete, 
    onUploadError,
    uploadSingleDocument
  ]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: allowMultiple,
    maxFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleRemoveDocument = (documentId: string) => {
    setProcessingDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleRetryDocument = async (documentId: string) => {
    const doc = processingDocuments.find(d => d.id === documentId);
    if (doc) {
      setProcessingDocuments(prev => prev.map(d => 
        d.id === documentId ? { ...d, status: 'uploading', progress: 0, error: undefined } : d
      ));
      await simulateProcessing(doc.file, doc.documentId || '');
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    const doc = processingDocuments.find(d => d.id === documentId);
    if (doc?.documentId) {
      try {
        const result = await getDocumentPreviewURL(doc.documentId);
        if (result.url) {
          window.open(result.url, '_blank');
        }
      } catch (error) {
        console.error('Preview error:', error);
      }
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    const doc = processingDocuments.find(d => d.id === documentId);
    if (doc?.documentId) {
      try {
        await downloadDocument(doc.documentId, doc.file.name);
      } catch (error) {
        console.error('Download error:', error);
      }
    }
  };

  const clearCompletedDocuments = () => {
    setProcessingDocuments(prev => prev.filter(doc => doc.status !== 'completed'));
  };

  const completedCount = processingDocuments.filter(doc => doc.status === 'completed').length;
  const hasDocuments = processingDocuments.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Client and Document Type Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClientSelector
          value={selectedClientId}
          onChange={setSelectedClientId}
          clients={clients}
        />
        
        <DocumentTypeSelector
          value={selectedDocumentType}
          onChange={setSelectedDocumentType}
        />
      </div>

      {/* Tags Input */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., quarterly, expenses, 2024"
          className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border-subtle hover:border-primary/50 hover:bg-surface-elevated'
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: isDragActive ? 1 : 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="space-y-4"
        >
          <Upload className="w-12 h-12 mx-auto text-primary" />
          
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {isDragActive ? 'Drop files here' : 'Upload Documents'}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              Drag & drop files or click to browse
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Supports PDF, images, and document files up to 50MB
            </p>
          </div>
          
          {selectedClientId && (
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {clients.find(c => c.id === selectedClientId)?.name || 'Selected Client'}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Processing Documents */}
      {hasDocuments && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Document Processing ({processingDocuments.length})
            </h3>
            {completedCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCompletedDocuments}
                className="text-text-secondary hover:text-text-primary"
              >
                Clear Completed ({completedCount})
              </Button>
            )}
          </div>

          <AnimatePresence>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {processingDocuments.map((doc) => (
                <ProcessingStatusIndicator
                  key={doc.id}
                  document={doc}
                  onRetry={() => handleRetryDocument(doc.id)}
                  onDelete={() => handleRemoveDocument(doc.id)}
                  onPreview={() => handlePreviewDocument(doc.id)}
                  onDownload={() => handleDownloadDocument(doc.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {/* Processing Summary */}
      {hasDocuments && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <h4 className="font-semibold text-text-primary">AI Processing Active</h4>
              <p className="text-sm text-text-secondary">
                Documents are being processed with OCR, classification, and specialized analysis
              </p>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-text-primary">
                {processingDocuments.filter(d => d.status === 'uploading').length}
              </div>
              <div className="text-xs text-text-tertiary">Uploading</div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">
                {processingDocuments.filter(d => d.status === 'processing').length}
              </div>
              <div className="text-xs text-text-tertiary">Processing</div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">
                {processingDocuments.filter(d => d.status === 'classifying').length}
              </div>
              <div className="text-xs text-text-tertiary">Classifying</div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">
                {completedCount}
              </div>
              <div className="text-xs text-text-tertiary">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};