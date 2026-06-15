import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Search,
  Send,
  Timer
} from 'lucide-react';
import { Category, Post, PostStatus, Project } from '../types';
import BlogDetail from './BlogDetail';
import InfoTooltip from '../components/InfoTooltip';

interface AnalyticsProps {
  project: Project;
  posts: Post[];
  categories: Category[];
}

const Analytics: React.FC<AnalyticsProps> = ({ project, posts, categories }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedPost = selectedPostId ? posts.find(post => post.id === selectedPostId) : null;

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || post.categoryId === categoryFilter || post.categoryIds?.includes(categoryFilter);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const metrics = useMemo(() => {
    const published = posts.filter(post => post.status === 'Published').length;
    const scheduled = posts.filter(post => post.status === 'Scheduled').length;
    const drafts = posts.filter(post => post.status === 'Draft').length;

    return [
      { label: 'Generated Content', value: posts.length.toString(), icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Published Content', value: published.toString(), icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Scheduled Posts', value: scheduled.toString(), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Drafts in Review', value: drafts.toString(), icon: Timer, color: 'text-slate-600', bg: 'bg-slate-100' }
    ];
  }, [posts]);

  if (selectedPost) {
    return (
      <BlogDetail
        post={selectedPost}
        category={categories.find(category => category.id === selectedPost.categoryId)}
        allPosts={posts}
        onBack={() => setSelectedPostId(null)}
        onSelectPost={setSelectedPostId}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{project.name} Analytics</h2>
            <InfoTooltip content="Track content status, review output, and monitor project-level publishing progress." />
          </div>
          <p className="text-slate-500">Review generated content, published output, and project-specific performance.</p>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest">
          {project.websiteUrl}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {metrics.map(metric => (
            <div key={metric.label} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex flex-col items-center justify-center gap-2">
              <div className={`${metric.bg} ${metric.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                <metric.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex items-baseline justify-center gap-2 w-full">
                <div className="text-2xl font-black text-slate-900 leading-none">{metric.value}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider truncate">{metric.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Publishing Mix</h3>
              <InfoTooltip content="Shows how posts are split across published, scheduled, and draft states." />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
          </div>

          <div className="space-y-4">
            {(['Published', 'Scheduled', 'Draft'] as PostStatus[]).map(status => {
              const count = posts.filter(post => post.status === status).length;
              const percent = posts.length ? Math.round((count / posts.length) * 100) : 0;
              return (
                <div key={status} className="rounded-xl bg-slate-50/70 border border-slate-100 px-3 py-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>{status}</span>
                    <span className="text-slate-900">{percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${status === 'Published' ? 'bg-emerald-500' : status === 'Scheduled' ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="space-y-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800">Content Review</h3>
              <InfoTooltip content="Search, filter, preview, and inspect posts created for this project." />
            </div>
            <p className="text-sm text-slate-500">Preview generated and published content for the selected project.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 text-slate-900 placeholder:text-slate-400" placeholder="Search content..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as PostStatus | 'All')}>
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredPosts.map(post => {
            const category = categories.find(cat => cat.id === post.categoryId);
            return (
              <button key={post.id} type="button" onClick={() => setSelectedPostId(post.id)} className="group text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    post.status === 'Published' ? 'bg-emerald-500 text-white' :
                    post.status === 'Scheduled' ? 'bg-amber-500 text-white' : 'bg-slate-900/80 text-white'
                  }`}>
                    {post.status}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">{category?.name || 'Uncategorized'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" />{post.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-2 min-h-[42px] group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-3 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Review</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800">No content matches this view</h4>
            <p className="text-sm text-slate-500 mt-1">Try adjusting the project-specific filters.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
