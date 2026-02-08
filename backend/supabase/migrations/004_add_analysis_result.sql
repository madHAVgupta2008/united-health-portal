-- Add analysis_result column to hospital_bills table
ALTER TABLE hospital_bills 
ADD COLUMN IF NOT EXISTS analysis_result JSONB;

-- Add comment for documentation
COMMENT ON COLUMN hospital_bills.analysis_result IS 'Stores the detailed AI analysis of the bill document';
