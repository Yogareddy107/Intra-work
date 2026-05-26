-- Insert default channels if they don't exist
INSERT INTO public.channels (id, name, is_private, description)
VALUES 
  (gen_random_uuid(), 'general', false, 'General discussion for everyone.'),
  (gen_random_uuid(), 'engineering', false, 'Tech talks and pull requests.'),
  (gen_random_uuid(), 'design', false, 'Design reviews and mockups.'),
  (gen_random_uuid(), 'leadership', true, 'Private leadership channel.'),
  (gen_random_uuid(), 'random', false, 'Non-work banter and water cooler chat.')
ON CONFLICT DO NOTHING;

-- Note: In Supabase types, the tables already exist:
-- channels: id, name, is_private, description, created_at, created_by
-- messages: id, channel_id, user_id, content, attachment_url, created_at, updated_at
