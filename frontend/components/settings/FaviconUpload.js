"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const client_1 = require("@/integrations/supabase/client");
const utils_1 = require("@/lib/utils");
const FaviconUpload = ({ faviconUrl, onFaviconChange }) => {
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        // Validate file type
        if (!file.type.includes('image/')) {
            toast({
                title: "Arquivo inválido",
                description: "Por favor, selecione uma imagem (PNG, JPG, etc.)",
                variant: "destructive"
            });
            return;
        }
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "A imagem deve ter no máximo 2MB",
                variant: "destructive"
            });
            return;
        }
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `favicon-${Date.now()}.${fileExt}`;
            const filePath = `favicons/${fileName}`;
            const { error: uploadError } = await client_1.supabase.storage
                .from('logos')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            const { data } = client_1.supabase.storage
                .from('logos')
                .getPublicUrl(filePath);
            onFaviconChange(data.publicUrl);
            toast({
                title: "Favicon enviado",
                description: "Favicon atualizado com sucesso!"
            });
        }
        catch (error) {
            toast({
                title: "Erro no upload",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setUploading(false);
        }
    };
    const removeFavicon = () => {
        onFaviconChange('');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [faviconUrl && ((0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex items-center justify-between p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-8 h-8 bg-muted rounded-sm flex items-center justify-center overflow-hidden", children: [(0, jsx_runtime_1.jsx)("img", { src: faviconUrl, alt: "Favicon atual", className: "w-full h-full object-cover", onError: (e) => {
                                                const target = e.target;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            } }), (0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { className: "w-4 h-4 text-muted-foreground hidden" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: "Favicon atual" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Aparece na aba do navegador" })] })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", onClick: removeFavicon, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) })] }) })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", onClick: () => document.getElementById('favicon-upload')?.click(), disabled: uploading, className: "w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }), uploading ? 'Enviando...' : faviconUrl ? 'Alterar Favicon' : 'Enviar Favicon'] }), (0, jsx_runtime_1.jsx)("input", { id: "favicon-upload", type: "file", accept: "image/*", onChange: handleFileUpload, className: "hidden" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground text-center", children: "Recomendado: 32x32px ou 16x16px \u2022 PNG, JPG \u2022 M\u00E1x. 2MB" })] })] }));
};
exports.default = FaviconUpload;
