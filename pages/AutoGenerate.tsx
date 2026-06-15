import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  Sparkles,
  X
} from 'lucide-react';
import { supabase, supabaseSchema } from '../supabaseClient';
import { Project } from '../types';

type SuggestionState = 'pending' | 'approved' | 'rejected';
type ArticleStatus = 'Draft' | 'Scheduled' | 'Published' | 'Failed';

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  primaryKeyword: string;
  seoPotential: string;
  state: SuggestionState;
}

interface GeneratedArticle {
  id: string;
  title: string;
  status: ArticleStatus;
  publishAt?: string;
  error?: string;
}

interface AutoGenerateProps {
  project: Project | null;
}

const labelClass = 'text-[9px] font-black text-slate-400 uppercase tracking-widest';
const inputClass = 'w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 disabled:opacity-50';

const makeId = () => Math.random().toString(36).slice(2, 10);

const normalizeSuggestionTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const toArticleStatus = (status: string): ArticleStatus => {
  const normalized = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft';
  return ['Draft', 'Scheduled', 'Published', 'Failed'].includes(normalized) ? normalized as ArticleStatus : 'Draft';
};

const AutoGenerate: React.FC<AutoGenerateProps> = ({ project }) => {
  const [nicheOverride, setNicheOverride] = useState('');
  const [locationOverride, setLocationOverride] = useState('');
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingArticles, setIsGeneratingArticles] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const context = useMemo(() => ({
    name: project?.name || '',
    websiteUrl: project?.websiteUrl || '',
    niche: nicheOverride.trim() || project?.niche || '',
    location: locationOverride.trim() || project?.location || '',
    category: project?.category || '',
    tone: project?.tone || 'Professional',
    tags: project?.tags?.join(', ') || ''
  }), [project, nicheOverride, locationOverride]);

  const approvedSuggestions = suggestions.filter((suggestion) => suggestion.state === 'approved');
  const suggestionHistoryKey = project?.id ? `autoGenerateSuggestionHistory:${project.id}` : '';

  const getSuggestionHistory = () => {
    if (!suggestionHistoryKey) return [];

    try {
      const parsed = JSON.parse(localStorage.getItem(suggestionHistoryKey) || '[]');
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const rememberSuggestionTitles = (titles: string[]) => {
    if (!suggestionHistoryKey) return;

    const seen = new Set<string>();
    const nextHistory = [...getSuggestionHistory(), ...titles]
      .map((title) => title.trim())
      .filter(Boolean)
      .filter((title) => {
        const normalized = normalizeSuggestionTitle(title);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .slice(-100);

    localStorage.setItem(suggestionHistoryKey, JSON.stringify(nextHistory));
  };

  const getExcludedSuggestionTitles = () => [
    ...getSuggestionHistory(),
    ...suggestions.map((suggestion) => suggestion.title),
    ...articles.map((article) => article.title)
  ];

  const filterFreshSuggestions = (items: TopicSuggestion[], excludedTitles: string[]) => {
    const seen = new Set(excludedTitles.map(normalizeSuggestionTitle).filter(Boolean));

    return items.filter((item) => {
      const normalized = normalizeSuggestionTitle(item.title);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };

  useEffect(() => {
    const fetchGeneratedArticles = async () => {
      if (!project?.id) {
        setArticles([]);
        return;
      }

      const { data } = await supabase
        .schema(supabaseSchema)
        .from('content_posts')
        .select('id,title_en,status,publish_at')
        .eq('project_id', project.id)
        .order('publish_at', { ascending: false })
        .limit(12);

      if (data) {
        setArticles(data.map((post: any) => ({
          id: post.id,
          title: post.title_en,
          status: toArticleStatus(post.status),
          publishAt: post.publish_at
        })));
      }
    };

    fetchGeneratedArticles();
  }, [project?.id]);

  const invokeAutoGenerate = async (payload: Record<string, any>) => {
    const body = {
      projectId: project?.id,
      targetSchema: supabaseSchema,
      nicheOverride: nicheOverride.trim() || undefined,
      locationOverride: locationOverride.trim() || undefined,
      ...payload
    };

    console.info('[auto-generate-content] invoking', {
      action: payload.action,
      projectId: project?.id,
      suggestionCount: Array.isArray(payload.suggestions) ? payload.suggestions.length : undefined,
    });

    const { data, error } = await supabase.functions.invoke('auto-generate-content', { body });

    if (error) {
      const response = error.context instanceof Response ? error.context : null;
      let responseBody = '';

      if (response) {
        try {
          responseBody = await response.clone().text();
        } catch (readError) {
          responseBody = `Unable to read Edge Function response body: ${readError instanceof Error ? readError.message : String(readError)}`;
        }
      }

      console.error('[auto-generate-content] invoke failed', {
        name: error.name,
        message: error.message,
        status: response?.status,
        statusText: response?.statusText,
        responseBody,
        context: error.context,
      });

      const details = responseBody || error.message || 'No response was returned by the Edge Function.';
      throw new Error(
        `auto-generate-content request failed. Details: ${details}`
      );
    }
    if (data?.error) {
      console.error('[auto-generate-content] returned error JSON', {
        action: payload.action,
        error: data.error,
      });
      throw new Error(data.error);
    }
    return data;
  };

  const generateSuggestions = async () => {
    if (!project?.id) return;

    setErrorMsg(null);
    setIsGeneratingSuggestions(true);
    try {
      const data = await invokeAutoGenerate({
        action: 'generate_suggestions',
        excludeTitles: getExcludedSuggestionTitles()
      });
      const excludedTitles = getExcludedSuggestionTitles();
      const nextSuggestions = filterFreshSuggestions((Array.isArray(data?.suggestions) ? data.suggestions : [])
        .slice(0, 15)
        .map((item: any) => ({
          id: makeId(),
          title: String(item.title || '').trim(),
          description: String(item.description || '').trim(),
          primaryKeyword: String(item.primaryKeyword || item.primary_keyword || '').trim(),
          seoPotential: String(item.seoPotential || item.seo_potential || '').trim(),
          state: 'pending' as SuggestionState
        }))
        .filter((item: TopicSuggestion) => item.title && item.description), excludedTitles);

      setSuggestions(nextSuggestions);
      rememberSuggestionTitles(nextSuggestions.map((suggestion) => suggestion.title));
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to generate suggestions.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const updateSuggestionState = (id: string, state: SuggestionState) => {
    setSuggestions((items) => items.map((item) => item.id === id ? { ...item, state } : item));
  };

  const bulkApprove = () => {
    setSuggestions((items) => items.map((item) => item.state === 'rejected' ? item : { ...item, state: 'approved' }));
  };

  const replaceSuggestion = async (id: string) => {
    if (!project?.id) return;

    setErrorMsg(null);
    setReplacingId(id);
    try {
      const data = await invokeAutoGenerate({
        action: 'replace_suggestion',
        excludeTitles: getExcludedSuggestionTitles()
      });
      const replacement = data?.suggestion;
      if (!replacement?.title) throw new Error('No replacement topic was returned.');
      if (filterFreshSuggestions([{
        id: makeId(),
        title: String(replacement.title || '').trim(),
        description: String(replacement.description || '').trim(),
        primaryKeyword: String(replacement.primaryKeyword || replacement.primary_keyword || '').trim(),
        seoPotential: String(replacement.seoPotential || replacement.seo_potential || '').trim(),
        state: 'pending'
      }], getExcludedSuggestionTitles()).length === 0) {
        throw new Error('The replacement topic was already suggested. Please try Replace again.');
      }

      setSuggestions((items) => items.map((item) => item.id === id ? {
        id: makeId(),
        title: String(replacement.title || '').trim(),
        description: String(replacement.description || '').trim(),
        primaryKeyword: String(replacement.primaryKeyword || replacement.primary_keyword || '').trim(),
        seoPotential: String(replacement.seoPotential || replacement.seo_potential || '').trim(),
        state: 'pending'
      } : item));
      rememberSuggestionTitles([String(replacement.title || '').trim()]);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to replace this topic.');
    } finally {
      setReplacingId(null);
    }
  };

  const generateApprovedArticles = async () => {
    if (!project?.id || approvedSuggestions.length === 0 || isGeneratingArticles) return;

    setErrorMsg(null);
    setIsGeneratingArticles(true);
    setArticles((items) => [
      ...approvedSuggestions.map((suggestion) => ({
        id: `pending-${suggestion.id}`,
        title: suggestion.title,
        status: 'Draft' as ArticleStatus
      })),
      ...items
    ]);

    try {
      const data = await invokeAutoGenerate({
        action: 'generate_articles',
        suggestions: approvedSuggestions.map(({ title, description, primaryKeyword, seoPotential }) => ({
          title,
          description,
          primaryKeyword,
          seoPotential
        }))
      });
      const generated = (Array.isArray(data?.articles) ? data.articles : []).map((article: any) => ({
        id: article.id || makeId(),
        title: article.title || article.title_en || 'Generated article',
        status: toArticleStatus(article.status || 'scheduled'),
        publishAt: article.publishAt || article.publish_at,
        error: article.error
      }));

      setArticles((items) => [
        ...generated,
        ...items.filter((item) => !item.id.startsWith('pending-'))
      ]);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to generate approved articles.');
      setArticles((items) => items.map((item) => item.id.startsWith('pending-') ? { ...item, status: 'Failed', error: error?.message } : item));
    } finally {
      setIsGeneratingArticles(false);
    }
  };

  const statusStyles: Record<ArticleStatus, string> = {
    Draft: 'bg-indigo-50 text-indigo-700',
    Scheduled: 'bg-amber-50 text-amber-700',
    Published: 'bg-emerald-50 text-emerald-700',
    Failed: 'bg-rose-50 text-rose-700'
  };

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          <Sparkles className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900">Select a project first</h2>
          <p className="text-xs text-slate-500 mt-1">Auto Generate uses the active project's saved configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Auto Generate</h2>
          <p className="text-sm text-slate-500">Approve SEO topics once and prepare scheduled articles automatically.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.niche || 'No niche'}</span>
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.location || 'No location'}</span>
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.tone}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Niche Override</label>
            <input
              className={inputClass}
              placeholder={project.niche || 'Use project niche'}
              value={nicheOverride}
              onChange={(event) => setNicheOverride(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Location Override</label>
            <input
              className={inputClass}
              placeholder={project.location || 'Use project location'}
              value={locationOverride}
              onChange={(event) => setLocationOverride(event.target.value)}
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-all">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">AI Topic Suggestions</h3>
              <p className="text-xs text-slate-500">OpenAI runs through the `auto-generate-content` Edge Function.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={bulkApprove}
                disabled={suggestions.length === 0 || isGeneratingArticles}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Bulk Approve
              </button>
              <button
                type="button"
                onClick={generateSuggestions}
                disabled={isGeneratingSuggestions || isGeneratingArticles}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                {isGeneratingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Suggestions
              </button>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="h-[420px] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-xs font-bold text-slate-500">Generate suggestions to start the automatic pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className={`border rounded-2xl p-3 transition-all ${suggestion.state === 'approved' ? 'border-emerald-200 bg-emerald-50/40' : suggestion.state === 'rejected' ? 'border-rose-100 bg-rose-50/40' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-black text-slate-900 leading-snug">{suggestion.title}</h4>
                    <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {suggestion.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{suggestion.description}</p>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                    <div><span className="font-black text-slate-700">Keyword:</span> {suggestion.primaryKeyword || 'Not provided'}</div>
                    <div><span className="font-black text-slate-700">SEO:</span> {suggestion.seoPotential || 'High intent potential'}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateSuggestionState(suggestion.id, 'approved')} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black hover:bg-emerald-100 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button type="button" onClick={() => updateSuggestionState(suggestion.id, 'rejected')} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black hover:bg-rose-100 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button type="button" onClick={() => replaceSuggestion(suggestion.id)} disabled={replacingId === suggestion.id} className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-black hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1">
                      {replacingId === suggestion.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                      Replace
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">Pipeline Status</h3>
          <p className="text-xs text-slate-500 mt-1">{approvedSuggestions.length} approved topic{approvedSuggestions.length === 1 ? '' : 's'} ready.</p>
          <button
            type="button"
            onClick={generateApprovedArticles}
            disabled={approvedSuggestions.length === 0 || isGeneratingArticles}
            className="mt-3 w-full px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {isGeneratingArticles ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve Topics
          </button>

          <div className="mt-4 space-y-2 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
            {articles.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No generated articles yet.
              </div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[11px] font-black text-slate-800 leading-snug">{article.title}</h4>
                    <span className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${statusStyles[article.status]}`}>
                      {article.status}
                    </span>
                  </div>
                  {article.publishAt && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(article.publishAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                  {article.error && <p className="text-[10px] text-rose-600 mt-1 break-all">{article.error}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoGenerate;
