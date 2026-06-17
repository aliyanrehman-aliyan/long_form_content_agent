
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderKanban, 
  FileText, 
  Globe, 
  Layers, 
  Calendar as CalendarIcon, 
  LogOut, 
  ChevronDown, 
  Loader2,
  BarChart3,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Tab, Project, Post, Category, ContentType } from './types';
import Posts from './pages/Posts';
import ProjectsPage from './pages/Projects';
import Editor from './pages/Editor';
import Calendar from './pages/Calendar';
import CategoriesPage from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Demo from './pages/Demo';
import AutoGenerate from './pages/AutoGenerate';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const getTabFromPath = (path: string): Tab => {
  switch (normalizePath(path)) {
    case '/projects':
      return 'Projects';
    case '/analytics':
      return 'Analytics';
    case '/settings':
      return 'Settings';
    case '/demo':
      return 'Demo';
    case '/auto-generate':
    case '/customer-workspace/auto-generate':
      return 'AutoGenerate';
    case '/customer-workspace/categories':
      return 'Categories';
    case '/customer-workspace/calendar':
      return 'Calendar';
    case '/customer-workspace':
    case '/customer-workspace/posts':
    case '/':
      return 'Posts';
    default:
      return 'Posts';
  }
};

const getRouteForTab = (tab: Tab) => {
  switch (tab) {
    case 'Projects':
      return '/projects';
    case 'Analytics':
      return '/analytics';
    case 'Settings':
      return '/settings';
    case 'Demo':
      return '/demo';
    case 'AutoGenerate':
      return '/customer-workspace/auto-generate';
    case 'Categories':
    case 'CategoryDetail':
      return '/customer-workspace/categories';
    case 'Calendar':
      return '/customer-workspace/calendar';
    case 'Posts':
    case 'Editor':
    default:
      return '/customer-workspace/posts';
  }
};

const toPublishingMode = (deliveryMethod: string | null | undefined): Project['publishingMode'] =>
  deliveryMethod === 'email' || deliveryMethod === 'email_delivery' ? 'email_delivery' : 'supabase_shared';

const toDeliveryMethodColumn = (publishingMode: Project['publishingMode']) =>
  publishingMode === 'email_delivery' ? 'email' : 'supabase_shared';

const allowedContentTypes: ContentType[] = [
  'blog_article',
  'faq',
  'landing_page_content',
  'service_page',
  'product_description',
  'case_study',
  'general_content',
];

const toContentType = (value: string | null | undefined): ContentType =>
  allowedContentTypes.includes(value as ContentType) ? value as ContentType : 'blog_article';

const mapProject = (p: any): Project => ({
  id: p.id,
  name: p.name,
  websiteUrl: p.website_url,
  niche: p.niche || '',
  tone: p.tone || 'Professional',
  location: p.target_location || '',
  contentType: toContentType(p.content_type),
  category: p.category || '',
  tags: Array.isArray(p.target_tags) ? p.target_tags : [],
  createdAt: p.created_at,
  publishingMode: toPublishingMode(p.delivery_method),
});

