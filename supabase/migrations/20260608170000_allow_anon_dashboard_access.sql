BEGIN;

GRANT USAGE ON SCHEMA ag_long_form_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ag_long_form_content TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA ag_long_form_content
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

DROP POLICY IF EXISTS "Temporary anon manage projects" ON ag_long_form_content.projects;
CREATE POLICY "Temporary anon manage projects"
ON ag_long_form_content.projects
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Temporary anon manage categories" ON ag_long_form_content.categories;
CREATE POLICY "Temporary anon manage categories"
ON ag_long_form_content.categories
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Temporary anon manage content posts" ON ag_long_form_content.content_posts;
CREATE POLICY "Temporary anon manage content posts"
ON ag_long_form_content.content_posts
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Temporary anon manage media assets" ON ag_long_form_content.media_assets;
CREATE POLICY "Temporary anon manage media assets"
ON ag_long_form_content.media_assets
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

COMMIT;
