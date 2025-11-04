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
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
const BackgroundImageUpload = ({ imageUrl, onImageChange }) => {
    const { toast } = (0, use_toast_1.useToast)();
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `background-${Date.now()}.${fileExt}`;
            const filePath = `backgrounds/${fileName}`;
            const { error: uploadError } = await client_1.supabase.storage
                .from('property-images')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            const { data: { publicUrl } } = client_1.supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);
            onImageChange(publicUrl);
            toast({
                title: "Imagem carregada",
                description: "Sua imagem de fundo foi enviada com sucesso!"
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
    const removeImage = () => {
        onImageChange('');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagem de Fundo do Site" }), imageUrl ? ((0, jsx_runtime_1.jsxs)("div", { className: "relative inline-block", children: [(0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: "Imagem de fundo", className: "h-32 w-56 rounded-lg border object-cover" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: removeImage, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 w-56 h-32", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center h-full flex flex-col justify-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ImageIcon, { className: "mx-auto h-8 w-8 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted-foreground", children: "Nenhuma imagem" })] }) })), (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, { defaultValue: "url", className: "w-full", children: [(0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { className: "grid w-full grid-cols-2", children: [(0, jsx_runtime_1.jsxs)(tabs_1.TabsTrigger, { value: "url", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Link, { className: "h-4 w-4" }), "URL da Web"] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsTrigger, { value: "upload", className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4" }), "Upload"] })] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsContent, { value: "url", className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: imageUrl, onChange: (e) => onImageChange(e.target.value), placeholder: "https://exemplo.com/imagem-fundo.jpg" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Cole a URL de uma imagem da web" })] }), (0, jsx_runtime_1.jsxs)(tabs_1.TabsContent, { value: "upload", className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: "file", accept: "image/*", onChange: handleFileUpload, className: "sr-only", id: "background-upload" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", disabled: uploading, asChild: true, className: "w-full", children: (0, jsx_runtime_1.jsxs)("label", { htmlFor: "background-upload", className: "cursor-pointer", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }), uploading ? 'Enviando...' : 'Selecionar Arquivo'] }) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Selecione uma imagem do seu computador" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Esta imagem aparecer\u00E1 como fundo na se\u00E7\u00E3o hero do site p\u00FAblico" })] }));
};
exports.default = BackgroundImageUpload;
