import { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Search,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Bug,
  Server,
  Globe,
  Zap
} from 'lucide-react';
import { api } from '../api/client';

interface LogEntry {
  id: string;
  timestamp: string;
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

interface LogStats {
  total: number;
  byLevel: {
    info: number;
    success: number;
    warn: number;
    error: number;
    debug: number;
  };
  errorRate: number;
  avgResponseTime: number;
}

export default function LoggerDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial logs
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // Setup SSE stream
  useEffect(() => {
    if (isOpen && isStreaming) {
      startLogStream();
    } else {
      stopLogStream();
    }

    return () => stopLogStream();
  }, [isOpen, isStreaming]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(search) ||
        log.url?.toLowerCase().includes(search) ||
        log.service?.toLowerCase().includes(search)
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, typeFilter]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs?limit=100');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching log stats:', error);
    }
  };

  const startLogStream = () => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/logs/stream`);

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        if (log.type !== 'connected') {
          setLogs(prev => [...prev, log].slice(-100)); // Keep last 100
          fetchStats(); // Update stats
        }
      } catch (error) {
        console.error('Error parsing log stream:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  const stopLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const clearLogs = async () => {
    try {
      await api.delete('/logs');
      setLogs([]);
      setSelectedLog(null);
      fetchStats();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.json`;
    link.click();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <Globe className="w-4 h-4 text-purple-500" />;
      case 'response':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'service':
        return <Server className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-all ${
          isOpen ? 'bg-gray-800 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
        title="Toggle Logger"
      >
        <Terminal className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">Logger</span>
        {stats && stats.byLevel.error > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
            {stats.byLevel.error}
          </span>
        )}
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl transition-all duration-300 z-40 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: isOpen ? '60vh' : '0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white">
          <div className="flex items-center space-x-4">
            <Terminal className="w-5 h-5" />
            <h3 className="font-bold text-lg">System Logger</h3>
            {stats && (
              <div className="flex items-center space-x-3 text-sm">
                <span className="px-2 py-1 bg-gray-700 rounded">
                  Total: {stats.total}
                </span>
                <span className="px-2 py-1 bg-red-600 rounded">
                  Errors: {stats.byLevel.error}
                </span>
                <span className="px-2 py-1 bg-green-600 rounded">
                  Avg: {stats.avgResponseTime.toFixed(0)}ms
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="rounded"
              />
              <span>Live</span>
            </label>
            <button
              onClick={clearLogs}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={exportLogs}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 border-b border-gray-300">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Levels</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="request">Request</option>
            <option value="response">Response</option>
            <option value="system">System</option>
            <option value="service">Service</option>
            <option value="error">Error</option>
          </select>
          <label className="flex items-center space-x-1 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">Auto-scroll</span>
          </label>
        </div>

        {/* Content */}
        <div className="flex" style={{ height: 'calc(60vh - 120px)' }}>
          {/* Log List */}
          <div className="flex-1 overflow-y-auto bg-gray-50 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No logs to display
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`flex items-start space-x-2 p-2 rounded cursor-pointer border transition-colors ${
                      selectedLog?.id === log.id
                        ? 'bg-primary-100 border-primary-500'
                        : 'hover:bg-gray-100 border-transparent'
                    } ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-center space-x-1 shrink-0">
                      {getLevelIcon(log.level)}
                      {getTypeIcon(log.type)}
                    </div>
                    <span className="text-gray-500 shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    {log.method && (
                      <span className={`font-bold shrink-0 ${
                        log.method === 'GET' ? 'text-blue-600' :
                        log.method === 'POST' ? 'text-green-600' :
                        log.method === 'PUT' ? 'text-yellow-600' :
                        log.method === 'DELETE' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {log.method}
                      </span>
                    )}
                    <span className="flex-1 truncate">{log.message}</span>
                    {log.statusCode && (
                      <span className={`shrink-0 font-bold ${
                        log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-600' :
                        log.statusCode >= 400 && log.statusCode < 500 ? 'text-yellow-600' :
                        log.statusCode >= 500 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {log.statusCode}
                      </span>
                    )}
                    {log.duration && (
                      <span className="text-gray-500 shrink-0">
                        {log.duration}ms
                      </span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedLog && (
            <div className="w-1/3 border-l border-gray-300 overflow-y-auto bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm">Log Details</h4>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-700">Level:</span>
                  <div className="mt-1 flex items-center space-x-2">
                    {getLevelIcon(selectedLog.level)}
                    <span className="uppercase font-bold">{selectedLog.level}</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Type:</span>
                  <div className="mt-1 flex items-center space-x-2">
                    {getTypeIcon(selectedLog.type)}
                    <span>{selectedLog.type}</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Timestamp:</span>
                  <p className="mt-1 font-mono bg-gray-100 p-2 rounded">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>

                {selectedLog.message && (
                  <div>
                    <span className="font-semibold text-gray-700">Message:</span>
                    <p className="mt-1 bg-gray-100 p-2 rounded whitespace-pre-wrap">
                      {selectedLog.message}
                    </p>
                  </div>
                )}

                {selectedLog.url && (
                  <div>
                    <span className="font-semibold text-gray-700">URL:</span>
                    <p className="mt-1 font-mono bg-gray-100 p-2 rounded break-all">
                      {selectedLog.url}
                    </p>
                  </div>
                )}

                {selectedLog.requestBody && (
                  <div>
                    <span className="font-semibold text-gray-700">Request Body:</span>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.responseBody && (
                  <div>
                    <span className="font-semibold text-gray-700">Response Body:</span>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-xs max-h-64">
                      {JSON.stringify(selectedLog.responseBody, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error && (
                  <div>
                    <span className="font-semibold text-red-700">Error:</span>
                    <pre className="mt-1 bg-red-50 p-2 rounded overflow-x-auto text-xs text-red-900">
                      {typeof selectedLog.error === 'string' ? selectedLog.error : JSON.stringify(selectedLog.error, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <span className="font-semibold text-gray-700">Metadata:</span>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
