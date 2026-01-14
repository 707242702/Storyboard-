
import React, { useState } from 'react';
import { StoryboardItem } from '../types';

interface StoryboardCardProps {
  item: StoryboardItem;
  onJumpTo: (timestamp: string) => void;
  index: number;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ item, onJumpTo, index }) => {
  const [copied, setCopied] = useState(false);

  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.reproductionPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col group cursor-pointer shadow-lg"
      onClick={() => onJumpTo(item.timestamp)}
    >
      {/* Visual Section */}
      <div className="relative aspect-video bg-black overflow-hidden border-b border-[#2a2a2a]">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={`Shot ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-tighter">Extracting Frame</span>
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="bg-black/80 backdrop-blur-md text-white text-[11px] font-black px-2 py-0.5 rounded border border-white/10">
            #{index + 1}
          </span>
          {index === 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">INTRO</span>
          )}
        </div>
        
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-md text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
            {item.duration}
          </span>
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="bg-black/80 backdrop-blur-md text-slate-300 text-[11px] font-mono px-2 py-1 rounded border border-white/5">
            {item.timestamp}
          </span>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="p-5 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h4 className="text-white text-sm font-black uppercase tracking-tight">{item.shotType}</h4>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.cameraMovement}</span>
          </div>
          <button 
            onClick={copyPrompt}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              copied ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {copied ? (
              <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg><span>Copied</span></>
            ) : (
              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg><span>Copy Prompt</span></>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-600 font-bold uppercase">Visual Description</span>
            <p className="text-slate-300 text-[12px] leading-relaxed line-clamp-2">{item.description}</p>
          </div>

          {item.subtitles && (
            <div className="p-2 bg-blue-500/5 rounded border border-blue-500/10">
              <span className="text-[9px] text-blue-400/70 font-bold uppercase block mb-1">Text / Subtitles</span>
              <p className="text-blue-200 text-[11px] leading-snug italic">"{item.subtitles}"</p>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] text-slate-600 font-bold uppercase">Prompt for Generation</span>
            <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-[11px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 group-hover:border-white/10 transition-colors">
              {item.reproductionPrompt}
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#2a2a2a] mt-auto">
          <span className="text-[10px] text-slate-500 font-medium flex items-center">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-2 shadow-sm shadow-orange-500/50"></div>
            {item.lighting}
          </span>
          {index === (index + 1) && ( // Placeholder logic for OUTRO if you wanted to flag it specifically
             <span className="text-[10px] font-bold text-slate-600">OUTRO</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;
