// Vercel Serverless Function wrapper for Express app
// This file exports the Express app as a serverless function

import app from '../backend/src/app.js';

// Export the Express app as the default handler
// Vercel will automatically handle routing to this function
export default app;
