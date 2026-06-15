
import React from 'react';
import { Project, Post } from '../types';
import { 
  Eye, 
  MousePointer2, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import InfoTooltip from '../components/InfoTooltip';

interface DashboardProps {
  project: Project;
  posts: Post[];
  onCreatePost?: () => void;
}

const TRAFFIC_DATA = [
  { name: 'Mon', views: 4000, visits: 2400 },
  { name: 'Tue', views: 3000, visits: 1398 },
  { name: 'Wed', views: 2000, visits: 9800 },
  { name: 'Thu', views: 2780, visits: 3908 },
  { name: 'Fri', views: 1890, visits: 4800 },
  { name: 'Sat', views: 2390, visits: 3800 },
  { name: 'Sun', views: 3490, visits: 4300 },
];

const CATEGORY_DATA = [
  { name: 'Health', count: 45, color: '#4f46e5' },
  { name: 'Food', count: 21, color: '#10b981' },
  { name: 'Tech', count: 18, color: '#f59e0b' },
  { name: 'Life', count: 32, color: '#ec4899' },
];

const Dashboard: React.FC<DashboardProps> = ({ project, posts, onCreatePost }) => {
  const stats = [
    { label: 'Total Views', value: '124,592', change: '+12.5%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unique Visitors', value: '48,210', change: '+8.2%', icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg. Session', value: '4m 32s', change: '-2.4%', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bounce Rate', value: '42.3%', change: '+1.1%', icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{project.name} Overview</h2>
            <InfoTooltip content="Summarizes project activity, content performance, and recent work." />
          </div>
          <p className="text-slate-500">Performance insights for {project.websiteUrl}</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Export Report
          </button>
          <button 
            onClick={onCreatePost}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change}
                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Traffic Analysis</h3>
              <InfoTooltip content="Shows recent views and visits for the project content." />
            </div>
            <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-2 py-1 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Popular Categories</h3>
            <InfoTooltip content="Highlights category groups with the most content activity." />
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} width={70} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <button className="w-full py-2 text-indigo-600 text-sm font-semibold hover:underline flex items-center justify-center gap-2">
              View Category Settings <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Posts Snippet */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Recent Posts</h3>
            <InfoTooltip content="Lists the newest posts in this project for quick review." />
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
        </div>
        <div className="divide-y divide-slate-50">
          {posts.slice(0, 3).map((post) => (
            <div key={post.id} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
              <img src={post.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-800 truncate mb-1">{post.title}</h4>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">1.2k</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Views</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  post.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {post.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
