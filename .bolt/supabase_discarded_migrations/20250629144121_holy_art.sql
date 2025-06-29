/*
  # Add Search Vector for Full-Text Search

  1. New Features
    - Add `search_vector` column to documents table for powerful full-text search
    - Create GIN index for fast text search queries
    - Implement trigger function to automatically update search vector
    - Set different weights for different fields:
      - A (highest): original_filename
      - B: document_type
      - C: ai_summary
      - D: ocr_text
    - Update existing documents to populate their search vectors

  2. Benefits
    - Enables efficient full-text search across document content
    - Supports stemming, ranking, and partial word matches
    - Properly weights different fields for relevance
    - Automatically maintains search index when documents are updated
*/

-- Add search_vector column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE documents ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create GIN index for fast text search
CREATE INDEX IF NOT EXISTS idx_documents_search 
ON documents USING gin(search_vector);

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

-- Update existing documents to populate search vector
UPDATE documents
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(original_filename, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(document_type, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(ai_summary, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(ocr_text, '')), 'D')
WHERE search_vector IS NULL;

-- Add comment to explain the search vector
COMMENT ON COLUMN documents.search_vector IS 
'Tsvector for full-text search across document metadata and content with weighted relevance';