import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type TopicSuggestion = {
  title: string;
  description: string;
  primaryKeyword: string;
  seoPotential: string;
};

type ProjectContext = {
  id: string;
  name: string;
  websiteUrl: string;
  niche: string;
  category: string;
  location: string;
  tone: string;
  businessContext: string;
  targetTags: string;
};

type ContentBlock = {
  type: 'heading' | 'paragraph' | 'bullet_list' | 'quote';
  content: string | string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const contentWritingInstructions = `
Use a professional, simple, easy-to-read tone.
Structure each article with an introduction, clear main sections, an FAQ section before the conclusion, and a conclusion at the end.
Use clear headings, focused paragraphs, and bullet lists where helpful outside the FAQ section.
The FAQ heading must always be exactly "FAQ".
Each FAQ question must be plain heading text without markdown hash symbols and must be on its own line.
Use exactly three FAQ questions in this format:
1. What is [question]?
2. How does [question]?
3. Why is [question] important?
Place each FAQ answer as normal paragraph text below its question.
Each FAQ answer must be 2-3 short sentences.
Do not put FAQ questions and answers on the same line.
Do not use bullet points inside FAQ.
Do not bold FAQ questions or answers.
Do not include visible markdown characters such as "##" or "###".
Do not use alternate FAQ headings such as "FAQs about...".
The FAQ section must always appear before the Conclusion section.
The Conclusion heading must come after FAQ.
`.trim();

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `auto-post-${Date.now()}`;

const makeUniqueSlug = (baseSlug: string, usedSlugs: Set<string>) => {
  let nextSlug = makeSlug(baseSlug);
  let suffix = 2;

  while (usedSlugs.has(nextSlug)) {
    nextSlug = `${makeSlug(baseSlug)}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(nextSlug);
  return nextSlug;
};

const normalizeBlocks = (blocks: unknown[]): ContentBlock[] =>
  (Array.isArray(blocks) ? blocks : [])
    .filter((block: any) => ['heading', 'paragraph', 'bullet_list', 'quote'].includes(block?.type))
    .map((block: any) => ({
      type: block.type as ContentBlock['type'],
      content:
        block.type === 'bullet_list'
          ? Array.isArray(block.content)
            ? block.content
            : String(block.content || '').split('\n').filter(Boolean)
          : String(block.content || ''),
    }));

const stripMarkdownDecorators = (value: string) =>
  value
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

const getHeadingText = (value: string) =>
  stripMarkdownDecorators(value)
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

const isFaqHeading = (block: ContentBlock) =>
  block.type === 'heading' &&
  /^(faq|faqs|frequently asked questions)\b/i.test(getHeadingText(String(block.content)));

const isConclusionHeading = (block: ContentBlock) =>
  block.type === 'heading' &&
  /^conclusion\b/i.test(getHeadingText(String(block.content)));

const sentenceParts = (value: string) =>
  stripMarkdownDecorators(value)
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];

const normalizeFaqAnswer = (value: string | undefined, fallback: string) => {
  const sentences = sentenceParts(value || '').slice(0, 3);

  if (sentences.length >= 2) {
    return sentences.join(' ');
  }

  if (sentences.length === 1) {
    return `${sentences[0]} ${fallback}`;
  }

  return fallback;
};

const topicText = (title: string) =>
  stripMarkdownDecorators(title)
    .replace(/[.!?]+$/g, '')
    .trim() || 'this topic';

const defaultFaqQuestions = (title: string) => {
  const topic = topicText(title);
  return [
    `What is ${topic}?`,
    `How does ${topic} work?`,
    `Why is ${topic} important?`,
  ];
};

const defaultFaqAnswers = (title: string) => {
  const topic = topicText(title);
  return [
    `${topic} is the main subject covered in this article. It explains the key context in simple terms so readers can understand what matters before making decisions.`,
    `It works by connecting the topic to practical needs, common questions, and useful next steps. Readers can use the guidance to compare options and apply the ideas with more confidence.`,
    `It is important because it helps readers make informed choices and avoid common confusion. Clear information also supports better planning, stronger SEO value, and a more useful content experience.`,
  ];
};

const normalizeFaqQuestion = (index: number, title: string) =>
  `${index + 1}. ${defaultFaqQuestions(title)[index]}`;

const extractFaqPairs = (blocks: ContentBlock[]) => {
  const pairs: Array<{ question?: string; answer?: string }> = [];
  let activeIndex = -1;

  for (const block of blocks) {
    if (block.type === 'heading' && !isFaqHeading(block) && !isConclusionHeading(block)) {
      if (pairs.length >= 3) continue;
      pairs.push({ question: String(block.content) });
      activeIndex = pairs.length - 1;
      continue;
    }

    if (block.type === 'paragraph' && activeIndex >= 0 && !pairs[activeIndex].answer) {
      pairs[activeIndex].answer = String(block.content);
    }
  }

  return pairs;
};

const normalizeFaqStructure = (blocks: ContentBlock[], title: string) => {
  const faqStart = blocks.findIndex(isFaqHeading);
  const faqEnd = faqStart >= 0
    ? blocks.findIndex((block, index) => index > faqStart && isConclusionHeading(block))
    : -1;
  const faqSource = faqStart >= 0
    ? blocks.slice(faqStart + 1, faqEnd >= 0 ? faqEnd : blocks.length)
    : [];
  const faqPairs = extractFaqPairs(faqSource);

  const withoutFaq = faqStart >= 0
    ? [
        ...blocks.slice(0, faqStart),
        ...(faqEnd >= 0 ? blocks.slice(faqEnd) : []),
      ]
    : blocks;

  const conclusionStart = withoutFaq.findIndex(isConclusionHeading);
  const beforeConclusion = conclusionStart >= 0 ? withoutFaq.slice(0, conclusionStart) : withoutFaq;
  const conclusionBlocks = conclusionStart >= 0
    ? [
        { type: 'heading', content: '## Conclusion' } as ContentBlock,
        ...withoutFaq.slice(conclusionStart + 1),
      ]
    : [
        { type: 'heading', content: '## Conclusion' } as ContentBlock,
        {
          type: 'paragraph',
          content: `In conclusion, ${topicText(title)} is easier to understand when the key points are organized clearly. Use these insights as a practical starting point for better decisions and future content planning.`,
        } as ContentBlock,
      ];

  const fallbackAnswers = defaultFaqAnswers(title);
  const faqBlocks: ContentBlock[] = [{ type: 'heading', content: 'FAQ' }];

  for (let index = 0; index < 3; index += 1) {
    faqBlocks.push({
      type: 'heading',
      content: normalizeFaqQuestion(index, title),
    });
    faqBlocks.push({
      type: 'paragraph',
      content: normalizeFaqAnswer(faqPairs[index]?.answer, fallbackAnswers[index]),
    });
  }

  return [
    ...beforeConclusion,
    ...faqBlocks,
    ...conclusionBlocks,
  ];
};

const getScheduleForIndex = (index: number, latestPublishAt?: string | null) => {
  const nextDate = latestPublishAt ? new Date(latestPublishAt) : new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() + index + 1);
  const dubaiDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nextDate);

  return `${dubaiDate}T09:00:00+04:00`;
};

const resolveCategoryIds = async (
  supabase: any,
  projectId: string,
  categoryName: string,
) => {
  const name = categoryName.trim();
  if (!name) return [];

  const slug = makeSlug(name);
  const { data: categories, error: fetchError } = await supabase
    .from('categories')
    .select('id,name,slug')
    .eq('project_id', projectId);

  if (fetchError) throw fetchError;

  const existing = (categories || []).find((category: any) =>
    String(category.slug || '').toLowerCase() === slug ||
    String(category.name || '').trim().toLowerCase() === name.toLowerCase()
  );

  if (existing?.id) return [existing.id];

  const { data: inserted, error: insertError } = await supabase
    .from('categories')
    .insert({
      project_id: projectId,
      name,
      slug,
      description: `Auto-created category for ${name}.`,
      status: 'active',
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return inserted?.id ? [inserted.id] : [];
};

const callOpenAiJson = async (prompt: string) => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY Supabase Secret is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
      temperature: 0.75,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. Do not include markdown fences or commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `OpenAI request failed with status ${response.status}`);
  }

  const payload = JSON.parse(text);
  return JSON.parse(payload?.choices?.[0]?.message?.content || '{}');
};

const normalizeSuggestionTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const filterUniqueSuggestions = (suggestions: unknown[], excludeTitles: string[], limit: number) => {
  const seen = new Set(excludeTitles.map(normalizeSuggestionTitle).filter(Boolean));
  const uniqueSuggestions = [];

  for (const suggestion of suggestions) {
    const item = suggestion as Record<string, unknown>;
    const title = String(item?.title || '').trim();
    const normalized = normalizeSuggestionTitle(title);

    if (!title || !normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    uniqueSuggestions.push(item);

    if (uniqueSuggestions.length >= limit) break;
  }

  return uniqueSuggestions;
};

const buildSuggestionPrompt = (context: ProjectContext, count: number, excludeTitles: string[]) => `
Generate ${count} high-quality SEO blog topic suggestion${count === 1 ? '' : 's'}.

Project context:
- Business name: ${context.name || 'Selected project'}
- Website: ${context.websiteUrl || 'Not provided'}
- Niche: ${context.niche || 'Not provided'}
- Category: ${context.category || 'Not provided'}
- Location: ${context.location || 'Not provided'}
- Tone: ${context.tone || 'Professional'}
- Business context: ${context.businessContext || 'Not provided'}
- Target tags: ${context.targetTags || 'Not provided'}
- Exclude these titles: ${excludeTitles.length ? excludeTitles.join(' | ') : 'None'}

Each topic must be search-intent driven, specific, non-duplicative, and useful for an SEO blog calendar.
Do not repeat, closely paraphrase, or reuse the same angle as any excluded title.
If an excluded title covers a topic, choose a clearly different keyword, search intent, and article angle.

Return JSON:
{
  "suggestions": [
    {
      "title": "Topic title",
      "description": "One short sentence explaining the angle.",
      "primaryKeyword": "main keyword",
      "seoPotential": "High/Medium plus a short reason"
    }
  ]
}
`.trim();

const buildArticlePrompt = (context: ProjectContext, suggestion: TopicSuggestion) => `
Generate one complete SEO-optimized blog article for the selected project.

Content-writing rules:
${contentWritingInstructions}

Article topic:
- Title: ${suggestion.title}
- Short description: ${suggestion.description}
- Primary keyword: ${suggestion.primaryKeyword}
- SEO potential: ${suggestion.seoPotential}

Project context:
- Business name: ${context.name || 'Selected project'}
- Website: ${context.websiteUrl || 'Not provided'}
- Niche: ${context.niche || 'Not provided'}
- Category: ${context.category || 'Not provided'}
- Location: ${context.location || 'Not provided'}
- Tone: ${context.tone || 'Professional'}
- Business context: ${context.businessContext || 'Not provided'}
- Target tags: ${context.targetTags || 'Not provided'}

Return JSON:
{
  "title_en": "English title",
  "title_ar": "Arabic title",
  "slug": "english-url-slug",
  "excerpt_en": "Short English excerpt",
  "excerpt_ar": "Short Arabic excerpt",
  "focus_keyword": "Primary SEO keyword",
  "seo_title": "SEO title under 65 characters",
  "meta_description": "Meta description under 160 characters",
  "target_tags": ["tag one", "tag two"],
  "content_blocks_en": [
    { "type": "paragraph", "content": "Intro paragraph" },
    { "type": "heading", "content": "Section heading" },
    { "type": "bullet_list", "content": ["List item"] },
    { "type": "heading", "content": "FAQ" },
    { "type": "heading", "content": "1. What is the topic?" },
    { "type": "paragraph", "content": "Answer in 2-3 short sentences. Keep it concise and practical." },
    { "type": "heading", "content": "2. How does the topic work?" },
    { "type": "paragraph", "content": "Answer in 2-3 short sentences. Keep it concise and practical." },
    { "type": "heading", "content": "3. Why is the topic important?" },
    { "type": "paragraph", "content": "Answer in 2-3 short sentences. Keep it concise and practical." },
    { "type": "heading", "content": "## Conclusion" },
    { "type": "paragraph", "content": "Conclusion paragraph" }
  ],
  "content_blocks_ar": [
    { "type": "paragraph", "content": "Arabic intro paragraph" }
  ]
}
`.trim();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Supabase function environment is missing database credentials.' }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (_error) {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
    }

    const action = String(body.action || '');
    const projectId = String(body.projectId || '');

    if (!['generate_suggestions', 'replace_suggestion', 'generate_articles'].includes(action)) {
      return jsonResponse({ error: 'Invalid action.' }, 400);
    }

    if (!projectId) {
      return jsonResponse({ error: 'projectId is required.' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: 'ag_long_form_content' },
    });

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return jsonResponse({ error: projectError?.message || 'Project not found.' }, 404);
    }

    const targetTags = Array.isArray(project.target_tags)
      ? project.target_tags.join(', ')
      : String(project.target_tags || '');

    const context: ProjectContext = {
      id: project.id,
      name: project.name || '',
      websiteUrl: project.website_url || '',
      niche: String(body.nicheOverride || project.niche || ''),
      category: project.category || '',
      location: String(body.locationOverride || project.target_location || ''),
      tone: project.tone || 'Professional',
      businessContext: project.business_context || project.settings_metadata?.business_context || '',
      targetTags,
    };

    if (action === 'generate_suggestions' || action === 'replace_suggestion') {
      const count = action === 'replace_suggestion' ? 1 : 12;
      const excludeTitles = Array.isArray(body.excludeTitles) ? body.excludeTitles.map(String) : [];
      const requestedCount = action === 'replace_suggestion' ? 5 : 18;
      const result = await callOpenAiJson(buildSuggestionPrompt(context, requestedCount, excludeTitles));
      const suggestions = filterUniqueSuggestions(
        Array.isArray(result.suggestions) ? result.suggestions : [],
        excludeTitles,
        count
      );

      if (action === 'replace_suggestion') {
        return jsonResponse({ suggestion: suggestions[0] || null });
      }

      return jsonResponse({ suggestions });
    }

    const approvedSuggestions = Array.isArray(body.suggestions)
      ? body.suggestions.slice(0, 7)
      : [];

    if (approvedSuggestions.length === 0) {
      return jsonResponse({ error: 'At least one approved suggestion is required.' }, 400);
    }

    const { data: existingPosts } = await supabase
      .from('content_posts')
      .select('slug,publish_at')
      .eq('project_id', projectId)
      .order('publish_at', { ascending: false, nullsFirst: false });
    const usedSlugs = new Set((existingPosts || []).map((post: any) => post.slug));
    const latestPublishAt = (existingPosts || []).find((post: any) => post.publish_at)?.publish_at || null;
    const articles = [];

    for (const [index, suggestion] of approvedSuggestions.entries()) {
      try {
        const result = await callOpenAiJson(buildArticlePrompt(context, suggestion));
        const title = String(result.title_en || suggestion.title || '').trim();
        const slug = makeUniqueSlug(String(result.slug || title), usedSlugs);
        const publishAt = getScheduleForIndex(index, latestPublishAt);
        const categoryIds = await resolveCategoryIds(
          supabase,
          projectId,
          context.category || suggestion.primaryKeyword || context.niche || 'General'
        );
        const contentBlocksEn = normalizeFaqStructure(
          normalizeBlocks(result.content_blocks_en || result.blocks_en || []),
          title
        );
        const contentBlocksAr = normalizeBlocks(result.content_blocks_ar || result.blocks_ar || []);

        const { data: inserted, error: insertError } = await supabase
          .from('content_posts')
          .insert({
            project_id: projectId,
            content_type: 'blog',
            category_ids: categoryIds,
            title_en: title,
            title_ar: String(result.title_ar || ''),
            slug,
            excerpt_en: String(result.excerpt_en || suggestion.description || ''),
            excerpt_ar: String(result.excerpt_ar || ''),
            status: 'scheduled',
            publish_at: publishAt,
            featured_image_url: `https://picsum.photos/seed/${encodeURIComponent(slug)}/800/400`,
            focus_keyword: String(result.focus_keyword || suggestion.primaryKeyword || ''),
            seo_title: String(result.seo_title || title).slice(0, 80),
            meta_description: String(result.meta_description || suggestion.description || '').slice(0, 180),
            tags: Array.isArray(result.target_tags) ? result.target_tags : [],
            content_blocks_en: contentBlocksEn,
            content_blocks_ar: contentBlocksAr,
            generation_metadata: {
              source: 'auto-generate-content',
              primaryKeyword: suggestion.primaryKeyword || '',
              seoPotential: suggestion.seoPotential || '',
              categoryIds,
            },
            review_metadata: {},
            metadata: {},
          })
          .select('id,title_en,status,publish_at')
          .single();

        if (insertError) throw insertError;

        articles.push({
          id: inserted.id,
          title: inserted.title_en,
          status: inserted.status,
          publishAt: inserted.publish_at,
        });
      } catch (error) {
        articles.push({
          id: crypto.randomUUID(),
          title: String(suggestion.title || 'Failed article'),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Article generation failed.',
        });
      }
    }

    return jsonResponse({
      articles,
      scheduledCount: articles.filter((article) => article.status === 'scheduled').length,
      skippedCount: Array.isArray(body.suggestions) && body.suggestions.length > 7 ? body.suggestions.length - 7 : 0,
    });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unexpected auto generation error.',
    }, 500);
  }
});
