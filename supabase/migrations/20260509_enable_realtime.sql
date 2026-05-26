-- Enable Realtime Broadcast for all created tables
-- By default, Supabase does not broadcast table changes over websockets.
-- This script adds our tables to the 'supabase_realtime' publication.

BEGIN;
  -- Remove the tables from publication if they somehow exist to avoid duplicate errors
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.tasks;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.employees;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.documents;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.meetings;

  -- Add the tables to the realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
COMMIT;
