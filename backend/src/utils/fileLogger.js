import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Generate log filename with date
const getLogFilename = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `app-${today}.log`);
};

/**
 * Write structured log to file
 * @param {string} level - INFO, WARN, ERROR, DEBUG
 * @param {string} event - Event name (e.g., 'appointment.created')
 * @param {object} context - Additional context data
 */
export const logToFile = (level, event, context = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      event,
      ...context
    };

    // Format as single-line JSON for easy parsing
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to today's log file
    fs.appendFileSync(getLogFilename(), logLine);
    
    // Also log to console for development
    console.log(`[${level}] ${event}`, context);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
};

/**
 * Convenience methods
 */
export const logger = {
  info: (event, context) => logToFile('INFO', event, context),
  warn: (event, context) => logToFile('WARN', event, context),
  error: (event, context) => logToFile('ERROR', event, context),
  debug: (event, context) => logToFile('DEBUG', event, context)
};

export default logger;
