DO $migration$
DECLARE
  target_schema text;
  generated_index_name text;
BEGIN
  FOREACH target_schema IN ARRAY ARRAY[
    'ag_long_form_content_dev',
    'ag_long_form_content_test'
  ] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = target_schema
        AND c.relname = 'projects'
        AND con.conname = 'projects_website_url_key'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.projects RENAME CONSTRAINT projects_website_url_key TO projects_website_url_unique',
        target_schema
      );
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = target_schema
        AND c.relname = 'categories'
        AND con.conname = 'categories_project_id_slug_key'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.categories RENAME CONSTRAINT categories_project_id_slug_key TO categories_project_slug_unique',
        target_schema
      );
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = target_schema
        AND c.relname = 'content_posts'
        AND con.conname = 'content_posts_project_id_slug_key'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.content_posts RENAME CONSTRAINT content_posts_project_id_slug_key TO content_posts_project_slug_unique',
        target_schema
      );
    END IF;

    FOREACH generated_index_name IN ARRAY ARRAY[
      'categories_project_id_idx',
      'categories_status_idx',
      'content_posts_category_ids_idx',
      'content_posts_content_type_idx',
      'content_posts_created_at_idx',
      'content_posts_project_id_idx',
      'content_posts_publish_at_idx',
      'content_posts_status_idx',
      'content_posts_tags_idx',
      'media_assets_project_id_idx',
      'projects_created_at_idx',
      'projects_delivery_method_idx',
      'projects_target_tags_idx'
    ] LOOP
      EXECUTE format('DROP INDEX IF EXISTS %I.%I', target_schema, generated_index_name);
    END LOOP;
  END LOOP;
END
$migration$;

NOTIFY pgrst, 'reload schema';
