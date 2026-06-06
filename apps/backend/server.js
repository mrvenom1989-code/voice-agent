import express from 'express';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { readDb, writeDb } from './db.js';

// Import separated agent modules
import clinicAgent from './agents/clinic/index.js';
import pharmacyAgent from './agents/pharmacy/index.js';
import mobileKlinikAgent from './agents/mobile_klinik/index.js';
import multilingualAgent from './agents/multilingual/index.js';
import { sharedTools } from './agents/sharedTools.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Utilities ───────────────────────────────────────────────────────────────

const withTimeout = (promise, ms = 4000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    )
  ]);

// ─── Gemini Client ────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY not set in .env — voice agent will not work.');
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY || 'missing'
});

const LIVE_MODEL = 'models/gemini-3.1-flash-live-preview';
const AUDIO_BUFFER_MIN_BYTES = 3200;

// ─── Agent Configs ────────────────────────────────────────────────────────────

const AGENT_CONFIGS = {
  clinic: {
    name: clinicAgent.name,
    voice: clinicAgent.voice,
    systemInstruction: clinicAgent.systemInstruction,
    tools: clinicAgent.toolDeclarations,
    toolImplementations: {
      ...clinicAgent.toolImplementations,
      ...sharedTools
    }
  },
  pharmacy: {
    name: pharmacyAgent.name,
    voice: pharmacyAgent.voice,
    systemInstruction: pharmacyAgent.systemInstruction,
    tools: pharmacyAgent.toolDeclarations,
    toolImplementations: {
      ...pharmacyAgent.toolImplementations,
      ...sharedTools
    }
  },
  mobile_klinik: {
    name: mobileKlinikAgent.name,
    voice: mobileKlinikAgent.voice,
    systemInstruction: mobileKlinikAgent.systemInstruction,
    tools: mobileKlinikAgent.toolDeclarations,
    toolImplementations: {
      ...mobileKlinikAgent.toolImplementations,
      ...sharedTools
    }
  },
  multilingual: {
    name: multilingualAgent.name,
    voice: multilingualAgent.voice,
    systemInstruction: multilingualAgent.systemInstruction,
    tools: multilingualAgent.toolDeclarations,
    toolImplementations: {
      ...multilingualAgent.toolImplementations,
      ...sharedTools
    }
  }
};

// ─── Express / HTTP ───────────────────────────────────────────────────────────

