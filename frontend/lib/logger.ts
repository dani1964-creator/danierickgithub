// Lightweight logger wrapper used by frontend code.
// Prefer server-side / bundler-safe environment variables. Avoid accessing
// `import.meta` directly because bundlers (and Next's runtime) may warn.
const isDev = (() => {
  try {
    // Honor an explicit public debug flag when present (useful for preview/deploys)
    if (typeof process !== 'undefined') {
      const pub = process.env.NEXT_PUBLIC_DEBUG || process.env.NEXT_PUBLIC_VITE_DEV;
      if (typeof pub !== 'undefined') return String(pub) === '1' || String(pub).toLowerCase() === 'true';
      return process.env.NODE_ENV !== 'production';
    }
  } catch (e) {
    // Fallback safe value
  }
  return false;
})();

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...(args as any));
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...(args as any));
  },
  warn: (...args: unknown[]) => console.warn(...(args as any)),
  error: (...args: unknown[]) => console.error(...(args as any)),
};

export default logger;
