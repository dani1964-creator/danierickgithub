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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwipeableCarousel = SwipeableCarousel;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const carousel_1 = require("@/components/ui/carousel");
const embla_carousel_autoplay_1 = __importDefault(require("embla-carousel-autoplay"));
function SwipeableCarousel({ children, className = "", autoplay = false, autoplayDelay = 3000 }) {
    const plugin = React.useRef((0, embla_carousel_autoplay_1.default)({ delay: autoplayDelay, stopOnInteraction: true }));
    return ((0, jsx_runtime_1.jsxs)(carousel_1.Carousel, { plugins: autoplay ? [plugin.current] : [], className: className, onMouseEnter: autoplay ? plugin.current.stop : undefined, onMouseLeave: autoplay ? plugin.current.reset : undefined, children: [(0, jsx_runtime_1.jsx)(carousel_1.CarouselContent, { className: "-ml-4", children: children.map((child, index) => ((0, jsx_runtime_1.jsx)(carousel_1.CarouselItem, { className: "pl-4", children: child }, index))) }), (0, jsx_runtime_1.jsx)(carousel_1.CarouselPrevious, { className: "left-2" }), (0, jsx_runtime_1.jsx)(carousel_1.CarouselNext, { className: "right-2" })] }));
}
