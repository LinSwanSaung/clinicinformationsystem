import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Custom fetch with timeout and retry logic for better VPN/network resilience
// Increased timeout to 60 seconds for VPN/network latency issues
const createFetchWithTimeout = (timeoutMs = 60000) => {
  return async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.warn(`⚠️ Request to ${url} timed out after ${timeoutMs}ms`);
      controller.abort();
    }, timeoutMs);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      const duration = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (duration > 5000) {
        logger.warn(`⚠️ Slow request to ${url} took ${duration}ms`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
      throw error;
    }
  };
};

// Create Supabase client for general operations using SERVICE_KEY to bypass RLS
// Increased timeout to 60 seconds for VPN/network latency issues
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: createFetchWithTimeout(60000), // 60 second timeout for VPN resilience
  },
});

// Create Supabase admin client (if service key is available)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: createFetchWithTimeout(60000), // 60 second timeout for VPN resilience
      },
    })
  : null;

// Database configuration
export const dbConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_KEY,
};

/**
 * Execute a Supabase query with retry logic for network resilience
 * Useful for handling VPN/network connectivity issues
 */
export const executeWithRetry = async (
  queryFn,
  retries = 3,
  operationName = 'database operation'
) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await queryFn();

      // If it's a Supabase response with error property
      if (result && typeof result === 'object' && 'error' in result) {
        if (result.error) {
          // Check if it's a network error that might be retryable
          const errorMsg = result.error.message?.toLowerCase() || '';
          const errorCode = result.error.code?.toLowerCase() || '';
          const isNetworkError =
            errorMsg.includes('fetch failed') ||
            errorMsg.includes('network') ||
            errorMsg.includes('timeout') ||
            errorMsg.includes('econnrefused') ||
            errorMsg.includes('enotfound') ||
            errorMsg.includes('econnreset') ||
            errorMsg.includes('etimedout') ||
            errorCode === 'pgrst301' || // Supabase connection error
            errorCode === '08006' || // Connection failure
            errorCode === '57p01'; // Admin shutdown

          if (isNetworkError && attempt <= retries) {
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
            logger.warn(
              `⚠️ ${operationName} attempt ${attempt}/${retries + 1} failed (network error), retrying in ${backoffDelay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
      }

      return result;
    } catch (error) {
      const errorMsg = error?.message?.toLowerCase() || '';
      const errorCode = error?.code?.toLowerCase() || '';
      const isNetworkError =
        errorMsg.includes('fetch failed') ||
        errorMsg.includes('network') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('econnrefused') ||
        errorMsg.includes('enotfound') ||
        errorMsg.includes('econnreset') ||
        errorMsg.includes('etimedout') ||
        errorMsg.includes('abort') ||
        errorCode === 'pgrst301' ||
        errorCode === '08006' ||
        errorCode === '57p01';

      if (isNetworkError && attempt <= retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        logger.warn(
          `⚠️ ${operationName} attempt ${attempt}/${retries + 1} error (network), retrying in ${backoffDelay}ms...`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }

      // If not a network error or out of retries, throw
      throw error;
    }
  }
};

// Test database connection with retry logic
export const testConnection = async (retries = 2) => {
  try {
    await executeWithRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
        if (error) {
          throw error;
        }
        return { data, error };
      },
      retries,
      'Database connection test'
    );

    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
    return false;
  }
};
