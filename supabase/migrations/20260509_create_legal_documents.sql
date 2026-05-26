-- Create Legal Documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'offer_letter', 'nda', 'agreement', 'policy'
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending_signature', 'signed', 'archived'
    employee_id UUID REFERENCES public.employees(id),
    document_url TEXT, -- Link to storage or placeholder
    content TEXT -- For simple text-based documents
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public select legal_documents" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert legal_documents" ON public.legal_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update legal_documents" ON public.legal_documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete legal_documents" ON public.legal_documents FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
