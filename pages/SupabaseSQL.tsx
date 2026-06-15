
import React, { useState } from 'react';
import { Copy, Check, Database, Code, Download, Info, Globe, Clock, Shield } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

const SupabaseSQL: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- ==========================================
-- Long Form Content Agent Supabase Database Schema
-- Optimized for Dubai (EN/AR) Multi-Project CMS
-- ==========================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL UNIQUE,
  niche TEXT,
  tone TEXT,
  target_location TEXT DEFAULT 'Dubai, UAE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- Blog Posts Table (Matches App.tsx implementation)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Content Fields
  title_en TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_ar TEXT,
  
  -- Status & Scheduling
  status post_status DEFAULT 'draft',
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Featured Assets & SEO
  featured_image_url TEXT,
  focus_keyword TEXT,
  seo_title TEXT,
  meta_description TEXT,
  
  -- Structured Content (JSONB)
  blocks_en JSONB DEFAULT '[]'::jsonb,
  blocks_ar JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, slug)
);

-- Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Storage Setup Instructions
-- Note: You must manually create a public bucket named 'media' in Supabase Storage.

-- 4. Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage data (Admin Access)
CREATE POLICY "Admin All Projects" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Posts" ON blog_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Media" ON media_assets FOR ALL TO authenticated USING (true);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_project ON blog_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_publish_at ON blog_posts(publish_at);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);

-- 6. Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_projects_ts BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_posts_ts BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSQL = () => {
    const element = document.createElement("a");
    const file = new Blob([sqlSchema], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "omnicms_supabase_schema.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">Supabase SQL Schema</h2>
              <InfoTooltip content="Reference SQL for the app's database structure and setup notes." />
            </div>
            <p className="text-slate-500">Accurate database architecture matching your current app logic</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadSQL}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download .sql</span>
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-indigo-600 px-5 py-2.5 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-white" /><span>Copied!</span></>
            ) : (
              <><Copy className="w-4 h-4" /><span>Copy SQL</span></>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800 leading-relaxed">
          <span className="font-bold">Important:</span> Paste this into the Supabase SQL Editor. Also, ensure you create a <strong>Public Bucket</strong> in Storage named <code className="bg-blue-100 px-1 rounded">media</code> for image uploads to work.
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
         <div className="absolute top-4 right-4 bg-slate-800/80 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-400">POSTGRESQL</div>
          <pre className="p-8 text-[#94a3b8] font-mono text-sm leading-relaxed overflow-x-auto max-h-[70vh] custom-scrollbar selection:bg-indigo-500/30">
            <code>
              {sqlSchema.split('\n').map((line, i) => {
                if (line.startsWith('--')) return <span key={i} className="text-slate-500 italic">{line}{'\n'}</span>;
                if (line.match(/CREATE TABLE|CREATE TYPE|ALTER TABLE|CREATE INDEX|CREATE OR REPLACE FUNCTION|CREATE TRIGGER|DO \$\$/)) 
                  return <span key={i} className="text-indigo-400 font-bold">{line}{'\n'}</span>;
                if (line.match(/UUID|TEXT|TIMESTAMPTZ|JSONB|INT|BIGINT|REFERENCES|PRIMARY KEY|DEFAULT|NOT NULL/))
                  return <span key={i} className="text-sky-300">{line}{'\n'}</span>;
                return <span key={i}>{line}{'\n'}</span>;
              })}
            </code>
          </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Database, label: "JSONB Content", detail: "Bilingual blocks in JSONB", color: "bg-emerald-100 text-emerald-600" },
          { icon: Globe, label: "Multilingual", detail: "AR/EN field support", color: "bg-indigo-100 text-indigo-600" },
          { icon: Clock, label: "Lifecycle", detail: "Scheduled post support", color: "bg-amber-100 text-amber-600" },
          { icon: Shield, label: "RLS Active", detail: "Admin-level protection", color: "bg-rose-100 text-rose-600" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{stat.label}</h4>
            <p className="text-xs text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupabaseSQL;
