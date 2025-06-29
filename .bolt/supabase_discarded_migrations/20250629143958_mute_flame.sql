/*
  # Add Search Vector to Documents Table

  1. New Columns
    - `search_vector` (tsvector) - For full-text search across document content
  
  2. Indexes
    - Create GIN index on search_vector for efficient full-text search
  
  3. Functions
    - Create function to update search vector when documents are inserted or updated
    - Create trigger to automatically call the function

  This migration enhances the search capabilities of the application by enabling
  full-text search across document content, including OCR text, AI summaries, and metadata.
*/

-- Add search_vector column to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE documents ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create index for search_vector
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.original_filename, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.document_type, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.ai_summary, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.ocr_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector on insert or update
DROP TRIGGER IF EXISTS trigger_update_documents_search_vector ON documents;
CREATE TRIGGER trigger_update_documents_search_vector
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_documents_search_vector();

-- Update existing documents to populate search_vector
UPDATE documents SET search_vector = 
  setweight(to_tsvector('english', COALESCE(original_filename, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(document_type, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(ai_summary, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(ocr_text, '')), 'D')
WHERE search_vector IS NULL;

-- Add comment to explain the search vector
COMMENT ON COLUMN documents.search_vector IS 'Stores the tsvector for full-text search across document content';