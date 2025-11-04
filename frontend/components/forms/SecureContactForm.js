"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SecureContactForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/hooks/use-toast");
const client_1 = require("@/integrations/supabase/client");
const security_1 = require("@/lib/security");
const enhanced_security_1 = require("@/lib/enhanced-security");
function SecureContactForm({ propertyId, brokerId, className = "" }) {
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        email: "",
        phone: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [errors, setErrors] = (0, react_1.useState)({});
    const { toast } = (0, use_toast_1.useToast)();
    const validateForm = () => {
        const newErrors = {};
        if (!security_1.contactFormSchema.name(formData.name)) {
            newErrors.name = formData.name ? "Nome deve ter até 100 caracteres" : "Nome é obrigatório";
        }
        if (!security_1.contactFormSchema.email(formData.email)) {
            newErrors.email = formData.email ? "Email inválido" : "Email é obrigatório";
        }
        if (formData.phone && !security_1.contactFormSchema.phone(formData.phone)) {
            newErrors.phone = "Formato de telefone inválido";
        }
        if (!security_1.contactFormSchema.message(formData.message)) {
            newErrors.message = "Mensagem deve ter até 2000 caracteres";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({
                title: "Erro de validação",
                description: "Por favor, corrija os erros no formulário.",
                variant: "destructive"
            });
            return;
        }
        if (!brokerId) {
            toast({
                title: "Erro de configuração",
                description: "ID do corretor não encontrado.",
                variant: "destructive"
            });
            return;
        }
        // Use enhanced security for form submission
        const result = await enhanced_security_1.EnhancedSecurity.secureFormSubmit('contact_form', formData, async () => {
            // Sanitize all inputs
            const sanitizedData = {
                name: (0, security_1.sanitizeInput)(formData.name),
                email: (0, security_1.sanitizeInput)(formData.email),
                phone: formData.phone ? (0, security_1.sanitizeInput)(formData.phone) : null,
                message: (0, security_1.sanitizeInput)(formData.message),
                property_id: propertyId || null,
                broker_id: brokerId
            };
            const { error } = await client_1.supabase
                .from('leads')
                .insert(sanitizedData);
            if (error)
                throw error;
            return sanitizedData;
        });
        if (result.success) {
            toast({
                title: "Mensagem enviada!",
                description: "Entraremos em contato em breve.",
            });
            // Reset form
            setFormData({ name: "", email: "", phone: "", message: "" });
            setErrors({});
        }
        else {
            toast({
                title: "Erro ao enviar",
                description: result.error || "Tente novamente em alguns instantes.",
                variant: "destructive"
            });
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: `space-y-4 ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "name", children: "Nome *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "name", type: "text", value: formData.name, onChange: (e) => handleInputChange("name", e.target.value), maxLength: 100, className: errors.name ? "border-red-500" : "", required: true }), errors.name && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-500 mt-1", children: errors.name })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange("email", e.target.value), className: errors.email ? "border-red-500" : "", required: true }), errors.email && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-500 mt-1", children: errors.email })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "phone", children: "Telefone" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "phone", type: "tel", value: formData.phone, onChange: (e) => handleInputChange("phone", e.target.value), className: errors.phone ? "border-red-500" : "" }), errors.phone && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-500 mt-1", children: errors.phone })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "message", children: "Mensagem" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "message", value: formData.message, onChange: (e) => handleInputChange("message", e.target.value), maxLength: 2000, rows: 4, className: errors.message ? "border-red-500" : "" }), errors.message && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-500 mt-1", children: errors.message })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: isSubmitting, className: "w-full", children: isSubmitting ? "Enviando..." : "Enviar Mensagem" })] }));
}
