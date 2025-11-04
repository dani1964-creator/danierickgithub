"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const tabs_1 = require("@/components/ui/tabs");
const slider_1 = require("@/components/ui/slider");
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
const LogoUpload = ({ logoUrl, logoSize = 80, onLogoChange, onLogoSizeChange }) => {
    const { toast } = (0, use_toast_1.useToast)();
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;
            const { error: uploadError } = await client_1.supabase.storage
                .from('property-images')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            const { data: { publicUrl } } = client_1.supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);
            onLogoChange(publicUrl);
            toast({
                title: "Logo carregada",
                description: "Sua logo foi enviada com sucesso!"
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
    const removeLogo = () => {
        onLogoChange('');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Logo da Imobili\u00E1ria" }), logoUrl ? ((0, jsx_runtime_1.jsxs)("div", { className: "relative inline-block", children: [(0, jsx_runtime_1.jsx)("img", { src: logoUrl, alt: "Logo da imobili\u00E1ria", className: "w-auto rounded-lg border", style: { height: `${logoSize}px` } }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: removeLogo, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 w-48", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ImageIcon, { className: "mx-auto h-8 w-8 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted-foreground", children: "Nenhuma logo" })] }) })), logoUrl && onLogoSizeChange && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-sm font-medium", children: "Tamanho da Logo" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(slider_1.Slider, { value: [logoSize], onValueChange: (value) => onLogoSizeChange(value[0]), max: 200, min: 40, step: 5, className: "w-full" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsx)("span", { children: "40px" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium", children: [logoSize, "px"] }), (0, jsx_runtime_1.jsx)("span", { children: "200px" })] })] })] })), (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, { defaultValue: "url", className: "w-full", children: [(0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { className: "grid w-full grid-cols-2", children: [(0, jsx_runtime_1.jsxs)(tabs_1.TabsTrigger, { value: "url", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Link, { className: "h-4 w-4" }), "URL da Web"] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsTrigger, { value: "upload", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4" }), "Upload"] })] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsContent, { value: "url", className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: logoUrl, onChange: (e) => onLogoChange(e.target.value), placeholder: "URL da sua logo" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Cole a URL de uma imagem da web" })] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsContent, { value: "upload", className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: "file", accept: "image/*", onChange: handleFileUpload, className: "sr-only", id: "logo-upload" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", disabled: uploading, asChild: true, className: "w-full", children: (0, jsx_runtime_1.jsxs)("label", { htmlFor: "logo-upload", className: "cursor-pointer", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }), uploading ? 'Enviando...' : 'Selecionar Arquivo'] }) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Selecione uma imagem do seu computador" })] })] })] }));
};
exports.default = LogoUpload;
