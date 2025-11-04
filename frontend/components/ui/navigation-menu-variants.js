"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationMenuTriggerStyle = void 0;
const class_variance_authority_1 = require("class-variance-authority");
exports.navigationMenuTriggerStyle = (0, class_variance_authority_1.cva)("group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50");
