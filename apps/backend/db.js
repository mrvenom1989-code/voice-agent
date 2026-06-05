import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

// Helper to read database state
export async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return {
      appointments: [],
      inventory: [],
      doctors: [],
      clinicHours: {},
      location: "",
      repairJobs: [],
      partsInventory: [],
      repairPrices: [],
      klinikHours: {},
      klinikLocation: "",
      sessions: []
    };
  }
}

// Helper to write database state
export async function writeDb(data) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return data;
  } catch (error) {
    console.error('Error writing db.json:', error);
    throw error;
  }
}
