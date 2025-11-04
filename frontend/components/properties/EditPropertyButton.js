"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const EditPropertyDialog_1 = __importDefault(require("./EditPropertyDialog"));
const EditPropertyButton = ({ property, onPropertyUpdated }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => setOpen(true), className: "hover:bg-primary/10 hover:text-primary hover:border-primary/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) }), (0, jsx_runtime_1.jsx)(EditPropertyDialog_1.default, { property: property, open: open, onOpenChange: setOpen, onPropertyUpdated: onPropertyUpdated })] }));
};
exports.default = EditPropertyButton;
