
// pages/Editor.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Calendar,
  Heading as HeadingIcon,
  Type as TypeIcon,
  List,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Settings,
  Sparkles,
  Loader2,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  Clock,
  X,
  Check,
  Zap,
  BookOpen,
} from "lucide-react";

import { Post, ContentBlock, SEOData, PostStatus, Project, Category } from "../types";
import { supabase } from "../supabaseClient";
import contentWritingSkill from "../skills/content-writing.md?raw";

interface EditorProps {
  post: Post | null;
  project: Project;
  categories: Category[];
  onSave: (post: Post) => void;
  onCancel: () => void;
}

interface SuggestedTopic {
  id: string;
  label: string;
  prompt: string;
  icon: any;
}

const buildContentGenerationPrompt = ({
  title,
  project,
}: {
  title: string;
  project: Project;
}) => `
You are generating a complete blog post for the selected project.

Reusable content-writing skill instructions:
${contentWritingSkill}

Use the skill instructions as the single source of truth for content structure
and writing style. Apply them to the generated English and Arabic blog content.

Post title: ${title}
Project context:
- Name: ${project.name}
- Niche: ${project.niche}
- Location: ${project.location}
- Tone: ${project.tone}

Output requirements:
- Treat the post title as the H1.
- Use generated heading blocks for H2/H3-style sections.
- Include short readable paragraphs.
- Include bullet_list blocks where helpful.
- Include an FAQ section before the conclusion.
- Keep the conclusion as the final section.
`.trim();

const normalizeBlockContent = (block: any) =>
  block?.type === 'bullet_list'
    ? (typeof block.content === 'string' ? block.content.split('\n').filter((l: string) => l.trim().length > 0) : block.content)
    : block?.content;

const createContentBlock = (type: ContentBlock["type"], content: string | string[]): ContentBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  content,
});

const normalizeCategoryValue = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const isHeadingBlock = (block: ContentBlock, pattern: RegExp) =>
  block.type === "heading" && typeof block.content === "string" && pattern.test(block.content);

const defaultFaqBlocks = (title: string, lang: "en" | "ar"): ContentBlock[] => {
  if (lang === "ar") {
    return [
      createContentBlock("heading", "الأسئلة الشائعة"),
      createContentBlock("heading", "ما أهم نقطة يجب تذكرها؟"),
      createContentBlock("paragraph", `أهم نقطة هي تطبيق النصائح المناسبة من موضوع "${title}" بشكل تدريجي وبسيط.`),
      createContentBlock("heading", "كيف أبدأ بخطوات عملية؟"),
      createContentBlock("paragraph", "ابدأ بخطوة واضحة واحدة، ثم راجع النتائج وعدل خطتك حسب الحاجة."),
    ];
  }

  return [
    createContentBlock("heading", "FAQ"),
    createContentBlock("heading", `What should I remember about ${title}?`),
    createContentBlock("paragraph", "Focus on the most practical steps first, then build consistency as you learn what works best."),
    createContentBlock("heading", "How can I apply this advice?"),
    createContentBlock("paragraph", "Start with one clear action, review your progress, and adjust your approach when needed."),
  ];
};

const ensureSkillStructure = (blocks: ContentBlock[], title: string, lang: "en" | "ar") => {
  const faqPattern = lang === "ar" ? /الأسئلة|شائعة/i : /\bfaq\b|frequently asked questions/i;
  const conclusionPattern = lang === "ar" ? /الخاتمة|ختام|النتيجة/i : /\bconclusion\b|final thoughts/i;
  const hasFaq = blocks.some((block) => isHeadingBlock(block, faqPattern));
  const conclusionIndex = blocks.findIndex((block) => isHeadingBlock(block, conclusionPattern));
  const conclusionBlocks = conclusionIndex >= 0 ? blocks.slice(conclusionIndex) : [];
  const mainBlocks = conclusionIndex >= 0 ? blocks.slice(0, conclusionIndex) : blocks;
  const faqBlocks = hasFaq ? [] : defaultFaqBlocks(title, lang);

  if (conclusionBlocks.length > 0) {
    return [...mainBlocks, ...faqBlocks, ...conclusionBlocks];
  }

  return [
    ...mainBlocks,
    ...faqBlocks,
    createContentBlock("heading", lang === "ar" ? "الخاتمة" : "Conclusion"),
    createContentBlock(
      "paragraph",
      lang === "ar"
        ? `يوضح هذا الموضوع أن "${title}" يحتاج إلى فهم واضح وخطوات عملية يمكن تطبيقها بثبات.`
        : `${title} becomes easier to understand and apply when the key ideas are organized into clear, practical steps.`
    ),
  ];
};

