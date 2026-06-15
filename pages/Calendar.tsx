
import React, { useState, useMemo } from 'react';
import { Post } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  Edit3, 
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

interface CalendarProps {
  posts: Post[];
  onEditPost?: (post: Post) => void;
}

const Calendar: React.FC<CalendarProps> = ({ posts, onEditPost }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);
    const days = [];

    // Padding for start day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Helper to get YYYY-MM-DD from a local Date object without UTC shifting
  const getDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPostsForDay = (date: Date) => {
    const targetDateStr = getDateString(date);
    return posts.filter(post => {
      // All posts in the 'posts' array have a 'date' field in YYYY-MM-DD format (Dubai relative)
      return post.date === targetDateStr;
    });
  };

  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Content Calendar</h2>
            <InfoTooltip content="View scheduled, draft, and published posts by calendar date." />
          </div>
          <p className="text-slate-500 text-sm">Plan and track your posting schedule visually</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-800 min-w-[110px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/20" />;
              
              const dayPosts = getPostsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();

              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDay(day)}
                  className={`relative min-h-[70px] lg:min-h-[85px] p-2 border-r border-b border-slate-100 cursor-pointer transition-all hover:bg-indigo-50/30 group ${isSelected ? 'bg-indigo-50/50' : ''}`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-indigo-200' : isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {day.getDate()}
                  </span>
                  
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {dayPosts.map(post => (
                      <div 
                        key={post.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          post.status === 'Published' ? 'bg-emerald-500' :
                          post.status === 'Scheduled' ? 'bg-amber-500' : 'bg-indigo-400'
                        }`} 
                        title={`${post.status}: ${post.title}`}
                      />
                    ))}
                  </div>

                  {dayPosts.length > 0 && (
                    <div className="mt-auto pt-1 hidden group-hover:block animate-in fade-in duration-200">
                      <div className="text-[9px] font-bold text-indigo-600 uppercase">
                        {dayPosts.length} Post{dayPosts.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col overflow-hidden max-h-full">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 text-indigo-600" />
            {selectedDay ? monthNames[selectedDay.getMonth()] + ' ' + selectedDay.getDate() : 'Select a date'}
            <InfoTooltip content="Shows the posts planned for the selected calendar day." />
          </h3>

          {!selectedDay ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <CalendarIcon className="w-10 h-10 mb-3 opacity-10" />
              <p className="text-xs font-medium">Choose a day to view<br/>scheduled posts</p>
            </div>
          ) : selectedDayPosts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <Search className="w-10 h-10 mb-3 opacity-10" />
              <p className="text-xs font-medium">No content planned<br/>for this day</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {selectedDayPosts.map(post => (
                <div key={post.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                      post.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                      post.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{post.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {post.publishAt ? new Date(post.publishAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : 'All Day'}
                    </div>
                    <button 
                      onClick={() => onEditPost?.(post)}
                      className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2 pt-4 border-t border-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Legend</h4>
              <InfoTooltip content="Explains the color dots used for post status on the calendar." />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-indigo-400" /> Drafts
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Scheduled
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Published
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
