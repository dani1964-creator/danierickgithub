"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Lightweight logger wrapper used by frontend code.
// Debug output only appears in development (Vite sets import.meta.env.DEV).
const isDev = (() => {
    try {
        // Vite env
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const im = import.meta;
        if (im && im.env && typeof im.env.DEV !== 'undefined')
            return Boolean(im.env.DEV);
    }
    catch {
        // import.meta might not be available in some environments
    }
    return process.env.NODE_ENV !== 'production';
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
