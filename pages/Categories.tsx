
import React, { useState } from 'react';
import { Category, Post, CategoryStatus } from '../types';
import { 
  Layers, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  Eye,
  X
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

interface CategoriesPageProps {
  categories: Category[];
  posts: Post[];
  projectId: string;
  onSave: (category: Category) => void;
  onDelete: (id: string) => void;
  onViewCategory: (id: string) => void;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories, posts, projectId, onSave, onDelete, onViewCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'Active' as CategoryStatus
  });

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        status: cat.status
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category: Category = {
      id: editingCategory?.id || Math.random().toString(36).substr(2, 9),
      projectId,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      status: formData.status,
      createdAt: editingCategory?.createdAt || new Date().toISOString().split('T')[0]
    };
    onSave(category);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Content Categories</h2>
            <InfoTooltip content="Organize posts into reusable project-specific topics and category groups." />
          </div>
          <p className="text-slate-500">Organize your content into project-specific topics</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          New Category
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-black placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Total Posts</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCategories.map((cat) => {
              const postCount = posts.filter(p => p.categoryId === cat.id).length;
              return (
                <tr 
                  key={cat.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => onViewCategory(cat.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">/{cat.slug}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                      {postCount} Posts
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      cat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{cat.createdAt}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(cat)} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(cat.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredCategories.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-medium">No categories found for this project.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-slate-800">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                  <InfoTooltip content="Create or update a category used to group related posts." />
                </div>
                <p className="text-slate-500 text-sm">Define a new topic for your project</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Name *</label>
                <input 
                  required
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-black placeholder:text-slate-400"
                  placeholder="e.g. Health & Wellness"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Slug</label>
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-slate-400 font-mono text-xs shadow-sm">
                  <span>/category/</span>
                  <input 
                    className="bg-transparent border-none outline-none flex-1 font-mono text-black"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Description</label>
                <textarea 
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none text-black placeholder:text-slate-400"
                  placeholder="Briefly describe what this category covers..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Status</label>
                <select 
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-black"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as CategoryStatus })}
                >
                  <option value="Active">Active</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
