export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, unknown>;
}

export class Logger {
  static log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    };

    // Output as JSON for structured logging
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  static error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }
}

// MCP Audit Logger
export class MCPCallLogger {
  static logToolCall(userId: string, toolName: string, params: Record<string, unknown>, result: unknown): void {
    Logger.info('MCP Tool Call', {
      userId,
      toolName,
      params,
      result,
      type: 'mcp_audit'
    });
  }

  static logToolError(userId: string, toolName: string, params: Record<string, unknown>, error: unknown): void {
    Logger.error('MCP Tool Error', {
      userId,
      toolName,
      params,
      error: error instanceof Error ? error.message : String(error),
      type: 'mcp_audit'
    });
  }
}