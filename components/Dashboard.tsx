
import React from 'react';
import { NicheType, ContentConfig } from '../types';

interface DashboardProps {
  setActiveTab: (tab: any) => void;
  config: ContentConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, config }) => {
  const stats = [
    { label: 'Total Views', value: '2.4M', change: '+12%', color: 'text-emerald-400' },
    { label: 'Avg. RPM', value: '$18.40', change: '+5%', color: 'text-indigo-400' },
    { label: 'Time Saved', value: '142h', change: '+24h', color: 'text-amber-400' },
    { label: 'Active Channels', value: '8', change: 'Stable', color: 'text-slate-400' },
  ];

  const niches = [
    { type: NicheType.FINANCE, cpm: '$12-22', difficulty: 'Medium', color: 'bg-indigo-500' },
    { type: NicheType.TECH_AI, cpm: '$15-20', difficulty: 'Easy', color: 'bg-blue-500' },
    { type: NicheType.SENIOR_HEALTH, cpm: '$6.17', difficulty: 'Medium', color: 'bg-emerald-500' },
    { type: NicheType.HISTORY, cpm: '$5-9', difficulty: 'Easy', color: 'bg-amber-500' },
  ];

  return (
    /* Changed class to className */
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, Editor-in-Chief</h1>
          <p className="text-slate-400">Managing automation infrastructure across {config.niche} niches.</p>
        </div>
        <button 
          onClick={() => setActiveTab('generator')}
          /* Fixed class and stroke attributes for React */
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Content Project
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 glass">
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 glass">
            <h3 className="text-lg font-semibold mb-6">Market Opportunity Index</h3>
            <div className="space-y-4">
              {niches.map((niche, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className={`w-3 h-12 rounded-full ${niche.color}`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{niche.type}</p>
                    <p className="text-xs text-slate-500">Target CPM: {niche.cpm}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Difficulty: {niche.difficulty}</p>
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1">
                      <div className={`${niche.color} h-1.5 rounded-full`} style={{ width: niche.difficulty === 'Easy' ? '30%' : '60%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-2xl border border-slate-800 bg-indigo-600 shadow-xl shadow-indigo-600/10">
            <h3 className="text-lg font-bold text-white mb-2">B2B Potential</h3>
            <p className="text-indigo-100 text-sm mb-6">Scale your infrastructure to enterprise clients like nursing homes and real estate firms.</p>
            <ul className="space-y-3 mb-6">
              /* Fixed class and stroke attributes for React */
              <li className="flex items-center gap-2 text-sm text-indigo-50 text-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                White-Label Channels
              </li>
              <li className="flex items-center gap-2 text-sm text-indigo-50 text-opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Auto-CTA Insertion
              </li>
            </ul>
            <button className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
              Request B2B Access
            </button>
          </div>
          
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 glass">
            <h3 className="text-lg font-semibold mb-4 text-white">Logic Injection Status</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">System Health</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal</span>
            </div>
            <p className="text-xs text-slate-500 italic">"Gemini-3-Pro-Preview active. Orchestrating 12 n8n workflows across 4 regions."</p>
          </div>
        </div>
      </div>
    </div>
  );
};
