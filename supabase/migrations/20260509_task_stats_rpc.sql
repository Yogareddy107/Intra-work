-- Create increment functions for task stats
CREATE OR REPLACE FUNCTION public.increment_task_comments(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET comments_count = comments_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_task_files(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET files_count = files_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
