-- 1. Fix Messages FK to reference auth.users instead of profiles to avoid profile-missing errors
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop the recipient_id FK because it links to auth.users but we use employee IDs in the UI
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

-- 3. Ensure every user has a profile if they don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Realtime explicitly again
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
