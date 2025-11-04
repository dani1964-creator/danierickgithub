"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarUpload = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const label_1 = require("@/components/ui/label");
const avatar_1 = require("@/components/ui/avatar");
const client_1 = require("@/integrations/supabase/client");
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
const AvatarUpload = ({ currentUrl, onUploadComplete, bucketName = 'logos', folder = 'realtor-avatars', label = 'Foto de Perfil', fallbackText = 'A' }) => {
    const { toast } = (0, use_toast_1.useToast)();
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [previewUrl, setPreviewUrl] = (0, react_1.useState)(currentUrl);
    const fileInputRef = (0, react_1.useRef)(null);
    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Arquivo inválido",
                description: "Por favor, selecione uma imagem.",
                variant: "destructive"
            });
            return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "A imagem deve ter no máximo 5MB.",
                variant: "destructive"
            });
            return;
        }
        setUploading(true);
        try {
            // Create a preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;
            // Upload file to Supabase Storage
            const { error: uploadError } = await client_1.supabase.storage
                .from(bucketName)
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            // Get public URL
            const { data: { publicUrl } } = client_1.supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);
            // Clean up object URL
            URL.revokeObjectURL(objectUrl);
            setPreviewUrl(publicUrl);
            onUploadComplete(publicUrl);
            toast({
                title: "Upload concluído",
                description: "Foto carregada com sucesso!"
            });
        }
        catch (error) {
            logger_1.logger.error('Upload error:', (0, utils_1.getErrorMessage)(error));
            toast({
                title: "Erro no upload",
                description: (0, utils_1.getErrorMessage)(error) || "Tente novamente.",
                variant: "destructive"
            });
            setPreviewUrl(currentUrl);
        }
        finally {
            setUploading(false);
        }
    };
    const removeImage = () => {
        setPreviewUrl(null);
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)(avatar_1.Avatar, { className: "h-16 w-16", children: [(0, jsx_runtime_1.jsx)(avatar_1.AvatarImage, { src: previewUrl || undefined }), (0, jsx_runtime_1.jsx)(avatar_1.AvatarFallback, { children: previewUrl ? ((0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-8 w-8" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-xl font-medium", children: fallbackText })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileSelect, className: "sr-only", id: "avatar-upload" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: () => fileInputRef.current?.click(), disabled: uploading, children: uploading ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" }), "Carregando..."] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }), previewUrl ? 'Alterar' : 'Carregar'] })) }), previewUrl && ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "ghost", size: "sm", onClick: removeImage, disabled: uploading, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) }))] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "JPG, PNG ou GIF. M\u00E1ximo 5MB." })] })] })] }));
};
exports.AvatarUpload = AvatarUpload;
