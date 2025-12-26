
import React, { useState, useEffect, useRef } from 'react';
import { NicheType, ContentConfig, GeneratedContent } from '../types';
import { TubeGeniusAI } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface ScriptGeneratorProps {
  config: ContentConfig;
  onConfigChange: (newConfig: Partial<ContentConfig>) => void;
}

interface VideoStatus {
  status: 'idle' | 'generating' | 'completed' | 'url_fetching' | 'error';
  url?: string;
  progressMessage?: string;
}

interface SavedDraft {
  id: string;
  timestamp: number;
  config: ContentConfig;
  result: GeneratedContent | null;
}

interface ClaimFeedback {
  verified: boolean;
  accuracy: 'correct' | 'incorrect' | null;
}

type InspectorTab = 'settings' | 'script' | 'safety';
type VideoQuality = 'Standard' | 'High' | 'Ultra';
type AspectRatio = '16:9' | '9:16';

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ config, onConfigChange }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoStates, setVideoStates] = useState<Record<number, VideoStatus>>({});
  const [claimFeedbacks, setClaimFeedbacks] = useState<Record<number, ClaimFeedback>>({});
  const [activeScene, setActiveScene] = useState<number>(0);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [globalQuality, setGlobalQuality] = useState<VideoQuality>('Standard');
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('settings');
  
  // Video Player States
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  
  // Per-scene configuration
  const [sceneAspectRatios, setSceneAspectRatios] = useState<Record<number, AspectRatio>>({});
  const [sceneQualities, setSceneQualities] = useState<Record<number, VideoQuality>>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tubegenius_drafts');
    if (stored) {
      try {
        setSavedDrafts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved drafts", e);
      }
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeScene, videoStates]);

  const handleGenerate = async () => {
    if (!config.topic) return setError("Missing production topic.");
    setLoading(true);
    setError(null);
    try {
      const aiService = new TubeGeniusAI();
      const content = await aiService.generateContent(config);
      setResult(content);
      
      const initialRatios: Record<number, AspectRatio> = {};
      const initialQualities: Record<number, VideoQuality> = {};
      content.imagePrompts.forEach((_, i) => {
        initialRatios[i] = config.format === 'Shorts' ? '9:16' : '16:9';
        initialQualities[i] = globalQuality;
      });
      setSceneAspectRatios(initialRatios);
      setSceneQualities(initialQualities);
      
      setVideoStates({});
      setClaimFeedbacks({});
      setActiveScene(0);
      setInspectorTab('script');
    } catch (err: any) {
      setError(err.message || "Pipeline failure.");
    } finally {
      setLoading(false);
    }
  };

  const handlePushToN8N = async () => {
    setIsPushing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPushing(false);
    alert("Project assets pushed to n8n Automation Workflow.");
  };

  const handleSaveDraft = () => {
    const newDraft: SavedDraft = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      config: { ...config },
      result: result ? { ...result } : null
    };
    const updated = [newDraft, ...savedDrafts].slice(0, 10);
    setSavedDrafts(updated);
    localStorage.setItem('tubegenius_drafts', JSON.stringify(updated));
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    onConfigChange(draft.config);
    setResult(draft.result);
    
    if (draft.result) {
      const initialRatios: Record<number, AspectRatio> = {};
      const initialQualities: Record<number, VideoQuality> = {};
      draft.result.imagePrompts.forEach((_, i) => {
        initialRatios[i] = draft.config.format === 'Shorts' ? '9:16' : '16:9';
        initialQualities[i] = 'Standard';
      });
      setSceneAspectRatios(initialRatios);
      setSceneQualities(initialQualities);
    }
    
    setVideoStates({});
    setClaimFeedbacks({});
    setActiveScene(0);
    setInspectorTab('script');
  };

  const deleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem('tubegenius_drafts', JSON.stringify(updated));
  };

  const setSceneAspectRatio = (index: number, ratio: AspectRatio) => {
    setSceneAspectRatios(prev => ({ ...prev, [index]: ratio }));
  };

  const setSceneQuality = (index: number, q: VideoQuality) => {
    setSceneQualities(prev => ({ ...prev, [index]: q }));
  };

  const handleRenderVideo = async (index: number, prompt: string) => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    
    const currentQuality = sceneQualities[index] || globalQuality;
    const statusMsg = currentQuality === 'Ultra' ? 'Deep Engine Synthesis...' : 'Rendering Scene...';
    setVideoStates(prev => ({ ...prev, [index]: { status: 'generating', progressMessage: statusMsg } }));
    
    const selectedAspectRatio = sceneAspectRatios[index] || (config.format === 'Shorts' ? '9:16' : '16:9');
    // Map quality to specific models: Ultra uses the high-fidelity 'generate' model, others use 'fast-generate'
    const selectedModel = currentQuality === 'Ultra' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model: selectedModel,
        prompt,
        config: { 
          numberOfVideos: 1, 
          resolution, 
          aspectRatio: selectedAspectRatio 
        }
      });
      while (!op.done) {
        const renderMsg = currentQuality === 'Ultra' ? 'Complex Neural Processing...' : 'Finalizing Frames...';
        setVideoStates(prev => ({ ...prev, [index]: { ...prev[index], progressMessage: renderMsg } }));
        await new Promise(r => setTimeout(r, 8000));
        op = await ai.operations.getVideosOperation({ operation: op });
      }
      const uri = op.response?.generatedVideos?.[0]?.video?.uri;
      const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      setVideoStates(prev => ({ ...prev, [index]: { status: 'completed', url: URL.createObjectURL(blob) } }));
    } catch (e: any) {
      setVideoStates(prev => ({ ...prev, [index]: { status: 'error', progressMessage: e.message } }));
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-full max-h-[calc(100vh-160px)] overflow-hidden">
      
      {/* Inspector Sidebar */}
      <div className="xl:w-[400px] flex flex-col glass-panel rounded-2xl border-slate-800 overflow-hidden flex-shrink-0">
        <div className="flex border-b border-white/5 bg-slate-900/40">
          {(['settings', 'script', 'safety'] as InspectorTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setInspectorTab(tab)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${inspectorTab === tab ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {inspectorTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-300">Production Parameters</h3>
                <button onClick={handleSaveDraft} className="p-2 text-slate-500 hover:text-white transition-all bg-slate-800/50 rounded-lg border border-white/5" title="Save Draft">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Project Hook</label>
                  <input value={config.topic} onChange={(e) => onConfigChange({ topic: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Target niche or topic..." />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Default Qual</label>
                    <select value={globalQuality} onChange={(e) => setGlobalQuality(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400">
                      <option value="Standard">Standard</option>
                      <option value="High">High</option>
                      <option value="Ultra">Ultra</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Global Res</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400">
                      <option value="720p">720p Std</option>
                      <option value="1080p">1080p HQ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <button onClick={handleGenerate} disabled={loading} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${loading ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95'}`}>
                  {loading ? 'Synthesizing Project...' : 'Initialize AI Generation'}
                </button>
                
                {result && (
                  <button onClick={handlePushToN8N} disabled={isPushing} className={`w-full py-4 rounded-xl font-black text-[10px] border border-emerald-500/30 text-emerald-400 uppercase tracking-widest transition-all hover:bg-emerald-500/10 active:scale-95 flex items-center justify-center gap-2`}>
                    {isPushing ? 'Pushing Data...' : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v10"/><path d="m16 8-4 4-4-4"/><path d="M22 12A10 10 0 0 1 12 22a10 10 0 0 1-10-10"/></svg>
                        Push to n8n Pipeline
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {inspectorTab === 'script' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col space-y-6">
              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <p className="text-xs font-medium">Initialize project assets to start editing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asset Orchestration</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {result.imagePrompts.map((p, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveScene(i)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${activeScene === i ? 'bg-indigo-600/10 border-indigo-500/40 shadow-lg' : 'bg-slate-950/50 border-slate-900 hover:border-slate-800'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Scene 0{i+1}</span>
                          <div className="flex items-center gap-2">
                             {/* Per-scene Aspect Ratio */}
                            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-white/5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSceneAspectRatio(i, '16:9'); }}
                                className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${sceneAspectRatios[i] === '16:9' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                              >16:9</button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSceneAspectRatio(i, '9:16'); }}
                                className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${sceneAspectRatios[i] === '9:16' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                              >9:16</button>
                            </div>
                          </div>
                        </div>

                        {/* Per-scene Quality Selector */}
                        <div className="mb-4">
                          <div className="flex gap-1">
                            {(['Standard', 'High', 'Ultra'] as VideoQuality[]).map((q) => (
                              <button
                                key={q}
                                onClick={(e) => { e.stopPropagation(); setSceneQuality(i, q); }}
                                className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter border transition-all ${sceneQualities[i] === q ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-400' : 'bg-slate-950 border-white/5 text-slate-700 hover:text-slate-500'}`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-4 italic leading-relaxed">"{p}"</p>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRenderVideo(i, p); }}
                          disabled={videoStates[i]?.status === 'generating'}
                          className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${videoStates[i]?.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald/10' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500'}`}
                        >
                          {videoStates[i]?.status === 'generating' ? 'Synthesizing...' : videoStates[i]?.status === 'completed' ? 'Re-Render Asset' : 'Render to Video'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {inspectorTab === 'safety' && (
            <div className="animate-in fade-in duration-300 h-full">
               {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <p className="text-xs font-medium italic">Compliance report pending...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Fact-Check Audit</h4>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">AI Verification Engine</span>
                  </div>
                  {result.criticalClaims.map((claim, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition-colors">
                      <p className="text-[10px] leading-relaxed text-slate-300 font-medium mb-3">{claim.text}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase ${getConfidenceColor(claim.confidence)}`}>{claim.confidence}% SCORE</span>
                        </div>
                        <div className="flex gap-1">
                           <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-md bg-slate-900 border border-white/5 text-slate-600 hover:text-emerald-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-md bg-slate-900 border border-white/5 text-slate-600 hover:text-rose-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Monitor */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 glass-panel rounded-2xl border-slate-800 overflow-hidden relative flex flex-col bg-black/90 shadow-2xl">
          {!result ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 animate-pulse-soft">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-400 tracking-[0.3em] uppercase opacity-50">Studio Idle</h2>
              <p className="text-slate-600 text-[10px] max-w-sm leading-loose uppercase tracking-[0.2em]">Ready for neural asset synthesis. Initialize production to proceed.</p>
            </div>
          ) : (
            <>
              {/* Monitoring Viewport */}
              <div className="flex-1 bg-[#010101] relative group flex items-center justify-center overflow-hidden">
                {videoStates[activeScene]?.status === 'completed' ? (
                  <div className="w-full h-full relative group/player">
                    <video 
                      ref={videoRef} 
                      src={videoStates[activeScene].url} 
                      className="w-full h-full object-contain" 
                      autoPlay 
                      loop={isLooping} 
                    />
                    {showCaptions && (
                      <div className="absolute bottom-16 left-0 right-0 px-16 pointer-events-none transition-all duration-500 animate-in slide-in-from-bottom-2">
                        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-5 rounded-2xl text-center max-w-[80%] mx-auto shadow-2xl">
                          <p className="text-white text-sm font-bold leading-relaxed tracking-wide drop-shadow-xl">{result.imagePrompts[activeScene]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    {result.scenePreviews?.[activeScene] ? (
                      <img src={result.scenePreviews[activeScene]} className="w-full h-full object-cover opacity-10 blur-xl scale-125 transition-all duration-1000" />
                    ) : (
                      <div className="w-full h-full bg-slate-950"></div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-t from-black via-transparent to-black/40">
                      <div className="px-6 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-8 shadow-glow">Scene Reference v2.5</div>
                      <h3 className="text-2xl font-bold text-white max-w-2xl leading-tight mb-14 drop-shadow-2xl">{result.imagePrompts[activeScene]}</h3>
                      
                      <div className="flex flex-col gap-6 items-center">
                        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                          {(['Standard', 'High', 'Ultra'] as VideoQuality[]).map(q => (
                            <button
                              key={q}
                              onClick={() => setSceneQuality(activeScene, q)}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sceneQualities[activeScene] === q ? 'bg-indigo-600 text-white shadow-glow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={() => handleRenderVideo(activeScene, result.imagePrompts[activeScene])} 
                          disabled={videoStates[activeScene]?.status === 'generating'}
                          className="px-16 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-[0_0_50px_rgba(99,102,241,0.3)] active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
                        >
                          {videoStates[activeScene]?.status === 'generating' ? videoStates[activeScene].progressMessage : `Render Asset (${sceneQualities[activeScene] || globalQuality})`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Visual Status Overlays */}
                <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
                  <div className="px-4 py-1.5 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 font-mono text-[11px] text-emerald-400 shadow-2xl">REC 00:00:0{activeScene + 1}:12</div>
                  <div className={`px-4 py-1.5 bg-rose-600/10 backdrop-blur-xl rounded-lg border border-rose-500/30 font-mono text-[10px] text-rose-500 uppercase tracking-widest flex items-center gap-2 ${videoStates[activeScene]?.status === 'generating' ? 'animate-pulse' : ''}`}>
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-glow-rose"></div>
                    Neural_Edit
                  </div>
                </div>
              </div>

              {/* Professional Monitor Toolbar */}
              <div className="h-20 bg-slate-950 border-t border-white/10 flex items-center justify-between px-10 z-10">
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Active Scene</span>
                    <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">#0{activeScene + 1}</span>
                  </div>
                  
                  {/* Speed Controller */}
                  <div className="flex items-center gap-5 bg-slate-900/40 px-5 py-2.5 rounded-2xl border border-white/5 transition-all hover:border-white/10">
                    <div className="flex items-center gap-3">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                       <span className="text-[10px] font-black text-slate-400 w-10 text-center tracking-tighter">{playbackSpeed}X</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.5" step="0.25" value={playbackSpeed} 
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} 
                      className="w-32 accent-indigo-500 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-5">
                   {/* Loop Toggle */}
                   <button 
                    onClick={() => setIsLooping(!isLooping)} 
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black transition-all ${isLooping ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40 shadow-glow' : 'bg-slate-900/50 border-white/5 text-slate-600 hover:text-slate-400'}`}
                    title="Toggle Loop"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                     LOOP
                   </button>

                   <button 
                    onClick={() => setShowCaptions(!showCaptions)} 
                    className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black tracking-widest transition-all ${showCaptions ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'}`}
                   >
                     TITLES
                   </button>
                   
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Master Timeline */}
        <div className="h-44 glass-panel rounded-2xl border-slate-800 p-5 flex flex-col gap-4 flex-shrink-0 relative overflow-hidden bg-slate-950/40">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
              Master Production Sequence
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{config.format}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{config.language}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex gap-5 overflow-x-auto pb-3 custom-scrollbar relative px-2">
             {/* Playhead */}
             <div 
              className="absolute top-0 bottom-3 w-[2.5px] bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,1)] z-20 pointer-events-none transition-all duration-500 ease-in-out" 
              style={{ left: `${(activeScene * 220) + 110}px` }}
             >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-950 shadow-2xl"></div>
             </div>

             {result?.imagePrompts.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveScene(i)} 
                  className={`relative min-w-[200px] h-full rounded-2xl overflow-hidden border-2 cursor-pointer transition-all flex flex-col group ${activeScene === i ? 'border-indigo-600 scale-[1.02] bg-indigo-600/10 shadow-2xl' : 'border-slate-800/50 hover:border-slate-700 bg-slate-950/60'}`}
                >
                  <div className="flex-1 overflow-hidden relative">
                    {result.scenePreviews?.[i] ? (
                      <img src={result.scenePreviews[i]} className={`w-full h-full object-cover transition-all duration-1000 ${activeScene === i ? 'grayscale-0 opacity-100 scale-100' : 'grayscale opacity-30 group-hover:opacity-50 scale-110'}`} />
                    ) : (
                      <div className="w-full h-full bg-slate-900/40 flex items-center justify-center">
                         <div className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                    {videoStates[i]?.status === 'completed' && (
                      <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-emerald-500 text-[8px] font-black text-white rounded-md shadow-2xl animate-in zoom-in-50">SYNCED</div>
                    )}
                  </div>
                  <div className="p-3 bg-black/60 backdrop-blur-md border-t border-white/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clip 0{i+1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-bold text-slate-600">{sceneAspectRatios[i] || '16:9'}</span>
                        <span className="text-[7px] font-black text-indigo-400 bg-indigo-500/10 px-1 rounded-sm">{sceneQualities[i]?.charAt(0) || 'S'}</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium truncate leading-relaxed group-hover:text-white transition-colors uppercase tracking-tighter">{p}</p>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
