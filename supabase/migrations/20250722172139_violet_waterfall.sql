/*
  # Add AI Analysis Response Column

  1. New Column
    - `ai_analysis_response` (jsonb)
      - Stores the AI analysis results for user-initiated document analysis
      - Allows caching of analysis results to avoid redundant OpenAI API calls
      - Only populated when user explicitly requests AI analysis

  2. Purpose
    - Cache AI analysis results for better performance
    - Reduce OpenAI API costs by avoiding duplicate requests
    - Provide instant access to previously generated insights
*/

-- Add ai_analysis_response column to documents table
ALTER TABLE public.documents 
ADD COLUMN ai_analysis_response JSONB;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN public.documents.ai_analysis_response IS 'Stores user-initiated AI analysis results including summary, findings, actions, and insights';