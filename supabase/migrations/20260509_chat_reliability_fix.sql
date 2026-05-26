-- 1. Ensure messages has a proper foreign key to profiles for easier joins
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Ensure channels name is unique to prevent duplicate DM channels
ALTER TABLE public.channels ADD CONSTRAINT channels_name_key UNIQUE (name);

-- 3. Fix RLS for channels - Allow authenticated to manage channels they created OR are members of (for now just all authenticated)
DROP POLICY IF EXISTS "authenticated_channels_select" ON public.channels;
DROP POLICY IF EXISTS "authenticated_channels_insert" ON public.channels;
CREATE POLICY "channels_select_all" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "channels_insert_all" ON public.channels FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Fix RLS for messages - Allow all authenticated to see/send (IntraWork is an open workspace style)
DROP POLICY IF EXISTS "authenticated_messages_select" ON public.messages;
DROP POLICY IF EXISTS "authenticated_messages_insert" ON public.messages;
CREATE POLICY "messages_select_all" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert_all" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Ensure Realtime is enabled for everything needed
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
