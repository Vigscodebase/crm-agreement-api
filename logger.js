import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// 1. Create highly optimized asynchronous file transports
const backendTransport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: path.join(__dirname, 'logs', 'backend.log'), mkdir: true },
      level: isProduction ? 'info' : 'debug',
    }
    // {
    //   target: 'pino/file', // Also output to terminal console stream for cloud log aggregators
    //   options: { destination: 1 },
    //   level: isProduction ? 'info' : 'debug',
    // }
  ]
});

// Dedicated file destination for incoming frontend logs
export const frontendFileLogger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: { destination: path.join(__dirname, 'logs', 'frontend.log'), mkdir: true }
  }
});

// 2. Initialize the HTTP middleware logger
export const httpLogger = pinoHttp({
  level: isProduction ? 'info' : 'debug',
  // SECURITY: Automatically strip out sensitive data before it reaches logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.token',
      'body.creditCard'
    ],
    censor: '[REDACTED]'
  },
  // Inject a unique correlation ID per request for distributed tracing
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
}, backendTransport);