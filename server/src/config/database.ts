import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check root data directory first, fallback to server data
const rootDataDir = path.resolve(__dirname, '../../../data');
const serverDataDir = path.resolve(__dirname, '../../data');

export const DATA_DIRECTORY = fs.existsSync(rootDataDir) ? rootDataDir : serverDataDir;
export const SERVER_PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const CLIENT_PUBLIC_DIR = path.resolve(__dirname, '../../../client/public');

export const config = {
  port: process.env.PORT || 5000,
  dataDir: DATA_DIRECTORY,
  isDev: process.env.NODE_ENV !== 'production'
};
