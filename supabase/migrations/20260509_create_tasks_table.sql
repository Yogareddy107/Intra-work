-- Create an enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'med', 'high');

-- Create an enum for task status
CREATE TYPE public.task_status AS ENUM ('todo', 'progress', 'review', 'done');

-- Create the tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    tag TEXT NOT NULL,
    priority public.task_priority NOT NULL DEFAULT 'med',
    status public.task_status NOT NULL DEFAULT 'todo',
    comments_count INTEGER NOT NULL DEFAULT 0,
    files_count INTEGER NOT NULL DEFAULT 0,
    assignees TEXT[] NOT NULL DEFAULT '{}'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
-- Allow authenticated users to view all tasks
CREATE POLICY "Allow authenticated users to select tasks" 
ON public.tasks FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert tasks
CREATE POLICY "Allow authenticated users to insert tasks" 
ON public.tasks FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update tasks
CREATE POLICY "Allow authenticated users to update tasks" 
ON public.tasks FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete tasks
CREATE POLICY "Allow authenticated users to delete tasks" 
ON public.tasks FOR DELETE 
TO authenticated 
USING (true);

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial seed data
INSERT INTO public.tasks (title, tag, priority, status, comments_count, files_count, assignees) VALUES
('Design onboarding email sequence', 'Marketing', 'med', 'todo', 3, 1, '{"MS", "PK"}'),
('Audit accessibility on settings page', 'Frontend', 'low', 'todo', 1, 0, '{"DL"}'),
('Implement JWT refresh token rotation', 'Backend', 'high', 'progress', 8, 2, '{"RN", "LP"}'),
('Build attendance heatmap widget', 'Analytics', 'med', 'progress', 4, 3, '{"MS"}'),
('Migrate billing to new schema', 'Backend', 'high', 'progress', 12, 1, '{"PK", "RN"}'),
('Channel notifications spec', 'Product', 'med', 'review', 6, 4, '{"DL"}'),
('Deploy preview environments via GH Actions', 'DevOps', 'high', 'review', 2, 0, '{"LP"}'),
('Sidebar redesign', 'Design', 'low', 'done', 5, 2, '{"DL", "PK"}'),
('Set up SSO for Workspace', 'Security', 'high', 'done', 3, 1, '{"AR"}');
