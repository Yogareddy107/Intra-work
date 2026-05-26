-- Create RPC function to send messages - this bypasses schema cache issues for specific columns
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
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
