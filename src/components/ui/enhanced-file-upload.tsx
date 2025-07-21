import React, { useState, useCallback } from 'react';
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
  User
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { useClients } from '../../hooks/useClients';
import { 
  DocumentType, 
  DocumentUploadOptions, 
  DOCUMENT_TYPE_LABELS
} from '../../types/documents';
import { formatFileSize } from '../../lib/uploadUtils';
import { cn } from '../../lib/utils';

interface EnhancedFileUploadProps {
  clientId?: string;
  documentType?: DocumentType;
  allowMultiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (documentIds: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
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

const FilePreview: React.FC<{
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  onRemove: () => void;
}> = ({ file, progress, status, error, onRemove }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <RotateCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center space-x-3 p-3 bg-surface-elevated rounded-xl border border-border-subtle"
    >
      <div className="flex-shrink-0">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary truncate">
            {file.name}
          </p>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <button
              onClick={onRemove}
              className="p-1 hover:bg-surface-elevated rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-text-tertiary hover:text-text-primary" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-text-tertiary">
            {formatFileSize(file.size)}
          </span>
          {status !== 'pending' && status !== 'completed' && (
            <span className="text-xs text-text-tertiary">
              {progress}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="mt-2 bg-surface rounded-full h-1">
            <motion.div
              className="bg-primary h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}

        {/* Status text */}
        <p className="text-xs text-text-tertiary mt-1">
          {status === 'uploading' && 'Uploading...'}
          {status === 'processing' && 'Processing...'}
          {status === 'completed' && 'Upload complete'}
          {status === 'error' && 'Upload failed'}
          {status === 'pending' && 'Ready to upload'}
        </p>
      </div>
    </motion.div>
  );
};

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  clientId,
  documentType = 'other',
  allowMultiple = true,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(documentType);
  const [tags, setTags] = useState<string>('');
  const { uploads, isUploading, uploadMultipleDocuments, removeUpload } = useDocumentUpload();
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '');

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
      const { results } = await uploadMultipleDocuments(acceptedFiles, selectedClientId, options);
      
      const successful = results.filter(r => r.data && !r.error);
      const failed = results.filter(r => r.error);

      if (successful.length > 0) {
        const documentIds = successful.map(r => r.data!.id);
        onUploadComplete?.(documentIds);
      }

      if (failed.length > 0) {
        const errorMessage = `${failed.length} file(s) failed to upload`;
        onUploadError?.(errorMessage);
      }
    } catch (error: any) {
      onUploadError?.(error.message);
    }
  }, [
    selectedClientId, 
    selectedDocumentType, 
    tags, 
    uploadMultipleDocuments, 
    onUploadComplete, 
    onUploadError
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
    disabled: isUploading,
  });

  const completedUploads = uploads.filter(u => u.status === 'completed');
  const hasUploads = uploads.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Client Selector - only show if not pre-selected */}
      {!clientId && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Client Association
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
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
      )}

      {/* Document Type Selector */}
      <DocumentTypeSelector
        value={selectedDocumentType}
        onChange={setSelectedDocumentType}
      />

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
            : 'border-border-subtle hover:border-primary/50 hover:bg-surface-elevated',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: isDragActive ? 1 : 0.6 }}
          whileHover={!isUploading ? { scale: 1.02 } : {}}
          whileTap={!isUploading ? { scale: 0.98 } : {}}
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
        </motion.div>

        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-surface/80 rounded-2xl flex items-center justify-center"
          >
            <div className="text-center">
              <RotateCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary">Uploading...</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Progress */}
      {hasUploads && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              Upload Progress ({completedUploads.length}/{uploads.length})
            </h3>
            {completedUploads.length === uploads.length && uploads.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => uploads.forEach(u => removeUpload(u.file.name))}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <AnimatePresence>
            {uploads.map((upload) => (
              <FilePreview
                key={upload.file.name}
                file={upload.file}
                progress={upload.progress}
                status={upload.status}
                error={upload.error}
                onRemove={() => removeUpload(upload.file.name)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Keep the old component for backward compatibility
export { EnhancedFileUpload };