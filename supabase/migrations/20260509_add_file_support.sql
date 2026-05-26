-- Add file-related columns to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create storage bucket for documents if not exists (via SQL is limited, usually done in dashboard)
-- However, we can ensure the table can handle the metadata.
