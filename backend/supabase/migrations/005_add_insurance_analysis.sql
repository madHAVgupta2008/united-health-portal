-- Add analysis_result column to insurance_documents table
ALTER TABLE insurance_documents 
ADD COLUMN IF NOT EXISTS analysis_result JSONB;

-- Add comment for documentation
COMMENT ON COLUMN insurance_documents.analysis_result IS 'Stores the detailed AI analysis of the insurance document';
