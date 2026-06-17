DO $migration$
DECLARE
  target_schema text;
BEGIN
  FOREACH target_schema IN ARRAY ARRAY[
    'ag_long_form_content',
    'ag_long_form_content_dev',
    'ag_long_form_content_test'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE %I.projects ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT %L',
      target_schema,
      'blog_article'
    );

    EXECUTE format(
      'UPDATE %I.projects SET content_type = %L WHERE content_type IS NULL OR TRIM(content_type) = '''' OR content_type NOT IN (%L, %L, %L, %L, %L, %L, %L)',
      target_schema,
      'blog_article',
      'blog_article',
      'faq',
      'landing_page_content',
      'service_page',
      'product_description',
      'case_study',
      'general_content'
    );

    EXECUTE format(
      'ALTER TABLE %I.projects DROP CONSTRAINT IF EXISTS projects_content_type_allowed',
      target_schema
    );

    EXECUTE format(
      'ALTER TABLE %I.projects ADD CONSTRAINT projects_content_type_allowed CHECK (content_type IN (%L, %L, %L, %L, %L, %L, %L))',
      target_schema,
      'blog_article',
      'faq',
      'landing_page_content',
      'service_page',
      'product_description',
      'case_study',
      'general_content'
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS projects_content_type_idx ON %I.projects (content_type)',
      target_schema
    );
  END LOOP;
END
$migration$;

NOTIFY pgrst, 'reload schema';
