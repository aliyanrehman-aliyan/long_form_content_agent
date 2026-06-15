
import React, { useState, useRef } from 'react';
import { MediaAsset } from '../types';
import { 
  Upload, 
  Search, 
  Trash2, 
  X, 
  Copy, 
  ExternalLink, 
  Filter, 
  Check, 
  Image as ImageIcon,
  FileIcon,
  Download,
  PenLine
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

interface MediaPageProps {
  assets: MediaAsset[];
  onUpload: (files: FileList) => void;
  onDelete: (assetId: string) => void;
  onEditPost?: (postTitle: string) => void;
}

const MediaPage: React.FC<MediaPageProps> = ({ assets, onUpload, onDelete, onEditPost }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Used' | 'Unused'>('All');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const isUsed = asset.usedInPosts.length > 0;
    const matchesFilter = 
      filterStatus === 'All' || 
      (filterStatus === 'Used' && isUsed) || 
      (filterStatus === 'Unused' && !isUsed);
    return matchesSearch && matchesFilter;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Media Library</h2>
            <InfoTooltip content="Upload, search, and manage images and reusable assets for posts." />
          </div>
          <p className="text-slate-500">Manage images and assets for your blog project</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            className="hidden" 
            onChange={e => e.target.files && onUpload(e.target.files)} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Upload className="w-5 h-5" />
            Upload Media
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-black placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Used', 'Unused'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div 
        className={`flex-1 overflow-y-auto bg-white rounded-3xl border-2 border-dashed p-6 transition-all ${
          isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              <Upload className="w-12 h-12 opacity-20" />
            </div>
            <p className="font-bold text-slate-800">No media assets found</p>
            <p className="text-sm max-w-[200px] mt-2">Drag and drop files here or use the upload button</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredAssets.map(asset => (
              <div 
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                  selectedAsset?.id === asset.id 
                    ? 'border-indigo-600 ring-4 ring-indigo-500/5' 
                    : 'border-slate-50 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <img src={asset.url} alt={asset.altText} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{asset.fileSize}</span>
                </div>
                {asset.usedInPosts.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" title="Used in posts" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Panel */}
      {selectedAsset && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-slate-100 shadow-2xl animate-in slide-in-from-right duration-300 z-20 flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Media Details</h3>
              <InfoTooltip content="Inspect the selected asset, copy its URL, or see where it is used." />
            </div>
            <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              <img src={selectedAsset.url} alt="" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Filename</label>
                <p className="text-sm font-bold text-slate-800 break-all">{selectedAsset.filename}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Size</label>
                  <p className="text-xs font-semibold text-slate-600">{selectedAsset.fileSize}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Type</label>
                  <p className="text-xs font-semibold text-slate-600">{selectedAsset.mimeType}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Uploaded</label>
                <p className="text-xs font-semibold text-slate-600">{selectedAsset.createdAt}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Public URL</label>
                <InfoTooltip content="Copy the asset URL for use inside post content or external publishing." />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono outline-none text-black"
                  value={selectedAsset.url}
                />
                <button 
                  onClick={() => handleCopyUrl(selectedAsset.url)}
                  className={`p-2 rounded-lg border transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <div className="mb-3 flex items-center gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Used In</label>
                <InfoTooltip content="Lists posts currently referencing this media asset." />
              </div>
              <div className="space-y-2">
                {selectedAsset.usedInPosts.map((postTitle, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg group/item">
                    <div className="flex items-center gap-2 truncate">
                      <FileIcon className="w-3 h-3 text-indigo-400" />
                      <span className="truncate">{postTitle}</span>
                    </div>
                    {onEditPost && (
                      <button 
                        onClick={() => onEditPost(postTitle)}
                        className="p-1 hover:bg-indigo-600 hover:text-white rounded transition-colors text-indigo-600 opacity-0 group-hover/item:opacity-100"
                      >
                        <PenLine className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {selectedAsset.usedInPosts.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Not used in any posts yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-50 flex gap-3">
            <button 
              onClick={() => window.open(selectedAsset.url, '_blank')}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Preview
            </button>
            <button 
              onClick={() => {
                onDelete(selectedAsset.id);
                setSelectedAsset(null);
              }}
              className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
