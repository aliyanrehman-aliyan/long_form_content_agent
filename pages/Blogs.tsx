
import React, { useState } from 'react';
import { Post, Category, PostStatus } from '../types';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  Clock, 
  LayoutGrid, 
  List,
  Eye,
  ChevronRight
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

interface BlogsPageProps {
  posts: Post[];
  categories: Category[];
  onPreview: (postId: string) => void;
}

const BlogsPage: React.FC<BlogsPageProps> = ({ posts, categories, onPreview }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || post.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Content Review Center</h2>
            <InfoTooltip content="Preview how posts will appear to readers and filter review-ready content." />
          </div>
          <p className="text-slate-500">View how your content appears to public readers</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search blogs..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-black placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-black outline-none focus:border-indigo-500"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-black outline-none focus:border-indigo-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredPosts.map(post => {
          const category = categories.find(c => c.id === post.categoryId);
          return (
            <div 
              key={post.id} 
              onClick={() => onPreview(post.id)}
              className="group cursor-pointer bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    post.status === 'Published' ? 'bg-emerald-500 text-white' :
                    post.status === 'Scheduled' ? 'bg-amber-500 text-white' : 'bg-slate-900/80 text-white'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    {category?.name || 'Uncategorized'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{post.date}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between group-hover:bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-3xl transition-colors">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Read Preview</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <Eye className="w-16 h-16 mx-auto mb-4 text-slate-200" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No matching blogs found</h3>
          <p className="text-slate-400 max-w-sm mx-auto">Try changing your filters or search terms to preview different content.</p>
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
