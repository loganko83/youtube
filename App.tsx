
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ScriptGenerator } from './components/ScriptGenerator';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { ContentConfig, NicheType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'workflow' | 'analytics'>('dashboard');
  const [config, setConfig] = useState<ContentConfig>({
    niche: NicheType.SENIOR_HEALTH,
    topic: '',
    tone: 'Friendly',
    format: 'Shorts',
    language: 'Korean'
  });

  const handleConfigChange = (newConfig: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleOpenApiKeyDialog = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} config={config} />;
      case 'generator':
        return <ScriptGenerator config={config} onConfigChange={handleConfigChange} />;
      case 'workflow':
        return <WorkflowVisualizer config={config} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} config={config} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* API Key Banner for Veo */}
          <div className="mb-6 p-4 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Veo Video Engine Active</p>
                <p className="text-xs text-slate-400">High-quality video generation requires a paid Google Cloud Project API Key.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-indigo-400 hover:underline"
              >
                Billing Docs
              </a>
              <button 
                onClick={handleOpenApiKeyDialog}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Set API Key
              </button>
            </div>
          </div>

          {renderContent()}
        </div>
        
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>
      </main>
    </div>
  );
};

export default App;
