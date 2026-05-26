
DROP POLICY IF EXISTS "Authenticated can view channels" ON public.channels;
CREATE POLICY "View public channels or own private channels"
  ON public.channels FOR SELECT TO authenticated
  USING (is_private = false OR created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated can view messages" ON public.messages;
CREATE POLICY "View messages in accessible channels"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = messages.channel_id
        AND (c.is_private = false OR c.created_by = auth.uid())
    )
  );
