-- Fix IRS Notice Duplication Issue
-- This migration adds a unique constraint to prevent duplicate IRS notices for the same document

-- Add unique constraint to prevent duplicate IRS notices for the same document
ALTER TABLE irs_notices 
ADD CONSTRAINT unique_document_irs_notice 
UNIQUE (document_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_document_irs_notice ON irs_notices IS 
'Prevents duplicate IRS notice records for the same document. Each document can have only one IRS notice record.';
