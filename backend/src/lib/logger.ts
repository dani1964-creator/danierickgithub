// Lightweight logger for backend code
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...(args as any));
  },
  info: (...args: unknown[]) => console.info(...(args as any)),
  warn: (...args: unknown[]) => console.warn(...(args as any)),
  error: (...args: unknown[]) => console.error(...(args as any)),
};

export default logger;
