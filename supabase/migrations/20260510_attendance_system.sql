-- 1. Create the attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'completed'
    work_date DATE DEFAULT CURRENT_DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can view their own logs
CREATE POLICY "Users can view their own logs" 
ON public.attendance_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert their own check-ins" 
ON public.attendance_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-outs
CREATE POLICY "Users can update their own check-outs" 
ON public.attendance_logs FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Super Admins and Admins can view ALL logs
-- We check the user_roles table for permissions
CREATE POLICY "Admins can view all logs" 
ON public.attendance_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    )
);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;

-- 5. Helper function to update employee status automatically
CREATE OR REPLACE FUNCTION public.sync_employee_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- When checking in, mark as Present
        UPDATE public.employees 
        SET status = 'Present' 
        WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id);
    ELSIF (TG_OP = 'UPDATE' AND NEW.check_out IS NOT NULL) THEN
        -- When checking out, mark as Remote (or you could choose Absent)
        UPDATE public.employees 
        SET status = 'Remote' 
        WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Bind the status sync trigger
CREATE TRIGGER on_attendance_change
    AFTER INSERT OR UPDATE ON public.attendance_logs
    FOR EACH ROW EXECUTE FUNCTION public.sync_employee_status();

-- 7. Force cache refresh
NOTIFY pgrst, 'reload';
