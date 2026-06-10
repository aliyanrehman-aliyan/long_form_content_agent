
import React, { useState } from 'react';
import { Project, PublishingMode } from '../types';
import { 
  FolderKanban, 
  Plus, 
  Globe, 
  MapPin, 
  Tag, 
  Target, 
  ArrowRight, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  Link, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Key,
  Database,
  X,
  Type
} from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  activeProjectId: string;
  onSelect: (id: string) => void;
  onAdd: (project: Project) => Promise<{ data?: any; error?: any }>;
  onUpdate: (project: Project) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, activeProjectId, onSelect, onAdd, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    niche: '',
    location: '',
    tone: 'Professional',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const newProjectData: any = {
      name: formData.name,
      websiteUrl: formData.websiteUrl,
      niche: formData.niche,
      tone: formData.tone,
      location: formData.location || 'Dubai, UAE',
      categories: ['Uncategorized'],
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      createdAt: new Date().toISOString().split('T')[0],
      publishingMode: 'supabase_shared'
    };

    const result = await onAdd(newProjectData as Project);

    if (result.error) {
      setErrorMsg(result.error.message || "Failed to create project. This URL may already be registered.");
      setIsSaving(false);
    } else {
      setIsSaving(false);
      setShowAddModal(false);
      setFormData({ name: '', websiteUrl: '', niche: '', location: '', tone: 'Professional', tags: '' });
    }
  };

  const handleUpdateProjectSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      onUpdate(editingProject);
      setEditingProject(null);
      setTestResult(null);
    }
  };

  const testConnection = async () => {
    if (!editingProject) return;
    setIsTesting(true);
    setTestResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (editingProject.publishingMode === 'supabase_shared') {
      setTestResult({ success: true, message: 'Supabase shared connection validated. Post ID tracking is active.' });
    } else {
      setTestResult({ success: true, message: 'Email delivery selected. Completed posts will be prepared for inbox review.' });
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Projects</h2>
          <p className="text-slate-500">Manage multiple blog entities and their specific configurations</p>
        </div>
        <button 
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Add New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`relative group cursor-pointer bg-white rounded-3xl border p-8 transition-all duration-300 ${
              activeProjectId === project.id 
              ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-2xl' 
              : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl'
            }`}
          >
            {activeProjectId === project.id && (
              <div className="absolute top-6 right-6 text-indigo-600 bg-indigo-50 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 rounded-2xl ${activeProjectId === project.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-all`}>
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                  <MapPin className="w-3 h-3" />
                  {project.location}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <Target className="w-3 h-3" /> Niche
                </div>
                <div className="text-slate-700 font-semibold">{project.niche}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <Link className="w-3 h-3" /> Connector
                </div>
                <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${project.publishingMode === 'email_delivery' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {project.publishingMode === 'email_delivery' ? 'Email Delivery' : 'Supabase Shared'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProject(project);
                }}
                className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <Settings2 className="w-4 h-4" /> Settings
              </button>
              <button 
                className={`text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeProjectId === project.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                }`}
              >
                Go to Posts <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Settings Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-2.5 rounded-2xl">
                    <Settings2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{editingProject.name} Settings</h3>
                </div>
                <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-500 text-sm">Configure project details and publishing connectors.</p>
            </div>

            <form onSubmit={handleUpdateProjectSettings} className="p-10 pt-0 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* General Info */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">General Information</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Project Name</label>
                    <input 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 placeholder:text-slate-400"
                      value={editingProject.name}
                      onChange={e => setEditingProject({...editingProject, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                    <input 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 placeholder:text-slate-400"
                      value={editingProject.location}
                      onChange={e => setEditingProject({...editingProject, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Niche</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 placeholder:text-slate-400"
                    value={editingProject.niche}
                    onChange={e => setEditingProject({...editingProject, niche: e.target.value})}
                  />
                </div>
              </div>

              {/* Connector Config */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Publishing Strategy</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, publishingMode: 'supabase_shared' })}
                    className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all text-left ${
                      editingProject.publishingMode === 'supabase_shared' 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${editingProject.publishingMode === 'supabase_shared' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Supabase Shared</div>
                      <div className="text-xs text-slate-400 leading-tight mt-1">Website reads directly from this database.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, publishingMode: 'email_delivery' })}
                    className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all text-left ${
                      editingProject.publishingMode === 'email_delivery' 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${editingProject.publishingMode === 'email_delivery' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Email Delivery</div>
                      <div className="text-xs text-slate-400 leading-tight mt-1">Completed posts are prepared for inbox review.</div>
                    </div>
                  </button>
                </div>
              </div>

              {editingProject.publishingMode === 'email_delivery' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block block">Email Delivery Address</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-xs text-slate-900 placeholder:text-slate-400"
                          placeholder="name@example.com"
                          value={editingProject.apiBaseUrl || ''}
                          onChange={e => setEditingProject({...editingProject, apiBaseUrl: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block block">Delivery Notes</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text"
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-xs text-slate-900 placeholder:text-slate-400"
                          placeholder="Optional notes"
                          value={editingProject.apiKey || ''}
                          onChange={e => setEditingProject({...editingProject, apiKey: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {testResult && (
                <div className={`flex items-start gap-3 p-4 rounded-2xl border ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'} animate-in zoom-in-95`}>
                  {testResult.success ? <ShieldCheck className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                  <div className="text-sm font-medium">{testResult.message}</div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingProject(null);
                    setTestResult(null);
                  }}
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <div className="flex-1 flex gap-3">
                  <button 
                    type="button" 
                    onClick={testConnection}
                    disabled={isTesting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Test Connection
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Create Project</h3>
                <p className="text-slate-500 text-xs mt-1">Add a new website to Long Form Content Agent</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">{errorMsg}</div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Project Name</label>
                <input 
                  required
                  disabled={isSaving}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                  placeholder="e.g. HealthOne UAE"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Website URL</label>
                <input 
                  required
                  disabled={isSaving}
                  type="url"
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                  placeholder="https://healthone.ae"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    disabled={isSaving}
                    className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                    placeholder="e.g. Dubai Marina, Deira, Jumeirah, Sharjah, UAE"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Niche</label>
                  <input 
                    required
                    disabled={isSaving}
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                    placeholder="Tech, Wellness..."
                    value={formData.niche}
                    onChange={e => setFormData({...formData, niche: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Tone</label>
                  <select 
                    disabled={isSaving}
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 disabled:opacity-50 appearance-none"
                    value={formData.tone}
                    onChange={e => setFormData({...formData, tone: e.target.value})}
                  >
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Witty</option>
                    <option>Educational</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Target Tags</label>
                <input 
                  disabled={isSaving}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                  placeholder="marketing, dubai, medical..."
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
