-- Create ENUM for System Roles
CREATE TYPE public.system_role AS ENUM ('super_admin', 'hr_admin', 'manager', 'employee');

-- Add system_role column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS system_role public.system_role DEFAULT 'employee';

-- Set the admin email to be a super_admin if it exists
UPDATE public.employees 
SET system_role = 'super_admin' 
WHERE email = 'teamintrasphere@gmail.com';

-- Update types definition
-- Note: You should regenerate types locally, but this migration prepares the DB schema.
