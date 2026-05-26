-- 1. Create legal_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'offer_letter', 'nda', etc.
    status TEXT DEFAULT 'draft',
    content TEXT,
    employee_id UUID REFERENCES public.employees(id)
);

-- 2. Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Legal Documents Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_documents' AND policyname = 'Allow public select legal_docs') THEN
        CREATE POLICY "Allow public select legal_docs" ON public.legal_documents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_documents' AND policyname = 'Allow public insert legal_docs') THEN
        CREATE POLICY "Allow public insert legal_docs" ON public.legal_documents FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_documents' AND policyname = 'Allow public update legal_docs') THEN
        CREATE POLICY "Allow public update legal_docs" ON public.legal_documents FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_documents' AND policyname = 'Allow public delete legal_docs') THEN
        CREATE POLICY "Allow public delete legal_docs" ON public.legal_documents FOR DELETE USING (true);
    END IF;
END $$;

-- 4. Channels RLS Fix (Allow everyone to create for now, or refine based on role)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow authenticated to insert channels') THEN
        CREATE POLICY "Allow authenticated to insert channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow public to select channels') THEN
        CREATE POLICY "Allow public to select channels" ON public.channels FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Messages RLS Fix
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow authenticated to insert messages') THEN
        CREATE POLICY "Allow authenticated to insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow public to select messages') THEN
        CREATE POLICY "Allow public to select messages" ON public.messages FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Trigger for updated_at
CREATE TRIGGER update_legal_docs_updated_at
    BEFORE UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
