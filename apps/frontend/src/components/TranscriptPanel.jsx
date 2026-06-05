import React, { useEffect, useRef } from 'react';
import { MessageSquare, Bot, User, Terminal, ArrowDown } from 'lucide-react';

export function TranscriptPanel({ transcript }) {
  const containerRef = useRef(null);

  // Auto-scroll to the bottom when transcript updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="glass-card rounded-3xl p-6 glow-indigo relative overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold tracking-wide text-slate-100">Live Conversation Transcript</h2>
        </div>
      </div>

      {/* Transcript Log Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 scroll-smooth"
      >
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic gap-2 select-none">
            <Bot className="w-8 h-8 text-slate-700 animate-pulse-slow" />
            No conversation active. Start call to begin.
          </div>
        ) : (
          transcript.map((item, index) => {
            const isModel = item.sender === 'model';
            const isSystem = item.sender === 'system';

            if (isSystem) {
              return (
                <div key={index} className="flex justify-center my-2">
                  <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-400 font-mono tracking-tight max-w-[90%]">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  isModel ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                }`}
              >
                {/* Avatar Bubble */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  isModel
                    ? 'bg-gradient-to-tr from-brand-700 to-purple-500 text-white shadow-md'
                    : 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                }`}>
                  {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-1">
                    {isModel ? 'Aura (AI)' : 'You'}
                  </span>
                  
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border transition-all duration-200 ${
                    isModel
                      ? 'bg-purple-950/20 border-purple-500/20 text-slate-100 rounded-tl-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'bg-slate-900 border-slate-800 text-emerald-100 rounded-tr-none'
                  }`}>
                    {item.text || <span className="animate-pulse text-slate-500 font-serif">...</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
