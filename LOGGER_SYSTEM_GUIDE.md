# 📊 Professional Logger System - Complete Guide

**Version**: 1.0  
**Created**: 2025-12-26  
**Status**: ✅ Production Ready

---

## Overview

The Market Screener now includes a **professional-grade logging and monitoring system** with real-time request/response tracking, similar to enterprise monitoring tools like Datadog, Splunk, or Chrome DevTools. This system helps you monitor API activity, debug issues, and ensure system health.

---

## 🎯 Key Features

### ✅ Real-Time Monitoring
- Live log streaming via Server-Sent Events (SSE)
- Automatic request/response capture
- Zero-latency updates

### ✅ Pull-Down Logger Drawer
- Beautiful UI inspired by browser DevTools
- Slide-up from bottom of screen
- Accessible from any page
- Keyboard shortcuts ready

### ✅ Comprehensive Logging
- **HTTP Requests**: Method, URL, headers, body
- **HTTP Responses**: Status code, duration, body
- **System Events**: Service initialization, errors
- **Service Logs**: Custom service activity
- **Error Tracking**: Full stack traces

### ✅ Advanced Filtering
- Filter by level (info, success, warn, error, debug)
- Filter by type (request, response, system, service, error)
- Real-time search across all log fields
- Auto-scroll to latest logs

### ✅ Detailed Log Inspection
- Click any log to see full details
- Request/response bodies (JSON formatted)
- Headers and metadata
- Error stack traces
- Execution duration

### ✅ Export & Analysis
- Export logs as JSON
- Statistics dashboard
- Error rate tracking
- Average response time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│        Frontend (React)             │
│  ┌───────────────────────────────┐  │
│  │    LoggerDrawer Component     │  │
│  │  - Pull-down UI               │  │
│  │  - SSE Client                 │  │
│  │  - Filtering & Search         │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ SSE Stream
               │ REST API
┌──────────────┴──────────────────────┐
│        Backend (Express)            │
│  ┌───────────────────────────────┐  │
│  │   Logging Middleware          │  │
│  │  - Captures all requests      │  │
│  │  - Captures all responses     │  │
│  │  - Measures duration          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Logger Service              │  │
│  │  - Circular buffer (1000 logs)│  │
│  │  - Real-time notifications    │  │
│  │  - Statistics calculation     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Logger Routes               │  │
│  │  - GET /api/logs              │  │
│  │  - GET /api/logs/stream (SSE) │  │
│  │  - GET /api/logs/stats        │  │
│  │  - DELETE /api/logs           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 📦 Components

### Backend Components

#### 1. Logger Service (`backend/src/services/loggerService.ts`)

**Purpose**: Central logging service with in-memory storage

**Features**:
- Circular buffer (last 1,000 logs)
- Multiple log levels (info, success, warn, error, debug)
- Multiple log types (request, response, system, service, error)
- Real-time listener pattern for SSE streaming
- Statistics calculation

**Methods**:
```typescript
loggerService.info(message, metadata?)
loggerService.success(message, metadata?)
loggerService.warn(message, metadata?)
loggerService.error(message, error?, metadata?)
loggerService.debug(message, metadata?)
loggerService.logRequest(req, metadata?)
loggerService.logResponse(req, res, duration, responseBody?)
loggerService.logService(service, message, metadata?)
loggerService.getLogs(filter?)
loggerService.getStatistics()
loggerService.clear()
loggerService.subscribe(listener)
```

#### 2. Logging Middleware (`backend/src/middleware/loggingMiddleware.ts`)

**Purpose**: Automatic HTTP request/response logging

**Features**:
- Captures all incoming requests
- Captures all outgoing responses
- Measures request duration
- Truncates large response bodies (>10KB)
- Error handling and logging

**Usage**: Automatically applied to all routes

