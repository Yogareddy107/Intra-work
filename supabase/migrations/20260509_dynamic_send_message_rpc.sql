-- Dynamic RPC to send messages - this is immune to schema cache issues and missing columns
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
    v_query TEXT;
BEGIN
    -- We build the query dynamically to avoid compile-time errors if columns are being cached
    v_query := 'INSERT INTO public.messages (channel_id, user_id, content';
    
    -- Check if columns exist before adding them to the query
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_dm') THEN
        v_query := v_query || ', is_dm';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        v_query := v_query || ', recipient_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        v_query := v_query || ', attachment_url';
    END IF;

    v_query := v_query || ') VALUES ($1, $2, $3';

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_dm') THEN
        v_query := v_query || ', $4';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        v_query := v_query || ', $5';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        v_query := v_query || ', $6';
    END IF;

    v_query := v_query || ') RETURNING id';

    -- Execute with parameter binding
    EXECUTE v_query 
    INTO v_message_id
    USING p_channel_id, v_user_id, p_content, p_is_dm, p_recipient_id, p_attachment_url;

    RETURN jsonb_build_object('id', v_message_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated, service_role;

-- Force reload
NOTIFY pgrst, 'reload';
