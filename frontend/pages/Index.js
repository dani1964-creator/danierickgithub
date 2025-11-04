"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const useAuth_1 = require("@shared/hooks/useAuth");
const AuthForm_1 = __importDefault(require("@/components/auth/AuthForm"));
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
const Dashboard_1 = __importDefault(require("./Dashboard"));
const Index = () => {
    const { isAuthenticated, loading } = (0, useAuth_1.useAuth)();
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-background", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center animate-fade-in", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-xs text-muted-foreground", children: "Verificando acesso..." })] }) }));
    }
    if (!isAuthenticated) {
        return (0, jsx_runtime_1.jsx)(AuthForm_1.default, {});
    }
    return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {}) }));
};
exports.default = Index;
