// Vercel Serverless Function wrapper for Express app
// This file exports the Express app as a serverless function

import app from '../backend/src/app.js';

// Wrapper to ensure CORS headers are set for all requests, including OPTIONS
export default function handler(req, res) {
  try {
    // Extract origin from request headers
    const origin = req.headers.origin;
    
    // Set CORS headers for all requests (including OPTIONS preflight)
    // Always set headers to allow Vercel preview URLs
    if (origin && origin.includes('.vercel.app')) {
      // For Vercel preview URLs, echo back the exact origin
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin) {
      // For other origins, echo back the origin (Express CORS will validate)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // No origin header (e.g., same-origin request or mobile app)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-dev-role, Cache-Control, Pragma');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle OPTIONS preflight requests immediately
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Pass all other requests to Express app (which will also set CORS headers via middleware)
    // Express handles errors internally via errorHandler middleware
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Handler] Error in handler:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}
