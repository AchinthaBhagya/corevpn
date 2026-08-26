CREATE POLICY "Users upload own slips"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own slips"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'slips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all slips"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'slips' AND private.has_role(auth.uid(), 'admin'::app_role));