-- 1. Ensure columns exist in messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_dm') THEN
        ALTER TABLE public.messages ADD COLUMN is_dm BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        ALTER TABLE public.messages ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
    END IF;
END $$;

-- 2. Ensure storage bucket exists and is public for attachments if needed
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage policies for attachments
CREATE POLICY "Public Access to Attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Auth Upload Attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

-- 4. Force schema cache reload (Supabase specific)
NOTIFY pgrst, 'reload';
