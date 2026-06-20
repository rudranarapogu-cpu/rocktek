
CREATE POLICY "Users can self-assign seller or driver role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('seller','driver'));
