"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Lightweight logger wrapper used by frontend code.
// Prefer bundler-safe environment variables. Avoid `import.meta` access which
// may trigger warnings in Next's build/runtime.
const isDev = (() => {
    try {
        if (typeof process !== 'undefined') {
            const pub = process.env.NEXT_PUBLIC_DEBUG || process.env.NEXT_PUBLIC_VITE_DEV;
            if (typeof pub !== 'undefined') return String(pub) === '1' || String(pub).toLowerCase() === 'true';
            return process.env.NODE_ENV !== 'production';
        }
    }
    catch (e) {
    }
    return false;
})();
exports.logger = {
    debug: (...args) => {
        if (isDev)
            console.debug(...args);
    },
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};
exports.default = exports.logger;
