-- Create Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'on_hold'
    progress INTEGER DEFAULT 0,
    color TEXT DEFAULT 'primary'
);

-- Update tasks table to reference projects
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public select projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete projects" ON public.projects FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial projects
INSERT INTO public.projects (name, description, status, progress, color) VALUES
('Atlas Web Platform', 'Redesign of the core user interface.', 'active', 65, 'primary'),
('IntraSphere Mobile', 'Cross-platform app for iOS and Android.', 'active', 30, 'info'),
('Analytics Engine', 'High-performance data processing pipeline.', 'active', 85, 'success'),
('Legal Compliance', 'Updating agreements for 2026 regulations.', 'on_hold', 10, 'warning');
