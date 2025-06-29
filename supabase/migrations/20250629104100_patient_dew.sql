/*
  # Add Required Documents to Clients Table

  1. Changes
    - Add `required_documents` column to `clients` table
    - Column stores array of document types that client needs to provide
    - Update existing records to have empty array as default

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new column

  3. Indexing
    - Add GIN index for efficient querying of document types
*/

-- Add required_documents column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT '{}';

-- Add index for efficient querying of required documents
CREATE INDEX IF NOT EXISTS idx_clients_required_documents 
ON clients USING gin(required_documents);

-- Add comment for documentation
COMMENT ON COLUMN clients.required_documents IS 
'Array of document types that this client is required to provide for tax preparation. Values should match document_type enum values.';