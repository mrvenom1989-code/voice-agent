import { useState, useEffect, useRef } from 'react';

export function useGeminiLive() {
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [activeTool, setActiveTool] = useState(null); // { name, args, status: 'calling'|'done', response }
  const [dbState, setDbState] = useState(null); // Synced clinic DB
  const [isMuted, setIsMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(0); // For user audio visualizer
  const [isSpeaking, setIsSpeaking] = useState(false); // True when model is actively playing audio

  const socketRef = useRef(null);

  // Ref to track mute state inside closures (avoids stale closure bug)
  const isMutedRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  
  // Audio Contexts
  const inputAudioCtxRef = useRef(null);
  const outputAudioCtxRef = useRef(null);
  
  // Microphone Stream and Nodes
  const micStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  
  // Audio Playback Queue
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Close connection & stop audio
  const disconnect = (finalStatus = 'disconnected') => {
    const statusStr = typeof finalStatus === 'string' ? finalStatus : 'disconnected';
    console.log('Disconnecting session with status:', statusStr);
    
    // Close WebSocket
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'end' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    // Stop mic capturing
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Terminate worklets
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Stop output playback nodes
    stopAllPlayback();

    // Close Audio Contexts
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    setStatus(prev => {
      if (prev === 'error' && statusStr === 'disconnected') {
        return 'error';
      }
      return statusStr;
    });
    setInputVolume(0);
    setIsSpeaking(false);
    setActiveTool(null);
  };

  // Clear active playback buffers immediately (Interruption)
  const stopAllPlayback = () => {
    console.log(`Stopping ${activeSourcesRef.current.length} active playback sources.`);
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might have finished playing already
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  };

  const connect = async (agentId = 'clinic') => {
    try {
      setStatus('connecting');
      setErrorMessage('');
      setTranscript([]);
      setActiveTool(null);

      // 1. Initialize Audio Contexts — use default hardware sample rate
      // Forcing non-native rates (16kHz/24kHz) causes silent failures on Windows audio drivers.
      // The browser/worklet will handle resampling internally.
      inputAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      outputAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Expose for debugging
      window.debugInputAudioCtx = inputAudioCtxRef.current;
      window.debugOutputAudioCtx = outputAudioCtxRef.current;

      // Resume immediately within user gesture
      await inputAudioCtxRef.current.resume();
      await outputAudioCtxRef.current.resume();
      console.log('AudioContexts resumed. Input state:', inputAudioCtxRef.current.state, 'Output state:', outputAudioCtxRef.current.state);

      nextStartTimeRef.current = 0;

      // 2. Request Mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1
        }
      });
      micStreamRef.current = stream;

      // 3. Setup inline AudioWorklet for recording with downsampling & VAD
      const workletCode = `
        class InputProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = [];
          }

          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channel = input[0];

              // Calculate volume level (RMS) first
              let sum = 0;
              for (let i = 0; i < channel.length; i++) {
                sum += channel[i] * channel[i];
              }
              const rms = Math.sqrt(sum / (channel.length || 1));

              // NOTE: VAD disabled — send all frames so Gemini always receives audio.
              // Re-enable VAD threshold once core audio pipeline is confirmed working.

              // Downsample from hardware rate (e.g., 48kHz) to 16kHz for Gemini
              const sourceSampleRate = sampleRate; // Global sampleRate in AudioWorklet scope
              const targetSampleRate = 16000;

              if (sourceSampleRate === targetSampleRate) {
                // No downsampling needed (rare but possible)
                const pcm = new Int16Array(channel.length);
                for (let i = 0; i < channel.length; i++) {
                  const s = Math.max(-1, Math.min(1, channel[i]));
                  pcm[i] = s < 0 ? s * 32768 : s * 32767;
                }
                this.port.postMessage({ pcm: pcm.buffer, volume: rms }, [pcm.buffer]);
              } else {
                // Downsample using linear interpolation
                const ratio = sourceSampleRate / targetSampleRate;
                const newLength = Math.round(channel.length / ratio);
                const pcm = new Int16Array(newLength);

                for (let i = 0; i < newLength; i++) {
                  const srcIdx = i * ratio;
                  const idxFloor = Math.floor(srcIdx);
                  const idxCeil = Math.min(idxFloor + 1, channel.length - 1);
                  const frac = srcIdx - idxFloor;
                  // Linear interpolation between adjacent samples
                  const sample = channel[idxFloor] * (1 - frac) + channel[idxCeil] * frac;
                  const s = Math.max(-1, Math.min(1, sample));
                  pcm[i] = s < 0 ? s * 32768 : s * 32767;
                }
                this.port.postMessage({ pcm: pcm.buffer, volume: rms }, [pcm.buffer]);
              }
            }
            return true;
          }
        }
        registerProcessor('input-processor', InputProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      await inputAudioCtxRef.current.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const sourceNode = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(inputAudioCtxRef.current, 'input-processor');
      workletNodeRef.current = workletNode;

      // Connect source → worklet only. Do NOT connect worklet to destination —
      // that would feed mic audio back into the speakers causing echo/loopback.
      sourceNode.connect(workletNode);

      // 4. Establish proxy WebSocket connection
      const socket = new WebSocket(`ws://localhost:5000?agent=${agentId}`);
      // Set binaryType to arraybuffer so audio frames arrive as ArrayBuffer directly.
      // Default 'blob' requires an async .arrayBuffer() conversion which can disorder chunks.
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Proxy WebSocket connected.');
        socket.send(JSON.stringify({ type: 'start' }));
      };

      socket.onmessage = async (event) => {
        try {
          // Handle binary frames — raw 24kHz PCM audio from backend (arrives as ArrayBuffer)
          if (event.data instanceof ArrayBuffer) {
            play24kHzBinaryChunk(event.data);
            return;
          }

          const message = JSON.parse(event.data);
          console.log('[useGeminiLive] Received WS message:', message.type);

          switch (message.type) {
            case 'status':
              console.log('[useGeminiLive] Status update:', message.status, message.message);
              if (message.status === 'connected') {
                setStatus('connected');
              } else if (message.status === 'disconnected') {
                disconnect('disconnected');
              } else if (message.status === 'error') {
                setErrorMessage(message.message);
                disconnect('error');
              }
              break;

            case 'transcript':
              console.log('[useGeminiLive] Transcript:', message.sender, message.text);
              setTranscript(prev => {
                // If the last message is from the same sender, append to it for natural streaming text
                const last = prev[prev.length - 1];
                if (last && last.sender === message.sender) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, text: last.text + message.text }
                  ];
                }
                return [...prev, { sender: message.sender, text: message.text }];
              });
              break;

            case 'interrupted':
              console.log('[useGeminiLive] Interrupted');
              // Model was interrupted, halt all queued model playout instantly
              stopAllPlayback();
              setTranscript(prev => [
                ...prev,
                { sender: 'system', text: '[AI Interrupted]' }
              ]);
              break;

            case 'tool_call':
              console.log('[useGeminiLive] Tool call:', message.name, message.args);
              setActiveTool({
                name: message.name,
                args: message.args,
                status: 'calling'
              });
              setTranscript(prev => [
                ...prev,
                { sender: 'system', text: `[Tool Called: ${message.name}]` }
              ]);
              break;

            case 'tool_response':
              console.log('[useGeminiLive] Tool response:', message.name, message.response);
              setActiveTool(prev => prev ? { ...prev, status: 'done', response: message.response } : null);
              break;

            case 'db_update':
              console.log('[useGeminiLive] DB update received');
              // Real-time synchronization of the inventory and appointment dashboard
              setDbState(message.db);
              break;

            default:
              break;
          }
        } catch (e) {
          console.error('[useGeminiLive] Error parsing/handling WS message:', e);
        }
      };

      socket.onerror = (err) => {
        console.error('Proxy WS error:', err);
        setStatus('error');
        setErrorMessage('Could not connect to proxy server. Ensure backend is running.');
      };

      socket.onclose = () => {
        console.log('Proxy WS closed.');
        disconnect();
      };

      // 5. Handle microphone worklet callbacks
      workletNode.port.onmessage = (event) => {
        const { pcm, volume } = event.data;
        
        // Update volume level for UI
        setInputVolume(volume);

        // Only send PCM if we have audio data (VAD passed), connected, and not muted
        if (pcm && socket.readyState === WebSocket.OPEN && !isMutedRef.current) {
          socket.send(pcm);
        }
      };

    } catch (err) {
      console.error('Failed to start Live session:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Microphone access denied or audio configuration failed.');
      disconnect();
    }
  };

  // Playback engine for raw binary 24kHz PCM (received as ArrayBuffer from binary WS frame)
  const play24kHzBinaryChunk = (arrayBuffer) => {
    try {
      const audioCtx = outputAudioCtxRef.current;
      if (!audioCtx || audioCtx.state === 'closed') {
        console.warn('[useGeminiLive] play24kHzBinaryChunk: AudioContext is null or closed');
        return;
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.error("Failed to resume output audio context:", e));
      }

      // Convert little-endian 16-bit PCM to Float32
      const int16Samples = new Int16Array(arrayBuffer, 0, Math.floor(arrayBuffer.byteLength / 2));
      const float32Samples = new Float32Array(int16Samples.length);
      for (let i = 0; i < int16Samples.length; i++) {
        float32Samples[i] = int16Samples[i] / 32768.0;
      }

      // Create AudioBuffer at 24kHz — the browser will automatically resample to hardware rate
      const audioBuffer = audioCtx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      // Schedule gapless playback
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      
      // If the next start time is in the past, align it with the current time
      let startTime = nextStartTimeRef.current;
      if (startTime < currentTime) {
        startTime = currentTime;
      }

      sourceNode.start(startTime);
      setIsSpeaking(true);

      // Store node reference to handle interruption cut-offs
      activeSourcesRef.current.push(sourceNode);

      // Update play cursor for gapless scheduling
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      // Remove source node reference on completion
      sourceNode.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(src => src !== sourceNode);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error('[useGeminiLive] Error in play24kHzBinaryChunk:', e);
    }
  };

  // Auto-dismiss tool banner 5 seconds after execution completes
  useEffect(() => {
    if (activeTool?.status === 'done') {
      const timer = setTimeout(() => setActiveTool(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeTool]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    status,
    errorMessage,
    transcript,
    activeTool,
    dbState,
    isMuted,
    inputVolume,
    isSpeaking,
    toggleMute,
    connect,
    disconnect
  };
}
