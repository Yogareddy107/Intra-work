-- Create the meetings table
CREATE TABLE public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration TEXT NOT NULL,
    room TEXT NOT NULL,
    attendees TEXT[] NOT NULL DEFAULT '{}',
    color TEXT NOT NULL DEFAULT 'primary'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all meetings
CREATE POLICY "Allow authenticated users to select meetings" 
ON public.meetings FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert meetings
CREATE POLICY "Allow authenticated users to insert meetings" 
ON public.meetings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update meetings
CREATE POLICY "Allow authenticated users to update meetings" 
ON public.meetings FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete meetings
CREATE POLICY "Allow authenticated users to delete meetings" 
ON public.meetings FOR DELETE 
TO authenticated 
USING (true);

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial seed data for "today"
INSERT INTO public.meetings (title, start_time, duration, room, attendees, color) VALUES
('Engineering standup', date_trunc('day', now()) + interval '10 hours', '30 min', 'Google Meet', '{"MS", "RN", "LP", "PK"}', 'primary'),
('Design crit · Atlas v2', date_trunc('day', now()) + interval '11 hours 30 minutes', '45 min', 'Google Meet', '{"DL", "PK", "MS"}', 'info'),
('Q4 OKR planning', date_trunc('day', now()) + interval '14 hours', '60 min', 'Boardroom', '{"AR", "MS", "PK", "SA"}', 'success'),
('1:1 with Maya', date_trunc('day', now()) + interval '16 hours', '30 min', 'Google Meet', '{"AR", "MS"}', 'warning'),
('Performance Review', date_trunc('day', now()) + interval '2 days 10 hours', '60 min', 'Room 102', '{"AR", "SA"}', 'primary'),
('Sprint Retro', date_trunc('day', now()) - interval '3 days 14 hours', '45 min', 'Google Meet', '{"MS", "RN", "LP", "PK"}', 'info');
