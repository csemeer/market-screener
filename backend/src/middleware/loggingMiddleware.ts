import { Request, Response, NextFunction } from 'express';
import { loggerService } from '../services/loggerService';

/**
 * Request Logging Middleware
 * Captures all HTTP requests and responses with detailed information
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log incoming request
  loggerService.logRequest(req, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: req.query
  });

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody: any;

  // Override res.send
  res.send = function (body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Override res.json
  res.json = function (body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Parse response body if it's a string
    let parsedBody = responseBody;
    if (typeof responseBody === 'string') {
      try {
        parsedBody = JSON.parse(responseBody);
      } catch (e) {
        // Keep as string if not JSON
      }
    }

    // Truncate large response bodies for logging
    if (parsedBody && typeof parsedBody === 'object') {
      const bodySize = JSON.stringify(parsedBody).length;
      if (bodySize > 10000) {
        parsedBody = {
          _truncated: true,
          _size: bodySize,
          _preview: JSON.stringify(parsedBody).substring(0, 1000) + '...'
        };
      }
    }

    loggerService.logResponse(req, res, duration, parsedBody);
  });

  next();
}

/**
 * Error Logging Middleware
 * Captures and logs all errors
 */
export function errorLoggingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  loggerService.error(
    `Error handling ${req.method} ${req.originalUrl}`,
    err,
    {
      statusCode: err.statusCode || 500,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      headers: req.headers
    }
  );

  // Pass to next error handler
  next(err);
}
