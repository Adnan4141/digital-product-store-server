interface LogContext {
  method?: string;
  path?: string;
  params?: any;
  query?: any;
  body?: any;
  userId?: string;
  [key: string]: any;
}

class Logger {
  error(message: string, error: Error | any, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      message,
      error: {
        name: error?.name || 'Unknown',
        message: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      },
      context: context || {},
    };

    console.error('❌ ERROR:', JSON.stringify(errorDetails, null, 2));
    
    console.error('\n--- Error Details ---');
    console.error(`Time: ${timestamp}`);
    console.error(`Message: ${message}`);
    console.error(`Error Name: ${error?.name || 'Unknown'}`);
    console.error(`Error Message: ${error?.message || String(error)}`);
    if (context) {
      console.error('Context:', context);
    }
    if (error?.stack) {
      console.error('Stack Trace:');
      console.error(error.stack);
    }
    if (error?.code) {
      console.error(`Error Code: ${error.code}`);
    }
    if (error?.meta) {
      console.error('Error Meta:', error.meta);
    }
    console.error('--- End Error ---\n');
  }

  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️  WARNING [${timestamp}]: ${message}`, context || '');
  }

  info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    console.log(`ℹ️  INFO [${timestamp}]: ${message}`, context || '');
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`🔍 DEBUG [${timestamp}]: ${message}`, context || '');
    }
  }
}

export const logger = new Logger();
