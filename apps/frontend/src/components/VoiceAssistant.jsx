import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';

export function VoiceAssistant({
  status,
  errorMessage,
  isMuted,
  inputVolume,
  isSpeaking,
  toggleMute,
  connect,
  disconnect
}) {
  const [waveformBars, setWaveformBars] = useState(new Array(12).fill(10));
  const [duration, setDuration] = useState(0);

  // Track call duration when connected
  useEffect(() => {
    let timerInterval;
    if (status === 'connected') {
      setDuration(0);
      timerInterval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timerInterval);
  }, [status]);

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Animate waveform bars based on mic volume or speaking state
  useEffect(() => {
    let interval;
    if (status === 'connected') {
      interval = setInterval(() => {
        setWaveformBars(() => {
          return new Array(12).fill(0).map(() => {
            if (isSpeaking) {
              // Simulated AI voice waves (random bounce)
              return Math.floor(Math.random() * 60) + 15;
            } else if (inputVolume > 0.005) {
              // User voice waves mapped to raw RMS volume
              const scale = Math.min(100, Math.floor(inputVolume * 500));
              return Math.floor(Math.random() * scale) + 10;
            }
            // Silent idle wave
            return Math.floor(Math.random() * 4) + 6;
          });
        });
      }, 80);
    } else {
      setWaveformBars(new Array(12).fill(6));
    }

    return () => clearInterval(interval);
  }, [status, inputVolume, isSpeaking]);

  return (
    <div className="glass-card rounded-3xl p-6 glow-indigo relative overflow-hidden flex flex-col items-center">
      {/* Background radial glow */}
      <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl transition-colors duration-1000 ${
        status === 'connected' ? (isSpeaking ? 'bg-purple-600/20' : 'bg-emerald-600/20') : 'bg-indigo-600/10'
      }`} />

      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-wide text-indigo-200">Aura Front Desk Connection</h2>
          {status === 'connected' && (
            <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800/40">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        
        {/* Status Pill */}
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
          status === 'connected' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
          status === 'connecting' ? 'bg-amber-950/40 text-amber-400 border-amber-500/30 animate-pulse-slow' :
          status === 'error' ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
          'bg-slate-900/60 text-slate-400 border-slate-700/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-emerald-400 animate-pulse' :
            status === 'connecting' ? 'bg-amber-400 animate-ping' :
            status === 'error' ? 'bg-rose-400' :
            'bg-slate-500'
          }`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Visual Waveform Panel */}
      <div className="w-full h-32 bg-slate-950/60 rounded-2xl border border-slate-800/40 flex items-center justify-center gap-1 mb-6 relative px-4">
        {status === 'connected' ? (
          <div className="flex items-end gap-1.5 h-20">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-2.5 rounded-full transition-all duration-75 ${
                  isSpeaking 
                    ? 'bg-gradient-to-t from-brand-600 to-purple-400' 
                    : (inputVolume > 0.005 ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : 'bg-indigo-900/60')
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 text-sm">
            {status === 'connecting' ? (
              <p className="animate-pulse">Setting up audio worklet stream...</p>
            ) : status === 'error' ? (
              <div className="flex items-center gap-1 text-rose-400 px-3 py-2 bg-rose-950/20 rounded-lg border border-rose-800/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs text-left leading-normal">{errorMessage || 'Audio connection error.'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Volume2 className="w-8 h-8 text-slate-600 animate-pulse-slow" />
                <p className="text-slate-400 text-xs">Press "Start Call" to begin speaking with Aura</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {status === 'connected' && (
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full border transition-all duration-200 ${
              isMuted 
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        )}

        {status === 'connected' || status === 'connecting' ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-6 py-4 rounded-full transition-all duration-200 shadow-[0_4px_20px_rgba(225,29,72,0.3)]"
          >
            <PhoneOff className="w-5 h-5" />
            End Call
          </button>
        ) : (
          <button
            onClick={connect}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium px-8 py-4 rounded-full transition-all duration-200 shadow-[0_4px_25px_rgba(139,92,246,0.4)] transform hover:scale-[1.02]"
          >
            <Phone className="w-5 h-5 animate-pulse" />
            Start Call
          </button>
        )}
      </div>
    </div>
  );
}
