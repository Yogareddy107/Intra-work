-- Create an enum for employee status
CREATE TYPE public.employee_status AS ENUM ('Present', 'Remote', 'On Leave', 'Absent');

-- Create the employees table
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status public.employee_status NOT NULL DEFAULT 'Present',
    initials TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all employees
CREATE POLICY "Allow authenticated users to select employees" 
ON public.employees FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert employees
CREATE POLICY "Allow authenticated users to insert employees" 
ON public.employees FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update employees
CREATE POLICY "Allow authenticated users to update employees" 
ON public.employees FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete employees
CREATE POLICY "Allow authenticated users to delete employees" 
ON public.employees FOR DELETE 
TO authenticated 
USING (true);

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial seed data
INSERT INTO public.employees (employee_id, full_name, email, role, department, status, initials) VALUES
('ISL-0421', 'Maya Singh', 'maya@intrasphere.io', 'VP Engineering', 'Engineering', 'Present', 'MS'),
('ISL-0398', 'Rahul Nair', 'rahul@intrasphere.io', 'Senior Engineer', 'Engineering', 'Present', 'RN'),
('ISL-0312', 'Priya Kapoor', 'priya@intrasphere.io', 'Product Manager', 'Product', 'Remote', 'PK'),
('ISL-0287', 'Devon Lee', 'devon@intrasphere.io', 'UX Designer', 'Design', 'On Leave', 'DL'),
('ISL-0245', 'Sara Ahmed', 'sara@intrasphere.io', 'HR Lead', 'People Ops', 'Present', 'SA'),
('ISL-0211', 'Liam Park', 'liam@intrasphere.io', 'DevOps Engineer', 'Engineering', 'Present', 'LP'),
('ISL-0188', 'Ana Costa', 'ana@intrasphere.io', 'Account Executive', 'Sales', 'Absent', 'AC');
