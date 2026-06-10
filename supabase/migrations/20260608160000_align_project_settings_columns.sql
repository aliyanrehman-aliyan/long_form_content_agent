BEGIN;

CREATE SCHEMA IF NOT EXISTS ag_long_form_content;

DO $$ BEGIN
  CREATE TYPE ag_long_form_content.delivery_method AS ENUM ('supabase_shared', 'email_delivery');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ag_long_form_content.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  niche TEXT,
  category TEXT,
  target_location TEXT,
  tone TEXT,
  target_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  delivery_method ag_long_form_content.delivery_method NOT NULL DEFAULT 'supabase_shared',
  email_delivery_address TEXT,
  email_delivery_notes TEXT,
  settings_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ag_long_form_content.projects
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS target_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS delivery_method ag_long_form_content.delivery_method NOT NULL DEFAULT 'supabase_shared',
  ADD COLUMN IF NOT EXISTS email_delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS email_delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS settings_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE ag_long_form_content.projects
SET
  target_tags = COALESCE(target_tags, ARRAY[]::TEXT[]),
  delivery_method = COALESCE(delivery_method, 'supabase_shared'::ag_long_form_content.delivery_method),
  settings_metadata = COALESCE(settings_metadata, '{}'::JSONB),
  updated_at = COALESCE(updated_at, NOW());

COMMIT;
