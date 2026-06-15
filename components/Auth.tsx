
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Globe, Loader2, Lock, Mail } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 text-center bg-indigo-600 text-white">
          <div className="bg-white/20 p-4 rounded-3xl inline-block mb-6 backdrop-blur-sm">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">Blog Management System</h1>
            <InfoTooltip content="Sign in to access project content management and publishing tools." />
          </div>
          <p className="text-indigo-100 font-medium">Dubai's Multi-Project Blog Manager</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-2">
              <Lock className="w-4 h-4" /> {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required 
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-black placeholder:text-slate-400"
                placeholder="admin@pointx.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required 
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-black placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In to Dashboard'}
          </button>
          
          <div className="pt-4 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authorized Access Only</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
