-- Site Builder projects table
CREATE TABLE IF NOT EXISTS site_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'review', 'revising', 'published', 'archived')),
  form_data jsonb NOT NULL DEFAULT '{}',
  generated_code text,
  vercel_url text,
  production_url text,
  org_id uuid REFERENCES organizations(id),
  chat_history jsonb DEFAULT '[]',
  session_id text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE site_projects ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "superadmin_all_site_projects" ON site_projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );
