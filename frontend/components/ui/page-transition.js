"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageTransition = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const PageTransition = ({ children, duration = 300 }) => {
    const location = (0, react_router_dom_1.useLocation)();
    const [displayLocation, setDisplayLocation] = (0, react_1.useState)(location);
    const [transitionStage, setTransitionStage] = (0, react_1.useState)('fadeIn');
    (0, react_1.useEffect)(() => {
        if (location !== displayLocation) {
            setTransitionStage('fadeOut');
        }
    }, [location, displayLocation]);
    return ((0, jsx_runtime_1.jsx)("div", { className: `transition-opacity duration-${duration} ${transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'}`, onTransitionEnd: () => {
            if (transitionStage === 'fadeOut') {
                setDisplayLocation(location);
                setTransitionStage('fadeIn');
            }
        }, children: children }));
};
exports.PageTransition = PageTransition;
