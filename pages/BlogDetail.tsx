
import React, { useMemo } from 'react';
import { Post, Category, ContentBlock } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  ArrowRight,
  Globe
} from 'lucide-react';

interface BlogDetailProps {
  post: Post;
  category?: Category;
  allPosts: Post[];
  onBack: () => void;
  onSelectPost?: (postId: string) => void;
}

const BlogDetail: React.FC<BlogDetailProps> = ({ post, category, allPosts, onBack, onSelectPost }) => {
  const relatedArticles = useMemo(() => {
    return allPosts
      .filter(p => p.id !== post.id)
      .slice(0, 2);
  }, [allPosts, post.id]);

  const cleanHeading = (value: string) =>
    value
      .replace(/^#{1,6}\s*/, '')
      .trim();

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 key={block.id} className="text-2xl md:text-3xl font-bold text-slate-900 mt-12 mb-6 scroll-m-20">
            {cleanHeading(block.content as string)}
          </h2>
        );
      case 'paragraph':
        return (
          <p key={block.id} className="text-lg text-slate-600 leading-relaxed mb-6 last:mb-0">
            {block.content as string}
          </p>
        );
      case 'bullet_list':
        const items = Array.isArray(block.content) ? block.content : [block.content];
        return (
          <ul key={block.id} className="space-y-4 mb-8 ml-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-4 text-slate-600 text-lg">
                <div className="mt-2 w-5 h-5 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'image':
        return (
          <div key={block.id} className="my-10 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <img src={block.content as string} alt="" className="w-full h-auto" />
          </div>
        );
      case 'quote':
        return (
          <blockquote key={block.id} className="pl-6 border-l-4 border-indigo-500 italic text-xl text-slate-700 py-4 my-10 bg-indigo-50/50 rounded-r-2xl">
            {block.content as string}
          </blockquote>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-32 bg-slate-50 min-h-screen">
      {/* Top Header Controls */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100 px-8 py-3 flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review
        </button>
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
          post.status === 'Published' ? 'bg-emerald-500 text-white' :
          post.status === 'Scheduled' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
        }`}>
          {post.status} PREVIEW
        </span>
      </div>

      {/* Hero Header */}
      <div className="relative h-[600px] w-full overflow-hidden">
        <img src={post.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 backdrop-grayscale-[20%]" />
      </div>

      {/* Main Content Card */}
      <article className="relative z-10 -mt-80 max-w-4xl mx-auto px-4 md:px-0">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-900/10 overflow-hidden p-8 md:p-16">
          {/* Badge & Title */}
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1 rounded-full bg-[#EAB308] text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-lg shadow-amber-200">
              {category?.name || 'MARKET INSIGHTS'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.15] mb-8 tracking-tight max-w-3xl mx-auto">
              {post.title}
            </h1>
            
            {/* Meta Row */}
            <div className="flex items-center justify-center gap-8 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                {post.author}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full mb-16" />

          {/* Content Body */}
          <div className="prose prose-slate prose-lg max-w-none">
            <p className="text-lg text-slate-500 font-medium leading-[1.8] mb-12">
              {post.excerpt}
            </p>

            {post.blocksEn && post.blocksEn.length > 0 ? (
              post.blocksEn.map(renderBlock)
            ) : (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                This post has no content blocks yet.
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Articles Section */}
      <div className="max-w-4xl mx-auto mt-24 px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-slate-900 inline-block relative">
            Related Articles
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-amber-500 mx-auto w-12 rounded-full" />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {relatedArticles.map((article) => (
            <div 
              key={article.id} 
              onClick={() => onSelectPost?.(article.id)}
              className="group cursor-pointer bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-8">
                <h3 className="font-black text-slate-900 mb-4 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-600 transition-colors">
                  Learn More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="mt-32 border-t border-slate-200 pt-16 px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Copyright 2026 Long Form Content Agent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogDetail;
