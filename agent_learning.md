# Agent Learning Log & Checkpoint

This file captures technical learnings, issues faced, workarounds, and the current task checkpoint of the AI Voice Receptionist Platform POC.

---

## 1. Technical Learnings

### Gemini Live API & WebSocket Routing
- **WebSocket URL routing**: Passing dynamic metadata (like the target `agentId`) in the connection query string (e.g. `ws://localhost:5000?agent=mobile_klinik`) is the cleanest way to dynamically spin up matching Gemini Live sessions with correct instructs, voices, and tools.
- **Model Config Customization**: Dynamic instantiation of `ai.live.connect` lets us change prompts, voice names (e.g., `Aoede`, `Kore`, `Fenrir`), and tool schemas per session.

### Node --watch & Watch Path Exclusions
- **Recursive Watch Restarts**: Running Node's watch engine via `node --watch server.js` will recursively monitor the directory. If a backend tool call writes data changes into a local database file (like `data/db.json`), the watcher detects this update and restarts the server, instantly severing any active caller's WebSocket session.
- **Watch Path Isolation**: Restricting Node's watch path explicitly using `--watch-path=server.js --watch-path=tools.js server.js` ensures that dynamic files like `db.json` and frontend directories are completely ignored, keeping the proxy server running uninterrupted.

### Inactivity Safeguards (RMS Audio Volume Gating)
- **Audio Packet Heartbeat**: Microphones constantly stream audio packets (PCM chunks) even during silence. To implement an inactivity timer, we cannot reset the timer on *every* message frame.
- **RMS Volume Gating**: We must calculate the root-mean-square (RMS) of each PCM chunk on the backend. Only reset the inactivity timer when `rms > 0.005` (indicating actual voice activity, not background noise/hum) or when a text control message is sent.

### WebSocket Flush Race Condition
- **Premature Close**: Executing `ws.close()` immediately after a `ws.send(JSON.stringify({ type: 'status', status: 'error', ... }))` will close the socket before the TCP stream has time to flush the final error frame to the client.
- **Close Delay**: Adding a short `setTimeout(() => ws.close(), 100)` delay solves this race condition, ensuring the client successfully parses the disconnect reason.

### React Error State Preservation
- **State Cleanup Override**: When a socket terminates, the `onclose` callback triggers a clean disconnect, which resets status to `'disconnected'` and clears `errorMessage`.
- **Status Gating**: Gating the React `setStatus` call (checking `if (prev === 'error' && finalStatus === 'disconnected') return 'error';`) preserves the warning status in the UI so the red warning banner remains visible on safeguard disconnect.

---

## 2. Issues Faced & Solutions (New Updates)

### Issue: Clara disconnected immediately after booking
- **Problem**: User speaks and completes a booking. The tool call updates `db.json`, which triggers a watch restart on the backend, severing the WebSocket.
- **Solution**: Changed the dev runner in `apps/backend/package.json` to `"dev": "node --watch-path=server.js --watch-path=tools.js server.js"`.

### Issue: Inactivity timer never fires or alerts are hidden
- **Problem**: Continuous silent PCM chunks reset the inactivity timer, and premature `ws.close()` prevented the error banner from showing up.
- **Solution**: Gated the inactivity reset by checking `rms > 0.005`, added a 100ms socket close delay, and updated the React Hook to preserve the `'error'` state.
