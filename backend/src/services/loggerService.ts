import { Request, Response, NextFunction } from 'express';

/**
 * Log Entry Interface
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  type: 'request' | 'response' | 'system' | 'service' | 'error';
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  requestBody?: any;
  responseBody?: any;
  headers?: any;
  error?: any;
  message: string;
  service?: string;
  metadata?: any;
}

/**
 * Logger Service - Centralized logging with real-time streaming
 */
class LoggerService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Keep last 1000 logs in memory
  private listeners: Set<(log: LogEntry) => void> = new Set();

  /**
   * Add a new log entry
   */
  log(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Maintain circular buffer
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Notify all listeners (for WebSocket streaming)
    this.notifyListeners(logEntry);

    // Console output for server-side visibility
    this.consoleOutput(logEntry);

    return logEntry;
  }

  /**
   * Quick log methods
   */
  info(message: string, metadata?: any) {
    return this.log({
      level: 'info',
      type: 'system',
      message,
      metadata
    });
  }

  success(message: string, metadata?: any) {
    return this.log({
      level: 'success',
      type: 'system',
      message,
      metadata
    });
  }

  warn(message: string, metadata?: any) {
    return this.log({
      level: 'warn',
      type: 'system',
      message,
      metadata
    });
  }

  error(message: string, error?: any, metadata?: any) {
    return this.log({
      level: 'error',
      type: 'error',
      message,
      error: error?.stack || error?.message || error,
      metadata
    });
  }

  debug(message: string, metadata?: any) {
    return this.log({
      level: 'debug',
      type: 'system',
      message,
      metadata
    });
  }

  /**
   * Log HTTP request
   */
  logRequest(req: Request, metadata?: any) {
    return this.log({
      level: 'info',
      type: 'request',
      method: req.method,
      url: req.originalUrl || req.url,
      message: `${req.method} ${req.originalUrl || req.url}`,
      requestBody: req.body,
      headers: req.headers,
      metadata
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: Request, res: Response, duration: number, responseBody?: any) {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'success';

    return this.log({
      level,
      type: 'response',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      message: `${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`,
      responseBody,
      headers: res.getHeaders()
    });
  }

  /**
   * Log service activity
   */
  logService(service: string, message: string, metadata?: any) {
    return this.log({
      level: 'info',
      type: 'service',
      service,
      message: `[${service}] ${message}`,
      metadata
    });
  }

  /**
   * Get all logs
   */
  getLogs(filter?: {
    level?: LogEntry['level'];
    type?: LogEntry['type'];
    search?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.type) {
        filtered = filtered.filter(log => log.type === filter.type);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(log =>
          log.message.toLowerCase().includes(search) ||
          log.url?.toLowerCase().includes(search) ||
          log.service?.toLowerCase().includes(search)
        );
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered.reverse(); // Most recent first
  }

  /**
   * Get logs statistics
   */
  getStatistics() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        success: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      byType: {
        request: 0,
        response: 0,
        system: 0,
        service: 0,
        error: 0
      },
      errorRate: 0,
      avgResponseTime: 0,
      recentErrors: [] as LogEntry[]
    };

    let totalDuration = 0;
    let responseCount = 0;

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byType[log.type]++;

      if (log.type === 'response' && log.duration) {
        totalDuration += log.duration;
        responseCount++;
      }

      if (log.level === 'error') {
        stats.recentErrors.push(log);
      }
    });

    stats.errorRate = this.logs.length > 0 ? (stats.byLevel.error / this.logs.length) * 100 : 0;
    stats.avgResponseTime = responseCount > 0 ? totalDuration / responseCount : 0;
    stats.recentErrors = stats.recentErrors.slice(-10); // Last 10 errors

    return stats;
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.info('Logs cleared');
  }

  /**
   * Subscribe to real-time log updates
   */
  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(log: LogEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (error) {
        console.error('Error notifying log listener:', error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Console output with colors
   */
  private consoleOutput(log: LogEntry) {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    };
    const reset = '\x1b[0m';

    const color = colors[log.level];
    const timestamp = log.timestamp.toISOString();
    const prefix = `${color}[${log.level.toUpperCase()}]${reset}`;

    console.log(`${prefix} ${timestamp} - ${log.message}`);
  }
}

export const loggerService = new LoggerService();
