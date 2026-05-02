import axios from 'axios';

// --- Type Definitions ---
export type LogStack = 'backend' | 'frontend';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogPackage = 
  | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' // Frontend specific
  | 'auth' | 'config' | 'middleware' | 'utils'                // Shared
  | 'handler' | 'db';                                         // Backend specific (from examples)

interface LogResponse {
  logID: string;
  message: string;
}

// --- Configuration & State ---
// Ideally, this should come from environment variables.
const LOG_API_URL = process.env.LOGGING_API_URL || 'http://20.207.122.201/evaluation-service/logs';

// We store the access token in memory or retrieve it via an external provider/function.
let currentAccessToken: string | null = null;

/**
 * Configure the logger with an access token.
 * This should be called once during application startup after authentication.
 * @param token The Bearer token received from the auth API
 */
export const configureLogger = (token: string) => {
  currentAccessToken = token;
};

/**
 * Validates the log parameters against the constraints.
 */
const validateLogParams = (stack: string, level: string, pkg: string) => {
  const validStacks = ['backend', 'frontend'];
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  
  // Frontend only + Shared + Backend specific
  const validPackages = [
    'api', 'component', 'hook', 'page', 'state', 'style',
    'auth', 'config', 'middleware', 'utils',
    'handler', 'db'
  ];

  if (!validStacks.includes(stack)) {
    console.warn(`[LoggingMiddleware] Invalid stack: ${stack}. Must be one of ${validStacks.join(', ')}`);
  }
  if (!validLevels.includes(level)) {
    console.warn(`[LoggingMiddleware] Invalid level: ${level}. Must be one of ${validLevels.join(', ')}`);
  }
  if (!validPackages.includes(pkg)) {
    console.warn(`[LoggingMiddleware] Invalid package: ${pkg}. Ensure you are using an approved package name.`);
  }
};

/**
 * Centralized logging function that sends logs to the evaluation test server.
 * 
 * @param stack   The execution environment ("backend" | "frontend")
 * @param level   The severity level ("debug" | "info" | "warn" | "error" | "fatal")
 * @param pkg     The package/module where the log originated (e.g., "handler", "api", "auth")
 * @param message A descriptive log message
 */
export const Log = async (
  stack: LogStack, 
  level: LogLevel, 
  pkg: LogPackage, 
  message: string
): Promise<LogResponse | void> => {
  // 1. Validate inputs (helps catch typos during development)
  validateLogParams(stack, level, pkg);

  // 2. Local fallback logging (always good to have standard out)
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${stack.toUpperCase()}] [${level.toUpperCase()}] [${pkg}]: ${message}`);

  // 3. Send to external log server
  try {
    const token = currentAccessToken || process.env.ACCESS_TOKEN;
    
    if (!token) {
      console.warn('[LoggingMiddleware] Access token is missing. Log was only written locally.');
      return;
    }

    const payload = {
      stack,
      level,
      package: pkg,
      message
    };

    const response = await axios.post<LogResponse>(
      LOG_API_URL, 
      payload, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000 // Ensure we don't hang the application
      }
    );

    return response.data;
  } catch (error: any) {
    // If the remote logger fails, we shouldn't crash the main application.
    // Instead, we catch the error and log it locally.
    console.error('[LoggingMiddleware] Failed to send log to remote server:', error?.response?.data || error?.message);
  }
};

export default Log;
