"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.getErrorMessage = getErrorMessage;
exports.toSlug = toSlug;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function getErrorMessage(err) {
    if (err instanceof Error)
        return err.message;
    if (err && typeof err === 'object' && 'message' in err) {
        const m = err.message;
        return typeof m === 'string' ? m : JSON.stringify(err);
    }
    try {
        return typeof err === 'string' ? err : JSON.stringify(err);
    }
    catch {
        return 'Ocorreu um erro desconhecido';
    }
}
// Gera slug robusto a partir de um texto
function toSlug(input) {
    return input
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
