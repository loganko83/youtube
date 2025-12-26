
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Monitor', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    )},
    { id: 'generator', label: 'Studio', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    )},
    { id: 'workflow', label: 'Neural Hub', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v10"/><path d="M18.4 4.6a10 10 0 1 1-12.8 0"/></svg>
    )},
    { id: 'analytics', label: 'Analytics', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    )},
  ];

  return (
    <aside className="w-72 bg-slate-950 border-r border-white/5 flex flex-col p-8 z-20">
      <div className="flex items-center gap-4 mb-16 px-2">
        <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-indigo-400/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M4 21h16"/><path d="M4 11h16"/><path d="M4 6h16"/><path d="M12 20V5"/></svg>
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter text-white block">TUBE<span className="text-indigo-500">GENIUS</span></span>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Studio OS</span>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border font-bold text-sm ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20 translate-x-1' 
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900/50 hover:translate-x-1'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Compute</p>
            <span className="text-[10px] font-bold text-indigo-400">65%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '65%' }}></div>
          </div>
          <button className="w-full bg-slate-100 text-slate-950 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">
            Upgrade Plan
          </button>
        </div>
      </div>
    </aside>
  );
};
