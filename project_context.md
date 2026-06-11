# Project Context

## Latest Session Updates - June 8, 2026

This section is the newest source of truth for recent Codex work in this chat.
Some older sections below may still mention previous/stale architecture notes.

### Codex Working Rules Added

- Added root-level `AGENTS.md`.
- `AGENTS.md` instructs Codex to:
  - work only on the exact requested task
  - inspect first and list exact files before edits unless asked to apply now
  - avoid unrelated UI/routes/database/Edge Function changes
  - use PowerShell on Windows
  - keep OpenAI only inside Supabase Edge Functions
  - keep Supabase schema as `ag_long_form_content`
  - protect Customer Workspace, Analytics, Settings, and Auto Generate
  - use `skills/content-writing.md` for generated blog content

### Current App Navigation

- Left sidebar currently has four main items:
  - Customer Workspace
  - Analytics
  - Settings
  - Auto Generate
- Auto Generate is a separate page at `/auto-generate`.
- Auto Generate must not be moved back into Settings.
- Settings remains a three-step flow only:
  - Business Profile
  - Content Configuration
  - Method

### Temporary Auth State

- Login screen is currently bypassed/disabled for local dashboard access.
- `App.tsx` uses a temporary local user object.
- Sidebar bottom action currently clears project selection instead of performing real logout.
- This was done because the user asked to remove the login requirement for now.

### Supabase Client And Schema

- `supabaseClient.ts` now uses `.env.local` variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- The Supabase client is configured with:
  - `db: { schema: 'ag_long_form_content' }`
- Frontend must not expose `OPENAI_API_KEY`.
- OpenAI must only be called from Supabase Edge Functions.

### Database And Table Mapping

- Current app direction uses schema `ag_long_form_content`.
- Main tables:
  - `projects`
  - `categories`
  - `content_posts`
  - `media_assets`
- `App.tsx` now maps posts from `content_posts`, not `blog_posts`.
- `content_posts` mapping uses:
  - `category_ids`
  - `content_blocks_en`
  - `content_blocks_ar`
  - `content_type`
  - metadata defaults
- Project settings are stored in `ag_long_form_content.projects`.

### Settings Save Flow

- Settings can open when no project is selected.
- Saving from Settings creates a new project if no project exists.
- Saving updates the selected project if one exists.
- New/updated project should refresh the project selector.
- Settings save shows a compact centered "Thank You!" modal after successful save.
- The modal closes with Continue, outside click, or Esc.
- No redirect happens after closing the modal.

### Delivery Method Fix

- Delivery Method selection was fixed.
- UI state still uses `email_delivery` internally for Email Delivery.
- Database writes now save:
  - Supabase Shared: `delivery_method = 'supabase_shared'`
  - Email Delivery: `delivery_method = 'email'`
- Database reads normalize both `email` and older `email_delivery` to the Email Delivery UI state.
- Added migration:
  - `supabase/migrations/20260608172000_allow_email_delivery_method_value.sql`
- SQL in that migration:

```sql
ALTER TYPE ag_long_form_content.delivery_method
  ADD VALUE IF NOT EXISTS 'email';
```

### Auto Generate Page

- Auto Generate is implemented as its own page.
- It uses the selected project's saved configuration:
  - niche
  - category
  - location
  - tone
  - business context/settings metadata where available
  - target tags
- It also includes optional:
  - Niche Override
  - Location Override
- Empty overrides fall back to saved project settings.
- It calls Supabase Edge Function:
  - `auto-generate-content`
- Frontend call uses:

```ts
supabase.functions.invoke('auto-generate-content', { body })
```

- Auto Generate supports:
  - Generate Suggestions
  - Approve
  - Reject
  - Replace one suggestion
  - Bulk Approve
  - Generate approved articles
  - Pipeline status display

### Auto Generate Edge Function

- Added/updated function:
  - `supabase/functions/auto-generate-content/index.ts`
- Function actions:
  - `generate_suggestions`
  - `replace_suggestion`
  - `generate_articles`
- Function uses OpenAI only.
- Function reads `OPENAI_API_KEY` only from Supabase Secrets using `Deno.env.get`.
- Function uses Supabase service role only inside the Edge Function.
- Function targets schema:
  - `ag_long_form_content`
- Function inserts generated articles into:
  - `ag_long_form_content.content_posts`
- It schedules generated articles one per day after the selected project's latest existing `publish_at` date, so newly approved pipeline posts continue after the current schedule instead of restarting from today/tomorrow.
- CORS handling was improved:
  - handles `OPTIONS`
  - allows `authorization`, `apikey`, `content-type`, and `x-client-info`
  - returns JSON responses
