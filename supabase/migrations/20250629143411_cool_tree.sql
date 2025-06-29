/*
  # Add Unique Constraint for IRS Notices

  1. Changes
    - Add unique constraint on document_id column in irs_notices table
    - Create named constraint for better error messages and management
    - Add index for the constraint to improve query performance

  2. Purpose
    - Prevent duplicate IRS notice records for the same document
    - Ensure data integrity when processing documents
    - Fix issue with multiple notices being created for the same document

  This migration addresses the issue where multiple IRS notice records could be
  created for the same document due to redundant creation pathways.
*/

-- Add unique constraint to prevent duplicate IRS notices for the same document
ALTER TABLE irs_notices 
ADD CONSTRAINT unique_document_irs_notice UNIQUE (document_id);

-- Create index for the unique constraint (if not automatically created)
CREATE UNIQUE INDEX IF NOT EXISTS unique_document_irs_notice 
ON irs_notices (document_id);