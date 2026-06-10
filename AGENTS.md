# AGENTS.md - Long Form Content Agent

## Project Overview

Long Form Content Agent is a Vite/React application for managing long-form blog content across projects. It includes project settings, customer workspace content management, analytics, and an Auto Generate workflow powered by Supabase Edge Functions and OpenAI.

Main app root:

`C:\Users\Aliyan Rehman\Desktop\Agent long form content`

If unsure about context, first confirm the working directory and inspect `package.json`, `App.tsx`, `supabaseClient.ts`, and `project_context.md`.

---

## Working Style

- Work only on the exact task requested.
- Make minimal surgical changes only.
- Do not touch unrelated files, pages, routes, database schema, Edge Functions, or UI.
- Inspect first, then explain the plan before editing unless the user clearly says "apply now".
- Before editing, list the exact files that will change.
- Do not rewrite full files unless necessary.
- Do not refactor unrelated code.
- Do not create tests unless explicitly asked.
- Do not add extra nice-to-have changes.
- Do not redesign unrelated UI or change existing functionality.
- Do not run repeated commands without a reason.
- Use PowerShell on Windows.
- Do not use Bash on Windows.
- Run `npm run build` only when asked or after important changes.
- Do not claim a fix is complete unless it has been verified or clearly state what was not verified.

---

## Approval Workflow

For most tasks, follow this flow:

1. Inspect only.
2. Report:
   - root cause or critique
   - exact files involved
   - minimal patch plan
   - risks
3. Ask for approval.
4. Apply only the approved patch.
5. Verify only what is appropriate for the requested change.
6. Stop after a short summary.

Do not start editing immediately unless the user clearly says "apply now" or the task is explicitly a direct file creation/edit request.

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Supabase JavaScript client
- Supabase Database under schema `ag_long_form_content`
- Supabase Edge Functions
- OpenAI via Supabase Edge Functions only
- Lucide React icons
- Recharts for analytics

---

## Important Files

- `App.tsx` - main routing, project selection, shared data loading, save handlers.
- `supabaseClient.ts` - Supabase client configuration.
- `types.ts` - shared application types.
- `pages/Settings.tsx` - three-step project settings flow.
- `pages/AutoGenerate.tsx` - Auto Generate page and Edge Function invoke flow.
- `pages/Posts.tsx` - customer workspace post list.
- `pages/Editor.tsx` - manual post editing/generation flow.
- `pages/Analytics.tsx` - analytics page.
- `pages/Projects.tsx` - project list and project modal.
- `supabase/functions/auto-generate-content/index.ts` - Auto Generate Edge Function.
- `supabase/migrations/` - database migrations.
- `skills/content-writing.md` - required writing style and article structure rules.
- `.env.local` - local environment variables. Never print or expose secret values.

---

## Protected App Structure

The left-side app structure must remain:

- Customer Workspace
- Analytics
- Settings
- Auto Generate

Do not move Auto Generate back into Settings.
Do not remove or rename these main sections unless explicitly asked.
Do not change existing routes unless the task is specifically about routing.

---

## Protected Files And Areas

Do not touch these unless the user specifically asks for work in that area:

- `pages/Editor.tsx` - manual post generation and editing flow.
- `pages/Posts.tsx` - post workspace behavior.
- `pages/Analytics.tsx` - analytics behavior and charts.
- `pages/Settings.tsx` - settings flow, unless the task is about settings.
- `pages/AutoGenerate.tsx` - Auto Generate page, unless the task is about Auto Generate.
- `supabase/functions/auto-generate-content/index.ts` - Edge Function, unless the task is about Auto Generate or OpenAI function calls.
- `supabase/migrations/` - database schema, unless a schema change is explicitly required.
- `supabaseClient.ts` - Supabase configuration, unless the task is about Supabase connection/schema use.
- `.env.local` - never modify secrets unless explicitly asked; never reveal secret values.

Do not change unrelated design, copy, spacing, colors, layouts, or components while fixing logic.

---

## Supabase Rules

- Keep the Supabase schema under `ag_long_form_content`.
- Main tables are expected to include:
  - `projects`
  - `categories`
  - `content_posts`
  - `media_assets`
