"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@shared/hooks/useAuth");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const input_1 = require("@/components/ui/input");
const dialog_1 = require("@/components/ui/dialog");
const textarea_1 = require("@/components/ui/textarea");
const label_1 = require("@/components/ui/label");
const avatar_upload_1 = require("@/components/ui/avatar-upload");
const avatar_1 = require("@/components/ui/avatar");
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
const toggle_group_1 = require("@/components/ui/toggle-group");
const utils_1 = require("@/lib/utils");
const Realtors = () => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [realtors, setRealtors] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showAddDialog, setShowAddDialog] = (0, react_1.useState)(false);
    const [editingRealtor, setEditingRealtor] = (0, react_1.useState)(null);
    const [brokerInfo, setBrokerInfo] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)(() => localStorage.getItem('realtors_view_mode') || 'grid');
    // Form states
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        email: '',
        phone: '',
        creci: '',
        commission_percentage: 50,
        bio: '',
        avatar_url: '',
        whatsapp_button_text: 'Tire suas dúvidas!'
    });
    const fetchBrokerInfo = (0, react_1.useCallback)(async (currentUser) => {
        const userToUse = currentUser || user;
        if (!userToUse?.id)
            return;
        try {
            const { data, error } = await client_1.supabase
                .from('brokers')
                .select('id, business_name')
                .eq('user_id', userToUse.id)
                .single();
            if (error)
                throw error;
            setBrokerInfo(data);
        }
        catch (error) {
            logger_1.logger.error('Error fetching broker info:', error);
            // Garantir que o skeleton não fique preso em caso de erro
            setLoading(false);
        }
    }, [user]); // manter user como dependência para evitar closure stale
    const fetchRealtors = (0, react_1.useCallback)(async () => {
        if (!brokerInfo?.id)
            return;
        try {
            const { data, error } = await client_1.supabase
                .from('realtors')
                .select('*')
                .eq('broker_id', brokerInfo.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setRealtors((data || []));
        }
        catch (error) {
            logger_1.logger.error('Error fetching realtors:', error);
            toast({
                title: "Erro ao carregar corretores",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }, [brokerInfo?.id]); // Adicionada dependência do brokerInfo.id
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchBrokerInfo(user);
        }
    }, [user, fetchBrokerInfo]); // Buscar broker info quando user estiver disponível
    (0, react_1.useEffect)(() => {
        if (brokerInfo?.id) {
            fetchRealtors();
        }
    }, [brokerInfo?.id, fetchRealtors]); // Buscar realtors quando brokerInfo estiver disponível
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brokerInfo) {
            toast({
                title: "Erro",
                description: "Informações do corretor não encontradas.",
                variant: "destructive"
            });
            return;
        }
        try {
            const realtorData = {
                ...formData,
                broker_id: brokerInfo.id,
                commission_percentage: Number(formData.commission_percentage)
            };
            if (editingRealtor) {
                const { error } = await client_1.supabase
                    .from('realtors')
                    .update(realtorData)
                    .eq('id', editingRealtor);
                if (error)
                    throw error;
                setRealtors(realtors.map(realtor => realtor.id === editingRealtor
                    ? { ...realtor, ...realtorData }
                    : realtor));
                toast({
                    title: "Corretor atualizado",
                    description: "As informações do corretor foram atualizadas com sucesso."
                });
            }
            else {
                const { data, error } = await client_1.supabase
                    .from('realtors')
                    .insert([realtorData])
                    .select()
                    .single();
                if (error)
                    throw error;
                setRealtors([data, ...realtors]);
                toast({
                    title: "Corretor adicionado",
                    description: "Novo corretor foi adicionado com sucesso."
                });
            }
            setShowAddDialog(false);
            setEditingRealtor(null);
            resetForm();
        }
        catch (error) {
            logger_1.logger.error('Error saving realtor:', error);
            toast({
                title: "Erro ao salvar corretor",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const handleEdit = (realtor) => {
        setFormData({
            name: realtor.name,
            email: realtor.email,
            phone: realtor.phone || '',
            creci: realtor.creci || '',
            commission_percentage: realtor.commission_percentage,
            bio: realtor.bio || '',
            avatar_url: realtor.avatar_url || '',
            whatsapp_button_text: realtor.whatsapp_button_text || 'Tire suas dúvidas!'
        });
        setEditingRealtor(realtor.id);
        setShowAddDialog(true);
    };
    const handleDelete = async (realtorId) => {
        if (!confirm('Tem certeza que deseja excluir este corretor?'))
            return;
        try {
            const { error } = await client_1.supabase
                .from('realtors')
                .delete()
                .eq('id', realtorId);
            if (error)
                throw error;
            setRealtors(realtors.filter(realtor => realtor.id !== realtorId));
            toast({
                title: "Corretor excluído",
                description: "O corretor foi removido com sucesso."
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting realtor:', error);
            toast({
                title: "Erro ao excluir corretor",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const toggleRealtorStatus = async (realtorId, currentStatus) => {
        try {
            const { error } = await client_1.supabase
                .from('realtors')
                .update({ is_active: !currentStatus })
                .eq('id', realtorId);
            if (error)
                throw error;
            setRealtors(realtors.map(realtor => realtor.id === realtorId
                ? { ...realtor, is_active: !currentStatus }
                : realtor));
            toast({
                title: `Corretor ${!currentStatus ? 'ativado' : 'desativado'}`,
                description: `O corretor foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating realtor status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            creci: '',
            commission_percentage: 50,
            bio: '',
            avatar_url: '',
            whatsapp_button_text: 'Tire suas dúvidas!'
        });
    };
    const handleAddNew = () => {
        resetForm();
        setEditingRealtor(null);
        setShowAddDialog(true);
    };
    const getStatusBadge = (isActive) => {
        return isActive ? ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-green-500 hover:bg-green-600", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 mr-1" }), "Ativo"] })) : ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "secondary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserX, { className: "h-3 w-3 mr-1" }), "Inativo"] }));
    };
    const getActiveRealtors = () => realtors.filter(realtor => realtor.is_active);
    const getInactiveRealtors = () => realtors.filter(realtor => !realtor.is_active);
    // Mostrar skeleton apenas quando estiver carregando e não houver corretores já carregados
    if (loading && realtors.length === 0) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-32 bg-muted rounded-md animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-64 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 md:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-row items-center justify-between space-y-0 p-6 pb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-4 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-6 pt-0", children: (0, jsx_runtime_1.jsx)("div", { className: "h-8 w-16 bg-muted rounded animate-pulse" }) })] }, i))) })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)(DashboardLayout_1.default, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl sm:text-3xl font-bold", children: "Corretores" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-muted-foreground", children: ["Gerencie a equipe de corretores da ", brokerInfo?.business_name] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 self-start sm:self-auto", children: [(0, jsx_runtime_1.jsxs)(toggle_group_1.ToggleGroup, { type: "single", value: viewMode, onValueChange: (v) => { if (v) {
                                            localStorage.setItem('realtors_view_mode', v);
                                            setViewMode(v);
                                        } }, children: [(0, jsx_runtime_1.jsx)(toggle_group_1.ToggleGroupItem, { value: "grid", "aria-label": "Visualizar em grade", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LayoutGrid, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(toggle_group_1.ToggleGroupItem, { value: "list", "aria-label": "Visualizar em lista", children: (0, jsx_runtime_1.jsx)(lucide_react_1.List, { className: "h-4 w-4" }) })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: handleAddNew, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Adicionar" }), " Corretor"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 grid-cols-1 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Total de Corretores" }), (0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-4 w-4 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: realtors.length }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Corretores Ativos" }), (0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-4 w-4 text-green-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-green-600", children: getActiveRealtors().length }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Comiss\u00E3o M\u00E9dia" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Award, { className: "h-4 w-4 text-blue-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-blue-600", children: [realtors.length > 0
                                                    ? Math.round(realtors.reduce((sum, r) => sum + r.commission_percentage, 0) / realtors.length)
                                                    : 0, "%"] }) })] })] }), realtors.length === 0 ? ((0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-12", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-12 w-12 text-muted-foreground mb-4" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold mb-2", children: "Nenhum corretor cadastrado" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground text-center mb-4", children: "Adicione corretores \u00E0 sua equipe para come\u00E7ar a gerenciar leads e vendas." }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: handleAddNew, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Adicionar Primeiro Corretor"] })] }) })) : viewMode === 'grid' ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 grid-cols-1", children: realtors.map((realtor) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "h-full", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-4 sm:p-6 h-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)(avatar_1.Avatar, { className: "h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(avatar_1.AvatarImage, { src: realtor.avatar_url || undefined }), (0, jsx_runtime_1.jsx)(avatar_1.AvatarFallback, { children: (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-xs sm:text-sm", children: realtor.name.split(' ').map(n => n[0]).join('').toUpperCase() }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 space-y-2 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-base sm:text-lg font-semibold truncate", children: realtor.name }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-1", children: [getStatusBadge(realtor.is_active), (0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "outline", className: "text-xs", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Award, { className: "h-3 w-3 mr-1" }), realtor.commission_percentage, "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: realtor.email })] }), realtor.phone && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: realtor.phone })] })), realtor.creci && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "CRECI:" }), (0, jsx_runtime_1.jsx)("span", { children: realtor.creci })] }))] }), realtor.bio && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-muted-foreground line-clamp-2", children: realtor.bio }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-row md:flex-col items-start gap-1 md:gap-2 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => toggleRealtorStatus(realtor.id, realtor.is_active), className: "text-xs flex-1 md:flex-none md:w-20", children: realtor.is_active ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserX, { className: "h-3 w-3 md:mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden md:inline text-xs", children: "Desativar" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 md:mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden md:inline text-xs", children: "Ativar" })] })) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "outline", onClick: () => handleEdit(realtor), className: "text-xs flex-1 md:flex-none md:w-20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3 md:mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden md:inline text-xs", children: "Editar" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "destructive", onClick: () => handleDelete(realtor.id), className: "text-xs flex-1 md:flex-none md:w-20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-3 w-3 md:mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden md:inline text-xs", children: "Excluir" })] })] })] }) }) }, realtor.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-md border divide-y bg-card", children: realtors.map((realtor) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 flex items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3 min-w-0", children: [(0, jsx_runtime_1.jsxs)(avatar_1.Avatar, { className: "h-10 w-10 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(avatar_1.AvatarImage, { src: realtor.avatar_url || undefined }), (0, jsx_runtime_1.jsx)(avatar_1.AvatarFallback, { children: (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-xs", children: realtor.name.split(' ').map(n => n[0]).join('').toUpperCase() }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold truncate", children: realtor.name }), getStatusBadge(realtor.is_active), (0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "outline", className: "text-xs", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Award, { className: "h-3 w-3 mr-1" }), realtor.commission_percentage, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: realtor.email })] }), realtor.phone && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: realtor.phone })] })), realtor.creci && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "CRECI:" }), (0, jsx_runtime_1.jsx)("span", { children: realtor.creci })] }))] }), realtor.bio && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-1", children: realtor.bio }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => toggleRealtorStatus(realtor.id, realtor.is_active), className: "h-8 text-xs", children: realtor.is_active ? (0, jsx_runtime_1.jsx)(lucide_react_1.UserX, { className: "h-3 w-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => handleEdit(realtor), className: "h-8 text-xs", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "destructive", onClick: () => handleDelete(realtor.id), className: "h-8 text-xs", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-3 w-3" }) })] })] }, realtor.id))) }))] }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: showAddDialog, onOpenChange: setShowAddDialog, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "max-w-[600px] max-h-[90vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogHeader, { children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: editingRealtor ? 'Editar Corretor' : 'Adicionar Novo Corretor' }) }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "name", children: "Nome *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "Nome completo", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "email@exemplo.com", required: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "phone", children: "Telefone" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "phone", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), placeholder: "(11) 99999-9999" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "creci", children: "CRECI" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "creci", value: formData.creci, onChange: (e) => setFormData({ ...formData, creci: e.target.value }), placeholder: "CRECI 123456" })] })] }), (0, jsx_runtime_1.jsx)(avatar_upload_1.AvatarUpload, { currentUrl: formData.avatar_url, onUploadComplete: (url) => setFormData({ ...formData, avatar_url: url }), fallbackText: formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A' }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "commission", children: "Percentual de Comiss\u00E3o (%)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "commission", type: "number", min: "0", max: "100", step: "0.01", value: formData.commission_percentage, onChange: (e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) }), placeholder: "50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "bio", children: "Biografia" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "bio", value: formData.bio, onChange: (e) => setFormData({ ...formData, bio: e.target.value }), placeholder: "Escreva uma mensagem chamativa para atrair leads...", rows: 3 }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Este texto ser\u00E1 exibido na p\u00E1gina do im\u00F3vel como uma chamada para o lead entrar em contato" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "whatsapp_button_text", children: "Texto do Bot\u00E3o WhatsApp" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "whatsapp_button_text", value: formData.whatsapp_button_text, onChange: (e) => setFormData({ ...formData, whatsapp_button_text: e.target.value }), placeholder: "Tire suas d\u00FAvidas!" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Texto que aparecer\u00E1 no bot\u00E3o do WhatsApp abaixo da biografia" })] }), (0, jsx_runtime_1.jsxs)(dialog_1.DialogFooter, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: () => setShowAddDialog(false), children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", children: editingRealtor ? 'Atualizar' : 'Adicionar' })] })] })] }) })] }));
};
exports.default = Realtors;
