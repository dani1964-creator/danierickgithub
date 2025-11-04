"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
const badge_variants_1 = require("@/components/ui/badge-variants");
function Badge({ className, variant, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)((0, badge_variants_1.badgeVariants)({ variant }), className), ...props }));
}