- Project settings must be stored in `ag_long_form_content.projects`.
- Settings must save project context correctly.
- Preserve required project fields:
  - `id`
  - `user_id` or `owner_id` if auth is used
  - `name` or `project_name`
  - `website_url`
  - `niche`
  - `category`
  - `target_location` or `location`
  - `tone`
  - `target_tags`
  - `delivery_method`
  - `created_at`
  - `updated_at`
- Do not add enterprise tables or unrelated schema.
- Do not modify existing `get-posts` Edge Function or endpoint URLs.
- Do not expose service role keys or OpenAI keys in frontend code.
- Frontend must use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Use migrations for schema changes when a schema change is required.
- Return useful JSON errors from Edge Functions.

---

## OpenAI And Edge Function Rules

- Do not expose `OPENAI_API_KEY` in frontend code.
- OpenAI must only run inside Supabase Edge Functions.
- Read `OPENAI_API_KEY` from Supabase Secrets only.
- Do not use Pollinations or any other provider for Auto Generate.
- Auto Generate must use the `auto-generate-content` Edge Function.
- Frontend must call:

```ts
supabase.functions.invoke('auto-generate-content', { body })
```

- The function name must stay exactly `auto-generate-content`.
- The function should support these actions:
  - `generate_suggestions`
  - `replace_suggestion`
  - `generate_articles`
- Edge Functions must handle CORS, including `OPTIONS`.
- CORS must allow `authorization`, `apikey`, and `content-type` headers.
- Do not change unrelated Edge Functions.

---

## Settings Rules

- Settings must have only three steps:
  - Business Profile
  - Content Configuration
  - Method
- Content Configuration fields:
  - project name
  - website URL
  - niche
  - category
  - location
  - tone
  - target tags
- Method fields:
  - Supabase Shared
  - Email Delivery
- Save should create a project if no project exists.
- Save should update the selected project if one exists.
- Saved settings must remain selected after refresh.
- Do not change Business Profile, Content Configuration, Method, or manual generation flow unless explicitly requested.

---

## Auto Generate Rules

- Auto Generate is a separate page in the sidebar, not a Settings step.
- Auto Generate must use the currently selected project's saved configuration by default.
- Optional overrides:
  - Niche Override
  - Location Override
- Empty overrides must fall back to saved project settings.
- Generate Suggestions must use OpenAI through `auto-generate-content`.
- Suggestions should show:
  - title
  - short description
  - primary keyword
  - SEO potential
- Approve, Reject, Replace, and Bulk Approve behavior must remain intact.
- Replace should regenerate only one topic, not the whole list.
- Approved topics should generate articles automatically through the Edge Function.
- Generated articles should save to `ag_long_form_content.content_posts`.
- Automatic scheduling should assign one article per day for the next seven days.
- Status tracking should use:
  - Draft
  - Scheduled
  - Published
  - Failed

---

## Content Writing Rules

- Generated blog content must follow `skills/content-writing.md`.
- Keep a professional, simple, easy-to-read tone.
- Articles must include:
  - introduction
  - clear main sections
  - FAQ section
  - conclusion
- The FAQ section must appear before the conclusion.
- FAQ format must stay consistent in every article.
- FAQ answers should be concise, practical, and easy to understand.
- Use clear headings and focused paragraphs.
- Use bullet lists where helpful.
- Do not change app logic, UI, APIs, database, or existing functionality when applying content-writing instructions.

---

## UI Rules

- Keep UI consistent with the existing design system.
- Use compact spacing where the existing screen already does.
- Do not redesign pages while fixing logic.
- Do not alter unrelated layouts, colors, cards, typography, or navigation.
- Do not add explanatory in-app text unless explicitly requested.
- Keep existing Customer Workspace, Analytics, Settings, and Auto Generate behavior stable.

---

## Command Rules

- Use PowerShell commands.
- Prefer `rg` and `rg --files` for searching.
- Do not run destructive commands.
- Do not run deployment commands unless explicitly asked.
- Run `npm run build` only when asked or after important changes.
- If build is run, report whether it passed and mention only relevant warnings.

---

## Response Format For Codex

For inspection or planned work, respond with:

1. Root cause / critique
2. Exact files involved
3. Minimal patch plan
4. Risks
5. Ask for approval

For completed patch work, respond with:

1. Files changed
2. Exact changes made
3. Verification result
4. Anything not done

Keep responses short, practical, and focused on the requested task.
