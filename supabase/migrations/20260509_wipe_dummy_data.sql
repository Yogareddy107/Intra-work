-- Wipe all dummy data from tables
TRUNCATE TABLE public.tasks;
TRUNCATE TABLE public.employees;
TRUNCATE TABLE public.documents;
TRUNCATE TABLE public.meetings;

-- Note: We are deliberately NOT truncating public.channels or public.messages
-- so that your chat structure remains intact.
