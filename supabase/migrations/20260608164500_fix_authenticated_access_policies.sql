BEGIN;

GRANT USAGE ON SCHEMA ag_long_form_content TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ag_long_form_content TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ag_long_form_content TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA ag_long_form_content
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA ag_long_form_content
GRANT SELECT ON TABLES TO anon;

ALTER TABLE ag_long_form_content.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage projects" ON ag_long_form_content.projects;
DROP POLICY IF EXISTS "Admin All Projects" ON ag_long_form_content.projects;
DROP POLICY IF EXISTS "Allow authenticated project reads" ON ag_long_form_content.projects;
DROP POLICY IF EXISTS "Allow authenticated project inserts" ON ag_long_form_content.projects;
DROP POLICY IF EXISTS "Allow authenticated project updates" ON ag_long_form_content.projects;
DROP POLICY IF EXISTS "Allow authenticated project deletes" ON ag_long_form_content.projects;

CREATE POLICY "Allow authenticated project reads"
ON ag_long_form_content.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated project inserts"
ON ag_long_form_content.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated project updates"
ON ag_long_form_content.projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated project deletes"
ON ag_long_form_content.projects
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated manage categories" ON ag_long_form_content.categories;
CREATE POLICY "Authenticated manage categories"
ON ag_long_form_content.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage content posts" ON ag_long_form_content.content_posts;
CREATE POLICY "Authenticated manage content posts"
ON ag_long_form_content.content_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage media assets" ON ag_long_form_content.media_assets;
CREATE POLICY "Authenticated manage media assets"
ON ag_long_form_content.media_assets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
