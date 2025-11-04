"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomableImage = ZoomableImage;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function ZoomableImage({ src, alt, className }) {
    const [scale, setScale] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const containerRef = React.useRef(null);
    const imageRef = React.useRef(null);
    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.5, 4));
    };
    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.5, 1));
        if (scale <= 1.5) {
            setPosition({ x: 0, y: 0 });
        }
    };
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };
    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };
    const handleMouseMove = React.useCallback((e) => {
        if (isDragging && scale > 1) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            // Limite o movimento baseado no tamanho da imagem e container
            const container = containerRef.current;
            const image = imageRef.current;
            if (container && image) {
                const containerRect = container.getBoundingClientRect();
                const scaledWidth = image.naturalWidth * scale;
                const scaledHeight = image.naturalHeight * scale;
                const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
                const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
                setPosition({
                    x: Math.max(-maxX, Math.min(maxX, newX)),
                    y: Math.max(-maxY, Math.min(maxY, newY))
                });
            }
        }
    }, [isDragging, dragStart, scale]);
    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false);
    }, []);
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.max(1, Math.min(4, scale + delta));
        setScale(newScale);
        if (newScale <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative w-full h-full group flex items-center justify-center", children: [(0, jsx_runtime_1.jsx)("div", { ref: containerRef, className: "relative overflow-hidden cursor-move flex items-center justify-center", onMouseDown: handleMouseDown, onWheel: handleWheel, style: { maxWidth: '100%', maxHeight: '100%' }, children: (0, jsx_runtime_1.jsx)("img", { ref: imageRef, src: src, alt: alt, className: (0, utils_1.cn)("max-w-full max-h-full object-contain transition-transform duration-200", className), style: {
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }, draggable: false }) }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden md:flex absolute top-4 left-4 bg-black/60 rounded-lg p-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleZoomIn, disabled: scale >= 4, className: "p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", title: "Aumentar zoom", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ZoomIn, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleZoomOut, disabled: scale <= 1, className: "p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", title: "Diminuir zoom", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ZoomOut, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleReset, disabled: scale === 1 && position.x === 0 && position.y === 0, className: "p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", title: "Resetar zoom", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RotateCcw, { className: "h-4 w-4" }) })] }), scale > 1 && ((0, jsx_runtime_1.jsxs)("div", { className: "hidden md:block absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm", children: [Math.round(scale * 100), "%"] })), scale === 1 && ((0, jsx_runtime_1.jsx)("div", { className: "hidden md:block absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity", children: "Use a roda do mouse ou os bot\u00F5es para fazer zoom" }))] }));
}
