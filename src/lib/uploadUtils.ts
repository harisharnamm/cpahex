import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, DocumentType } from '../types/documents';

/**
 * Validates if a file is allowed based on type and size
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    };
  }

  // Check file type
  const allowedTypes = Object.values(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: 'File type not supported. Please upload PDF, images, or document files.'
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename with timestamp and random suffix
 */
export function generateUniqueFilename(originalFilename: string, userId: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop();
  const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, '');
  
  // Sanitize filename
  const sanitizedName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);
  
  return `${userId}/${timestamp}_${randomSuffix}_${sanitizedName}.${extension}`;
}

/**
 * Detects document type based on filename and content
 */
export function detectDocumentType(filename: string, content?: string): DocumentType {
  const lowerFilename = filename.toLowerCase();
  
  // Check for specific tax forms
  if (lowerFilename.includes('w2') || lowerFilename.includes('w-2')) {
    return 'w2';
  }
  
  if (lowerFilename.includes('1099')) {
    return '1099';
  }
  
  if (lowerFilename.includes('w9') || lowerFilename.includes('w-9')) {
    return 'w9';
  }
  
  // Check for IRS notices
  if (lowerFilename.includes('irs') || lowerFilename.includes('notice') || 
      lowerFilename.includes('cp2000') || lowerFilename.includes('cp14')) {
    return 'irs_notice';
  }
  
  // Check for receipts
  if (lowerFilename.includes('receipt') || lowerFilename.includes('invoice')) {
    return 'receipt';
  }
  
  // Check for bank statements
  if (lowerFilename.includes('bank') || lowerFilename.includes('statement')) {
    return 'bank_statement';
  }
  
  // If content is provided, use AI-style detection
  if (content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('wages, tips') || lowerContent.includes('form w-2')) {
      return 'w2';
    }
    
    if (lowerContent.includes('1099') || lowerContent.includes('miscellaneous income')) {
      return '1099';
    }
    
    if (lowerContent.includes('internal revenue service') || 
        lowerContent.includes('notice of deficiency')) {
      return 'irs_notice';
    }
  }
  
  return 'other';
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets appropriate bucket name based on document type
 */
export function getBucketName(documentType: DocumentType): string {
  if (documentType === 'irs_notice') {
    return 'irs-notices';
  }
  return 'client-documents';
}

/**
 * Extracts metadata from file
 */
export function extractFileMetadata(file: File): {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
} {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    extension: file.name.split('.').pop()?.toLowerCase() || '',
  };
}

/**
 * Creates a preview-safe URL for files
 */
export function createFilePreviewURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Cleanup preview URLs to prevent memory leaks
 */
export function revokeFilePreviewURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Compresses image files before upload
 */
export async function compressImageFile(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Chunks a large file for upload
 */
export function* chunkFile(file: File, chunkSize: number = 1024 * 1024): Generator<{ chunk: Blob; index: number; total: number }> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    yield {
      chunk,
      index: i,
      total: totalChunks,
    };
  }
}
