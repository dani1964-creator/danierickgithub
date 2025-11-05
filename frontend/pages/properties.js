"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const logger_1 = require("@/lib/logger");
const useAuth_1 = require("@shared/hooks/useAuth");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
const AddPropertyDialog_1 = __importDefault(require("@/components/properties/AddPropertyDialog"));
const PropertyViewToggle_1 = __importDefault(require("@/components/properties/PropertyViewToggle"));
const EditPropertyButton_1 = __importDefault(require("@/components/properties/EditPropertyButton"));
const security_1 = require("@/lib/security");
const utils_1 = require("@/lib/utils");
const Properties = () => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    // ✅ ESTADOS PARA FILTROS E PAGINAÇÃO
    const [brokerId, setBrokerId] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = (0, react_1.useState)('all');
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    // ✅ ESTADOS LOCAIS PARA CONTROLAR DADOS (corrigido igual ao /src/)
    const [properties, setProperties] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [totalCount, setTotalCount] = (0, react_1.useState)(0);
    const [totalPages, setTotalPages] = (0, react_1.useState)(0);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    // ✅ FUNÇÃO DE CARREGAMENTO (como na página de corretores)
    const fetchProperties = (0, react_1.useCallback)(async () => {
        if (!brokerId)
            return; // ✅ NÃO FAZ QUERY SEM BROKER_ID
        try {
            setLoading(true);
            setError(null);
            let query = client_1.supabase
                .from('properties')
                .select('*', { count: 'exact' })
                .eq('broker_id', brokerId)
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * 12, currentPage * 12 - 1);
            // Aplicar filtros
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            if (propertyTypeFilter !== 'all') {
                query = query.eq('property_type', propertyTypeFilter);
            }
            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }
            const { data, error: queryError, count } = await query;
            if (queryError)
                throw queryError;
            setProperties(data || []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / 12));
        }
        catch (err) {
            logger_1.logger.error('Error fetching properties:', err);
            setError(err.message || 'Erro ao carregar propriedades');
        }
        finally {
            setLoading(false);
        }
    }, [brokerId, statusFilter, propertyTypeFilter, searchTerm, currentPage]);
    const refreshProperties = (0, react_1.useCallback)(() => {
        fetchProperties();
    }, [fetchProperties]);
    // ✅ MÉTODOS DE NAVEGAÇÃO DE PÁGINAS
    const loadNextPage = (0, react_1.useCallback)(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);
    const loadPrevPage = (0, react_1.useCallback)(() => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    // ✅ CARREGAR PROPRIEDADES QUANDO BROKER_ID ESTIVER DISPONÍVEL
    (0, react_1.useEffect)(() => {
        if (brokerId) {
            fetchProperties();
        }
    }, [brokerId, fetchProperties]);
    // ✅ FUNÇÃO PARA BUSCAR BROKER ID (simplificada)
    const fetchBrokerData = (0, react_1.useCallback)(async (currentUser) => {
        const userToUse = currentUser || user;
        if (!userToUse?.id)
            return;
        try {
            const { data: brokerData, error: brokerError } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', userToUse.id)
                .single();
            if (brokerError) {
                logger_1.logger.error('Error fetching broker:', brokerError);
                toast({
                    title: "Erro ao identificar corretor",
                    description: (0, utils_1.getErrorMessage)(brokerError),
                    variant: "destructive"
                });
                return;
            }
            if (!brokerData) {
                toast({
                    title: "Corretor não encontrado",
                    description: "Não foi possível encontrar seus dados de corretor.",
                    variant: "destructive"
                });
                return;
            }
            // ✅ SETAR BROKER ID PARA ATIVAR O HOOK OTIMIZADO
            setBrokerId(brokerData.id);
        }
        catch (error) {
            logger_1.logger.error('Error fetching broker data:', error);
            toast({
                title: "Erro ao carregar dados",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    }, [toast]);
    // ✅ BUSCAR BROKER ID QUANDO USER ESTIVER DISPONÍVEL
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchBrokerData(user);
        }
    }, [user, fetchBrokerData]);
    // Sanitize search input to prevent XSS
    const sanitizedSearchTerm = (0, security_1.sanitizeInput)(searchTerm);
    const filteredProperties = properties.filter(property => {
        const searchLower = sanitizedSearchTerm.toLowerCase();
        const matchesSearch = (property.title.toLowerCase().includes(searchLower) ||
            property.address.toLowerCase().includes(searchLower) ||
            property.neighborhood?.toLowerCase().includes(searchLower) ||
            property.city?.toLowerCase().includes(searchLower) ||
            property.property_code?.toLowerCase().includes(searchLower));
        const matchesStatus = statusFilter === 'all' || statusFilter === '' || property.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const handleDeleteProperty = async (propertyId) => {
        if (!confirm('Tem certeza que deseja excluir este imóvel?'))
            return;
        try {
            const { error } = await client_1.supabase
                .from('properties')
                .delete()
                .eq('id', propertyId);
            if (error)
                throw error;
            toast({
                title: "Imóvel excluído",
                description: "O imóvel foi removido com sucesso."
            });
            refreshProperties();
        }
        catch (error) {
            toast({
                title: "Erro ao excluir",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const handleSearchChange = (value) => {
        // Limit search term length for security
        const limitedValue = value.substring(0, 100);
        setSearchTerm(limitedValue);
    };
    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Ativo', variant: 'default' },
            inactive: { label: 'Inativo', variant: 'secondary' },
            sold: { label: 'Vendido', variant: 'destructive' },
            rented: { label: 'Alugado', variant: 'outline' },
        };
        return statusMap[status] || { label: 'Ativo', variant: 'default' };
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };
    // Mostrar skeleton completo apenas quando estiver carregando e ainda não houver propriedades
    if (loading && properties.length === 0) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-48 bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-6 w-64 bg-muted/70 rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-12 w-36 bg-muted/70 rounded-lg animate-pulse" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between space-x-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2 flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-12 w-full bg-muted/70 rounded-lg animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-12 w-32 bg-muted/70 rounded-lg animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-12 w-20 bg-muted/70 rounded-lg animate-pulse" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-20 bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse mb-3" }), (0, jsx_runtime_1.jsx)("div", { className: "h-5 w-28 bg-muted/70 rounded animate-pulse" })] }, i))) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: Array.from({ length: 8 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-48 w-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 animate-pulse" }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-3/4 bg-muted/70 rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-5 w-1/2 bg-muted/50 rounded animate-pulse" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-5 w-20 bg-muted/50 rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-5 w-16 bg-muted/50 rounded animate-pulse" })] })] })] }, i))) })] }) }) }));
    }
    return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent", children: "Im\u00F3veis" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-muted-foreground mt-1 text-lg", children: ["Gerencie seus im\u00F3veis cadastrados (", totalCount || properties.length, " im\u00F3veis - P\u00E1gina ", currentPage, " de ", totalPages, ")"] })] }), (0, jsx_runtime_1.jsx)(AddPropertyDialog_1.default, { onPropertyAdded: refreshProperties })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Buscar por t\u00EDtulo, endere\u00E7o, bairro, cidade ou c\u00F3digo...", value: searchTerm, onChange: (e) => handleSearchChange(e.target.value), className: "pl-10 text-sm bg-background/80 backdrop-blur-sm border-border/50", maxLength: 100 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "h-4 w-4 text-muted-foreground" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: statusFilter, onValueChange: setStatusFilter, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-28 sm:w-32 bg-background/80 backdrop-blur-sm border-border/50", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Status" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "all", children: "Todos" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "active", children: "Ativo" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "sold", children: "Vendido" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "rented", children: "Alugado" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "inactive", children: "Inativo" })] })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-center sm:justify-end", children: (0, jsx_runtime_1.jsx)(PropertyViewToggle_1.default, { view: viewMode, onViewChange: setViewMode }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-bold text-primary", children: properties.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground mt-1", children: "Total de Im\u00F3veis" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-bold text-emerald-500", children: properties.filter(p => p.is_active).length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground mt-1", children: "Ativos" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-bold text-amber-500", children: properties.filter(p => p.is_featured).length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground mt-1", children: "Em Destaque" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-bold text-blue-500", children: properties.reduce((acc, p) => acc + p.views_count, 0) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground mt-1", children: "Visualiza\u00E7\u00F5es" })] }) })] }), filteredProperties.length === 0 ? ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-card/50 backdrop-blur-sm border-border/50 shadow-lg", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold mb-2", children: searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado' }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground mb-4", children: searchTerm
                                                ? 'Tente ajustar os termos de busca.'
                                                : 'Comece adicionando seu primeiro imóvel ao sistema.' }), !searchTerm && ((0, jsx_runtime_1.jsx)(AddPropertyDialog_1.default, { onPropertyAdded: refreshProperties }))] }) }) })) : viewMode === 'grid' ? (
                        // Grid View
                        (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: filteredProperties.map((property) => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative aspect-video overflow-hidden", children: [property.main_image_url ? ((0, jsx_runtime_1.jsx)("img", { src: property.main_image_url, alt: property.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center h-full text-muted-foreground bg-muted", children: "Sem imagem" })), property.is_featured && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg", variant: "default", children: "\u2B50 Destaque" })), property.status && property.status !== 'active' && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "absolute top-3 left-3 shadow-lg", variant: getStatusBadge(property.status).variant, children: getStatusBadge(property.status).label }))] }), (0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-base sm:text-lg line-clamp-2 flex-1", children: property.title }), property.property_code && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "ml-2 text-xs bg-primary/10 text-primary border-primary/20", children: property.property_code }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent", children: formatPrice(property.price) }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-xs bg-muted/50", children: property.transaction_type === 'sale' ? 'Venda' : 'Aluguel' })] })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "pt-0", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted-foreground mb-2 line-clamp-1", children: ["\uD83D\uDCCD ", property.address] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-3", children: [property.bedrooms && ((0, jsx_runtime_1.jsxs)("span", { children: ["\uD83D\uDECF\uFE0F ", property.bedrooms, " quartos"] })), property.bathrooms && ((0, jsx_runtime_1.jsxs)("span", { children: ["\uD83D\uDEBF ", property.bathrooms, " banheiros"] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { children: property.views_count })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(EditPropertyButton_1.default, { property: property, onPropertyUpdated: refreshProperties }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => handleDeleteProperty(property.id), className: "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-3 w-3" }) })] })] })] })] }, property.id))) })) : (
                        // List/Detailed View
                        (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: filteredProperties.map((property) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col lg:flex-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative w-full h-48 lg:w-72 lg:h-48 flex-shrink-0 overflow-hidden", children: [property.main_image_url ? ((0, jsx_runtime_1.jsx)("img", { src: property.main_image_url, alt: property.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center h-full text-muted-foreground bg-muted", children: "\uD83D\uDCF7 Sem imagem" })), property.is_featured && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg", variant: "default", children: "\u2B50 Destaque" })), property.status && property.status !== 'active' && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "absolute top-3 left-3 shadow-lg", variant: getStatusBadge(property.status).variant, children: getStatusBadge(property.status).label }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col lg:flex-row lg:items-start justify-between mb-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between mb-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl lg:text-2xl font-bold line-clamp-2 flex-1 pr-4", children: property.title }), property.property_code && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-xs bg-primary/10 text-primary border-primary/20 flex-shrink-0", children: property.property_code }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col lg:flex-row lg:items-center gap-3 mb-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent", children: formatPrice(property.price) }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "w-fit bg-muted/50", children: property.transaction_type === 'sale' ? '🏠 Venda' : '🏠 Aluguel' })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 mb-6", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "\uD83D\uDCCD" }), (0, jsx_runtime_1.jsx)("span", { children: property.address })] }), (property.neighborhood || property.city) && ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "\uD83C\uDFD9\uFE0F" }), (0, jsx_runtime_1.jsx)("span", { children: [property.neighborhood, property.city, property.uf].filter(Boolean).join(', ') })] })), property.description && ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted-foreground line-clamp-2 flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "flex-shrink-0", children: "\uD83D\uDCDD" }), (0, jsx_runtime_1.jsx)("span", { children: property.description })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-4 gap-2 sm:gap-3 md:flex md:items-center text-xs sm:text-sm text-muted-foreground mb-6 bg-muted/20 rounded-lg p-4", children: [property.bedrooms && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: ["\uD83D\uDECF\uFE0F ", property.bedrooms, " quartos"] })), property.bathrooms && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: ["\uD83D\uDEBF ", property.bathrooms, " banheiros"] })), property.area_m2 && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: ["\uD83D\uDCD0 ", property.area_m2, "m\u00B2"] })), property.parking_spaces && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: ["\uD83D\uDE97 ", property.parking_spaces, " vagas"] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsxs)("span", { children: [property.views_count, " visualiza\u00E7\u00F5es"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(EditPropertyButton_1.default, { property: property, onPropertyUpdated: refreshProperties }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => handleDeleteProperty(property.id), className: "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] })] })] })] }) }, property.id))) }))] }), totalPages && totalPages > 1 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border/50", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-muted-foreground", children: ["Mostrando ", ((currentPage - 1) * 12) + 1, " - ", Math.min(currentPage * 12, totalCount || 0), " de ", totalCount || 0, " im\u00F3veis"] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", onClick: loadPrevPage, disabled: !hasPrevPage || loading, className: "h-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-3 w-3 mr-1" }), "Anterior"] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm px-3 py-1 bg-primary/10 rounded", children: ["P\u00E1gina ", currentPage, " de ", totalPages] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", onClick: loadNextPage, disabled: !hasNextPage || loading, className: "h-8", children: ["Pr\u00F3xima", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-3 w-3 ml-1" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: refreshProperties, disabled: loading, className: "h-8", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `h-3 w-3 ${loading ? 'animate-spin' : ''}` }) })] })] }))] }) }));
};
exports.default = Properties;
