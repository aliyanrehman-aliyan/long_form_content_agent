import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Mail,
  MapPin,
  PenLine,
  Save,
  Sparkles,
  Tag,
  Target,
  Type
} from 'lucide-react';
import { Project } from '../types';
import InfoTooltip from '../components/InfoTooltip';

interface SettingsProps {
  project: Project | null;
  onUpdate: (project: Project) => Promise<void> | void;
  onCreate: (project: Project) => Promise<{ data?: Project; error?: any }>;
}

const TONE_OPTIONS = ['Professional', 'Casual', 'Witty', 'Educational'];

const getInitialFormData = (project: Project | null) => ({
  name: project?.name || '',
  websiteUrl: project?.websiteUrl || '',
  niche: project?.niche || '',
  location: project?.location || '',
  category: project?.category || '',
  tone: project?.tone || 'Professional',
  tags: project?.tags?.join(', ') || '',
  publishingMode: project?.publishingMode || 'supabase_shared',
  apiBaseUrl: project?.apiBaseUrl || '',
  apiKey: project?.apiKey || ''
});

const Settings: React.FC<SettingsProps> = ({ project, onUpdate, onCreate }) => {
  const [activeStep, setActiveStep] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailDeliveryMessage, setEmailDeliveryMessage] = useState(false);
  const [formData, setFormData] = useState(() => getInitialFormData(project));
  const isOnboarding = !project;
  const displayName = formData.name.trim() || (isOnboarding ? 'New Project' : project?.name || 'Project');

  useEffect(() => {
    setFormData(getInitialFormData(project));
    setSaved(false);
    setErrorMsg(null);
    setEmailDeliveryMessage(false);
  }, [project]);

  const steps = [
    { id: 'profile', title: 'Business Profile', description: 'Welcome and overview', icon: Building2 },
    { id: 'details', title: 'Content Configuration', description: 'Project and content fields', icon: Target },
    { id: 'method', title: 'Method', description: 'Delivery preferences', icon: Database }
  ];
  const activeStepHelp =
    activeStep === 'profile'
      ? 'Introduces the selected project and summarizes the workspace purpose.'
      : activeStep === 'details'
        ? 'Stores the project context used for content generation, targeting, and review.'
        : 'Controls how completed content is delivered after generation.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || !formData.websiteUrl.trim()) {
      setActiveStep('details');
      setErrorMsg('Please complete the project name and website URL.');
      return;
    }

    try {
      new URL(formData.websiteUrl);
    } catch {
      setActiveStep('details');
      setErrorMsg('Please enter a valid website URL.');
      return;
    }

    if (!formData.location.trim() || !formData.niche.trim()) {
      setActiveStep('details');
      setErrorMsg('Please complete the project location and niche.');
      return;
    }

    setIsSaving(true);
    setSaved(false);

    const updatedProject: Project = {
      ...(project || {}),
      id: project?.id || '',
      name: formData.name.trim(),
      websiteUrl: formData.websiteUrl.trim(),
      niche: formData.niche.trim(),
      location: formData.location.trim() || 'Dubai, UAE',
      category: formData.category.trim(),
      tone: formData.tone,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: project?.createdAt || new Date().toISOString(),
      publishingMode: formData.publishingMode as Project['publishingMode'],
      apiBaseUrl: formData.apiBaseUrl,
      apiKey: formData.apiKey
    };

    try {
      const result = isOnboarding ? await onCreate(updatedProject) : await onUpdate(updatedProject);
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw result.error;
      }
      setSaved(true);
      setShowThankYouModal(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to save project settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 disabled:opacity-50';
  const denseInputClass = 'w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 disabled:opacity-50';
  const labelClass = 'text-[9px] font-black text-slate-400 uppercase tracking-widest';
  const compactCard = 'bg-white border border-slate-100 rounded-2xl p-4 shadow-sm';
  const denseCard = 'bg-white border border-slate-100 rounded-2xl p-3 shadow-sm';
  const renderFieldLabel = (label: string, help: string) => (
    <div className="flex items-center gap-1.5">
      <label className={labelClass}>{label}</label>
      <InfoTooltip size="sm" content={help} />
    </div>
  );
  const currentIndex = steps.findIndex(step => step.id === activeStep);

  useEffect(() => {
    if (!showThankYouModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowThankYouModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showThankYouModal]);

  const goNext = () => {
    if (activeStep === 'profile') setActiveStep('details');
    if (activeStep === 'details') setActiveStep('method');
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[calc(100vh-8rem)] flex">
        <aside className="w-72 bg-slate-950 text-slate-300 p-5 flex flex-col">
          <button className="text-slate-400 text-xs font-semibold mb-5 flex items-center gap-2 cursor-default">
            <span className="text-lg leading-none">&lsaquo;</span>
            {isOnboarding ? 'Project Setup' : 'Project Settings'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white leading-tight truncate">{displayName}</h2>
              <p className="text-[11px] text-slate-400 font-medium">Long Form Content Agent</p>
            </div>
          </div>

          <nav className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeStep === step.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeStep === step.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold">{step.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{step.description}</div>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border ${
                  index <= currentIndex ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                }`} />
              </button>
            ))}
          </nav>
        </aside>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {activeStep === 'profile' && <Building2 className="w-4 h-4" />}
                {activeStep === 'details' && <Target className="w-4 h-4" />}
                {activeStep === 'method' && <Database className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 leading-tight">
                    {activeStep === 'profile' && 'Business Profile'}
                    {activeStep === 'details' && 'Content Configuration'}
                    {activeStep === 'method' && 'Method'}
                  </h1>
                  <InfoTooltip content={activeStepHelp} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {activeStep === 'profile' && (isOnboarding ? 'Create the business profile for a new project.' : 'Edit the business profile for this project.')}
                  {activeStep === 'details' && 'Edit the project context used for content generation and management.'}
                  {activeStep === 'method' && 'Choose how prepared content is delivered for this project.'}
                </p>
              </div>
            </div>
            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-slate-50/60">
            {activeStep === 'profile' && (
              <div className="space-y-4 max-w-5xl">
                <div className={compactCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{isOnboarding ? 'Set up a new project' : `Welcome to ${displayName}`}</h3>
                        <InfoTooltip content="Summarizes the active project and the main content workflow areas." />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-3xl">
                        Long Form Content Agent helps your team generate, organize, manage, schedule, and review long-form content for the selected project.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className={compactCard}>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Content Generation</h4>
                      <InfoTooltip content="Explains the tools used to create topic ideas, drafts, and SEO-ready content." />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Create topic ideas, drafts, SEO metadata, and structured long-form posts.</p>
                  </div>
                  <div className={compactCard}>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <PenLine className="w-4 h-4" />
                    </div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Content Management</h4>
                      <InfoTooltip content="Covers post organization, category assignment, scheduling, and review workflows." />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Manage posts, categories, calendar planning, and publishing workflow in one workspace.</p>
                  </div>
                  <div className={compactCard}>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Project Context</h4>
                      <InfoTooltip content="Keeps tone, niche, tags, and location aligned for this project." />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Use each project profile to keep tone, niche, tags, and location aligned.</p>
                  </div>
                </div>

                <div className={compactCard}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Current Business Context</h4>
                    <InfoTooltip content="Shows the saved niche, location, and tone that guide generated content." />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {formData.niche || 'No niche set'} content for {formData.location || 'No location set'}, written in a {formData.tone || 'Professional'} tone.
                  </p>
                </div>
              </div>
            )}

            {activeStep === 'details' && (
              <div className="space-y-3 max-w-5xl">
                <div className={denseCard}>
                  <div className="mb-0.5 flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Content Profile</h3>
                    <InfoTooltip content="Defines the project fields used by manual and automatic content generation." />
                  </div>
                  <p className="text-xs text-slate-500">These fields guide content generation, targeting, and review context.</p>
                </div>

                <div className={`${denseCard} space-y-3`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      {renderFieldLabel('Project Name', 'The display name used to identify this project across the workspace.')}
                      <input required className={denseInputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      {renderFieldLabel('Website URL', 'The public website URL associated with this project and its content.')}
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input required type="url" className={`${denseInputClass} pl-10`} value={formData.websiteUrl} onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      {renderFieldLabel('Location', 'The target market or geography used to localize generated content.')}
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input required className={`${denseInputClass} pl-10`} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {renderFieldLabel('Niche', 'The main industry, service area, or subject focus for generated content.')}
                      <div className="relative">
                        <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input required className={`${denseInputClass} pl-10`} value={formData.niche} onChange={e => setFormData({ ...formData, niche: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {renderFieldLabel('Tone', 'The writing voice the generator should follow for this project.')}
                      <div className="relative">
                        <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select className={`${denseInputClass} pl-10 appearance-none`} value={formData.tone} onChange={e => setFormData({ ...formData, tone: e.target.value })}>
                          {TONE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      {renderFieldLabel('Category', 'The default content category or topic group for this project.')}
                      <input className={denseInputClass} placeholder="e.g. Healthcare, Real Estate, SaaS..." value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                      {renderFieldLabel('Target Tags', 'Comma-separated keywords or tags used to guide topic and article generation.')}
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className={`${denseInputClass} pl-10`} placeholder="marketing, dubai, medical..." value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'method' && (
              <div className="space-y-4 max-w-5xl">
                <div className={compactCard}>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Delivery Method</h3>
                    <InfoTooltip content="Chooses whether completed posts stay in Supabase or are prepared for email delivery." />
                  </div>
                  <p className="text-xs text-slate-500">Select how completed posts are delivered after your content workflow.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, publishingMode: 'supabase_shared' });
                      setEmailDeliveryMessage(false);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all min-h-[120px] ${
                      formData.publishingMode === 'supabase_shared'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <Database className="w-5 h-5 text-indigo-600 mb-3" />
                    <div className="text-sm font-bold text-slate-900">Supabase Shared</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Website reads directly from the project-scoped content tables.</p>
                    {formData.publishingMode === 'supabase_shared' && (
                      <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">{isOnboarding ? 'Selected Method' : 'Current Method'}</div>
                    )}
                  </button>

                  <div className={`p-4 rounded-2xl border-2 shadow-sm min-h-[120px] transition-all ${
                    formData.publishingMode === 'email_delivery'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-100 bg-white'
                  }`}>
                    <Mail className="w-5 h-5 text-slate-600 mb-3" />
                    <div className="text-sm font-bold text-slate-900">Email Delivery</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Receive completed posts in your inbox for manual publishing or review.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, publishingMode: 'email_delivery' });
                        setEmailDeliveryMessage(true);
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Use Email Delivery
                    </button>
                    {formData.publishingMode === 'email_delivery' && (
                      <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">{isOnboarding ? 'Selected Method' : 'Current Method'}</div>
                    )}
                  </div>
                </div>

                {emailDeliveryMessage && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
                    We will write and send your posts to your email.
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-white">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {currentIndex + 1} of 3</div>
            <div className="flex items-center gap-3">
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </div>
              )}
              {activeStep !== 'method' ? (
                <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isOnboarding ? 'Create Project' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {showThankYouModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setShowThankYouModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="thank-you-title"
        >
          <div
            className="w-full max-w-sm rounded-[1.75rem] border border-slate-100 bg-white p-6 text-center shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 id="thank-you-title" className="text-xl font-black text-slate-900">Thank You!</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Your project settings have been saved successfully. Your preferences will now be used for future content generation.
            </p>
            <button
              type="button"
              onClick={() => setShowThankYouModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
