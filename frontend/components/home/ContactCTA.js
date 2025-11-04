"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const button_1 = require("@/components/ui/button");
const use_toast_1 = require("@/hooks/use-toast");
const client_1 = require("@/integrations/supabase/client");
const LeadModal_1 = __importDefault(require("@/components/leads/LeadModal"));
const ContactCTA = ({ brokerProfile }) => {
    const [contactInfo, setContactInfo] = (0, react_1.useState)(null);
    const [showLeadModal, setShowLeadModal] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const whatsappButtonText = brokerProfile?.whatsapp_button_text || 'Fale com um Corretor';
    const whatsappButtonColor = brokerProfile?.whatsapp_button_color || '#25D366';
    // Fetch contact information using public RPC (no authentication required)
    const fetchContactInfo = (0, react_1.useCallback)(async () => {
        if (!brokerProfile?.website_slug) {
            logger_1.logger.warn('No broker profile or website_slug available for ContactCTA');
            return null;
        }
        try {
            logger_1.logger.debug('ContactCTA fetching contact info for:', brokerProfile.website_slug);
            const { data, error } = await client_1.supabase.rpc('get_public_broker_contact', {
                broker_website_slug: brokerProfile.website_slug
            });
            logger_1.logger.debug('ContactCTA Contact RPC response:', {
                data,
                error
            });
            if (error) {
                logger_1.logger.error('ContactCTA Error fetching contact info:', error);
                return null;
            }
            const contactInfo = data && data.length > 0 ? data[0] : null;
            logger_1.logger.debug('ContactCTA Parsed contact info:', contactInfo);
            if (contactInfo) {
                setContactInfo(contactInfo);
                return contactInfo;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('ContactCTA Error fetching contact info:', error);
            return null;
        }
    }, [brokerProfile?.website_slug]);
    // Fetch contact info when component mounts
    (0, react_1.useEffect)(() => {
        if (brokerProfile?.website_slug) {
            logger_1.logger.debug('ContactCTA component loaded, fetching contact info...');
            fetchContactInfo();
        }
    }, [brokerProfile?.website_slug, fetchContactInfo]);
    const handleContactClick = async () => {
        // Fetch contact info if not already loaded
        let currentContactInfo = contactInfo;
        if (!currentContactInfo) {
            currentContactInfo = await fetchContactInfo();
        }
        if (currentContactInfo?.whatsapp_number) {
            const message = encodeURIComponent('Olá! Gostaria de mais informações sobre os imóveis.');
            // Detectar se é mobile para usar link apropriado
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const whatsappUrl = isMobile ? `whatsapp://send?phone=${currentContactInfo.whatsapp_number}&text=${message}` : `https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`;
            try {
                window.open(whatsappUrl, '_blank');
            }
            catch (error) {
                logger_1.logger.error('Erro ao abrir WhatsApp:', error);
                // Fallback para web WhatsApp
                window.open(`https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`, '_blank');
            }
        }
        else {
            // Show user-friendly error message
            toast({
                title: "Informações de contato não disponíveis",
                description: "Tente novamente em alguns instantes.",
                variant: "destructive"
            });
            logger_1.logger.warn('ContactCTA: Contact information access denied or not available');
        }
    };
    const handleLeadSuccess = async (_leadData) => {
        // Após o cadastro bem-sucedido, prosseguir com o WhatsApp
        await handleContactClick();
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "py-16 md:py-20 px-6 text-center relative overflow-hidden", style: {
                    backgroundColor: brokerProfile.primary_color || '#2563eb',
                    backgroundImage: brokerProfile.background_image_url ? `url(${brokerProfile.background_image_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }, children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-black/20", style: {
                            backgroundColor: brokerProfile.background_image_url
                                ? `${brokerProfile.overlay_color || '#000000'}${Math.round((parseInt(brokerProfile.overlay_opacity || '50') / 100) * 255).toString(16).padStart(2, '0')}`
                                : 'transparent'
                        } }), (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 max-w-3xl mx-auto space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl md:text-3xl font-semibold text-white leading-tight", children: "Interessado em nossos im\u00F3veis?" }), (0, jsx_runtime_1.jsx)("p", { className: "text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed", children: "Cadastre-se para receber informa\u00E7\u00F5es exclusivas e ser contatado por nossa equipe especializada." })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col sm:flex-row gap-3 justify-center items-center pt-2", children: (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => setShowLeadModal(true), variant: "outline", className: "border-2 border-white bg-background text-foreground hover:bg-accent px-6 py-3 text-base font-medium rounded-lg transition-all duration-200", children: "Receber Informa\u00E7\u00F5es" }) }), (0, jsx_runtime_1.jsx)("div", { className: "pt-4", children: (0, jsx_runtime_1.jsx)("p", { className: "text-white/70 text-sm", children: "Atendimento especializado \u2022 Im\u00F3veis exclusivos \u2022 Resposta r\u00E1pida" }) })] })] }), (0, jsx_runtime_1.jsx)(LeadModal_1.default, { isOpen: showLeadModal, onClose: () => setShowLeadModal(false), onSuccess: handleLeadSuccess, brokerProfile: brokerProfile, source: "contact_cta" })] }));
};
exports.default = ContactCTA;
