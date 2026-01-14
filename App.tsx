
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisStatus, StoryboardResponse, StoryboardItem } from './types';
import { analyzeVideoToStoryboard } from './services/geminiService';
import VideoPlayer from './components/VideoPlayer';
import StoryboardCard from './components/StoryboardCard';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<StoryboardResponse | null>(null);
  const [jumpTime, setJumpTime] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 150 * 1024 * 1024) {
        setError("File exceeds 150MB limit. Please upload a smaller clip.");
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
      setResult(null);
      setError('');
      setStatus(AnalysisStatus.IDLE);
    }
  };

  const timestampToSeconds = (ts: string, duration?: number): number => {
    const parts = ts.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    
    // Ensure we don't seek past the end if it's the outro
    if (duration && seconds >= duration) {
      return Math.max(0, duration - 0.5);
    }
    return seconds;
  };

  const captureThumbnails = async (scenes: StoryboardItem[]): Promise<void> => {
    if (!hiddenVideoRef.current) return;
    
    setStatus(AnalysisStatus.CAPTURING);
    const video = hiddenVideoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Wait for video metadata to get duration
    if (video.readyState < 1) {
      await new Promise(resolve => video.onloadedmetadata = resolve);
    }

    const updatedScenes = [...scenes];

    for (let i = 0; i < updatedScenes.length; i++) {
      const time = timestampToSeconds(updatedScenes[i].timestamp, video.duration);
      
      video.currentTime = time;
      await new Promise(resolve => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve(true);
        };
        video.addEventListener('seeked', onSeeked);
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      updatedScenes[i].thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      setResult(prev => prev ? { ...prev, scenes: [...updatedScenes] } : null);
    }
  };

  const processVideo = async () => {
    if (!videoFile) return;

    setStatus(AnalysisStatus.ANALYZING);
    setError('');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error("Failed to read file."));
      });
      reader.readAsDataURL(videoFile);
      const base64Data = await base64Promise;

      const storyboard = await analyzeVideoToStoryboard(base64Data, videoFile.type);
      setResult(storyboard);
      
      await captureThumbnails(storyboard.scenes);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      console.error("Analysis Failed:", err);
      setError(err.message || "The AI analysis failed. This could be due to video length or formatting.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleJumpTo = (ts: string) => {
    const video = hiddenVideoRef.current;
    setJumpTime(timestampToSeconds(ts, video?.duration));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070707] text-slate-100 pb-24 selection:bg-blue-500/30 font-sans">
      <video ref={hiddenVideoRef} src={videoUrl} className="hidden" crossOrigin="anonymous" muted />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#070707]/90 backdrop-blur-2xl border-b border-white/5 px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-700 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">LENS ANALYTICS</h1>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Story & Prompt Extraction</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             {videoFile && (
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 transition-all"
              >
                Change Clip
              </button>
             )}
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 mt-10">
        {!videoFile ? (
          <div className="flex flex-col items-center justify-center min-h-[75vh] border border-white/5 rounded-[2.5rem] p-16 text-center bg-gradient-to-b from-[#0f0f0f] to-transparent shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)] pointer-events-none"></div>
            <div className="w-28 h-28 bg-[#141414] rounded-[2rem] flex items-center justify-center mb-10 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Extract Cinematic Data</h2>
            <p className="text-slate-500 mb-12 max-w-xl text-lg leading-relaxed font-medium">Upload a video (max 70s) to automatically generate storyboards with AI reproduction prompts and text extraction.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.1em] rounded-2xl shadow-2xl shadow-blue-600/30 transition-all transform hover:translate-y-[-2px] active:translate-y-0"
            >
              Select Project File
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-16">
            {/* Player Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 group">
                <VideoPlayer src={videoUrl} currentTime={jumpTime} />
              </div>
              
              <div className="lg:col-span-4 flex flex-col justify-center">
                <div className="p-8 bg-[#121212] border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                   </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 mb-8 flex items-center">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                    Workflow Control
                  </h3>
                  
                  {status === AnalysisStatus.IDLE || status === AnalysisStatus.ERROR ? (
                    <button 
                      onClick={processVideo}
                      className="w-full py-6 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-3 transition-all hover:bg-blue-50 active:scale-[0.98] shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.447l6 11a1 1 0 01-.897 1.506h-13a1 1 0 01-.897-1.506l6-11a1 1 0 01.897-.447zm-1.3 12.953a1 1 0 100-2 1 1 0 000 2zm1-8V6a1 1 0 11-2 0v1a1 1 0 012 0z" clipRule="evenodd" />
                      </svg>
                      <span>Run AI Analysis</span>
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center p-6 bg-black/40 rounded-2xl border border-white/5 text-center">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <span className="text-sm font-black uppercase tracking-widest text-white mb-1">
                          {status === AnalysisStatus.ANALYZING ? "Scanning Video..." : "Extracting Frames..."}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                          Identifying cinematic patterns and text
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-6 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start space-x-3">
                      <div className="w-5 h-5 bg-red-500 text-black rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black">!</div>
                      <p className="text-red-400 text-xs font-bold leading-relaxed tracking-tight">{error}</p>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-col space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                      <span>File Format</span>
                      <span className="text-slate-300">{videoFile.type.split('/')[1]}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                      <span>Max Input</span>
                      <span className="text-slate-300">70 Seconds</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-6 md:space-y-0 border-b border-white/5 pb-12">
                  <div className="max-w-3xl">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/20">Analysis Ready</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-white mb-4 italic uppercase">{result.title}</h2>
                    <p className="text-slate-500 text-xl font-medium leading-relaxed">{result.summary}</p>
                  </div>
                  
                  <div className="flex bg-[#121212] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                    <button className="px-6 py-3 text-[11px] font-black uppercase tracking-widest bg-[#252525] text-white rounded-xl shadow-lg">Default Grid</button>
                    <button className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">Compact List</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {result.scenes.map((scene, idx) => (
                    <StoryboardCard 
                      key={idx} 
                      index={idx} 
                      item={scene} 
                      onJumpTo={handleJumpTo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skeleton State */}
            {status === AnalysisStatus.ANALYZING && !result && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-[#121212] rounded-3xl animate-pulse" />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
