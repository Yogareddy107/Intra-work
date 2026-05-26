-- Create the documents table
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    folder TEXT NOT NULL,
    starred BOOLEAN NOT NULL DEFAULT false,
    content TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all documents
CREATE POLICY "Allow authenticated users to select documents" 
ON public.documents FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents" 
ON public.documents FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents" 
ON public.documents FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents" 
ON public.documents FOR DELETE 
TO authenticated 
USING (true);

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial seed data
INSERT INTO public.documents (title, folder, starred, updated_at) VALUES
('Engineering onboarding handbook', 'Engineering', true, now() - interval '2 hours'),
('Q4 OKRs — Company-wide', 'Product', true, now() - interval '1 day'),
('Incident response playbook', 'Engineering', false, now() - interval '2 days'),
('Hiring pipeline & rubrics', 'People Ops', false, now() - interval '3 days'),
('Brand voice & tone guidelines', 'Brand', true, now() - interval '7 days'),
('Performance review framework', 'People Ops', false, now() - interval '7 days');
