-- 1. Drop all possible existing versions to prevent overloading conflicts
DROP FUNCTION IF EXISTS public.send_chat_message(UUID, TEXT, BOOLEAN, UUID);
DROP FUNCTION IF EXISTS public.send_chat_message(UUID, TEXT, BOOLEAN, UUID, TEXT);

-- 2. Create the final version with explicit signature
CREATE OR REPLACE FUNCTION public.send_chat_message(
    p_channel_id UUID,
    p_content TEXT,
    p_is_dm BOOLEAN DEFAULT false,
    p_recipient_id UUID DEFAULT NULL,
    p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_message_id UUID;
    v_user_id UUID := auth.uid();
BEGIN
    -- Validate authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the message
    INSERT INTO public.messages (
        channel_id,
        user_id,
        content,
        is_dm,
        recipient_id,
        attachment_url
    ) VALUES (
        p_channel_id,
        v_user_id,
        p_content,
        p_is_dm,
        p_recipient_id,
        p_attachment_url
    ) RETURNING id INTO v_message_id;

    RETURN jsonb_build_object('id', v_message_id);
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated, service_role;

-- 4. Force a schema cache reload by touching a table comment
COMMENT ON TABLE public.messages IS 'Messages table - cache refreshed';

-- 5. Notify PostgREST to reload
NOTIFY pgrst, 'reload';
