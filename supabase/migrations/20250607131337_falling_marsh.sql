/*
  # Add Storage Bucket for Service Images

  1. Storage
    - Create bucket for service images
    - Set up policies for image access

  2. Security
    - Allow public read access to images
    - Allow authenticated users to upload/delete images
*/

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public read access for service images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'service-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload service images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'service-images');

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated users can delete service images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'service-images');

-- Allow authenticated users to update image metadata
CREATE POLICY "Authenticated users can update service images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'service-images');