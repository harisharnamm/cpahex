/*
  # Add Unique Constraint for IRS Notices

  1. New Constraints
    - `unique_document_irs_notice` - Ensures each document can only have one associated IRS notice
    - Prevents duplication of IRS notice records for the same document

  2. Benefits
    - Maintains data integrity
    - Prevents duplicate notices from being created during document upload
    - Ensures consistent behavior across the application
*/

-- Add unique constraint to prevent multiple notices for the same document
ALTER TABLE irs_notices 
ADD CONSTRAINT unique_document_irs_notice UNIQUE (document_id);

-- Create index for the constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_document_irs_notice 
ON irs_notices(document_id);