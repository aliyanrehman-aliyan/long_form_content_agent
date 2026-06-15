DO $migration$
DECLARE
  source_schema CONSTANT text := 'ag_long_form_content';
  target_schemas CONSTANT text[] := ARRAY[
    'ag_long_form_content_dev',
    'ag_long_form_content_test'
  ];
  table_names CONSTANT text[] := ARRAY[
    'projects',
    'categories',
    'content_posts',
    'media_assets'
  ];
  source_schema_oid oid;
  target_schema text;
  table_name text;
  enum_rec record;
  column_rec record;
  default_rec record;
  fk_rec record;
  index_rec record;
  trigger_function_rec record;
  trigger_rec record;
  policy_rec record;
  source_labels text[];
  target_labels text[];
  labels_sql text;
  current_type_schema text;
  ddl text;
  policy_roles text;
  policy_command text;
  rel_security record;
  role_name text;
BEGIN
  SELECT oid
  INTO source_schema_oid
  FROM pg_namespace
  WHERE nspname = source_schema;

  IF source_schema_oid IS NULL THEN
    RAISE EXCEPTION 'Source schema % does not exist.', source_schema;
  END IF;

  FOREACH table_name IN ARRAY table_names LOOP
    IF to_regclass(format('%I.%I', source_schema, table_name)) IS NULL THEN
      RAISE EXCEPTION 'Source table %.% does not exist.', source_schema, table_name;
    END IF;
  END LOOP;

  FOREACH target_schema IN ARRAY target_schemas LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', target_schema);

    FOR enum_rec IN
      SELECT
        t.typname,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typnamespace = source_schema_oid
      GROUP BY t.typname
      ORDER BY t.typname
    LOOP
      source_labels := enum_rec.labels;

      SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
      INTO target_labels
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = target_schema
        AND t.typname = enum_rec.typname;

      IF target_labels IS NULL THEN
        SELECT string_agg(format('%L', label), ', ')
        INTO labels_sql
        FROM unnest(source_labels) AS label;

        EXECUTE format(
          'CREATE TYPE %I.%I AS ENUM (%s)',
          target_schema,
          enum_rec.typname,
          labels_sql
        );
      ELSIF target_labels IS DISTINCT FROM source_labels THEN
        RAISE EXCEPTION
          'Target enum %.% already exists but does not match %.%.',
          target_schema,
          enum_rec.typname,
          source_schema,
          enum_rec.typname;
      END IF;
    END LOOP;

    FOR trigger_function_rec IN
      SELECT DISTINCT
        p.oid,
        pg_get_functiondef(p.oid) AS definition
      FROM pg_trigger tr
      JOIN pg_class c ON c.oid = tr.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = tr.tgfoid
      WHERE n.nspname = source_schema
        AND c.relname = ANY(table_names)
        AND p.pronamespace = source_schema_oid
        AND NOT tr.tgisinternal
      ORDER BY p.oid
    LOOP
      ddl := replace(trigger_function_rec.definition, source_schema, target_schema);
      EXECUTE ddl;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      IF to_regclass(format('%I.%I', target_schema, table_name)) IS NULL THEN
        EXECUTE format(
          'CREATE TABLE %I.%I (LIKE %I.%I INCLUDING ALL)',
          target_schema,
          table_name,
          source_schema,
          table_name
        );
      END IF;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      FOR column_rec IN
        SELECT
          a.attname,
          t.typname
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_type t ON t.oid = a.atttypid
        WHERE n.nspname = source_schema
          AND c.relname = table_name
          AND t.typnamespace = source_schema_oid
          AND t.typtype = 'e'
          AND a.attnum > 0
          AND NOT a.attisdropped
      LOOP
        SELECT tn.nspname
        INTO current_type_schema
        FROM pg_attribute ta
        JOIN pg_class tc ON tc.oid = ta.attrelid
        JOIN pg_namespace tn_rel ON tn_rel.oid = tc.relnamespace
        JOIN pg_type tt ON tt.oid = ta.atttypid
        JOIN pg_namespace tn ON tn.oid = tt.typnamespace
        WHERE tn_rel.nspname = target_schema
          AND tc.relname = table_name
          AND ta.attname = column_rec.attname
          AND ta.attnum > 0
          AND NOT ta.attisdropped;

        IF current_type_schema IS DISTINCT FROM target_schema THEN
          EXECUTE format(
            'ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT',
            target_schema,
            table_name,
            column_rec.attname
          );

          EXECUTE format(
            'ALTER TABLE %I.%I ALTER COLUMN %I TYPE %I.%I USING %I::text::%I.%I',
            target_schema,
            table_name,
            column_rec.attname,
            target_schema,
            column_rec.typname,
            column_rec.attname,
            target_schema,
            column_rec.typname
          );
        END IF;
      END LOOP;

      FOR default_rec IN
        SELECT
          a.attname,
          pg_get_expr(d.adbin, d.adrelid) AS default_expr
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_attrdef d
          ON d.adrelid = a.attrelid
         AND d.adnum = a.attnum
        WHERE n.nspname = source_schema
          AND c.relname = table_name
          AND a.attnum > 0
          AND NOT a.attisdropped
      LOOP
        IF default_rec.default_expr IS NULL THEN
          EXECUTE format(
            'ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT',
            target_schema,
            table_name,
            default_rec.attname
          );
        ELSE
          ddl := replace(default_rec.default_expr, source_schema, target_schema);
          EXECUTE format(
            'ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT %s',
            target_schema,
            table_name,
            default_rec.attname,
            ddl
          );
        END IF;
      END LOOP;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      FOR fk_rec IN
        SELECT
          con.conname,
          pg_get_constraintdef(con.oid) AS definition
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = source_schema
          AND c.relname = table_name
          AND con.contype = 'f'
        ORDER BY con.conname
      LOOP
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint target_con
          JOIN pg_class target_class ON target_class.oid = target_con.conrelid
          JOIN pg_namespace target_ns ON target_ns.oid = target_class.relnamespace
          WHERE target_ns.nspname = target_schema
            AND target_class.relname = table_name
            AND target_con.conname = fk_rec.conname
        ) THEN
          ddl := replace(fk_rec.definition, source_schema, target_schema);
          EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
            target_schema,
            table_name,
            fk_rec.conname,
            ddl
          );
        END IF;
      END LOOP;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      FOR index_rec IN
        SELECT pg_get_indexdef(i.indexrelid) AS definition
        FROM pg_index i
        JOIN pg_class table_class ON table_class.oid = i.indrelid
        JOIN pg_namespace table_ns ON table_ns.oid = table_class.relnamespace
        LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
        WHERE table_ns.nspname = source_schema
          AND table_class.relname = table_name
          AND con.oid IS NULL
        ORDER BY i.indexrelid::regclass::text
      LOOP
        ddl := replace(index_rec.definition, source_schema, target_schema);
        ddl := regexp_replace(ddl, '^CREATE UNIQUE INDEX ', 'CREATE UNIQUE INDEX IF NOT EXISTS ');
        ddl := regexp_replace(ddl, '^CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS ');
        EXECUTE ddl;
      END LOOP;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      FOR trigger_rec IN
        SELECT
          tr.tgname,
          pg_get_triggerdef(tr.oid) AS definition
        FROM pg_trigger tr
        JOIN pg_class c ON c.oid = tr.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = source_schema
          AND c.relname = table_name
          AND NOT tr.tgisinternal
        ORDER BY tr.tgname
      LOOP
        EXECUTE format(
          'DROP TRIGGER IF EXISTS %I ON %I.%I',
          trigger_rec.tgname,
          target_schema,
          table_name
        );

        ddl := replace(trigger_rec.definition, source_schema, target_schema);
        EXECUTE ddl;
      END LOOP;
    END LOOP;

    FOREACH table_name IN ARRAY table_names LOOP
      SELECT relrowsecurity, relforcerowsecurity
      INTO rel_security
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = source_schema
        AND c.relname = table_name;

      IF rel_security.relrowsecurity THEN
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target_schema, table_name);
      ELSE
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', target_schema, table_name);
      END IF;

      IF rel_security.relforcerowsecurity THEN
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', target_schema, table_name);
      ELSE
        EXECUTE format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY', target_schema, table_name);
      END IF;

      FOR policy_rec IN
        SELECT
          pol.polname,
          pol.polcmd,
          pol.polpermissive,
          pol.polroles,
          pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
          pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = source_schema
          AND c.relname = table_name
        ORDER BY pol.polname
      LOOP
        policy_command := CASE policy_rec.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          ELSE 'ALL'
        END;

        IF policy_rec.polroles = ARRAY[0::oid] THEN
          policy_roles := 'PUBLIC';
        ELSE
          SELECT string_agg(format('%I', r.rolname), ', ' ORDER BY r.rolname)
          INTO policy_roles
          FROM unnest(policy_rec.polroles) AS role_oid
          JOIN pg_roles r ON r.oid = role_oid;
        END IF;

        IF policy_roles IS NULL THEN
          policy_roles := 'PUBLIC';
        END IF;

        EXECUTE format(
          'DROP POLICY IF EXISTS %I ON %I.%I',
          policy_rec.polname,
          target_schema,
          table_name
        );

        ddl := format(
          'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
          policy_rec.polname,
          target_schema,
          table_name,
          CASE WHEN policy_rec.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          policy_command,
          policy_roles
        );

        IF policy_rec.using_expr IS NOT NULL THEN
          ddl := ddl || format(' USING (%s)', replace(policy_rec.using_expr, source_schema, target_schema));
        END IF;

        IF policy_rec.check_expr IS NOT NULL THEN
          ddl := ddl || format(' WITH CHECK (%s)', replace(policy_rec.check_expr, source_schema, target_schema));
        END IF;

        EXECUTE ddl;
      END LOOP;
    END LOOP;

    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', target_schema, role_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', target_schema, role_name);
        EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO %I', target_schema, role_name);
        EXECUTE format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA %I TO %I', target_schema, role_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', target_schema, role_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO %I', target_schema, role_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I', target_schema, role_name);
      END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO service_role', target_schema);
      EXECUTE format('GRANT ALL ON ALL FUNCTIONS IN SCHEMA %I TO service_role', target_schema);
      EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO service_role', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO service_role', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON FUNCTIONS TO service_role', target_schema);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO service_role', target_schema);
    END IF;
  END LOOP;
END
$migration$;

NOTIFY pgrst, 'reload schema';
