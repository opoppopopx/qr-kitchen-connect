CREATE POLICY "menu images readable by everyone"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'menu-images');

CREATE POLICY "boss upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images' AND private.is_boss(auth.uid()));

CREATE POLICY "boss update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images' AND private.is_boss(auth.uid()))
WITH CHECK (bucket_id = 'menu-images' AND private.is_boss(auth.uid()));

CREATE POLICY "boss delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND private.is_boss(auth.uid()));