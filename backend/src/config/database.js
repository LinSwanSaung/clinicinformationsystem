import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { createPostgresClient } from './postgresClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const { pool, client } = createPostgresClient(process.env.DATABASE_URL);

// Compatibility export: most models still call this "supabase", but it is now
// backed by node-postgres and talks directly to PostgreSQL.
export const supabase = client;
export const supabaseAdmin = client;
export const db = pool;

export const dbConfig = {
  url: process.env.DATABASE_URL,
};

export const executeWithRetry = async (
  queryFn,
  retries = 3,
  operationName = 'database operation'
) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await queryFn();

      if (result?.error) {
        const errorCode = String(result.error.code || '').toLowerCase();
        const isRetryable =
          errorCode === '08006' ||
          errorCode === '57p01' ||
          errorCode === '53300' ||
          errorCode === '40001';

        if (isRetryable && attempt <= retries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          logger.warn(
            `${operationName} attempt ${attempt}/${retries + 1} failed, retrying in ${backoffDelay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        }
      }

      return result;
    } catch (error) {
      const errorCode = String(error?.code || '').toLowerCase();
      const isRetryable =
        errorCode === '08006' ||
        errorCode === '57p01' ||
        errorCode === '53300' ||
        errorCode === '40001' ||
        error?.message?.toLowerCase().includes('timeout');

      if (isRetryable && attempt <= retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.warn(
          `${operationName} attempt ${attempt}/${retries + 1} failed, retrying in ${backoffDelay}ms...`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }

      throw error;
    }
  }
};

export const testConnection = async (retries = 2) => {
  try {
    await executeWithRetry(
      async () => {
        const result = await pool.query('SELECT 1 AS ok');
        return { data: result.rows, error: null };
      },
      retries,
      'Database connection test'
    );

    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection error:', error.message);
    return false;
  }
};