const App: React.FC = () => {
  const [user, setUser] = useState<any>({ email: 'local@dashboard.dev', id: null });
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPath(window.location.pathname));
  const [projects, setProjects] = useState<Project[]>([]);
  // Initialize from localStorage for persistence
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(localStorage.getItem('selectedProjectId'));
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to extract Dubai-local YYYY-MM-DD from any ISO timestamp correctly
  const getDubaiDate = (iso: string) => {
    if (!iso) return '';
    const dt = new Date(iso);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt);
  };

  useEffect(() => {
    if (normalizePath(window.location.pathname) === '/') {
      window.history.replaceState(null, '', '/customer-workspace');
    }

    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Temporary local dashboard access. Auth screen is disabled for now.
  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      try {
        setUser({ email: 'local@dashboard.dev', id: null });
        await fetchProjects();
      } catch (error) {
        console.error("Dashboard init error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProjects = async (preferredSelectedProjectId?: string | null) => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Project fetch error:", error);
        return;
      }
      if (data) {
        const mapped: Project[] = data.map(mapProject);
        setProjects(mapped);

        // Restore a previous explicit selection only if it is still valid.
        const nextSelectedId = preferredSelectedProjectId ?? localStorage.getItem('selectedProjectId');
        const isValid = mapped.some(p => p.id === nextSelectedId);

        if (isValid && nextSelectedId) {
          setSelectedProjectId(nextSelectedId);
        } else {
          setSelectedProjectId(null);
          localStorage.removeItem('selectedProjectId');
        }
      }
    } catch (e) {
      console.error("Unexpected fetchProjects error:", e);
    }
  };

  const fetchProjectData = async (projectId: string) => {
    // Categories
    const { data: cats } = await supabase.from('categories').select('*').eq('project_id', projectId);
    if (cats) {
      setCategories(cats.map(c => ({
        id: c.id,
        projectId: c.project_id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        status: 'Active',
        createdAt: c.created_at
      })));
    }

    // Posts
    const { data: psts } = await supabase.from('content_posts').select('*').eq('project_id', projectId);
    if (psts) {
      setPosts(psts.map(p => {
        const statusVal = p.status.charAt(0).toUpperCase() + p.status.slice(1) as any;
        const categoryIds = p.category_ids || [];
    return {
  id: p.id,
  projectId: p.project_id,
  categoryId: categoryIds[0],
  categoryIds,
  title: p.title_en,
  titleAr: p.title_ar,
  slug: p.slug,
  content: p.content_en || '',
  excerpt: p.excerpt_en || '',
  excerptAr: p.excerpt_ar || '',
  status: statusVal,

  category:
    categoryIds.length > 0
      ? categoryIds
          .map((id: string) => cats?.find(c => c.id === id)?.name)
          .filter(Boolean)
          .join(', ')
      : 'Uncategorized',

  author: 'Admin',
  date: getDubaiDate(p.publish_at || p.published_at || p.created_at),

  publishAt: p.publish_at,
  image: p.featured_image_url || 'https://picsum.photos/seed/post/800/400',

  seo: {
    focusKeyword: p.focus_keyword || '',
    seoTitle: p.seo_title || '',
    metaDescription: p.meta_description || '',
  },

  blocksEn: p.content_blocks_en || [],
  blocksAr: p.content_blocks_ar || [],
  tags: Array.isArray(p.tags) ? p.tags : []
};

      }));
    }
  };

  // Keep localStorage in sync with selectedProjectId state
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selectedProjectId', selectedProjectId);
      fetchProjectData(selectedProjectId);
    } else {
      localStorage.removeItem('selectedProjectId');
      setCategories([]);
      setPosts([]);
      setEditingPost(null);
      setSelectedCategoryId(null);
    }
  }, [selectedProjectId]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const sidebarItems = [
    { id: 'Posts', icon: FileText, label: 'Customer Workspace' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'Settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'Demo', icon: FileText, label: 'Demo' },
  ];

  const workspaceItems = [
    { id: 'Posts', icon: FileText, label: 'Content' },
    { id: 'Categories', icon: Layers, label: 'Categories' },
    { id: 'Calendar', icon: CalendarIcon, label: 'Calendar' },
    { id: 'AutoGenerate', icon: Sparkles, label: 'Auto Generate' },
  ];

  const isWorkspaceTab = (tab: Tab) =>
    tab === 'Posts' || tab === 'Categories' || tab === 'CategoryDetail' || tab === 'Calendar' || tab === 'AutoGenerate' || tab === 'Editor';

  const navigateTo = (tab: Tab, route = getRouteForTab(tab)) => {
    setActiveTab(tab);
    if (normalizePath(window.location.pathname) !== normalizePath(route)) {
      window.history.pushState(null, '', route);
    }
  };

  const handleAddProject = async (newProj: Project, options: { navigateAfterCreate?: boolean } = { navigateAfterCreate: true }) => {
    const insertPayload = {
      name: newProj.name,
      website_url: newProj.websiteUrl,
      niche: newProj.niche,
      tone: newProj.tone,
      target_location: newProj.location,
      content_type: newProj.contentType || 'blog_article',
      category: newProj.category || null,
      target_tags: newProj.tags || [],
      delivery_method: toDeliveryMethodColumn(newProj.publishingMode || 'supabase_shared'),
      settings_metadata: {},
      created_by: null
    };
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(insertPayload)
        .select()
        .single();
      
      if (error) return { error };
      await fetchProjects(data.id);
      setSelectedProjectId(data.id);
      if (options.navigateAfterCreate) {
        navigateTo('Posts', '/customer-workspace/posts');
      }
      return { data: mapProject(data) };
    } catch (e) {
      return { error: e };
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    const { data, error } = await supabase.from('projects').update({
      name: updated.name,
      website_url: updated.websiteUrl,
      niche: updated.niche,
      tone: updated.tone,
      target_location: updated.location,
      content_type: updated.contentType || 'blog_article',
      category: updated.category || null,
      target_tags: updated.tags || [],
      delivery_method: toDeliveryMethodColumn(updated.publishingMode || 'supabase_shared'),
      settings_metadata: {}
    }).eq('id', updated.id).select().single();

    if (error) return { error };

    await fetchProjects(updated.id || selectedProjectId);
    return { data: data ? mapProject(data) : undefined };
  };

  const handleSaveCategory = async (cat: Category) => {
    if (cat.id.length < 10) {
       await supabase.from('categories').insert({
         project_id: cat.projectId,
         name: cat.name,
         slug: cat.slug,
         description: cat.description
       });
    } else {
       await supabase.from('categories').update({
         name: cat.name,
         slug: cat.slug,
         description: cat.description
       }).eq('id', cat.id);
    }
    if (selectedProjectId) fetchProjectData(selectedProjectId);
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    if (selectedProjectId) fetchProjectData(selectedProjectId);
  };

  const handleClearProjectSelection = () => {
    setSelectedProjectId(null);
    navigateTo('Projects');
  };

  const handleSavePost = async (post: Post) => {
    if (!selectedProjectId) {
      console.error("Cannot save post: No project selected");
      return;
    }

    const payload = {
  project_id: selectedProjectId,
  category_ids: post.categoryIds || [],
      content_type: activeProject?.contentType || 'blog_article',
      title_en: post.title,
      title_ar: post.titleAr,
      slug: post.slug,
      excerpt_en: post.excerpt,
      excerpt_ar: post.excerptAr,
      content_en: post.content,
      status: post.status.toLowerCase(),
      publish_at: post.publishAt,
      featured_image_url: post.image,
      focus_keyword: post.seo?.focusKeyword,
      seo_title: post.seo?.seoTitle,
      meta_description: post.seo?.metaDescription,
      content_blocks_en: post.blocksEn,
      content_blocks_ar: post.blocksAr,
      tags: post.tags || [],
      generation_metadata: {},
      review_metadata: {},
      metadata: {}
    };

    if (post.id.length < 10) {
      await supabase.from('content_posts').insert(payload);
    } else {
      await supabase.from('content_posts').update(payload).eq('id', post.id);
    }
    
    if (selectedProjectId) fetchProjectData(selectedProjectId);
    navigateTo('Posts', '/customer-workspace/posts');
  };

  const handleSignOut = async () => {
    localStorage.removeItem('selectedProjectId');
    setSelectedProjectId(null);
    navigateTo('Projects');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-200 animate-pulse">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Restoring Session...</p>
        </div>
      </div>
    );
  }

  const renderEmptyProjectState = () => (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <FolderKanban className="w-16 h-16 mb-4 opacity-10" />
        <p className="text-sm font-semibold">No active project assigned yet. Please select or create a project.</p>
      </div>
    );

  const renderContent = () => {
    if (!activeProject && activeTab !== 'Projects' && activeTab !== 'Settings' && activeTab !== 'Demo' && activeTab !== 'AutoGenerate') {
      return renderEmptyProjectState();
    }

    switch (activeTab) {
      case 'Posts':
        return <Posts posts={posts} categories={categories} projectName={activeProject?.name || ''} onDelete={async (id) => { await supabase.from('content_posts').delete().eq('id', id); fetchProjectData(selectedProjectId!); }} onToggleStatus={async (id) => { const p = posts.find(p => p.id === id); await supabase.from('content_posts').update({ status: p?.status === 'Published' ? 'draft' : 'published' }).eq('id', id); fetchProjectData(selectedProjectId!); }} onCreatePost={() => { setEditingPost(null); navigateTo('Editor', '/customer-workspace/posts'); }} onEditPost={(p) => { setEditingPost(p); navigateTo('Editor', '/customer-workspace/posts'); }} />;
      case 'Projects':
        return <ProjectsPage projects={projects} activeProjectId={selectedProjectId || ''} onSelect={(id) => { setSelectedProjectId(id); navigateTo('Posts', '/customer-workspace/posts'); }} onAdd={handleAddProject} onUpdate={handleUpdateProject} />;
      case 'Analytics':
        return <Analytics project={activeProject!} posts={posts} categories={categories} />;
      case 'Settings':
        return <Settings project={activeProject} onUpdate={handleUpdateProject} onCreate={(project) => handleAddProject(project, { navigateAfterCreate: false })} />;
      case 'Demo':
        return <Demo />;
      case 'AutoGenerate':
        return <AutoGenerate project={activeProject} />;
      case 'Categories':
        return <CategoriesPage categories={categories} posts={posts} projectId={selectedProjectId!} onSave={handleSaveCategory} onDelete={handleDeleteCategory} onViewCategory={(id) => { setSelectedCategoryId(id); navigateTo('CategoryDetail', '/customer-workspace/categories'); }} />;
      case 'CategoryDetail':
        const cat = categories.find(c => c.id === selectedCategoryId);
        return cat ? <CategoryDetail category={cat} posts={posts.filter(p => p.categoryId === cat.id)} allPosts={posts} onBack={() => navigateTo('Categories')} onEditPost={(p) => { setEditingPost(p); navigateTo('Editor', '/customer-workspace/posts'); }} /> : null;
      case 'Calendar':
        return <Calendar posts={posts} onEditPost={(p) => { setEditingPost(p); navigateTo('Editor', '/customer-workspace/posts'); }} />;
      case 'Editor':
        return <Editor post={editingPost} project={activeProject!} categories={categories} onSave={handleSavePost} onCancel={() => navigateTo('Posts', '/customer-workspace/posts')} />;
      default:
        return <div className="p-20 text-center">Coming Soon</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg"><Globe className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold text-white tracking-tight">Long Form Content Agent</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => navigateTo(item.id as Tab, item.id === 'Posts' ? '/customer-workspace' : getRouteForTab(item.id as Tab))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (item.id === 'Posts' ? isWorkspaceTab(activeTab) : activeTab === item.id)
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>

              {item.id === 'Posts' && isWorkspaceTab(activeTab) && (
                <div className="ml-4 pl-3 border-l border-slate-700/70 space-y-1">
                  {workspaceItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => navigateTo(subItem.id as Tab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === subItem.id || (subItem.id === 'Posts' && activeTab === 'Editor') || (subItem.id === 'Categories' && activeTab === 'CategoryDetail')
                          ? 'bg-slate-800 text-white'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-1">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Clear Project
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 border border-slate-200 transition-all hover:bg-slate-200" onClick={() => navigateTo('Projects')}>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {activeProject?.name || 'Select Project'}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleClearProjectSelection}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                !activeProject
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              All Projects
            </button>
            <span className="text-slate-300">|</span>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              {isWorkspaceTab(activeTab) ? 'Customer Workspace' : activeTab === 'AutoGenerate' ? 'Auto Generate' : activeTab}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
