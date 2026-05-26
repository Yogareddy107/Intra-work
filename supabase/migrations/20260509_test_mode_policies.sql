-- TEST MODE SCRIPT
-- This script temporarily disables the strict 'authenticated' requirement 
-- on your tables, allowing anyone (including 'anon') to read, insert, and update data.
-- Run this in your Supabase SQL editor so you can freely test the app without logging in.

-- Tasks Table
DROP POLICY IF EXISTS "Allow authenticated users to select tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON public.tasks;

CREATE POLICY "Allow public select tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);

-- Employees Table
DROP POLICY IF EXISTS "Allow authenticated users to select employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON public.employees;

CREATE POLICY "Allow public select employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete employees" ON public.employees FOR DELETE USING (true);

-- Documents Table
DROP POLICY IF EXISTS "Allow authenticated users to select documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON public.documents;

CREATE POLICY "Allow public select documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete documents" ON public.documents FOR DELETE USING (true);

-- Meetings Table
DROP POLICY IF EXISTS "Allow authenticated users to select meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow authenticated users to insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow authenticated users to update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow authenticated users to delete meetings" ON public.meetings;

CREATE POLICY "Allow public select meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert meetings" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update meetings" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete meetings" ON public.meetings FOR DELETE USING (true);
