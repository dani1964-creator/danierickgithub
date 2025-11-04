"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@shared/hooks/useAuth");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const select_1 = require("@/components/ui/select");
const usePropertyTypes_1 = require("@/hooks/usePropertyTypes");
const dialog_1 = require("@/components/ui/dialog");
const switch_1 = require("@/components/ui/switch");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
const utils_2 = require("@/lib/utils");
const AddPropertyDialog = ({ onPropertyAdded }) => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const fetchRealtors = (0, react_1.useCallback)(async () => {
        try {
            const { data: brokerData } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', user?.id)
                .single();
            if (brokerData) {
                const { data: realtorsData } = await client_1.supabase
                    .from('realtors')
                    .select('id, name, creci, is_active, avatar_url')
                    .eq('broker_id', brokerData.id)
                    .eq('is_active', true)
                    .order('name');
                setRealtors(realtorsData || []);
            }
        }
        catch (error) {
            logger_1.logger.error('Error fetching realtors:', error);
        }
    }, [user?.id]);
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchRealtors();
        }
    }, [user, fetchRealtors]);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [loading, setSaving] = (0, react_1.useState)(false);
    const [selectedImages, setSelectedImages] = (0, react_1.useState)([]);
    const [imageUrls, setImageUrls] = (0, react_1.useState)([]);
    const [currentImageUrl, setCurrentImageUrl] = (0, react_1.useState)('');
    const [realtors, setRealtors] = (0, react_1.useState)([]);
    const [formData, setFormData] = (0, react_1.useState)({
        title: '',
        description: '',
        price: '',
        property_type: 'apartment',
        transaction_type: 'sale',
        address: '',
        neighborhood: '',
        uf: '',
        bedrooms: '',
        bathrooms: '',
        area_m2: '',
        parking_spaces: '',
        is_featured: false,
        features: [],
        property_code: '',
        realtor_id: '',
    });
    const { groups: propertyTypes, valueToId } = (0, usePropertyTypes_1.usePropertyTypes)();
    const transactionTypes = [
        { value: 'sale', label: 'Venda' },
        { value: 'rent', label: 'Aluguel' },
    ];
    // periodicidades removidas com a retirada das informações gerais
    const commonFeatures = [
        'Garagem', 'Piscina', 'Elevador', 'Portaria 24h', 'Área de lazer',
        'Academia', 'Salão de festas', 'Varanda', 'Área gourmet', 'Jardim'
    ];
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleFeatureToggle = (feature) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setSelectedImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
    };
    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };
    const addImageUrl = () => {
        if (currentImageUrl.trim()) {
            setImageUrls(prev => [...prev, currentImageUrl.trim()]);
            setCurrentImageUrl('');
        }
    };
    const removeImageUrl = (index) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };
    const uploadImages = async () => {
        const uploadedUrls = [];
        for (const file of selectedImages) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `property-images/${fileName}`;
            const { error: uploadError } = await client_1.supabase.storage
                .from('property-images')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            const { data: { publicUrl } } = client_1.supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };
    const getBrokerProfile = async () => {
        // First try to get existing broker profile
        const { data: existingBroker } = await client_1.supabase
            .from('brokers')
            .select('id')
            .eq('user_id', user?.id)
            .maybeSingle();
        if (existingBroker) {
            return existingBroker.id;
        }
        // If no broker profile exists, create one
        const { data: newBroker, error } = await client_1.supabase
            .from('brokers')
            .insert({
            user_id: user?.id,
            business_name: 'Minha Imobiliária',
            email: user?.email || '',
            primary_color: '#2563eb',
            secondary_color: '#64748b',
            plan_type: 'free',
            is_active: true,
            max_properties: 5
        })
            .select('id')
            .single();
        if (error)
            throw error;
        return newBroker.id;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Get broker ID
            const brokerId = await getBrokerProfile();
            // Upload images and combine with URLs
            const uploadedUrls = await uploadImages();
            const allImageUrls = [...uploadedUrls, ...imageUrls];
            // Create property
            const insertPayload = {
                broker_id: brokerId,
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                property_type: formData.property_type,
                transaction_type: formData.transaction_type,
                address: formData.address,
                neighborhood: formData.neighborhood,
                uf: formData.uf,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
                parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
                is_featured: formData.is_featured,
                features: formData.features,
                images: allImageUrls,
                main_image_url: allImageUrls[0] || null,
                property_code: formData.property_code,
                realtor_id: formData.realtor_id || null,
                // mínimos obrigatórios adicionais
                city: null,
                is_active: true,
                slug: (0, utils_1.toSlug)(formData.title),
                // Informações gerais removidas do formulário
            };
            // If DB taxonomy available, include foreign key id
            const mappedId = valueToId.get(formData.property_type);
            if (mappedId)
                insertPayload.property_type_id = mappedId;
            const { error } = await client_1.supabase
                .from('properties')
                .insert(insertPayload);
            if (error)
                throw error;
            toast({
                title: "Imóvel adicionado",
                description: "O imóvel foi cadastrado com sucesso!"
            });
            // Reset form
            setFormData({
                title: '',
                description: '',
                price: '',
                property_type: 'apartment',
                transaction_type: 'sale',
                address: '',
                neighborhood: '',
                uf: '',
                bedrooms: '',
                bathrooms: '',
                area_m2: '',
                parking_spaces: '',
                is_featured: false,
                features: [],
                property_code: '',
                realtor_id: '',
            });
            setSelectedImages([]);
            setImageUrls([]);
            setCurrentImageUrl('');
            setOpen(false);
            onPropertyAdded();
        }
        catch (error) {
            toast({
                title: "Erro ao adicionar imóvel",
                description: (0, utils_2.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(dialog_1.Dialog, { open: open, onOpenChange: setOpen, children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTrigger, { asChild: true, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Adicionar Im\u00F3vel"] }) }), (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Adicionar Novo Im\u00F3vel" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "Preencha as informa\u00E7\u00F5es do im\u00F3vel para adicionar ao seu cat\u00E1logo" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "title", children: "T\u00EDtulo *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "title", value: formData.title, onChange: (e) => handleInputChange('title', e.target.value), placeholder: "Ex: Apartamento 3 quartos no Centro", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "price", children: "Pre\u00E7o *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "price", type: "number", value: formData.price, onChange: (e) => handleInputChange('price', e.target.value), placeholder: "500000", required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "property_code", children: "C\u00F3digo do Im\u00F3vel" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "property_code", value: formData.property_code, onChange: (e) => handleInputChange('property_code', e.target.value), placeholder: "Ex: COD001, REF123, etc." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Corretor Respons\u00E1vel" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.realtor_id, onValueChange: (value) => handleInputChange('realtor_id', value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Selecionar corretor" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: realtors.map(realtor => ((0, jsx_runtime_1.jsxs)(select_1.SelectItem, { value: realtor.id, children: [realtor.name, " ", realtor.creci && `(${realtor.creci})`] }, realtor.id))) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Tipo de Im\u00F3vel *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.property_type, onValueChange: (value) => handleInputChange('property_type', value), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Selecione o tipo" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: propertyTypes.map(group => ((0, jsx_runtime_1.jsxs)(select_1.SelectGroup, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectLabel, { children: group.label }), group.options.map((type) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: type.value, children: type.label }, type.value)))] }, group.label))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Tipo de Transa\u00E7\u00E3o *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.transaction_type, onValueChange: (value) => handleInputChange('transaction_type', value), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Venda ou Aluguel" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: transactionTypes.map(type => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: type.value, children: type.label }, type.value))) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "address", children: "Endere\u00E7o *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "address", value: formData.address, onChange: (e) => handleInputChange('address', e.target.value), placeholder: "Rua das Flores, 123", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "neighborhood", children: "Bairro" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "neighborhood", value: formData.neighborhood, onChange: (e) => handleInputChange('neighborhood', e.target.value), placeholder: "Centro" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "uf", children: "UF" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "uf", value: formData.uf, onChange: (e) => handleInputChange('uf', e.target.value), placeholder: "SP", maxLength: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "bedrooms", children: "Quartos" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "bedrooms", type: "number", value: formData.bedrooms, onChange: (e) => handleInputChange('bedrooms', e.target.value), placeholder: "3" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "bathrooms", children: "Banheiros" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "bathrooms", type: "number", value: formData.bathrooms, onChange: (e) => handleInputChange('bathrooms', e.target.value), placeholder: "2" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "area_m2", children: "\u00C1rea (m\u00B2)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "area_m2", type: "number", value: formData.area_m2, onChange: (e) => handleInputChange('area_m2', e.target.value), placeholder: "120" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "parking_spaces", children: "Vagas" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "parking_spaces", type: "number", value: formData.parking_spaces, onChange: (e) => handleInputChange('parking_spaces', e.target.value), placeholder: "2" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "description", children: "Descri\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), placeholder: "Descreva as principais caracter\u00EDsticas do im\u00F3vel...", rows: 4 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Caracter\u00EDsticas" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: commonFeatures.map(feature => ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: formData.features.includes(feature) ? "default" : "outline", className: "cursor-pointer", onClick: () => handleFeatureToggle(feature), children: feature }, feature))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagens" }), (0, jsx_runtime_1.jsx)("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "mx-auto h-12 w-12 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsxs)("label", { htmlFor: "images", className: "cursor-pointer", children: [(0, jsx_runtime_1.jsx)("span", { className: "mt-2 block text-sm font-medium text-muted-foreground", children: "Clique para adicionar imagens ou arraste aqui" }), (0, jsx_runtime_1.jsx)("input", { id: "images", type: "file", multiple: true, accept: "image/*", onChange: handleImageSelect, className: "sr-only" })] }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Ou adicione imagens por URL" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: currentImageUrl, onChange: (e) => setCurrentImageUrl(e.target.value), placeholder: "https://exemplo.com/imagem.jpg", className: "flex-1" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", onClick: addImageUrl, disabled: !currentImageUrl.trim(), variant: "outline", children: "Adicionar" })] })] }), selectedImages.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagens por arquivo" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: selectedImages.map((file, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("img", { src: URL.createObjectURL(file), alt: `Preview ${index + 1}`, className: "w-full h-24 object-cover rounded-lg" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: () => removeImage(index), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] }, index))) })] })), imageUrls.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagens por URL" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: imageUrls.map((url, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("img", { src: url, alt: `URL ${index + 1}`, className: "w-full h-24 object-cover rounded-lg", onError: (e) => {
                                                                e.target.style.border = '2px solid red';
                                                                e.target.title = 'Erro ao carregar imagem';
                                                            } }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: () => removeImageUrl(index), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] }, index))) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "is_featured", checked: formData.is_featured, onCheckedChange: (checked) => handleInputChange('is_featured', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "is_featured", children: "Im\u00F3vel em destaque" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: loading, children: loading ? 'Salvando...' : 'Adicionar Imóvel' })] })] })] })] }));
};
exports.default = AddPropertyDialog;
