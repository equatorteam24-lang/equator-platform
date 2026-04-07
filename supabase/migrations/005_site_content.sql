-- Site content table for client-editable page content
CREATE TABLE IF NOT EXISTS site_content (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section     TEXT        NOT NULL,
  content     JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, section)
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Org members can manage their own content
CREATE POLICY "org_content_manage" ON site_content
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE org_id = site_content.org_id OR role = 'superadmin'
    )
  );

-- Public can read content (needed for the frontend)
CREATE POLICY "public_content_read" ON site_content
  FOR SELECT USING (true);

-- Storage: org members can upload media
CREATE POLICY "org_media_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "org_media_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "public_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
