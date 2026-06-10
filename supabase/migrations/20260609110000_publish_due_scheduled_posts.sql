BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION ag_long_form_content.publish_due_scheduled_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ag_long_form_content, public
AS $$
DECLARE
  published_count INTEGER;
BEGIN
  UPDATE ag_long_form_content.content_posts
  SET
    status = 'published'::ag_long_form_content.content_status,
    published_at = COALESCE(published_at, NOW()),
    updated_at = NOW()
  WHERE status = 'scheduled'::ag_long_form_content.content_status
    AND publish_at IS NOT NULL
    AND publish_at <= NOW();

  GET DIAGNOSTICS published_count = ROW_COUNT;
  RETURN published_count;
END;
$$;

GRANT EXECUTE ON FUNCTION ag_long_form_content.publish_due_scheduled_posts() TO service_role;

WITH project_categories AS (
  SELECT
    id AS project_id,
    NULLIF(TRIM(category), '') AS category_name,
    TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(NULLIF(TRIM(category), '')), '[^a-z0-9]+', '-', 'g')) AS category_slug
  FROM ag_long_form_content.projects
  WHERE NULLIF(TRIM(category), '') IS NOT NULL
),
inserted_categories AS (
  INSERT INTO ag_long_form_content.categories (
    project_id,
    name,
    slug,
    description,
    status
  )
  SELECT
    project_id,
    category_name,
    category_slug,
    'Auto-created category for ' || category_name || '.',
    'active'::ag_long_form_content.category_status
  FROM project_categories pc
  WHERE NOT EXISTS (
    SELECT 1
    FROM ag_long_form_content.categories c
    WHERE c.project_id = pc.project_id
      AND (
        LOWER(TRIM(c.name)) = LOWER(pc.category_name)
        OR c.slug = pc.category_slug
      )
  )
  RETURNING id
)
UPDATE ag_long_form_content.content_posts cp
SET
  category_ids = ARRAY[matched_category.id]::UUID[],
  updated_at = NOW()
FROM project_categories pc
CROSS JOIN LATERAL (
  SELECT c.id
  FROM ag_long_form_content.categories c
  WHERE c.project_id = pc.project_id
    AND (
      LOWER(TRIM(c.name)) = LOWER(pc.category_name)
      OR c.slug = pc.category_slug
    )
  ORDER BY c.created_at ASC
  LIMIT 1
) matched_category
WHERE cp.project_id = pc.project_id
  AND (
    cp.category_ids IS NULL
    OR CARDINALITY(cp.category_ids) = 0
  );

SELECT cron.unschedule('publish-due-scheduled-posts')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'publish-due-scheduled-posts'
);

SELECT cron.schedule(
  'publish-due-scheduled-posts',
  '* * * * *',
  $$SELECT ag_long_form_content.publish_due_scheduled_posts();$$
);

SELECT ag_long_form_content.publish_due_scheduled_posts();

COMMIT;
