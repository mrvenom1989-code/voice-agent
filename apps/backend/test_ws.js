import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5000');

ws.on('open', () => {
  console.log('Connected to proxy WS');
  ws.send(JSON.stringify({ type: 'start' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'audio') {
    console.log(`Received audio chunk of length ${msg.data.length}`);
  } else {
    console.log('Received message:', msg);
  }
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});

ws.on('close', () => {
  console.log('WS Closed');
});

// Auto close after 10 seconds
setTimeout(() => {
  console.log('Closing test...');
  ws.close();
  process.exit(0);
}, 10000);