#### 3. Logger Routes (`backend/src/routes/loggerRoutes.ts`)

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logs` | GET | Get all logs (with filtering) |
| `/api/logs/stats` | GET | Get logging statistics |
| `/api/logs/stream` | GET | SSE stream for real-time logs |
| `/api/logs` | DELETE | Clear all logs |
| `/api/logs/test` | POST | Generate test logs |

### Frontend Components

#### LoggerDrawer Component (`frontend/src/components/LoggerDrawer.tsx`)

**Features**:
- Pull-down drawer UI (60% viewport height)
- Real-time log streaming toggle
- Search and filtering controls
- Auto-scroll option
- Detailed log inspection panel
- Export to JSON
- Clear logs button
- Statistics display

**States**:
- Closed (button visible in bottom-right)
- Open (drawer slides up from bottom)
- Streaming (live SSE connection active)

---

## 🚀 Usage Guide

### Opening the Logger

1. **Click the Logger Button**: Located at bottom-right corner of screen
2. **Drawer Slides Up**: Displays recent logs (last 100)
3. **Toggle Live Streaming**: Check "Live" to enable real-time updates

### Viewing Logs

**Log Entry Format**:
```
[Icon] [Icon] HH:MM:SS.mmm METHOD Message STATUS DURATION
```

**Example**:
```
✓ 🌐 14:23:45.123 GET GET /api/indexes - 200 (45ms) 200 45ms
```

**Color Coding**:
- 🟢 **Green**: Success (200-299 status codes)
- 🟡 **Yellow**: Warning (400-499 status codes)
- 🔴 **Red**: Error (500+ status codes, exceptions)
- 🔵 **Blue**: Info/System messages
- ⚫ **Gray**: Debug messages

### Filtering Logs

**By Level**:
- All Levels
- Success
- Info
- Warning
- Error
- Debug

**By Type**:
- All Types
- Request
- Response
- System
- Service
- Error

**By Search**:
- Type in search box
- Searches: message, URL, service name
- Real-time filtering

### Inspecting Logs

1. **Click any log entry** in the list
2. **Detail panel opens** on the right side
3. **View full information**:
   - Level & Type
   - Timestamp
   - Message
   - URL
   - Request Body (JSON formatted)
   - Response Body (JSON formatted)
   - Error Stack Trace (if error)
   - Metadata

### Exporting Logs

1. Click the **Download** icon (↓) in header
2. Downloads `logs-{timestamp}.json`
3. Can be analyzed or imported later

### Clearing Logs

1. Click the **Trash** icon (🗑️) in header
2. Clears all logs immediately
3. Generates a new "Logs cleared" entry

---

## 📊 Log Types & Levels

### Log Levels

| Level | Icon | Color | Use Case |
|-------|------|-------|----------|
| **success** | ✓ | Green | Successful operations |
| **info** | ℹ | Blue | General information |
| **warn** | ⚠ | Yellow | Warnings, 4xx errors |
| **error** | ✗ | Red | Errors, 5xx errors, exceptions |
| **debug** | 🐛 | Gray | Debug information |

### Log Types

| Type | Icon | Description |
|------|------|-------------|
| **request** | 🌐 | HTTP requests |
| **response** | ⚡ | HTTP responses |
| **system** | 📊 | System events |
| **service** | 🖥️ | Service activity |
| **error** | ❌ | Error events |

---

## 🎨 UI Components

### Toggle Button (Bottom-Right)

```
┌─────────────────┐
│ 🖥️ Logger ▼    │  <- Closed state
└─────────────────┘

┌─────────────────┐
│ 🖥️ Logger ▲    │  <- Open state
└─────────────────┘
```

**Features**:
- Shows error count badge (if errors > 0)
- Color changes when open (gray) vs closed (primary)

### Drawer Header

```
┌────────────────────────────────────────────────────────┐
│ 🖥️ System Logger | Total: 245 | Errors: 3 | Avg: 125ms │
│                              [Live] [🗑️] [↓] [✕]       │
└────────────────────────────────────────────────────────┘
```

### Filter Bar

```
┌────────────────────────────────────────────────────────┐
│ 🔍 [Search logs...] [All Levels▼] [All Types▼] ☑ Auto-scroll │
└────────────────────────────────────────────────────────┘
```

### Log List + Detail Panel

```
┌─────────────────────────────┬─────────────────────┐
│ Log Entries (scrollable)    │ Log Details         │
│                             │                     │
│ [Log entry 1]               │ Level: success      │
│ [Log entry 2] ← selected    │ Type: response      │
│ [Log entry 3]               │ Timestamp: ...      │
│ [Log entry 4]               │ Message: ...        │
│ ...                         │ Request Body: {...} │
│                             │ Response Body:{...} │
└─────────────────────────────┴─────────────────────┘
```

---

## 🔧 Configuration

### Backend Configuration

**Max Logs in Memory**:
```typescript
// backend/src/services/loggerService.ts
private readonly MAX_LOGS = 1000; // Adjust as needed
```

**Cache Duration** (future feature):
```typescript
private readonly CACHE_DURATION = 60000; // 1 minute
```

**Response Body Truncation**:
```typescript
// backend/src/middleware/loggingMiddleware.ts
if (bodySize > 10000) {  // Truncate if >10KB
  parsedBody = {
    _truncated: true,
    _size: bodySize,
    _preview: JSON.stringify(parsedBody).substring(0, 1000) + '...'
  };
}
```

### Frontend Configuration

**Drawer Height**:
```typescript
// frontend/src/components/LoggerDrawer.tsx
style={{ height: isOpen ? '60vh' : '0' }}  // 60% of viewport
```

**Log Limit**:
```typescript
const response = await api.get('/logs?limit=100');  // Last 100 logs
```

**Auto-refresh Interval** (when not streaming):
Can be added in `useEffect` with `setInterval`.

---

## 📈 Statistics Dashboard

**Metrics Displayed**:
- **Total Logs**: Count of all logs in memory
- **Error Count**: Number of error-level logs
- **Average Response Time**: Mean duration of all HTTP responses
- **Error Rate**: Percentage of logs that are errors

**Example**:
```json
{
  "total": 245,
  "byLevel": {
    "info": 120,
    "success": 95,
    "warn": 27,
    "error": 3,
    "debug": 0
  },
  "byType": {
    "request": 122,
    "response": 120,
    "system": 3,
    "service": 0,
    "error": 0
  },
  "errorRate": 1.22,
  "avgResponseTime": 125.5,
  "recentErrors": [...]
}
```

---

## 🎓 Best Practices

### 1. When to Use Logger Service Directly

```typescript
import { loggerService } from '../services/loggerService';

