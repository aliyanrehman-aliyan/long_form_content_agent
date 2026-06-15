
import React, { useState } from 'react';
import { Post, Category } from '../types';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Plus,
  CheckCircle2,
  Clock
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

interface PostsProps {
  posts: Post[];
  categories: Category[];
  projectName: string;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCreatePost?: () => void;
  onEditPost?: (post: Post) => void;
}

const Posts: React.FC<PostsProps> = ({ posts, categories, projectName, onDelete, onToggleStatus, onCreatePost, onEditPost }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{projectName} Posts</h2>
            <InfoTooltip content="Review, edit, publish, and manage posts for the active project." />
          </div>
          <p className="text-slate-500">Manage, edit and publish your content</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={onCreatePost}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search posts..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 text-black placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-video overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEditPost?.(post)}
                      className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(post.id)}
                      className="p-2 bg-rose-500/20 backdrop-blur-md hover:bg-rose-500/40 rounded-lg text-rose-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    post.status === 'Published' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-900/60 backdrop-blur text-white'
                  }`}>
                    {post.status}
                  </span>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-slate-800 shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug h-12">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      {post.author[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex items-center gap-1 text-[11px] font-medium">
                      <Clock className="w-3 h-3" /> {post.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={post.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold text-slate-800 truncate max-w-[240px]">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onToggleStatus(post.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                        post.status === 'Published' 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {post.status === 'Published' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {post.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{post.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{post.author}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">{post.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEditPost?.(post)}
                        className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors" onClick={() => onDelete(post.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredPosts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No posts found</h3>
          <p className="text-slate-500">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default Posts;
