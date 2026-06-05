import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("No API key found!");
  process.exit(1);
}

const MODEL_TO_TEST = "models/gemini-3.1-flash-live-preview"; 

const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
console.log(`Connecting to Gemini Live API with model: ${MODEL_TO_TEST}...`);

const ws = new WebSocket(geminiUrl);

ws.on('open', () => {
  console.log('Connected to Gemini WebSocket directly.');
  
  const setupMessage = {
    setup: {
      model: MODEL_TO_TEST,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede"
            }
          }
        }
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  };
  
  ws.send(JSON.stringify(setupMessage));
  console.log('Setup message sent.');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('\n--- Received Message ---');
    console.log(JSON.stringify(msg, null, 2));

    if (msg.setupComplete) {
      console.log('Setup complete! Triggering hello greeting...');
      const greetingTrigger = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: 'Hello! Please greet the caller. Keep it extremely short (under 5 words).' }]
            }
          ],
          turnComplete: true
        }
      };
      ws.send(JSON.stringify(greetingTrigger));
    }
  } catch (err) {
    console.error('Error parsing response:', err);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed: ${code} - ${reason.toString()}`);
  process.exit(0);
});

// Auto timeout after 8 seconds
setTimeout(() => {
  console.log('Timeout. Closing...');
  ws.close();
  process.exit(0);
}, 8000);
