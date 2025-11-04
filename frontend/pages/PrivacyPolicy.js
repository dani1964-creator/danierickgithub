"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const react_router_dom_1 = require("react-router-dom");
const client_1 = require("@/integrations/supabase/client");
const react_helmet_async_1 = require("react-helmet-async");
const dompurify_1 = __importDefault(require("dompurify"));
const loading_skeleton_1 = require("@/components/ui/loading-skeleton");
const PrivacyPolicy = () => {
    const { slug } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [brokerProfile, setBrokerProfile] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [notFound, setNotFound] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchBrokerProfile = async () => {
            if (!slug) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await client_1.supabase.rpc('get_public_broker_branding_secure', {
                    broker_website_slug: slug
                });
                if (error) {
                    logger_1.logger.error('Error fetching broker:', error);
                    setNotFound(true);
                }
                else if (!data || data.length === 0) {
                    setNotFound(true);
                }
                else {
                    setBrokerProfile(data[0]);
                }
            }
            catch (error) {
                logger_1.logger.error('Error:', error);
                setNotFound(true);
            }
            finally {
                setLoading(false);
            }
        };
        fetchBrokerProfile();
    }, [slug, navigate]);
    if (loading) {
        return (0, jsx_runtime_1.jsx)(loading_skeleton_1.ContentPageSkeleton, {});
    }
    if (notFound) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/404", replace: true });
    }
    // Convert markdown-style content to HTML
    const formatContent = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n/g, '<br />');
    };
    const sanitizedContent = dompurify_1.default.sanitize(formatContent(brokerProfile?.privacy_policy_content || ''));
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_helmet_async_1.Helmet, { children: [(0, jsx_runtime_1.jsxs)("title", { children: ["Pol\u00EDtica de Privacidade - ", brokerProfile?.business_name] }), (0, jsx_runtime_1.jsx)("meta", { name: "description", content: `Política de Privacidade da ${brokerProfile?.business_name}. Como coletamos, usamos e protegemos seus dados pessoais.` })] }), (0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-background animate-fade-in", children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-background dark:bg-card shadow-sm border-b dark:border-border", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [brokerProfile?.logo_url ? ((0, jsx_runtime_1.jsx)("img", { src: brokerProfile.logo_url, alt: brokerProfile.business_name, className: "h-10 w-auto mr-3" })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded text-white flex items-center justify-center font-bold mr-3", style: { backgroundColor: brokerProfile?.primary_color || 'hsl(var(--primary))' }, children: brokerProfile?.business_name?.charAt(0) || 'I' })), (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-foreground", children: brokerProfile?.business_name })] }) }) }), (0, jsx_runtime_1.jsxs)("main", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-lg p-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold mb-8", style: { color: brokerProfile?.primary_color || 'hsl(var(--primary))' }, children: "Pol\u00EDtica de Privacidade" }), (0, jsx_runtime_1.jsx)("div", { className: "prose prose-lg text-muted-foreground leading-relaxed", dangerouslySetInnerHTML: { __html: sanitizedContent } })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 text-center", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        // Navigate back and let the PublicSite component handle context restoration
                                        navigate(`/${slug}`, { replace: true });
                                    }, className: "inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors hover:opacity-90", style: {
                                        backgroundColor: brokerProfile?.primary_color || 'hsl(var(--primary))'
                                    }, children: "Voltar ao site" }) })] })] })] }));
};
exports.default = PrivacyPolicy;
