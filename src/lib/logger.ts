// Lightweight logger wrapper used by frontend code.
// Debug output only appears in development (Vite sets import.meta.env.DEV).
const isDev = (() => {
  try {
    // Vite env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const im = (import.meta as any);
    if (im && im.env && typeof im.env.DEV !== 'undefined') return Boolean(im.env.DEV);
  } catch {
    // import.meta might not be available in some environments
  }
  return process.env.NODE_ENV !== 'production';
})();

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...(args as any));
  },
  info: (...args: unknown[]) => console.info(...(args as any)),
  warn: (...args: unknown[]) => console.warn(...(args as any)),
  error: (...args: unknown[]) => console.error(...(args as any)),
};

export default logger;
