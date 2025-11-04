"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const PropertyViewToggle = ({ view, onViewChange }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: view === 'grid' ? 'default' : 'outline', size: "sm", onClick: () => onViewChange('grid'), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Grid3X3, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: view === 'list' ? 'default' : 'outline', size: "sm", onClick: () => onViewChange('list'), children: (0, jsx_runtime_1.jsx)(lucide_react_1.List, { className: "h-4 w-4" }) })] }));
};
exports.default = PropertyViewToggle;
