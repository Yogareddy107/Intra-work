-- 1. Safely add missing columns to the messages table
DO $$
BEGIN
    -- Add is_dm column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_dm') THEN
        ALTER TABLE public.messages ADD COLUMN is_dm BOOLEAN DEFAULT false;
    END IF;
    
    -- Add recipient_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        ALTER TABLE public.messages ADD COLUMN recipient_id UUID;
    END IF;

    -- Add attachment_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
    END IF;
END $$;

-- 2. Ensure the storage bucket for attachments exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Grant necessary permissions just in case
GRANT ALL ON TABLE public.messages TO authenticated, service_role;
GRANT ALL ON TABLE public.messages TO postgres, anon;

-- 4. Force a cache refresh again
NOTIFY pgrst, 'reload';             