// System events
loggerService.info('Starting batch job');
loggerService.success('Batch job completed');

// Service activity
loggerService.logService('EmailService', 'Sending welcome email', {
  userId: 123,
  email: 'user@example.com'
});

// Errors
try {
  // some operation
} catch (error) {
  loggerService.error('Failed to process payment', error, {
    orderId: 456,
    amount: 99.99
  });
}

// Debug
loggerService.debug('Cache hit for key: user:123', { cached: true });
```

### 2. Automatic HTTP Logging

**No code needed!** The logging middleware automatically captures:
- All requests (method, URL, headers, body)
- All responses (status, duration, body)

### 3. Monitoring in Production

- **Keep Live Streaming OFF** unless actively debugging
- **Monitor error count** badge on toggle button
- **Export logs regularly** for analysis
- **Clear old logs** periodically to free memory

### 4. Performance Considerations

- Logs stored in memory (RAM)
- Circular buffer prevents unlimited growth
- Large response bodies truncated automatically
- SSE connection only when drawer is open + streaming enabled

---

## 🐛 Debugging Scenarios

### Scenario 1: API Errors

**Problem**: Getting 500 errors from backend

**Solution**:
1. Open Logger
2. Filter by "error" level
3. Click error log entry
4. Check error stack trace
5. Review request that caused error

### Scenario 2: Slow Responses

**Problem**: API seems slow

**Solution**:
1. Open Logger
2. Enable Live streaming
3. Make API calls
4. Check duration column
5. Identify slow endpoints (>1000ms)

### Scenario 3: Missing Data

**Problem**: Expected data not returned

**Solution**:
1. Open Logger
2. Find corresponding request/response pair
3. Click response log
4. Inspect responseBody
5. Verify actual vs expected data

---

## 🔒 Security Considerations

### What's Logged

✅ **Safe to Log**:
- URLs and endpoints
- HTTP methods
- Status codes
- Response times
- Public data

⚠️ **Be Careful**:
- Request/response bodies may contain sensitive data
- Headers may contain auth tokens
- Metadata can reveal system internals

### Recommendations

1. **Don't log passwords** in request bodies
2. **Mask sensitive headers** (Authorization, etc.)
3. **Truncate large responses** (already implemented)
4. **Clear logs regularly** in production
5. **Limit access** to logger UI (add authentication if needed)

---

## 🚀 Future Enhancements

### Potential Additions

- [ ] **Persistent Storage**: Save logs to database
- [ ] **Log Levels Toggle**: Show/hide debug logs globally
- [ ] **Performance Metrics**: CPU, memory usage
- [ ] **Custom Filters**: Save filter presets
- [ ] **Alert Rules**: Email/Slack on error threshold
- [ ] **Log Replay**: Replay API calls from logs
- [ ] **Search History**: Recent searches
- [ ] **Export Formats**: CSV, PDF export
- [ ] **Time Range Filter**: Filter by date/time
- [ ] **WebSocket Alternative**: Use WS instead of SSE
- [ ] **Authentication**: Protect logger endpoints
- [ ] **Rate Limiting**: Prevent log spam

---

## 📚 API Reference

### Logger Service

```typescript
interface LogEntry {
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
```

### REST API

**GET /api/logs**
```
Query Parameters:
  - level: 'info' | 'warn' | 'error' | 'debug' | 'success'
  - type: 'request' | 'response' | 'system' | 'service' | 'error'
  - search: string
  - limit: number

Response:
{
  "logs": LogEntry[],
  "count": number,
  "timestamp": Date
}
```

**GET /api/logs/stats**
```
Response:
{
  "stats": {
    "total": number,
    "byLevel": {...},
    "byType": {...},
    "errorRate": number,
    "avgResponseTime": number,
    "recentErrors": LogEntry[]
  },
  "timestamp": Date
}
```

**GET /api/logs/stream**
```
Response: text/event-stream
Event Format: data: {LogEntry as JSON}\n\n
```

**DELETE /api/logs**
```
Response:
{
  "message": "Logs cleared successfully",
  "timestamp": Date
}
```

---

## ✅ Summary

The Professional Logger System provides:

✅ **Real-time monitoring** of all API activity  
✅ **Beautiful pull-down UI** accessible from any page  
✅ **Comprehensive logging** of requests, responses, errors  
✅ **Advanced filtering** and search capabilities  
✅ **Detailed inspection** of log entries  
✅ **Export functionality** for offline analysis  
✅ **Production-ready** with proper error handling  

**Status**: ✅ Ready for Production Use

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-12-26  
**Maintainer**: System Architecture Team
