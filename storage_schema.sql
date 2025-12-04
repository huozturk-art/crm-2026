-- Create a storage bucket called 'crm-media'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm-media', 'crm-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crm-media');

-- Policy to allow public to view images
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'crm-media');

-- Policy to allow users to delete their own images (optional, simplified for now)
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crm-media');
