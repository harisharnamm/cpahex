/*
  # Add Unique Constraint to IRS Notices

  1. New Constraints
    - `unique_document_irs_notice` - Ensures each document can only have one IRS notice
    - Prevents duplicate notices from being created for the same document

  2. Benefits
    - Prevents data duplication
    - Ensures data integrity
    - Simplifies notice management
    - Avoids confusion with multiple notices for the same document

  This migration adds a unique constraint to the document_id column in the irs_notices table
  to prevent multiple IRS notice records from being created for the same document.
*/

-- Add unique constraint to document_id column
ALTER TABLE irs_notices 
ADD CONSTRAINT unique_document_irs_notice UNIQUE (document_id);

-- Create index for the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_document_irs_notice
ON irs_notices (document_id);