const Editor: React.FC<EditorProps> = ({ post, project, categories, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<"info" | "en" | "ar" | "seo">("info");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------
  // UI States
  // ---------------------------
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ---------------------------
  // Suggestions State
  // ---------------------------
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // ---------------------------
  // Basic Info State
  // ---------------------------
  const [title, setTitle] = useState(post?.title || "");
  const [titleAr, setTitleAr] = useState(post?.titleAr || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [excerptAr, setExcerptAr] = useState(post?.excerptAr || "");
  
  // Specific Context (Overrides)
  const [blogNiche, setBlogNiche] = useState("");
  const [blogLocation, setBlogLocation] = useState("");

  // Multi Category Selection
  const getDefaultCategoryIds = () => {
    if (post?.categoryIds?.length) return post.categoryIds;
    if (post?.categoryId) return [post.categoryId];

    const projectCategory = normalizeCategoryValue(project.category || "");
    const matchedProjectCategory = projectCategory
      ? categories.find((category) =>
          normalizeCategoryValue(category.name) === projectCategory ||
          normalizeCategoryValue(category.slug) === projectCategory
        )
      : null;

    return matchedProjectCategory ? [matchedProjectCategory.id] : categories[0] ? [categories[0].id] : [];
  };

  const [categoryIds, setCategoryIds] = useState<string[]>(
    getDefaultCategoryIds
  );
  const didApplyDefaultCategoryRef = useRef(false);

  useEffect(() => {
    if (post || didApplyDefaultCategoryRef.current || categoryIds.length > 0 || categories.length === 0) return;

    const defaults = getDefaultCategoryIds();
    if (defaults.length > 0) {
      setCategoryIds(defaults);
      didApplyDefaultCategoryRef.current = true;
    }
  }, [post, categories, project.category, categoryIds.length]);
  
  const [tags, setTags] = useState(post?.tags?.join(", ") || "");
  const [image, setImage] = useState(post?.image || "https://picsum.photos/seed/newpost/800/400");

  // ---------------------------
  // Scheduling State
  // ---------------------------
  const [publishDate, setPublishDate] = useState(() => {
    const dt = post?.publishAt ? new Date(post.publishAt) : new Date();
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(dt);
  });

  const [publishTime, setPublishTime] = useState(() => {
    const dt = post?.publishAt ? new Date(post.publishAt) : new Date();
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dt);
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // ---------------------------
  // Blocks State
  // ---------------------------
  const [blocksEn, setBlocksEn] = useState<ContentBlock[]>(post?.blocksEn || []);
  const [blocksAr, setBlocksAr] = useState<ContentBlock[]>(post?.blocksAr || []);

  // ---------------------------
  // SEO State
  // ---------------------------
  const [seo, setSeo] = useState<SEOData>(
    post?.seo || {
      focusKeyword: "",
      seoTitle: "",
      metaDescription: "",
    }
  );

  // ---------------------------
  // Analytics / Readability Logic
  // ---------------------------
  const readabilityChecks = useMemo(() => {
    const text = blocksEn.map(b => (Array.isArray(b.content) ? b.content.join(" ") : b.content)).join(" ");
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const paragraphs = blocksEn.filter(b => b.type === 'paragraph');
    const headings = blocksEn.filter(b => b.type === 'heading');
    const lists = blocksEn.filter(b => b.type === 'bullet_list');

    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    return [
      { id: "sent_len", label: "Sentence Length", pass: avgSentenceLength > 0 && avgSentenceLength <= 20, detail: `${Math.round(avgSentenceLength)} words avg` },
      { id: "para_len", label: "Paragraph Flow", pass: paragraphs.length >= 3, detail: `${paragraphs.length} paragraphs` },
      { id: "headings", label: "Structure (H2/H3)", pass: headings.length >= 2, detail: `${headings.length} headings` },
      { id: "bullets", label: "Scannability (Lists)", pass: lists.length >= 1, detail: lists.length > 0 ? "Uses lists" : "No lists" },
      { id: "content_len", label: "Comprehensive Content", pass: words.length >= 300, detail: `${words.length} words` },
    ];
  }, [blocksEn]);

  const seoHealthChecks = useMemo(() => {
    const checks: { id: string; label: string; pass: boolean }[] = [];
    checks.push({ id: "title", label: "SEO Title", pass: seo.seoTitle.length >= 20 });
    checks.push({ id: "desc", label: "Meta Description", pass: seo.metaDescription.length >= 60 });
    checks.push({ id: "keyword", label: "Focus Keyword", pass: seo.focusKeyword.trim().length > 0 });
    checks.push({ id: "image", label: "Featured Image", pass: !!image });
    return checks;
  }, [seo, image]);

  const qualityScore = useMemo(() => {
    const allChecks = [...seoHealthChecks, ...readabilityChecks];
    return Math.round((allChecks.filter((c) => c.pass).length / allChecks.length) * 100);
  }, [seoHealthChecks, readabilityChecks]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const showSuccessToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Restored Edge Function Architecture
  const callEdgeFunction = async (functionName: string, payload: any) => {
    const supabaseUrl = 'https://srzykvorflqwtpigcttc.supabase.co';
    const url = `${supabaseUrl}/functions/v1/${functionName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Edge function failed: ${res.status}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  useEffect(() => {
    if (!post && title) {
      setSlug(title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
    }
  }, [title, post]);

  // Suggestions logic using blog override fallbacks
  const fetchSuggestions = async () => {
    if (post) return;
    
    const targetNiche = blogNiche || project.niche;
    const targetLocation = blogLocation || project.location;

    if (!targetNiche || !targetLocation) {
      setSuggestedTopics([]);
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const data = await callEdgeFunction("pollinations-generate", {
        niche: targetNiche,
        location: targetLocation,
        excludeTitles: suggestedTopics.map(t => t.prompt)
      });
      
      const icons = [TrendingUp, Sparkles, Zap, Globe];
      const formatted = (Array.isArray(data) ? data : []).map((item: any, idx: number) => ({
        id: `suggestion-${idx}-${Date.now()}`,
        label: item?.label || `Idea ${idx + 1}`,
        prompt: item?.prompt || "",
        icon: icons[idx % icons.length],
      }));
      setSuggestedTopics(formatted);
    } catch (e) {
      console.error("Failed to generate suggestions", e);
      setSuggestedTopics([]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleUploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File is too large. Maximum size allowed is 5MB.");
      return;
    }
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${project.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("blog-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        setImage(publicUrlData.publicUrl);
        showSuccessToast("Image uploaded successfully!");
      }
    } catch (error: any) {
      console.error("Featured image upload fatal error:", error);
      alert("Failed to upload image: " + (error.message || "Unknown error"));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Full Blog generation logic using Edge Function and fallbacks
  const generateFullPost = async () => {
    if (!title) return alert("Please enter a topic or select a suggestion.");
    
    const targetNiche = blogNiche || project.niche;
    const targetLocation = blogLocation || project.location;

    setIsGeneratingContent(true);
    try {
      const basePromptProject = {
        ...project,
        niche: targetNiche,
        location: targetLocation,
      };
      const contentGenerationPrompt = buildContentGenerationPrompt({
        title,
        project: basePromptProject,
      });
      const promptProject = {
        ...basePromptProject,
        tone: `${project.tone}\n\nContent writing skill instructions:\n${contentWritingSkill}`,
        contentWritingSkill,
        contentGenerationPrompt,
      };

      const result = await callEdgeFunction("pollinations-generate-post", {
        title,
        prompt: contentGenerationPrompt,
        instructions: contentWritingSkill,
        project: promptProject,
        contentWritingSkill,
        systemPrompt: contentGenerationPrompt,
        contentGenerationPrompt,
      });
      
      setTitle(result.title_en || title);
      setTitleAr(result.title_ar || "");
      setSlug(result.slug || slug);
      setExcerpt(result.excerpt_en || "");
      setExcerptAr(result.excerpt_ar || "");
      setTags(result.tags?.join(", ") || "");
      setSeo({
        focusKeyword: result.focus_keyword || "",
        seoTitle: result.seo_title || "",
        metaDescription: result.meta_description || "",
      });

      const mapBlocks = (bs: any[]) =>
        (Array.isArray(bs) ? bs : []).map((b: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: b.type as any,
          content: normalizeBlockContent(b),
        }));

      if (result.blocks_en) setBlocksEn(ensureSkillStructure(mapBlocks(result.blocks_en), result.title_en || title, "en"));
      if (result.blocks_ar) setBlocksAr(ensureSkillStructure(mapBlocks(result.blocks_ar), result.title_ar || title, "ar"));
      setActiveTab("en");
      showSuccessToast("AI content generated successfully!");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert("AI content generation failed: " + (error.message || "Unknown error"));
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAction = async (status: PostStatus) => {
    if (categoryIds.length === 0) {
      return alert("Please select at least one category.");
    }

    const combinedPublishAt = `${publishDate}T${publishTime}:00+04:00`;
    const selectedCategoryNames = categoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];

    const finalPost: Post = {
      id: post?.id || Math.random().toString(36).substr(2, 9),
      projectId: project.id,
      categoryId: categoryIds[0],
      categoryIds: categoryIds,    
      title,
      titleAr,
      slug,
      content: blocksEn
        .map((b) => (Array.isArray(b.content) ? b.content.join("\n") : b.content))
        .join("\n"),
      excerpt,
      excerptAr,
      status,
      category: selectedCategoryNames.join(", "),
      author: post?.author || "Admin User",
      date: publishDate,
      publishAt: combinedPublishAt,
      image,
      seo,
      blocksEn,
      blocksAr,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    };

    if (status === "Published") {
      setIsPublishing(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPublishing(false);
      showSuccessToast("Post published successfully!");
    } else if (status === "Scheduled") {
      setIsScheduleModalOpen(false);
      showSuccessToast(`Scheduled for ${publishDate} at ${publishTime}`);
    } else {
      showSuccessToast("Draft saved successfully!");
    }

    onSave(finalPost);
  };

  const toggleCategory = (id: string) => {
    setCategoryIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const renderBlockInputs = (block: ContentBlock, lang: "en" | "ar") => {
    const isRtl = lang === "ar";
    const setter = lang === "en" ? setBlocksEn : setBlocksAr;
    const blocks = lang === "en" ? blocksEn : blocksAr;
    const updateContent = (content: string | string[]) =>
      setter(blocks.map((b) => (b.id === block.id ? { ...b, content } : b)));

    switch (block.type) {
      case "heading":
        return (
          <input
            className="w-full text-xl font-bold text-black placeholder:text-slate-300 bg-white focus:outline-none"
            value={block.content as string}
            onChange={(e) => updateContent(e.target.value)}
            placeholder={isRtl ? "عنوان..." : "Heading content..."}
            dir={isRtl ? "rtl" : "ltr"}
          />
        );
      case "bullet_list":
        return (
          <textarea
            className="w-full text-black placeholder:text-slate-300 bg-white focus:outline-none resize-none min-h-[80px]"
            value={Array.isArray(block.content) ? block.content.join("\n") : (block.content as any)}
            onChange={(e) => updateContent(e.target.value.split("\n"))}
            placeholder={isRtl ? "قائمة العناصر..." : "List items (one per line)..."}
            dir={isRtl ? "rtl" : "ltr"}
          />
        );
      case "paragraph":
        return (
          <textarea
            className="w-full text-black placeholder:text-slate-300 bg-white focus:outline-none resize-none min-h-[100px]"
            value={block.content as string}
            onChange={(e) => updateContent(e.target.value)}
            placeholder={isRtl ? "ابدأ الكتابة..." : "Start writing content..."}
            dir={isRtl ? "rtl" : "ltr"}
          />
        );
      case "image":
        return (
          <input
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 text-black placeholder:text-slate-400"
            value={block.content as string}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="Image URL..."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500 relative bg-[#F8FAFC]">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            <div className="bg-emerald-500 p-1 rounded-full">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {(isGeneratingContent || isPublishing) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="w-20 h-20 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{isPublishing ? "Pushing Live..." : "AI Content Wizard..."}</h3>
              <p className="text-slate-500 text-sm">{isPublishing ? `Syncing with Supabase` : `Drafting comprehensive bilingual content...`}</p>
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Schedule Post</h3>
                <p className="text-slate-500 text-xs mt-1">Set a future publication date and time</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Publication Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-black font-medium"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Publication Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-black font-medium"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => handleAction("Scheduled")}
                  className="flex-1 py-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{post ? "Edit Post" : "New Content Post"}</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Project: {project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleAction("Draft")} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">
            Save Draft
          </button>
          <button onClick={() => setIsScheduleModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button onClick={() => handleAction("Published")} className="px-5 py-2.5 bg-[#6366F1] text-white rounded-xl font-bold hover:bg-[#4F46E5] transition-all text-sm flex items-center gap-2 shadow-lg shadow-indigo-100">
            <Send className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex bg-[#F1F5F9] p-1 gap-1 mx-6 mt-6 rounded-xl">
            {[
              { id: "info", label: "Basic Info" },
              { id: "en", label: "Content (EN)" },
              { id: "ar", label: "Content (AR)" },
              { id: "seo", label: "SEO / Readability" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg ${
                  activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === "info" && (
              <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
                {/* Specific Context inputs preserved */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Specific Content Niche</label>
                    <input
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                      placeholder={project.niche || "Override project niche..."}
                      value={blogNiche}
                      onChange={(e) => setBlogNiche(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Specific Content Location</label>
                    <input
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                      placeholder={project.location || "Override project location..."}
                      value={blogLocation}
                      onChange={(e) => setBlogLocation(e.target.value)}
                    />
                  </div>
                  <div className="col-span-full pt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      * If left blank, AI uses project default: <span className="text-indigo-500">{project.niche} / {project.location}</span>
                    </p>
                  </div>
                </div>

                {!post && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        AI Suggested Topics
                      </h3>
                      <button
                        onClick={fetchSuggestions}
                        disabled={isGeneratingSuggestions}
                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50"
                      >
                        {isGeneratingSuggestions ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />Generating…</>
                        ) : (
                          <><Sparkles className="w-3 h-3" />Generate</>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {suggestedTopics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => {
                            setTitle(topic.prompt);
                            setSlug(topic.prompt.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 text-left"
                        >
                          <topic.icon className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 line-clamp-2">
                            {topic.label}
                          </span>
                        </button>
                      ))}
                      {!isGeneratingSuggestions && suggestedTopics.length === 0 && (
                        <div className="col-span-full py-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Click “Generate” to load AI suggestions based on niche/location context
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
                  <button
                    onClick={generateFullPost}
                    disabled={isGeneratingContent || !title}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Full Post with AI
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Title (English) *</label>
                    <input
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-black placeholder:text-slate-400"
                      placeholder="Blog post title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 text-right block">Title (Arabic)</label>
                    <input
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-black placeholder:text-slate-400 text-right"
                      placeholder="عنوان المقال"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Slug *</label>
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-xs bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                    <Globe className="w-4 h-4" />
                    <input className="bg-transparent border-none outline-none flex-1 text-black font-sans" value={slug} onChange={(e) => setSlug(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Excerpt (English)</label>
                    <textarea
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none min-h-[100px] text-black placeholder:text-slate-400 resize-none"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 text-right block">Excerpt (Arabic)</label>
                    <textarea
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none min-h-[100px] text-black placeholder:text-slate-400 text-right resize-none"
                      value={excerptAr}
                      onChange={(e) => setExcerptAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Select Categories *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                    {categories.map((cat) => (
                      <label 
                        key={cat.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          categoryIds.includes(cat.id) 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={categoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          categoryIds.includes(cat.id) ? "bg-white border-white" : "bg-slate-100 border-slate-200"
                        }`}>
                          {categoryIds.includes(cat.id) && <Check className="w-3 h-3 text-indigo-600" />}
                        </div>
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                      </label>
                    ))}
                    {categories.length === 0 && (
                      <div className="col-span-full py-4 text-center text-slate-400 text-xs italic">
                        No categories found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
                  <input
                    className="w-full px-5 py-3 bg-white border rounded-xl border-slate-200 focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="keyword1, keyword2..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Featured Image *</label>
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-all"
                    >
                      {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {isUploadingImage ? "Uploading..." : "Upload from Computer"}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleUploadFeaturedImage} />
                  </div>
                  <div className="space-y-4">
                    <input
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                      placeholder="Or paste image URL here"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                    {image ? (
                      <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group bg-slate-50">
                        <img src={image} alt="Featured" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button onClick={() => setImage("")} className="p-4 bg-rose-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-transform shadow-xl">
                            <Trash2 className="w-4 h-4" /> Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-bold">No featured image provided</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "en" || activeTab === "ar") && (
              <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Content Blocks ({activeTab === "en" ? "English" : "Arabic"})</h3>
                    <p className="text-sm text-slate-400">Build your blog content using headings, paragraphs, and bullet lists</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={() =>
                      (activeTab === "en" ? setBlocksEn : setBlocksAr)([
                        ...(activeTab === "en" ? blocksEn : blocksAr),
                        { id: Math.random().toString(36).substr(2, 9), type: "heading", content: "" },
                      ])
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-500 transition-all text-sm shadow-sm"
                  >
                    <HeadingIcon className="w-4 h-4" /> Add Heading
                  </button>
                  <button
                    onClick={() =>
                      (activeTab === "en" ? setBlocksEn : setBlocksAr)([
                        ...(activeTab === "en" ? blocksEn : blocksAr),
                        { id: Math.random().toString(36).substr(2, 9), type: "paragraph", content: "" },
                      ])
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-500 transition-all text-sm shadow-sm"
                  >
                    <TypeIcon className="w-4 h-4" /> Add Paragraph
                  </button>
                  <button
                    onClick={() =>
                      (activeTab === "en" ? setBlocksEn : setBlocksAr)([
                        ...(activeTab === "en" ? blocksEn : blocksAr),
                        { id: Math.random().toString(36).substr(2, 9), type: "bullet_list", content: [] },
                      ])
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E0F2FE] text-[#0369A1] rounded-xl font-bold hover:bg-[#BAE6FD] transition-all text-sm shadow-sm"
                  >
                    <List className="w-4 h-4" /> Add Bullet List
                  </button>
                </div>
                <div className="space-y-4">
                  {(activeTab === "en" ? blocksEn : blocksAr).map((block) => (
                    <div key={block.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-400 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{block.type}</div>
                        <button
                          onClick={() =>
                            (activeTab === "en" ? setBlocksEn : setBlocksAr)((activeTab === "en" ? blocksEn : blocksAr).filter((b) => b.id !== block.id))
                          }
                          className="text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {renderBlockInputs(block, activeTab as any)}
                    </div>
                  ))}
                  {(activeTab === "en" ? blocksEn : blocksAr).length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-slate-400 font-medium">No content blocks yet. Add headings, paragraphs, or bullet lists above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-slate-50 border border-slate-100 p-8 rounded-[2rem] shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" /> Readability Analysis
                    </h3>
                    <div className="space-y-4">
                      {readabilityChecks.map((check) => (
                        <div key={check.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-indigo-300 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${check.pass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                              {check.pass ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{check.label}</div>
                              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{check.detail}</div>
                            </div>
                          </div>
                          <div className={`text-xs font-black uppercase tracking-widest ${check.pass ? 'text-emerald-500' : 'text-rose-400'}`}>
                            {check.pass ? 'Good' : 'Improve'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800">SEO Configuration</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Focus Keyword</label>
                        <input
                          className="w-full px-5 py-3 bg-white border rounded-xl border-slate-200 focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                          value={seo.focusKeyword}
                          onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">SEO Title</label>
                        <input
                          className="w-full px-5 py-3 bg-white border rounded-xl border-slate-200 focus:border-indigo-500 outline-none text-black placeholder:text-slate-400"
                          value={seo.seoTitle}
                          onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Meta Description</label>
                        <textarea
                          className="w-full px-5 py-3 bg-white border rounded-xl border-slate-200 focus:border-indigo-500 outline-none min-h-[120px] resize-none text-black placeholder:text-slate-400"
                          value={seo.metaDescription}
                          onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#6366F1]" /> Content Health Score
            </h3>
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="62" className="stroke-slate-100 fill-none" strokeWidth="10" />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    className={`fill-none transition-all duration-1000 ${
                      qualityScore > 75 ? "stroke-[#10B981]" : qualityScore > 40 ? "stroke-[#F59E0B]" : "stroke-[#F43F5E]"
                    }`}
                    strokeWidth="10"
                    strokeDasharray={`${qualityScore * 3.89} 389`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800">{qualityScore}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Percent</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failing Checks</div>
              {[...seoHealthChecks, ...readabilityChecks].filter(c => !c.pass).length === 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Perfect Content Optimization</span>
                </div>
              ) : (
                [...seoHealthChecks, ...readabilityChecks].filter(c => !c.pass).slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="p-1.5 rounded-lg text-rose-400 bg-rose-50">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{c.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