- Invalid JSON request bodies return a JSON error.
- Frontend Auto Generate error logging was improved to show:
  - error name
  - message
  - HTTP status/status text when available
  - Edge Function response body when available

### Edge Function JWT Config

- `supabase/config.toml` has:

```toml
[functions.auto-generate-content]
verify_jwt = false
```

- Deploy command previously provided:

```bash
supabase functions deploy auto-generate-content --project-ref jtgqxbwdybllzckrjckq --no-verify-jwt
```

- If OpenAI secret is missing, set it in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your_key_here --project-ref jtgqxbwdybllzckrjckq
```

### Supabase SQL / RLS Notes

- Prior errors included:
  - missing `category` column in `projects`
  - row-level security violation when creating/updating projects
  - Edge Function generic request failure
- Migrations currently present include:
  - `20260608160000_align_project_settings_columns.sql`
  - `20260608162500_fix_ag_long_form_content_rls.sql`
  - `20260608164500_fix_authenticated_access_policies.sql`
  - `20260608170000_allow_anon_dashboard_access.sql`
  - `20260608172000_allow_email_delivery_method_value.sql`
- Because auth is temporarily bypassed, anon dashboard policies/migrations may be needed in Supabase until real auth is restored.

### Content Writing / FAQ Status

- `skills/content-writing.md` exists and is the reusable writing instruction file.
- A later request started to inspect stricter FAQ formatting rules, but that turn was interrupted before edits were applied.
- Therefore, FAQ normalization/strict FAQ prompt updates should still be treated as pending unless verified in files.

### Verification Done In This Chat

- `npm.cmd run build` passed after major frontend/Edge Function changes.
- Build warnings seen:
  - Vite large chunk warning
  - existing `/index.css` runtime note
- `AGENTS.md` creation was docs-only, so build was not run for that change.

## Project Overview

- Project name: Long Form Content Agent.
- Purpose: a React/Supabase app for managing multiple customer/content projects, generating long-form bilingual content, organizing it by category, scheduling posts, reviewing content, and managing project-specific settings.
- Main user flow:
  - Sign in with Supabase Auth.
  - Create/select a project.
  - Configure business/content settings.
  - Generate or manually edit long-form content.
  - Assign categories, SEO fields, featured image, status, and publish schedule.
  - Review posts through Posts, Calendar, Categories, and Analytics screens.

## Architecture And Tech Stack

- Frontend:
  - React 19.
  - TypeScript.
  - Vite.
  - Tailwind-style utility classes in JSX.
  - `lucide-react` icons.
- Backend/services:
  - Supabase Auth for email/password login.
  - Supabase Postgres for app data.
  - Supabase Storage for featured images.
  - Supabase Edge Functions for generation and public post fetching.
- Current local package scripts:
  - `npm.cmd run build`
  - `npm run dev`
  - `npm run preview`

## Current Folder Structure

- `App.tsx`: main app state, auth session handling, project selection, routing between pages, Supabase CRUD calls.
- `supabaseClient.ts`: creates the Supabase client. Currently contains hardcoded Supabase URL/key and should be moved to env vars.
- `types.ts`: shared frontend types for projects, posts, categories, media assets, SEO, content blocks, and tabs.
- `pages/Projects.tsx`: project list/cards, create project modal, older project settings modal.
- `pages/Settings.tsx`: newer 3-step settings UI: Business Profile, Content Configuration, Method.
- `pages/Editor.tsx`: content editor, generation calls, image upload, schedule/publish/draft actions.
- `pages/Posts.tsx`: post grid/list, search, delete, status toggle, edit/create.
- `pages/Categories.tsx`: category list, create/edit/delete.
- `pages/CategoryDetail.tsx`: posts inside a category and preview/edit actions.
- `pages/Calendar.tsx`: date-based content calendar.
- `pages/Analytics.tsx`: content review and status metrics.
- `pages/BlogDetail.tsx`: preview view for generated content.
- `pages/Media.tsx`: media library UI exists, but is not currently wired into main `App.tsx`.
- `pages/SupabaseSQL.tsx` and `schema.sql`: older schema references exist and may be stale.
- `skills/content-writing.md`: content-writing instructions injected into generation prompts.

## Features Completed

- Supabase auth sign-in flow.
- Multi-project UI with project cards and project selector.
- Project create/update flows.
- Project-specific categories.
- Content editor with:
  - English and Arabic titles/excerpts/content blocks.
  - SEO fields.
  - Featured image upload.
  - Tags input.
  - Draft/published/scheduled statuses.
  - Dubai-time scheduling logic in the current UI.
- AI generation flow calls existing Edge Function URLs and then saves generated output.
- Posts, Categories, Calendar, Analytics, and Blog Detail review views.
- New UI/state change completed:
  - Added an `All Projects` button beside the top project selector in `App.tsx`.
  - Clicking it clears the selected project.
  - `selectedProjectId` is removed from `localStorage`.
  - Project-specific posts/categories/editing/category-detail state is cleared.
  - App returns to the Projects page with no project selected.
  - `fetchProjects()` no longer auto-selects the first project; it only restores a valid saved selection.
- Build verification after the UI change:
  - `npm.cmd run build` passed.
  - Vite reported only a large chunk warning and an existing `/index.css` runtime note.

## Database Direction And Latest Schema Decision

- Use schema only: `ag_long_form_content`.
- Do not create app tables in `public`.
- Keep database simple and avoid over-normalization.
- Keep project settings in one table.
- Do not use separate settings tables unless future requirements genuinely need them.
- Content record data should stay together in one content table.
- Current preferred core tables:
  - `ag_long_form_content.projects`
  - `ag_long_form_content.categories`
  - `ag_long_form_content.content_posts`
  - `ag_long_form_content.media_assets`
- Current preferred enums:
  - `ag_long_form_content.content_status`: `draft`, `scheduled`, `published`
  - `ag_long_form_content.category_status`: `active`, `hidden`
  - `ag_long_form_content.delivery_method`: `supabase_shared`, `email_delivery`
- Removed/avoided from the simplified schema:
  - `project_content_settings`
  - `project_method_settings`
  - `content_item_categories`
  - `content_generation_runs`
  - `content_review_events`
  - `content_delivery_events`
  - `content_item_media_assets`
- Category relationship decision:
  - Use `content_posts.category_ids uuid[]` to match the current editor's multi-category selection.
  - Avoid duplicating the same relationship with `primary_category_id` and a join table for now.
  - The first ID in `category_ids` can be treated as display/primary category by the app if needed.
- Project settings decision:
  - `projects` should store business profile, content configuration, and method fields together.
  - Relevant fields include:
    - `name`
    - `website_url`
    - `niche`
    - `target_location`
    - `tone`
    - `target_tags`
    - `delivery_method`
    - `email_delivery_address`
    - `email_delivery_notes`
    - `settings_metadata`

## Latest Fresh SQL Migration Summary

- The latest provided SQL was a fresh-run migration intended for a user who is manually deleting existing tables.
- It drops only these objects inside `ag_long_form_content`:
  - `media_assets`
  - `content_posts`
  - `categories`
  - `projects`
  - `set_updated_at()`
  - `content_status`
  - `category_status`
  - `delivery_method`
- It then recreates:
  - Schema `ag_long_form_content`.
  - The three enum types.
  - Four core tables.
  - Indexes for project/date/status/category/tag lookups.
  - `set_updated_at()` trigger function.
  - Update triggers on all core tables.
  - RLS enabled on all core tables.
  - Broad authenticated/service-role policies and grants.
- Important: the app code has not yet been fully updated to use `content_posts`; current `App.tsx` still queries `blog_posts`.

## Supabase And API Integrations

- Supabase client:
  - Current file: `supabaseClient.ts`.
  - Currently hardcoded to an older Supabase project URL/key.
  - Should be changed to use `.env.local` values.
  - If using a non-public schema, the client should target `ag_long_form_content` for PostgREST queries.
- Current frontend generation calls in `pages/Editor.tsx`:
  - `pollinations-generate`
  - `pollinations-generate-post`
  - The names are historical; user clarified actual generation used an OpenAI key inside the Edge Function.
  - Do not rename endpoints unless explicitly requested.
  - Do not change generation logic unless explicitly requested.
- Existing Edge Function constraint from earlier discussion:
  - Do not touch/recreate/refactor generation Edge Functions unless user explicitly asks.
  - User planned to copy existing Edge Function code to the new Supabase project manually.
- Public fetch Edge Function:
  - User showed an old `get-posts` function that queried `.from("blog_posts")`.
  - Exact old code should not be copied if the new database uses `ag_long_form_content.content_posts`.
  - Recommended `get-posts` function should:
    - Keep function name: `get-posts`.
    - Use `createClient(url, serviceKey, { db: { schema: "ag_long_form_content" } })`.
    - Query `.from("content_posts")`.
    - Filter `project_id` and `status = "published"`.
    - Order by `published_at`.

## Environment Variables And Secrets

- Frontend `.env.local` placeholders required:
  - `VITE_SUPABASE_URL=`
  - `VITE_SUPABASE_ANON_KEY=`
- Supabase Edge Function secrets/placeholders:
  - `SUPABASE_URL=`
  - `SUPABASE_SERVICE_ROLE_KEY=`
  - `OPENAI_API_KEY=`
- Earlier requested placeholders also included:
  - `SUPABASE_SERVICE_ROLE_KEY=`
  - `OPENAI_API_KEY=`
- Do not generate real secrets in code or documentation.

## UI/UX Decisions

- Project selection:
  - A project should not be automatically selected by default.
  - A neutral "no project selected" state is supported.
  - The `All Projects` button clears the active project.
  - Settings forms should not show project data when no project is selected.
  - Users can later select a project from cards/dropdown again.
- Header:
  - Current project selector opens Projects page.
  - New `All Projects` button sits beside the selector and uses existing rounded/button styling.
- Settings flow:
  - Business Profile: project identity and overview.
  - Content Configuration: website URL, location, niche, tone, target tags.
  - Method: delivery method, currently Supabase Shared and Email Delivery.
- Method direction:
  - Remove External API as a long-term method.
  - Use only `supabase_shared` and `email_delivery`.
  - Some older UI code in `Projects.tsx`/`types.ts` still references `external_api`; this is pending cleanup.

## Important Business Logic

- Project data must be scoped by `project_id`.
- Switching selected project should load only that project's categories and posts.
- Clearing project selection should clear project-scoped local state.
- Content statuses:
  - Frontend display: `Draft`, `Published`, `Scheduled`.
  - Database values: `draft`, `published`, `scheduled`.
- Scheduling:
  - Current UI combines selected date/time as Dubai offset `+04:00`.
  - Calendar groups posts by a Dubai-local formatted date.
- Categories:
  - Editor requires at least one selected category before saving.
  - Current UI supports multiple category selection.
- Featured images:
  - Uploaded through Supabase Storage bucket `blog-images`.
  - Current upload path format: `${project.id}/${Date.now()}.${fileExt}`.

## Current Code/Schema Mismatches To Resolve

- App code currently queries:
  - `projects`
  - `categories`
  - `blog_posts`
- Latest simplified schema uses:
  - `projects`
  - `categories`
  - `content_posts`
- Required pending code updates if using latest SQL:
  - Replace Supabase queries from `blog_posts` to `content_posts`.
  - Map `blocks_en`/`blocks_ar` to `content_blocks_en`/`content_blocks_ar`, or adjust SQL to use the old column names.
  - Map `category_id` + `category_ids` logic to only `category_ids`.
  - Persist project fields currently dropped by `App.tsx` mappings:
    - `target_tags`
    - `delivery_method`
    - email delivery fields
  - Update `types.ts` publishing mode from `external_api` to `email_delivery`.
  - Remove old External API UI from `Projects.tsx` if keeping only Supabase Shared and Email Delivery.
  - Configure Supabase client for `ag_long_form_content` schema.
- `pages/SupabaseSQL.tsx` and `schema.sql` contain older SQL and likely need updating or removal to avoid confusion.

## Constraints For Future Work

- Do not modify generation Edge Functions or endpoint URLs unless explicitly requested.
- Do not change content generation logic unless explicitly requested.
- Keep all app database objects in `ag_long_form_content`.
- Avoid over-normalizing the database.
- Keep project settings in `projects`.
- Keep content fields together in `content_posts`.
- Keep UI changes consistent with current design style.
- Use `apply_patch` for manual code edits.
- Do not generate or expose secrets.

## Known Issues

- Supabase client still has hardcoded old project credentials.
- Editor still hardcodes an old Supabase project URL for Edge Function calls.
- App still queries `blog_posts`, while latest schema uses `content_posts`.
- Old `Projects.tsx` settings modal still references `external_api`.
- `Settings.tsx` has newer Email Delivery UI, but the save path currently depends on `Project.publishingMode`, which still allows `external_api` in `types.ts`.
- Media library page exists but is not currently mounted in `App.tsx`.
- There may be stale SQL duplicated in `schema.sql` and `pages/SupabaseSQL.tsx`.
- The build passes, but Vite warns that the main JS chunk is larger than 500 kB.

## Future Roadmap And TODOs

- Update frontend Supabase client to use environment variables.
- Point Supabase queries to `ag_long_form_content`.
- Rename app data calls from `blog_posts` to `content_posts`, or create a compatibility view if avoiding frontend changes.
- Update TypeScript types:
  - `PublishingMode = 'supabase_shared' | 'email_delivery'`.
  - Add persisted project fields for target tags and delivery/email settings.
  - Align post field names with `content_posts`.
- Clean up `Projects.tsx` to remove External API UI and use Email Delivery.
- Update `schema.sql` and `pages/SupabaseSQL.tsx` to match the final simplified schema.
- Add or confirm Storage bucket `blog-images`.
- Deploy new Supabase Edge Functions/secrets in the new Supabase project:
  - generation functions copied by user.
  - `get-posts` updated for `ag_long_form_content.content_posts`.
- Consider code splitting if bundle size becomes a real deployment/performance concern.
