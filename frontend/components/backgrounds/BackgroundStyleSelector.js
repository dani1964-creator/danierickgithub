"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const card_1 = require("@/components/ui/card");
const label_1 = require("@/components/ui/label");
const BackgroundRenderer_1 = __importDefault(require("./BackgroundRenderer"));
// Presets profissionais (novos). IDs antigos ainda são suportados no renderer.
const backgroundStyles = [
    {
        id: 'pro-minimal',
        name: 'Minimal Super Clean',
        description: 'Sólido suave com micro texturas discretas'
    },
    {
        id: 'pro-soft-gradient',
        name: 'Soft Gradient Pro',
        description: 'Gradiente sutil e elegante, sem distrações'
    },
    {
        id: 'pro-mesh',
        name: 'Subtle Mesh',
        description: 'Mesh gradients bem suaves para profundidade'
    },
    {
        id: 'pro-glass',
        name: 'Glass Surface',
        description: 'Sensação de vidro fosco com leve brilho'
    },
    {
        id: 'pro-grid',
        name: 'Fine Grid',
        description: 'Grade fina e neutra para organização'
    },
    {
        id: 'pro-dots',
        name: 'Soft Dots',
        description: 'Pontos extremamente sutis para textura'
    }
];
const BackgroundStyleSelector = ({ selectedStyle, color1, color2, color3, onStyleChange, onColorChange }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-base font-semibold", children: "Estilo de Fundo das Se\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground mt-1", children: "Escolha o estilo visual que ser\u00E1 aplicado nas se\u00E7\u00F5es \"Im\u00F3veis em Destaque\" e \"Todos os Im\u00F3veis\"" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: backgroundStyles.map((style) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: `cursor-pointer transition-all duration-200 ${selectedStyle === style.id
                        ? 'ring-2 ring-primary shadow-md'
                        : 'hover:shadow-sm'}`, onClick: () => onStyleChange(style.id), children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium", children: style.name }), (0, jsx_runtime_1.jsx)("div", { className: `w-4 h-4 rounded-full border-2 ${selectedStyle === style.id
                                                ? 'bg-primary border-primary'
                                                : 'border-border'}` })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: style.description }), (0, jsx_runtime_1.jsx)("div", { className: "h-24 rounded-md overflow-hidden border", children: (0, jsx_runtime_1.jsx)(BackgroundRenderer_1.default, { style: style.id, color1: color1, color2: color2, color3: color3, className: "h-full", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center h-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-center opacity-60", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-2 bg-current rounded mb-1 mx-auto" }), (0, jsx_runtime_1.jsx)("div", { className: "w-16 h-1 bg-current rounded opacity-60 mx-auto" })] }) }) }) })] }) }) }, style.id))) }), (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-base font-semibold", children: "Personalizar Cores" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "color1", className: "text-sm", children: "Cor Prim\u00E1ria" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { id: "color1", type: "color", value: color1, onChange: (e) => onColorChange(1, e.target.value), className: "w-10 h-10 rounded border border-input cursor-pointer" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: color1, onChange: (e) => onColorChange(1, e.target.value), className: "flex-1 px-2 py-1 text-sm border border-input rounded", placeholder: "#2563eb" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "color2", className: "text-sm", children: "Cor Secund\u00E1ria" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { id: "color2", type: "color", value: color2, onChange: (e) => onColorChange(2, e.target.value), className: "w-10 h-10 rounded border border-input cursor-pointer" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: color2, onChange: (e) => onColorChange(2, e.target.value), className: "flex-1 px-2 py-1 text-sm border border-input rounded", placeholder: "#64748b" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "color3", className: "text-sm", children: "Cor de Fundo" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { id: "color3", type: "color", value: color3, onChange: (e) => onColorChange(3, e.target.value), className: "w-10 h-10 rounded border border-input cursor-pointer" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: color3, onChange: (e) => onColorChange(3, e.target.value), className: "flex-1 px-2 py-1 text-sm border border-input rounded", placeholder: "#ffffff" })] })] })] })] }) }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-base font-semibold", children: "Visualiza\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("div", { className: "h-40 rounded-lg overflow-hidden border", children: (0, jsx_runtime_1.jsx)(BackgroundRenderer_1.default, { style: selectedStyle, color1: color1, color2: color2, color3: color3, className: "h-full", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center h-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-bold mb-2 opacity-80", children: backgroundStyles.find(s => s.id === selectedStyle)?.name }), (0, jsx_runtime_1.jsx)("div", { className: "w-16 h-1 bg-current rounded mx-auto opacity-60" })] }) }) }) })] }) }) })] }));
};
exports.default = BackgroundStyleSelector;
