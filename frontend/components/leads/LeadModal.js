"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/hooks/use-toast");
const client_1 = require("@/integrations/supabase/client");
const lucide_react_1 = require("lucide-react");
const LeadModal = ({ isOpen, onClose, onSuccess, brokerProfile, property, source = 'website' }) => {
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const primaryColor = brokerProfile.primary_color || '#2563eb';
    const secondaryColor = brokerProfile.secondary_color || '#64748b';
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast({
                title: "Campos obrigatórios",
                description: "Nome e email são obrigatórios.",
                variant: "destructive"
            });
            return;
        }
        setLoading(true);
        try {
            const leadData = {
                broker_id: brokerProfile.id,
                property_id: property?.id || null,
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || null,
                message: formData.message.trim() || `Interesse em: ${property?.title || 'Informações sobre imóveis'}`,
                source: source,
                status: 'new'
            };
            const { error } = await client_1.supabase
                .from('leads')
                .insert([leadData]);
            if (error) {
                logger_1.logger.error('Error creating lead:', error);
                toast({
                    title: "Erro ao enviar",
                    description: "Tente novamente em alguns instantes.",
                    variant: "destructive"
                });
                return;
            }
            toast({
                title: "Cadastro realizado!",
                description: "Em breve nossa equipe entrará em contato.",
                variant: "default"
            });
            onSuccess(leadData);
            onClose();
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: ''
            });
        }
        catch (error) {
            logger_1.logger.error('Error submitting lead:', error);
            toast({
                title: "Erro inesperado",
                description: "Tente novamente em alguns instantes.",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const inputRingStyle = { ['--tw-ring-color']: primaryColor + '40' };
    return ((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: isOpen, onOpenChange: onClose, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "sm:max-w-md w-[calc(100vw-2rem)] max-w-[400px] mx-auto rounded-lg", style: {
                borderColor: primaryColor + '20'
            }, children: [(0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center", children: brokerProfile.logo_url ? ((0, jsx_runtime_1.jsx)("img", { src: brokerProfile.logo_url, alt: brokerProfile.business_name, className: "h-12 w-auto object-contain" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl", style: { backgroundColor: primaryColor }, children: brokerProfile.business_name.charAt(0).toUpperCase() })) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-2", children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { className: "text-xl font-semibold", children: "Receba mais informa\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: property ? `Sobre: ${property.title}` : 'Sobre nossos imóveis disponíveis' })] })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "name", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "w-4 h-4", style: { color: primaryColor } }), "Nome completo *"] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "name", type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), placeholder: "Seu nome completo", className: "transition-all focus-visible:ring-1", style: inputRingStyle, required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "email", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "w-4 h-4", style: { color: primaryColor } }), "Email *"] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), placeholder: "seu@email.com", className: "transition-all focus-visible:ring-1", style: inputRingStyle, required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "phone", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "w-4 h-4", style: { color: primaryColor } }), "WhatsApp"] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "phone", type: "tel", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), placeholder: "(11) 99999-9999", className: "transition-all focus-visible:ring-1", style: inputRingStyle })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "message", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "w-4 h-4", style: { color: primaryColor } }), "Mensagem (opcional)"] }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "message", value: formData.message, onChange: (e) => handleInputChange('message', e.target.value), placeholder: "Conte-nos mais sobre seu interesse...", className: "transition-all focus-visible:ring-1 min-h-[80px]", style: inputRingStyle })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: onClose, className: "flex-1", disabled: loading, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "flex-1 text-white hover:opacity-90 transition-all", style: {
                                        backgroundColor: primaryColor,
                                        borderColor: primaryColor
                                    }, disabled: loading, children: loading ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Enviando..."] })) : ('Enviar cadastro') })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground text-center", children: "Seus dados s\u00E3o protegidos e n\u00E3o ser\u00E3o compartilhados com terceiros." })] })] }) }));
};
exports.default = LeadModal;
