// config/paths.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PATHS = {
  VIEWS: path.join(__dirname, '../views'),
  PUBLIC: path.join(__dirname, '../public'),
  UPLOADS: path.join(__dirname, '../uploads')
};