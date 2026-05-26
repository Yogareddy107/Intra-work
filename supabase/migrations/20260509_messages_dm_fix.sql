-- 1. Add DM support to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_dm BOOLEAN DEFAULT false;

-- 2. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated to insert channels" ON public.channels;
DROP POLICY IF EXISTS "Allow public to select channels" ON public.channels;
DROP POLICY IF EXISTS "Allow authenticated to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow public to select messages" ON public.messages;

-- 3. Create permissive policies for authenticated users
-- Channels
CREATE POLICY "authenticated_channels_select" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_channels_insert" ON public.channels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_channels_update" ON public.channels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_channels_delete" ON public.channels FOR DELETE TO authenticated USING (true);

-- Messages
CREATE POLICY "authenticated_messages_select" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_messages_update" ON public.messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_messages_delete" ON public.messages FOR DELETE TO authenticated USING (true);

-- 4. Enable RLS on channels just in case it was disabled or misconfigured
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Seed some initial channels if empty
INSERT INTO public.channels (name, is_private)
SELECT 'general', false
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'general');

INSERT INTO public.channels (name, is_private)
SELECT 'engineering', false
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'engineering');
