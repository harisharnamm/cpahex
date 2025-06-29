/*
  # Ensure Client Schema is Complete

  1. Schema Updates
    - Ensure required_documents column exists with proper type
    - Ensure address column exists
    - Ensure all columns have proper defaults
    - Add proper indexes for performance

  2. Data Integrity
    - Update any existing records with null values to proper defaults
    - Ensure all constraints are properly applied

  This migration ensures the clients table has all required columns
  and proper data types for the client creation functionality.
*/

-- Ensure required_documents column exists with proper type and default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'required_documents'
  ) THEN
    ALTER TABLE clients ADD COLUMN required_documents text[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure address column exists (it should already exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'address'
  ) THEN
    ALTER TABLE clients ADD COLUMN address text;
  END IF;
END $$;

-- Update any existing records that have null required_documents to empty array
UPDATE clients 
SET required_documents = '{}' 
WHERE required_documents IS NULL;

-- Update any existing records that have null entity_type to 'individual'
UPDATE clients 
SET entity_type = 'individual' 
WHERE entity_type IS NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_clients_required_documents 
ON clients USING gin(required_documents);

CREATE INDEX IF NOT EXISTS idx_clients_entity_type 
ON clients(entity_type);

-- Add comments for documentation
COMMENT ON COLUMN clients.required_documents IS 
'Array of document types that this client is required to provide for tax preparation. Values should match document_type enum values.';

COMMENT ON COLUMN clients.address IS 
'Client physical address for tax and correspondence purposes.';

COMMENT ON COLUMN clients.entity_type IS 
'Type of business entity: individual, llc, corporation, s_corp, or partnership.';