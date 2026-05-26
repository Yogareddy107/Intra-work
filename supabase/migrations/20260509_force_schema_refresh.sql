-- 1. Grant permissions explicitly
GRANT ALL ON TABLE public.messages TO authenticated, service_role;
GRANT ALL ON TABLE public.channels TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated, service_role;

-- 2. Force a schema change to trigger cache invalidation
COMMENT ON TABLE public.messages IS 'Table for storing chat messages - refreshed at ' || now();

-- 3. Trigger PostgREST reload
NOTIFY pgrst, 'reload';

-- 4. Re-declare the function just in case with more explicit search path
CREATE OR REPLACE FUNCTION public.send_chat_message(
    p_channel_id UUID,
    p_content TEXT,
    p_is_dm BOOLEAN DEFAULT false,
    p_recipient_id UUID DEFAULT NULL,
    p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_message_id UUID;
    v_user_id UUID := auth.uid();
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
