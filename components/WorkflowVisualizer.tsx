
import React from 'react';
import { ContentConfig } from '../types';

interface WorkflowVisualizerProps {
  config: ContentConfig;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ config }) => {
  const steps = [
    { id: '1', name: 'Trigger', type: 'Input', desc: 'RSS, URL, or Manual prompt' },
    { id: '2', name: 'Logic Injection', type: 'Gemini', desc: 'Niche-specific system instructions' },
    { id: '3', name: 'Asset Gen', type: 'AI Tool', desc: 'Image & Voiceover synthesis' },
    { id: '4', name: 'Assembly', type: 'Render API', desc: 'SaaS Rendering (Shotstack/Creatomate)' },
    { id: '5', name: 'Compliance', type: 'Audit', desc: 'YouTube Community Guidelines check' },
    { id: '6', name: 'Publish', type: 'YT API', desc: 'Scheduled as Draft/Scheduled' },
  ];

  return (
    /* Changed class to className */
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <header>
        <h2 className="text-2xl font-bold text-white mb-2">Automation Orchestration</h2>
        <p className="text-slate-400">Current Pipeline: <span className="text-indigo-400 font-mono">tube_genius_v4_{config.niche.toLowerCase().replace(/\s+/g, '_')}</span></p>
      </header>

      <div className="relative overflow-x-auto pb-10">
        <div className="flex items-center gap-12 min-w-max p-4">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="group relative">
                <div className="w-48 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 glass hover:border-indigo-500/50 transition-all cursor-default">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{step.type}</span>
                  <h4 className="text-white font-bold mt-1">{step.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
                  
                  {/* Active Indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                </div>
              </div>
              
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-slate-800"></div>
                  /* Fixed class and stroke attributes for React */
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 glass">
          <h3 className="text-lg font-bold text-white mb-6">Pipeline Logs</h3>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex gap-4">
              <span className="text-slate-600">[14:20:01]</span>
              <span className="text-emerald-400">INFO</span>
              <span className="text-slate-300">Successfully fetched data from Yahoo Finance API.</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-600">[14:20:04]</span>
              <span className="text-indigo-400">AI</span>
              <span className="text-slate-300">Gemini 3 Pro generated script in 2.4s.</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-600">[14:20:08]</span>
              <span className="text-emerald-400">INFO</span>
              <span className="text-slate-300">Audit engine passed 10/10 safety checks.</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-600">[14:21:12]</span>
              <span className="text-amber-400">WARN</span>
              <span className="text-slate-300">Asset 04 low resolution. Retrying generation...</span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 glass">
          <h3 className="text-lg font-bold text-white mb-4">Infrastructure Settings</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Auto-Scaling</span>
              <span className="text-sm text-indigo-400 font-bold">Enabled</span>
            </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Retry Logic</span>
              <span className="text-sm text-slate-300">Exp. Backoff (3x)</span>
            </div>
             <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-400">Deployment Type</span>
              <span className="text-sm text-slate-300 font-mono">Edge / n8n-Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
