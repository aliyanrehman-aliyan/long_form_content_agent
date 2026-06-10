BEGIN;

ALTER TABLE ag_long_form_content.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_long_form_content.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage projects" ON ag_long_form_content.projects;
CREATE POLICY "Authenticated manage projects"
ON ag_long_form_content.projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

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
