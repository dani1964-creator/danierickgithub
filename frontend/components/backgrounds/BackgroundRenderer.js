"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const BackgroundRenderer = ({ style, color1, color2, color3 = '#ffffff', className = '', children }) => {
    const renderStyle1 = () => (
    // Gradiente Suave (atual "Destaque")
    (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-br from-white to-gray-50" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-[0.06]", style: {
                    background: `linear-gradient(135deg, ${color1}, ${color2})`
                } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 w-96 h-96 opacity-[0.04]", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full h-full rounded-full blur-3xl", style: { backgroundColor: color1 } }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 w-64 h-64 opacity-[0.04]", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full h-full rounded-full blur-2xl", style: { backgroundColor: color2 } }) })] }));
    const renderStyle2 = () => (
    // Geométrico Diagonal (atual "Todos")
    (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-white" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-[0.05]", style: {
                            background: `linear-gradient(45deg, ${color1}, transparent 50%, ${color2})`,
                            clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                        } })] }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-10 left-10 w-32 h-32 opacity-5", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full h-full transform rotate-45 blur-sm", style: {
                        background: `linear-gradient(45deg, ${color1}, ${color2})`
                    } }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-10 right-10 w-24 h-24 opacity-5", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full h-full rounded-full blur-xl", style: { backgroundColor: color2 } }) })] }));
    const renderStyle3 = () => (
    // Ondas Modernas
    (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-br from-white to-gray-50" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-[0.08]", style: {
                    background: `radial-gradient(ellipse at top left, ${color1}15, transparent 50%), radial-gradient(ellipse at bottom right, ${color2}15, transparent 50%)`
                } }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute -top-10 -left-10 w-96 h-96 opacity-[0.06]", style: {
                            background: `conic-gradient(from 0deg, ${color1}, ${color2}, ${color1})`,
                            borderRadius: '50% 30% 70% 40%',
                            filter: 'blur(60px)',
                            animation: 'float 8s ease-in-out infinite'
                        } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute -bottom-10 -right-10 w-80 h-80 opacity-[0.06]", style: {
                            background: `conic-gradient(from 180deg, ${color2}, ${color1}, ${color2})`,
                            borderRadius: '40% 70% 30% 50%',
                            filter: 'blur(50px)',
                            animation: 'float 10s ease-in-out infinite reverse'
                        } })] })] }));
    const renderStyle4 = () => (
    // Minimalista Clean
    (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0", style: { backgroundColor: `${color3}f2` } }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 opacity-[0.03]", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/4 left-1/4 w-2 h-2 rounded-full", style: { backgroundColor: color1 } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/3 right-1/3 w-1 h-1 rounded-full", style: { backgroundColor: color2 } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full", style: { backgroundColor: color1 } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full", style: { backgroundColor: color2 } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 opacity-[0.04]", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 left-1/4 w-px h-full", style: {
                            background: `linear-gradient(to bottom, transparent, ${color1}, transparent)`
                        } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/3 left-0 w-full h-px", style: {
                            background: `linear-gradient(to right, transparent, ${color2}, transparent)`
                        } })] })] }));
    const renderStyle5 = () => (
    // Padrão Hexagonal
    (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0", style: {
                    background: `linear-gradient(135deg, ${color3}, ${color3}e6)`
                } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-[0.06]", style: {
                    backgroundImage: `
            radial-gradient(circle at 25% 25%, ${color1}20 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, ${color2}20 0%, transparent 50%),
            radial-gradient(circle at 25% 75%, ${color2}20 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${color1}20 0%, transparent 50%)
          `,
                    backgroundSize: '80px 80px'
                } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-10 right-10 opacity-8", children: (0, jsx_runtime_1.jsx)("div", { className: "w-32 h-32 transform rotate-45 blur-sm", style: {
                        background: `linear-gradient(60deg, ${color1}, ${color2})`,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    } }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-20 left-10 opacity-6", children: (0, jsx_runtime_1.jsx)("div", { className: "w-24 h-24 transform -rotate-12 blur-md", style: {
                        background: `linear-gradient(120deg, ${color2}, ${color1})`,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    } }) })] }));
    // Mapear presets "pro" para estilos base existentes (fallback visual)
    const normalizedStyle = (() => {
        switch (style) {
            case 'pro-minimal':
                return 'style4'; // Minimalista
            case 'pro-soft-gradient':
                return 'style1'; // Gradiente Suave
            case 'pro-mesh':
                return 'style3'; // Ondas/mesh suave
            case 'pro-glass':
                return 'style2'; // Diagonal com sobreposição (simula vidro)
            case 'pro-grid':
            case 'pro-dots':
                return 'style5'; // Padrão discreto
            default:
                return style;
        }
    })();
    const renderBackground = () => {
        switch (normalizedStyle) {
            case 'style1':
                return renderStyle1();
            case 'style2':
                return renderStyle2();
            case 'style3':
                return renderStyle3();
            case 'style4':
                return renderStyle4();
            case 'style5':
                return renderStyle5();
            default:
                return renderStyle1();
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `relative overflow-hidden ${className}`, children: [renderBackground(), (0, jsx_runtime_1.jsx)("div", { className: "relative z-10", children: children }), (0, jsx_runtime_1.jsx)("style", { children: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      ` })] }));
};
exports.default = BackgroundRenderer;
