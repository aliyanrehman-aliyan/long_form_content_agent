
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const requestedSupabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA;

const allowedSupabaseSchemas = [
  'ag_long_form_content',
  'ag_long_form_content_dev',
  'ag_long_form_content_test',
] as const;

export type SupabaseSchema = typeof allowedSupabaseSchemas[number];

const resolveSupabaseSchema = (schema: string | undefined): SupabaseSchema => {
  if (!schema) return 'ag_long_form_content';

  if (allowedSupabaseSchemas.includes(schema as SupabaseSchema)) {
    return schema as SupabaseSchema;
  }

  throw new Error(
    `Unsupported VITE_SUPABASE_SCHEMA "${schema}". Use one of: ${allowedSupabaseSchemas.join(', ')}.`
  );
};

export const supabaseSchema = resolveSupabaseSchema(requestedSupabaseSchema);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema },
});
