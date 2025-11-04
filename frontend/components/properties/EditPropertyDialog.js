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
const EditPropertyDialog = ({ property, open, onOpenChange, onPropertyUpdated }) => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [loading, setSaving] = (0, react_1.useState)(false);
    const [selectedImages, setSelectedImages] = (0, react_1.useState)([]);
    const [currentImages, setCurrentImages] = (0, react_1.useState)([]);
    const [imageUrls, setImageUrls] = (0, react_1.useState)([]);
    const [currentImageUrl, setCurrentImageUrl] = (0, react_1.useState)('');
    const [realtors, setRealtors] = (0, react_1.useState)([]);
    const [formData, setFormData] = (0, react_1.useState)({
        title: property.title,
        description: property.description || '',
        price: property.price.toString(),
        property_type: property.property_type,
        transaction_type: property.transaction_type,
        address: property.address,
        neighborhood: property.neighborhood || '',
        uf: property.uf || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area_m2: property.area_m2?.toString() || '',
        parking_spaces: property.parking_spaces?.toString() || '',
        is_featured: property.is_featured,
        status: property.status || 'active',
        features: property.features || [],
        property_code: property.property_code || '',
        realtor_id: property.realtor_id || '',
        // Informações gerais
        hoa_fee: property.hoa_fee?.toString() || '',
        hoa_periodicity: property.hoa_periodicity || 'monthly',
        iptu_value: property.iptu_value?.toString() || '',
        iptu_periodicity: property.iptu_periodicity || 'annual',
        built_year: property.built_year?.toString() || '',
        suites: property.suites?.toString() || '',
        private_area_m2: property.private_area_m2?.toString() || '',
        total_area_m2: property.total_area_m2?.toString() || '',
        covered_parking_spaces: property.covered_parking_spaces?.toString() || '',
        floor_number: property.floor_number?.toString() || '',
        total_floors: property.total_floors?.toString() || '',
        sunlight_orientation: property.sunlight_orientation || '',
        property_condition: property.property_condition || '',
        water_cost: property.water_cost?.toString() || '',
        electricity_cost: property.electricity_cost?.toString() || '',
        furnished: Boolean(property.furnished),
        accepts_pets: Boolean(property.accepts_pets),
        elevator: Boolean(property.elevator),
        portaria_24h: Boolean(property.portaria_24h),
        gas_included: Boolean(property.gas_included),
        accessibility: Boolean(property.accessibility),
        heating_type: property.heating_type || '',
        notes: property.notes || '',
    });
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
    // Sync with latest property data whenever the dialog opens
    (0, react_1.useEffect)(() => {
        if (open) {
            setCurrentImages(property.images || []);
            setFormData({
                title: property.title,
                description: property.description || '',
                price: property.price.toString(),
                property_type: property.property_type,
                transaction_type: property.transaction_type,
                address: property.address,
                neighborhood: property.neighborhood || '',
                uf: property.uf || '',
                bedrooms: property.bedrooms?.toString() || '',
                bathrooms: property.bathrooms?.toString() || '',
                area_m2: property.area_m2?.toString() || '',
                parking_spaces: property.parking_spaces?.toString() || '',
                is_featured: property.is_featured,
                status: property.status || 'active',
                features: property.features || [],
                property_code: property.property_code || '',
                realtor_id: property.realtor_id || '',
                hoa_fee: property.hoa_fee?.toString() || '',
                hoa_periodicity: property.hoa_periodicity || 'monthly',
                iptu_value: property.iptu_value?.toString() || '',
                iptu_periodicity: property.iptu_periodicity || 'annual',
                built_year: property.built_year?.toString() || '',
                suites: property.suites?.toString() || '',
                private_area_m2: property.private_area_m2?.toString() || '',
                total_area_m2: property.total_area_m2?.toString() || '',
                covered_parking_spaces: property.covered_parking_spaces?.toString() || '',
                floor_number: property.floor_number?.toString() || '',
                total_floors: property.total_floors?.toString() || '',
                sunlight_orientation: property.sunlight_orientation || '',
                property_condition: property.property_condition || '',
                water_cost: property.water_cost?.toString() || '',
                electricity_cost: property.electricity_cost?.toString() || '',
                furnished: Boolean(property.furnished),
                accepts_pets: Boolean(property.accepts_pets),
                elevator: Boolean(property.elevator),
                portaria_24h: Boolean(property.portaria_24h),
                gas_included: Boolean(property.gas_included),
                accessibility: Boolean(property.accessibility),
                heating_type: property.heating_type || '',
                notes: property.notes || '',
            });
            setSelectedImages([]);
            setImageUrls([]);
            setCurrentImageUrl('');
        }
    }, [open, property]);
    const { groups: propertyTypes, valueToId } = (0, usePropertyTypes_1.usePropertyTypes)();
    const transactionTypes = [
        { value: 'sale', label: 'Venda' },
        { value: 'rent', label: 'Aluguel' },
    ];
    const periodicities = [
        { value: 'monthly', label: 'Mensal' },
        { value: 'annual', label: 'Anual' },
        { value: 'other', label: 'Outro' },
    ];
    const statusOptions = [
        { value: 'active', label: 'Ativo' },
        { value: 'rented', label: 'Alugado' },
        { value: 'sold', label: 'Vendido' },
        { value: 'inactive', label: 'Inativo' },
    ];
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
        setSelectedImages(prev => [...prev, ...files].slice(0, 10));
    };
    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };
    const removeExistingImage = (index) => {
        setCurrentImages(prev => prev.filter((_, i) => i !== index));
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Upload new images
            const uploadedUrls = await uploadImages();
            // Combine existing images, new uploads, and URLs
            const allImages = [...currentImages, ...uploadedUrls, ...imageUrls];
            // Update property
            const updatePayload = {
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
                status: formData.status,
                features: formData.features,
                images: allImages,
                main_image_url: allImages[0] || null,
                property_code: formData.property_code,
                realtor_id: formData.realtor_id || null,
                // Informações gerais
                hoa_fee: formData.hoa_fee ? parseFloat(formData.hoa_fee) : null,
                hoa_periodicity: formData.hoa_periodicity || null,
                iptu_value: formData.iptu_value ? parseFloat(formData.iptu_value) : null,
                iptu_periodicity: formData.iptu_periodicity || null,
                built_year: formData.built_year ? parseInt(formData.built_year) : null,
                suites: formData.suites ? parseInt(formData.suites) : null,
                private_area_m2: formData.private_area_m2 ? parseFloat(formData.private_area_m2) : null,
                total_area_m2: formData.total_area_m2 ? parseFloat(formData.total_area_m2) : null,
                covered_parking_spaces: formData.covered_parking_spaces ? parseInt(formData.covered_parking_spaces) : null,
                floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
                total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
                sunlight_orientation: formData.sunlight_orientation || null,
                property_condition: formData.property_condition || null,
                water_cost: formData.water_cost ? parseFloat(formData.water_cost) : null,
                electricity_cost: formData.electricity_cost ? parseFloat(formData.electricity_cost) : null,
                furnished: formData.furnished,
                accepts_pets: formData.accepts_pets,
                elevator: formData.elevator,
                portaria_24h: formData.portaria_24h,
                gas_included: formData.gas_included,
                accessibility: formData.accessibility,
                heating_type: formData.heating_type || null,
                notes: formData.notes || null,
                updated_at: new Date().toISOString()
            };
            const mappedId = valueToId.get(formData.property_type);
            if (mappedId)
                updatePayload.property_type_id = mappedId;
            const { error } = await client_1.supabase
                .from('properties')
                .update(updatePayload)
                .eq('id', property.id);
            if (error)
                throw error;
            toast({
                title: "Imóvel atualizado",
                description: "As informações do imóvel foram atualizadas com sucesso!"
            });
            onOpenChange(false);
            onPropertyUpdated();
        }
        catch (error) {
            toast({
                title: "Erro ao atualizar imóvel",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: open, onOpenChange: onOpenChange, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Editar Im\u00F3vel" }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "Atualize as informa\u00E7\u00F5es do im\u00F3vel" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "title", children: "T\u00EDtulo *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "title", value: formData.title, onChange: (e) => handleInputChange('title', e.target.value), placeholder: "Ex: Apartamento 3 quartos no Centro", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "price", children: "Pre\u00E7o *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "price", type: "number", value: formData.price, onChange: (e) => handleInputChange('price', e.target.value), placeholder: "500000", required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "property_code", children: "C\u00F3digo do Im\u00F3vel" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "property_code", value: formData.property_code, onChange: (e) => handleInputChange('property_code', e.target.value), placeholder: "Ex: COD001, REF123, etc." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Corretor Respons\u00E1vel" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.realtor_id, onValueChange: (value) => handleInputChange('realtor_id', value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Selecionar corretor" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: realtors.map(realtor => ((0, jsx_runtime_1.jsxs)(select_1.SelectItem, { value: realtor.id, children: [realtor.name, " ", realtor.creci && `(${realtor.creci})`] }, realtor.id))) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Tipo de Im\u00F3vel *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.property_type, onValueChange: (value) => handleInputChange('property_type', value), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Selecione o tipo" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: propertyTypes.map(group => ((0, jsx_runtime_1.jsxs)(select_1.SelectGroup, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectLabel, { children: group.label }), group.options.map((type) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: type.value, children: type.label }, type.value)))] }, group.label))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Tipo de Transa\u00E7\u00E3o *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.transaction_type, onValueChange: (value) => handleInputChange('transaction_type', value), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Venda ou Aluguel" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: transactionTypes.map(type => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: type.value, children: type.label }, type.value))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Status *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.status, onValueChange: (value) => handleInputChange('status', value), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Status do im\u00F3vel" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: statusOptions.map(status => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: status.value, children: status.label }, status.value))) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "address", children: "Endere\u00E7o *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "address", value: formData.address, onChange: (e) => handleInputChange('address', e.target.value), placeholder: "Rua das Flores, 123", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "neighborhood", children: "Bairro" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "neighborhood", value: formData.neighborhood, onChange: (e) => handleInputChange('neighborhood', e.target.value), placeholder: "Centro" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "uf", children: "UF" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "uf", value: formData.uf, onChange: (e) => handleInputChange('uf', e.target.value), placeholder: "SP", maxLength: 2 })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "bedrooms", children: "Quartos" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "bedrooms", type: "number", value: formData.bedrooms, onChange: (e) => handleInputChange('bedrooms', e.target.value), placeholder: "3" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "bathrooms", children: "Banheiros" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "bathrooms", type: "number", value: formData.bathrooms, onChange: (e) => handleInputChange('bathrooms', e.target.value), placeholder: "2" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "area_m2", children: "\u00C1rea (m\u00B2)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "area_m2", type: "number", value: formData.area_m2, onChange: (e) => handleInputChange('area_m2', e.target.value), placeholder: "120" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "parking_spaces", children: "Vagas" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "parking_spaces", type: "number", value: formData.parking_spaces, onChange: (e) => handleInputChange('parking_spaces', e.target.value), placeholder: "2" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold", children: "Informa\u00E7\u00F5es gerais" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-2 grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "hoa_fee", children: "Condom\u00EDnio (R$)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "hoa_fee", type: "number", value: formData.hoa_fee, onChange: (e) => handleInputChange('hoa_fee', e.target.value), placeholder: "450" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Periodicidade" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.hoa_periodicity, onValueChange: (value) => handleInputChange('hoa_periodicity', value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Periodicidade" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: periodicities.map(p => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: p.value, children: p.label }, p.value))) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-2 grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "iptu_value", children: "IPTU (R$)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "iptu_value", type: "number", value: formData.iptu_value, onChange: (e) => handleInputChange('iptu_value', e.target.value), placeholder: "1200" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Periodicidade" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.iptu_periodicity, onValueChange: (value) => handleInputChange('iptu_periodicity', value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Periodicidade" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: periodicities.map(p => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: p.value, children: p.label }, p.value))) })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "private_area_m2", children: "\u00C1rea \u00FAtil (m\u00B2)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "private_area_m2", type: "number", value: formData.private_area_m2, onChange: (e) => handleInputChange('private_area_m2', e.target.value), placeholder: "85" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "total_area_m2", children: "\u00C1rea total (m\u00B2)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "total_area_m2", type: "number", value: formData.total_area_m2, onChange: (e) => handleInputChange('total_area_m2', e.target.value), placeholder: "100" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "covered_parking_spaces", children: "Vagas cobertas" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "covered_parking_spaces", type: "number", value: formData.covered_parking_spaces, onChange: (e) => handleInputChange('covered_parking_spaces', e.target.value), placeholder: "1" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "suites", children: "Su\u00EDtes" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "suites", type: "number", value: formData.suites, onChange: (e) => handleInputChange('suites', e.target.value), placeholder: "1" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "floor_number", children: "Andar" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "floor_number", type: "number", value: formData.floor_number, onChange: (e) => handleInputChange('floor_number', e.target.value), placeholder: "5" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "total_floors", children: "Total de andares" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "total_floors", type: "number", value: formData.total_floors, onChange: (e) => handleInputChange('total_floors', e.target.value), placeholder: "12" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "built_year", children: "Ano de constru\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "built_year", type: "number", value: formData.built_year, onChange: (e) => handleInputChange('built_year', e.target.value), placeholder: "2015" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "sunlight_orientation", children: "Face do sol" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "sunlight_orientation", value: formData.sunlight_orientation, onChange: (e) => handleInputChange('sunlight_orientation', e.target.value), placeholder: "Norte, Sul, Leste, Oeste..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "property_condition", children: "Condi\u00E7\u00E3o do im\u00F3vel" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "property_condition", value: formData.property_condition, onChange: (e) => handleInputChange('property_condition', e.target.value), placeholder: "Novo, Usado, Reformado..." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "water_cost", children: "\u00C1gua (R$)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "water_cost", type: "number", value: formData.water_cost, onChange: (e) => handleInputChange('water_cost', e.target.value), placeholder: "100" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "electricity_cost", children: "Luz (R$)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "electricity_cost", type: "number", value: formData.electricity_cost, onChange: (e) => handleInputChange('electricity_cost', e.target.value), placeholder: "180" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "furnished", checked: formData.furnished, onCheckedChange: (checked) => handleInputChange('furnished', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "furnished", children: "Mobiliado" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "accepts_pets", checked: formData.accepts_pets, onCheckedChange: (checked) => handleInputChange('accepts_pets', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "accepts_pets", children: "Aceita pets" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "elevator", checked: formData.elevator, onCheckedChange: (checked) => handleInputChange('elevator', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "elevator", children: "Elevador" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "portaria_24h", checked: formData.portaria_24h, onCheckedChange: (checked) => handleInputChange('portaria_24h', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "portaria_24h", children: "Portaria 24h" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "gas_included", checked: formData.gas_included, onCheckedChange: (checked) => handleInputChange('gas_included', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "gas_included", children: "G\u00E1s encanado incluso" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "accessibility", checked: formData.accessibility, onCheckedChange: (checked) => handleInputChange('accessibility', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "accessibility", children: "Acessibilidade" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "heating_type", children: "Tipo de aquecimento" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "heating_type", value: formData.heating_type, onChange: (e) => handleInputChange('heating_type', e.target.value), placeholder: "El\u00E9trico, G\u00E1s..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 md:col-span-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "notes", children: "Observa\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "notes", value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), placeholder: "Informa\u00E7\u00F5es adicionais relevantes...", rows: 3 })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "description", children: "Descri\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), placeholder: "Descreva as principais caracter\u00EDsticas do im\u00F3vel...", rows: 4 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Caracter\u00EDsticas" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: commonFeatures.map(feature => ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: formData.features.includes(feature) ? "default" : "outline", className: "cursor-pointer", onClick: () => handleFeatureToggle(feature), children: feature }, feature))) })] }), currentImages && currentImages.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagens Atuais" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: currentImages.map((imageUrl, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "relative group", children: [(0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: `Imagem ${index + 1}`, className: "w-full h-24 object-cover rounded-lg", onError: (e) => {
                                                    logger_1.logger.error('Erro ao carregar imagem:', imageUrl);
                                                    e.target.style.display = 'none';
                                                } }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity", onClick: () => removeExistingImage(index), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] }, index))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Adicionar Mais Imagens" }), (0, jsx_runtime_1.jsx)("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "mx-auto h-12 w-12 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsxs)("label", { htmlFor: "images", className: "cursor-pointer", children: [(0, jsx_runtime_1.jsx)("span", { className: "mt-2 block text-sm font-medium text-muted-foreground", children: "Clique para adicionar imagens ou arraste aqui" }), (0, jsx_runtime_1.jsx)("input", { id: "images", type: "file", multiple: true, accept: "image/*", onChange: handleImageSelect, className: "sr-only" })] }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Ou adicione imagens por URL" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: currentImageUrl, onChange: (e) => setCurrentImageUrl(e.target.value), placeholder: "https://exemplo.com/imagem.jpg", className: "flex-1" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", onClick: addImageUrl, disabled: !currentImageUrl.trim(), variant: "outline", children: "Adicionar" })] })] }), selectedImages.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Novos arquivos" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: selectedImages.map((file, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("img", { src: URL.createObjectURL(file), alt: `Preview ${index + 1}`, className: "w-full h-24 object-cover rounded-lg" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: () => removeImage(index), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] }, index))) })] })), imageUrls.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Imagens por URL" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: imageUrls.map((url, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("img", { src: url, alt: `URL ${index + 1}`, className: "w-full h-24 object-cover rounded-lg", onError: (e) => {
                                                            e.target.style.border = '2px solid red';
                                                            e.target.title = 'Erro ao carregar imagem';
                                                        } }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "destructive", size: "sm", className: "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0", onClick: () => removeImageUrl(index), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3" }) })] }, index))) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "is_featured", checked: formData.is_featured, onCheckedChange: (checked) => handleInputChange('is_featured', checked) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "is_featured", children: "Im\u00F3vel em destaque" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: loading, children: loading ? 'Atualizando...' : 'Atualizar Imóvel' })] })] })] }) }));
};
exports.default = EditPropertyDialog;
