-- Add meeting_link column to meetings table
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Update existing meetings to have a default link if they are Google Meet
UPDATE public.meetings SET meeting_link = 'https://meet.google.com/abc-defg-hij' WHERE room = 'Google Meet' AND meeting_link IS NULL;