// Run Excel pricing synchronization on startup
try {
  console.log('🔄 Syncing repair prices and parts catalog from Master Repair Price.xlsx...');
  const scriptPath = path.join(__dirname, 'sync_excel_prices.py');
  execSync(`python "${scriptPath}"`, { stdio: 'inherit' });
  console.log('✅ Excel sync complete.');
} catch (err) {
  console.error('⚠️ Failed to sync from Excel (non-fatal, using existing database):', err.message);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/ping', (_req, res) => res.send('ok'));

app.get('/health', async (_req, res) => {
  const db = await readDb();
  res.json({
    status: 'ok',
    model: LIVE_MODEL,
    api_key: !!GEMINI_API_KEY,
    appointments: (db.appointments || []).length,
    inventory: (db.inventory || []).length,
    repairJobs: (db.repairJobs || []).length,
    sessions: (db.sessions || []).length
  });
});

app.get('/api/db', async (_req, res) => res.json(await readDb()));

const server = createServer(app);
const wss = new WebSocketServer({ server });

// ─── DB Helper ────────────────────────────────────────────────────────────────

async function sendDbUpdate(ws) {
  try {
    ws.send(JSON.stringify({ type: 'db_update', db: await readDb() }));
  } catch (e) {
    console.error('[DB] sendDbUpdate failed:', e.message);
  }
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

async function endSessionInDb(sessionId, finalStatus) {
  try {
    const db = await readDb();
    if (!db.sessions) db.sessions = [];
    const sess = db.sessions.find(s => s.id === sessionId);
    if (sess && !sess.endTime) {
      sess.endTime = new Date().toISOString();
      sess.durationMs = new Date(sess.endTime) - new Date(sess.startTime);
      if (sess.status !== 'escalated') {
        sess.status = finalStatus;
      }
      await writeDb(db);
      console.log(`[Session Tracking] Session ${sessionId} ended. Status: ${sess.status}, Duration: ${(sess.durationMs / 1000).toFixed(1)}s`);
    }
  } catch (e) {
    console.error('[Session Tracking] Failed to end session:', e.message);
  }
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(name, args, session, ws, id, agentConfig) {
  console.log(`[Tool] → ${name}`, JSON.stringify(args));
  ws.send(JSON.stringify({ type: 'tool_call', name, args }));

  let output;
  let mutated = false;
  try {
    const toolImpl = agentConfig.toolImplementations[name];
    if (toolImpl) {
      output = await withTimeout(toolImpl(args));
      if (['book_appointment', 'cancel_appointment', 'reserve_medicine', 'book_repair_job'].includes(name) && output.success) {
        mutated = true;
      }
    } else {
      output = { error: `Tool "${name}" not implemented for agent ${agentConfig.name}.` };
    }
  } catch (err) {
    output = { error: err.message };
  }

  // Record tool call in the session logs
  try {
    if (ws.sessionId) {
      const db = await readDb();
      if (!db.sessions) db.sessions = [];
      const sessionIndex = db.sessions.findIndex(s => s.id === ws.sessionId);
      if (sessionIndex !== -1) {
        db.sessions[sessionIndex].toolCalls.push({
          name,
          timestamp: new Date().toISOString()
        });
        if (name === 'handoff_to_human') {
          db.sessions[sessionIndex].status = 'escalated';
        }
        await writeDb(db);
        mutated = true; // Sync updated session log with frontend
      }
    }
  } catch (e) {
    console.error('[Session Tracking] Failed to record tool call:', e.message);
  }

  console.log(`[Tool] ← ${name}`, JSON.stringify(output).substring(0, 150));

  session.sendToolResponse({
    functionResponses: [{ id, name, response: { output } }]
  });

  ws.send(JSON.stringify({ type: 'tool_response', name, response: output }));
  if (mutated) await sendDbUpdate(ws);
}

// ─── Gemini Message Handler ───────────────────────────────────────────────────

async function handleMessage(msg, state, ws) {
  const { session, agentConfig } = state;
  // ── Audio ──────────────────────────────────────────────────────────────────
  const parts = msg.serverContent?.modelTurn?.parts ?? [];
  let sentAudio = false;
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buf = Buffer.from(part.inlineData.data, 'base64');
      if (ws.readyState === 1) ws.send(buf);
      sentAudio = true;
    }
  }
  if (sentAudio) {
    console.log(`[Gemini] 🔊 Audio → client (${parts.filter(p => p.inlineData).length} part(s))`);
    return;
  }

  // ── Log all non-audio frames ───────────────────────────────────────────────
  console.log('[Gemini] Frame:', JSON.stringify(msg).substring(0, 400));

  // ── Transcription ──────────────────────────────────────────────────────────
  if (msg.outputTranscription?.text) {
    console.log('[Gemini] 📝 Model:', msg.outputTranscription.text);
    ws.send(JSON.stringify({ type: 'transcript', sender: 'model', text: msg.outputTranscription.text }));
  }
  if (msg.inputTranscription?.text) {
    console.log('[Gemini] 📝 User:', msg.inputTranscription.text);
    ws.send(JSON.stringify({ type: 'transcript', sender: 'user', text: msg.inputTranscription.text }));
  }

  // ── Interruption ───────────────────────────────────────────────────────────
  if (msg.serverContent?.interrupted) {
    console.log('[Gemini] ✋ Interrupted.');
    ws.send(JSON.stringify({ type: 'interrupted' }));
  }

  // ── Turn complete ──────────────────────────────────────────────────────────
  if (msg.serverContent?.turnComplete) {
    if (!state.greetingDone) {
      // First turnComplete = greeting finished. Signal audio relay to start.
      state.greetingDone = true;
      console.log('[Gemini] ✅ Greeting complete. User audio relay now ACTIVE.');
    } else {
      console.log('[Gemini] ✅ Turn complete.');
    }
  }

  // ── Tool calls ─────────────────────────────────────────────────────────────
  if (msg.toolCall?.functionCalls?.length > 0) {
    for (const { name, args, id } of msg.toolCall.functionCalls) {
      await executeTool(name, args, session, ws, id, agentConfig);
    }
  }
}

// ─── WebSocket Session Manager ────────────────────────────────────────────────

const MAX_CALL_DURATION_MS = 180000; // 3 minutes maximum
const INACTIVITY_TIMEOUT_MS = 60000; // 60 seconds inactivity limit

wss.on('connection', async (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const agentId = parsedUrl.query.agent || 'clinic';
  const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS.clinic;

  // Generate session ID
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  ws.sessionId = sessionId;

  console.log('\n──────────────────────────────────────');
  console.log(`[Proxy] Client connected. Agent: ${agentId} (${agentConfig.name}) | Session: ${sessionId}`);

  // Create session entry in DB
  try {
    const db = await readDb();
    if (!db.sessions) db.sessions = [];
    db.sessions.push({
      id: sessionId,
      agentId,
      agentName: agentConfig.name,
      startTime: new Date().toISOString(),
      endTime: null,
      durationMs: null,
      status: 'connecting',
      toolCalls: []
    });
    await writeDb(db);
  } catch (e) {
    console.error('[Session Tracking] Failed to create session:', e.message);
  }

  if (!GEMINI_API_KEY) {
    await endSessionInDb(sessionId, 'error');
    ws.send(JSON.stringify({ type: 'status', status: 'error', message: 'GEMINI_API_KEY not configured.' }));
    ws.close();
    return;
  }

  let session = null;
  const state = {
    greetingDone: false,
    agentConfig,
    get session() { return session; }
  };

  let durationTimeout = null;
  let inactivityTimeout = null;

  const resetInactivityTimer = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(async () => {
      console.log(`[Proxy] Closing session due to 60s inactivity for ${agentConfig.name}`);
      await endSessionInDb(sessionId, 'inactive');
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'status',
          status: 'error',
          message: 'Call ended: Disconnected due to 60 seconds of inactivity.'
        }));
      }
      setTimeout(() => ws.close(), 100);
    }, INACTIVITY_TIMEOUT_MS);
  };

  const clearSafeguardTimers = () => {
    if (durationTimeout) clearTimeout(durationTimeout);
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
  };

  // Start max call duration timer
  durationTimeout = setTimeout(async () => {
    console.log(`[Proxy] Closing session due to hard 3-minute limit for ${agentConfig.name}`);
    await endSessionInDb(sessionId, 'timeout');
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'status',
        status: 'error',
        message: 'Call ended: Maximum duration of 3 minutes reached.'
      }));
    }
    setTimeout(() => ws.close(), 100);
  }, MAX_CALL_DURATION_MS);

  // Initialize inactivity monitoring
  resetInactivityTimer();

  try {
    console.log(`[Proxy] Opening Gemini Live session (${LIVE_MODEL}) for ${agentConfig.name}...`);

    session = await ai.live.connect({
      model: LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: agentConfig.voice } }
        },
        systemInstruction: { parts: [{ text: agentConfig.systemInstruction }] },
        tools: agentConfig.tools,
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      },
      callbacks: {
        onopen: async () => {
          console.log(`[Gemini] WebSocket open for ${agentConfig.name}.`);
          // Update session status in DB
          try {
            const db = await readDb();
            if (!db.sessions) db.sessions = [];
            const sess = db.sessions.find(s => s.id === sessionId);
            if (sess) {
              sess.status = 'active';
              await writeDb(db);
            }
          } catch (e) {
            console.error('[Session Tracking] Failed to update session to active:', e.message);
          }
        },

        onmessage: async (msg) => {
          if (!session) return;
          try {
            await handleMessage(msg, state, ws);
          } catch (err) {
            console.error('[handleMessage] Error:', err.message);
          }
        },

        onerror: async (err) => {
          console.error('[Gemini] ❌ Error:', JSON.stringify(err), err?.message);
          await endSessionInDb(sessionId, 'error');
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'status', status: 'error', message: String(err?.message ?? JSON.stringify(err)) }));
          }
        },

        onclose: async (event) => {
          const code = event?.code ?? event;
          const reason = event?.reason ?? '(none)';
          console.log(`[Gemini] Session closed — code: ${code}, reason: ${reason}`);
          session = null;
          await endSessionInDb(sessionId, 'completed');
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'status', status: 'disconnected', message: 'Session ended.' }));
          }
        }
      }
    });

    console.log('[Proxy] Gemini session ready ✓');
    ws.send(JSON.stringify({ type: 'status', status: 'connected', message: `Connected to ${agentConfig.name} Live.` }));
    await sendDbUpdate(ws);

    // Trigger greeting
    console.log('[Proxy] Sending greeting trigger...');
    session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      turnComplete: true
    });

  } catch (err) {
    console.error('[Proxy] Failed to open session:', err.message);
    clearSafeguardTimers();
    await endSessionInDb(sessionId, 'error');
    ws.send(JSON.stringify({ type: 'status', status: 'error', message: `Connection failed: ${err.message}` }));
    ws.close();
    return;
  }

  let audioBuffer = Buffer.alloc(0);
  let chunkCount = 0;

  ws.on('message', (data, isBinary) => {
    if (!session) return;

    if (isBinary) {
      if (!state.greetingDone) return;

      audioBuffer = Buffer.concat([audioBuffer, data]);

      if (audioBuffer.length >= AUDIO_BUFFER_MIN_BYTES) {
        chunkCount++;
        
        let sum = 0;
        const numSamples = audioBuffer.length / 2;
        for (let i = 0; i < audioBuffer.length; i += 2) {
          const sample = audioBuffer.readInt16LE(i);
          const normalized = sample / 32768.0;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / (numSamples || 1));

        if (chunkCount <= 3 || chunkCount % 50 === 0) {
          console.log(`[Client → Gemini] chunk #${chunkCount}: ${audioBuffer.length} bytes, RMS = ${rms.toFixed(5)}`);
        }

        // Reset inactivity timer only if actual voice activity is detected (RMS above silence threshold)
        if (rms > 0.005) {
          resetInactivityTimer();
        }

        session.sendRealtimeInput({
          audio: {
            data: audioBuffer.toString('base64'),
            mimeType: 'audio/pcm;rate=16000'
          }
        });
        audioBuffer = Buffer.alloc(0);
      }
    } else {
      resetInactivityTimer(); // Reset inactivity timer on control/text messages
      try {
        const m = JSON.parse(data.toString());
        if (m.type === 'end') {
          console.log('[Proxy] Client requested end.');
          session?.close();
          session = null;
        }
      } catch (_) {}
    }
  });

  ws.on('close', async () => {
    console.log('[Proxy] Client disconnected.');
    clearSafeguardTimers();
    await endSessionInDb(sessionId, 'completed');
    try { session?.close(); } catch (_) {}
    session = null;
    audioBuffer = Buffer.alloc(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n✅  Multi-Agent backend → http://localhost:${PORT}`);
  console.log(`    Model : ${LIVE_MODEL}`);
  console.log(`    Key   : ${GEMINI_API_KEY ? 'configured ✓' : '❌ MISSING'}\n`);
});
