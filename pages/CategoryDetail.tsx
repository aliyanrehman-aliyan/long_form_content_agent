
import React, { useState } from 'react';
import { Category, Post, PostStatus } from '../types';
import { 
  ArrowLeft, 
  Layers, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import BlogDetail from './BlogDetail';
import InfoTooltip from '../components/InfoTooltip';

interface CategoryDetailProps {
  category: Category;
  posts: Post[];
  allPosts: Post[];
  onBack: () => void;
  onEditPost: (post: Post) => void;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({ category, posts, allPosts, onBack, onEditPost }) => {
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostIdForPreview, setSelectedPostIdForPreview] = useState<string | null>(null);

  const filteredPosts = posts.filter(p => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (selectedPostIdForPreview) {
    const post = posts.find(p => p.id === selectedPostIdForPreview);
    if (post) {
      return (
        <BlogDetail 
          post={post} 
          category={category} 
          allPosts={allPosts} 
          onBack={() => setSelectedPostIdForPreview(null)} 
          onSelectPost={(id) => setSelectedPostIdForPreview(id)}
        />
      );
    }
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <button onClick={onBack} className="mt-1 p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{category.name}</h2>
              <InfoTooltip content="View, filter, and manage posts assigned to this category." />
              <span className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                category.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {category.status}
              </span>
            </div>
            <p className="text-slate-500 max-w-2xl leading-relaxed">{category.description || 'No description provided for this category.'}</p>
          </div>
        </div>
        <div className="flex md:flex-col items-end gap-1 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="text-3xl font-black text-indigo-600 leading-none">{posts.length}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Posts</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search posts in this category..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-black placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {['All', 'Published', 'Scheduled', 'Draft'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="group bg-slate-50 border border-slate-100 rounded-3xl p-5 hover:bg-white hover:border-indigo-200 hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-5 border border-slate-200 shadow-sm">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button 
                    onClick={() => setSelectedPostIdForPreview(post.id)}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onEditPost(post)}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all transform translate-y-2 group-hover:translate-y-0 delay-75"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    post.status === 'Published' ? 'bg-emerald-500 text-white' :
                    post.status === 'Scheduled' ? 'bg-amber-500 text-white' : 'bg-slate-900/80 text-white'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug min-h-[40px] group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-6 h-8 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {post.date}
                </div>
                <div className="flex items-center gap-1.5">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Actions</span>
                </div>
              </div>
            </div>
          ))}
          {filteredPosts.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-800">No posts found</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">We couldn't find any posts in this category matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
