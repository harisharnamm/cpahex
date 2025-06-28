import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Share2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Document, DOCUMENT_TYPE_LABELS } from '../../types/documents';
import { formatFileSize } from '../../lib/uploadUtils';
import { cn } from '../../lib/utils';

interface DocumentPreviewProps {
  document: Document;
  previewUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  className?: string;
}

const PreviewContent: React.FC<{
  document: Document;
  previewUrl: string;
}> = ({ document, previewUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const isPDF = document.mime_type === 'application/pdf';
  const isImage = document.mime_type.startsWith('image/');

  const handleLoad = () => {
    console.log('✅ Preview iframe loaded successfully');
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    console.error('❌ Preview iframe failed to load');
    setLoading(false);
    setError('Failed to load preview');
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Preview Not Available</h3>
          <p className="text-text-tertiary mb-4">{error}</p>
          <p className="text-sm text-text-tertiary">
            You can still download the file to view it
          </p>
        </div>
      </div>
    );
  }

  if (isPDF) {
    console.log('📄 Rendering PDF preview with URL:', previewUrl);
    return (
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 p-3 sm:p-4 bg-surface-elevated rounded-lg">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-text-tertiary" />
            <span className="text-xs sm:text-sm font-medium text-text-primary">PDF Document</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= 50} className="p-1 sm:p-2">
              <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <span className="text-xs sm:text-sm text-text-tertiary min-w-[2.5rem] sm:min-w-[3rem] text-center">
              {zoom}%
            </span>
            <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= 200} className="p-1 sm:p-2">
              <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleZoomReset} className="text-xs sm:text-sm p-1 sm:p-2">
              Reset
            </Button>
          </div>
        </div>
        
        <div className="border border-border-subtle rounded-lg overflow-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh]">
          <iframe
            src={previewUrl}
            className="w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            onLoad={handleLoad}
            onError={handleError}
            title={`Preview of ${document.original_filename}`}
          />
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 p-3 sm:p-4 bg-surface-elevated rounded-lg">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-tertiary" />
            <span className="text-xs sm:text-sm font-medium text-text-primary">Image</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= 50} className="p-1 sm:p-2">
              <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <span className="text-xs sm:text-sm text-text-tertiary min-w-[2.5rem] sm:min-w-[3rem] text-center">
              {zoom}%
            </span>
            <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= 200} className="p-1 sm:p-2">
              <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleZoomReset} className="text-xs sm:text-sm p-1 sm:p-2">
              Reset
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center border border-border-subtle rounded-lg overflow-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] p-2 sm:p-4">
          <img
            src={previewUrl}
            alt={document.original_filename}
            className="max-w-full h-auto rounded-lg"
            style={{ transform: `scale(${zoom / 100})` }}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    );
  }

  // Fallback for unsupported file types
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Preview Not Available</h3>
        <p className="text-text-tertiary mb-4">
          This file type cannot be previewed in the browser
        </p>
        <p className="text-sm text-text-tertiary">
          Download the file to view it with the appropriate application
        </p>
      </div>
    </div>
  );
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  previewUrl,
  isOpen,
  onClose,
  onDownload,
  className,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4',
        className
      )}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-4 flex-1 min-w-0 mb-4 sm:mb-0">
            <div className="w-full">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate">
                {document.original_filename}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                <Badge variant="neutral" size="sm">
                  {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                </Badge>
                <span className="text-xs sm:text-sm text-text-tertiary">
                  {formatFileSize(document.file_size)}
                </span>
                <span className="text-xs sm:text-sm text-text-tertiary">
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button
                variant="secondary"
                icon={Download}
                onClick={onDownload}
                className="text-xs sm:text-sm py-1 sm:py-2"
              >
                Download
              </Button>
            )}
            <Button
              variant="ghost"
              icon={X}
              onClick={onClose}
              className="text-xs sm:text-sm py-1 sm:py-2"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {previewUrl ? (
            <PreviewContent document={document} previewUrl={previewUrl} />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">Loading preview URL...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with document metadata */}
        {document.ai_summary && (
          <div className="border-t border-border-subtle p-6 bg-surface-elevated">
            <h3 className="text-sm font-semibold text-text-primary mb-2">AI Summary</h3>
            <p className="text-sm text-text-tertiary leading-relaxed">
              {document.ai_summary}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
