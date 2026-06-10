
BEGIN;

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL UNIQUE,
  niche TEXT,
  tone TEXT,
  target_location TEXT DEFAULT 'Dubai, UAE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Content Fields
  title_en TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_ar TEXT,
  
  -- Status & Scheduling
  status post_status DEFAULT 'draft',
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Featured Assets & SEO
  featured_image_url TEXT,
  focus_keyword TEXT,
  seo_title TEXT,
  meta_description TEXT,
  
  -- Structured Content (JSONB)
  blocks_en JSONB DEFAULT '[]'::jsonb,
  blocks_ar JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, slug)
);

-- Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_project ON blog_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_publish_at ON blog_posts(publish_at);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- 5. Security Policies (Authenticated Admin Access)
DROP POLICY IF EXISTS "Admin All Projects" ON projects;
CREATE POLICY "Admin All Projects" ON projects FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin All Categories" ON categories;
CREATE POLICY "Admin All Categories" ON categories FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin All Posts" ON blog_posts;
CREATE POLICY "Admin All Posts" ON blog_posts FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin All Media" ON media_assets;
CREATE POLICY "Admin All Media" ON media_assets FOR ALL TO authenticated USING (true);

-- 6. Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_update_projects_ts ON projects;
CREATE TRIGGER tr_update_projects_ts BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS tr_update_posts_ts ON blog_posts;
CREATE TRIGGER tr_update_posts_ts BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Note: You must manually create a public bucket named 'blog-images' in Supabase Storage.

COMMIT;
