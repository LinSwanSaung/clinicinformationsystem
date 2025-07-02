/**
 * Request logging middleware
 * Logs incoming requests with relevant information
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`📨 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });

    originalEnd.apply(this, args);
  };

  next();
};
