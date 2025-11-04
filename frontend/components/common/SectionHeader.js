"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionHeader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
const SectionHeader = ({ title, subtitle, className }) => ((0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.default)("max-w-6xl mx-auto px-4 md:px-6 lg:px-8", className), children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl md:text-3xl font-semibold tracking-tight", style: { color: 'var(--surface-fg)' }, children: title }), subtitle && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base text-slate-600 max-w-2xl mx-auto", children: subtitle }))] }) }));
exports.SectionHeader = SectionHeader;
exports.default = exports.SectionHeader;
