import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mainLogger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getLogFilename = () => {
  const today = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `app-${today}.log`);
};

export const logToFile = (level, event, context = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      event,
      ...context,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(getLogFilename(), logLine);
    mainLogger.info(`[FILE_LOG ${level}] ${event}`, context);
  } catch (error) {
    mainLogger.error('Failed to write log:', error);
  }
};

export const logger = {
  info: (event, context) => logToFile('INFO', event, context),
  warn: (event, context) => logToFile('WARN', event, context),
  error: (event, context) => logToFile('ERROR', event, context),
  debug: (event, context) => logToFile('DEBUG', event, context),
};

export default logger;
