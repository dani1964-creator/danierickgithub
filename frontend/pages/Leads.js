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
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const use_toast_1 = require("@/hooks/use-toast");
const checkbox_1 = require("@/components/ui/checkbox");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const dialog_1 = require("@/components/ui/dialog");
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
const toggle_group_1 = require("@/components/ui/toggle-group");
const utils_1 = require("@/lib/utils");
const Leads = () => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [leads, setLeads] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedLeads, setSelectedLeads] = (0, react_1.useState)([]);
    const [editingLead, setEditingLead] = (0, react_1.useState)(null);
    const [editName, setEditName] = (0, react_1.useState)('');
    const [editEmail, setEditEmail] = (0, react_1.useState)('');
    const [showDeleteDialog, setShowDeleteDialog] = (0, react_1.useState)(false);
    const [deleteConfirmText, setDeleteConfirmText] = (0, react_1.useState)('');
    const [editingFinancials, setEditingFinancials] = (0, react_1.useState)(null);
    const [editDealValue, setEditDealValue] = (0, react_1.useState)('');
    const [editCommissionValue, setEditCommissionValue] = (0, react_1.useState)('');
    const [realtors, setRealtors] = (0, react_1.useState)([]);
    const [assigningRealtor, setAssigningRealtor] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)(() => localStorage.getItem('leads_view_mode') || 'grid');
    const fetchRealtors = (0, react_1.useCallback)(async () => {
        if (!user?.id)
            return;
        try {
            // First, get the broker_id for the current user
            const { data: brokerData, error: brokerError } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            if (brokerError) {
                logger_1.logger.error('Error fetching broker:', brokerError);
                return;
            }
            if (!brokerData) {
                logger_1.logger.warn('Broker not found');
                return;
            }
            // Then fetch only realtors for this broker
            const { data, error } = await client_1.supabase
                .from('realtors')
                .select('id, name, is_active')
                .eq('broker_id', brokerData.id)
                .eq('is_active', true)
                .order('name');
            if (error)
                throw error;
            setRealtors(data || []);
        }
        catch (error) {
            logger_1.logger.error('Error fetching realtors:', error);
        }
    }, [user?.id]);
    const fetchLeads = (0, react_1.useCallback)(async (currentUser, shouldSetLoading = true) => {
        const userToUse = currentUser || user;
        if (!userToUse?.id)
            return;
        try {
            // First, get the broker_id for the current user to ensure proper filtering
            const { data: brokerData, error: brokerError } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', userToUse.id)
                .single();
            if (brokerError) {
                logger_1.logger.error('Error fetching broker:', brokerError);
                throw new Error('Erro ao identificar corretor');
            }
            if (!brokerData) {
                logger_1.logger.warn('Corretor não encontrado');
                throw new Error('Corretor não encontrado');
            }
            // Then fetch only leads for this broker
            const { data, error } = await client_1.supabase
                .from('leads')
                .select(`
          *,
          realtor:realtors(
            id,
            name
          ),
          property:properties(
            title,
            property_code
          )
        `)
                .eq('broker_id', brokerData.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setLeads(data || []);
        }
        catch (error) {
            logger_1.logger.error('Error fetching leads:', error);
            toast({
                title: "Erro ao carregar leads",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            if (shouldSetLoading) {
                setLoading(false);
            }
        }
    }, []); // Removido dependências para evitar re-renders constantes
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchLeads(user);
            fetchRealtors();
            // Debounce function to prevent excessive refreshes
            let refreshTimeout;
            const debouncedRefresh = () => {
                clearTimeout(refreshTimeout);
                refreshTimeout = setTimeout(() => {
                    logger_1.logger.debug('Leads data changed, refreshing after debounce...');
                    fetchLeads(user, false); // false = não alterar loading state
                }, 1500); // 1.5 second debounce
            };
            // Set up real-time subscription for leads (only specific events)
            const channel = client_1.supabase
                .channel('leads-real-time')
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'leads'
            }, (payload) => {
                logger_1.logger.info('New lead inserted:', payload);
                debouncedRefresh();
                toast({
                    title: "Novo lead!",
                    description: "Um novo lead foi recebido.",
                    duration: 3000,
                });
            })
                .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'leads'
            }, debouncedRefresh)
                .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'leads'
            }, debouncedRefresh)
                .subscribe();
            return () => {
                clearTimeout(refreshTimeout);
                client_1.supabase.removeChannel(channel);
            };
        }
    }, [user]); // Precisa depender do user para executar quando ele estiver disponível
    const updateLeadStatus = async (leadId, newStatus) => {
        try {
            const { error } = await client_1.supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);
            if (error)
                throw error;
            setLeads(leads.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
            toast({
                title: "Status atualizado",
                description: "Status do lead foi atualizado com sucesso."
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating lead status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const handleSelectLead = (leadId, checked) => {
        if (checked) {
            setSelectedLeads([...selectedLeads, leadId]);
        }
        else {
            setSelectedLeads(selectedLeads.filter(id => id !== leadId));
        }
    };
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedLeads(leads.map(lead => lead.id));
        }
        else {
            setSelectedLeads([]);
        }
    };
    const startEdit = (lead) => {
        setEditingLead(lead.id);
        setEditName(lead.name);
        setEditEmail(lead.email);
    };
    const saveEdit = async () => {
        if (!editingLead)
            return;
        try {
            const { error } = await client_1.supabase
                .from('leads')
                .update({
                name: editName.trim(),
                email: editEmail.trim()
            })
                .eq('id', editingLead);
            if (error)
                throw error;
            setLeads(leads.map(lead => lead.id === editingLead
                ? { ...lead, name: editName.trim(), email: editEmail.trim() }
                : lead));
            setEditingLead(null);
            setEditName('');
            setEditEmail('');
            toast({
                title: "Lead atualizado",
                description: "Informações do lead foram atualizadas com sucesso."
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating lead:', error);
            toast({
                title: "Erro ao atualizar lead",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const cancelEdit = () => {
        setEditingLead(null);
        setEditName('');
        setEditEmail('');
    };
    const startEditFinancials = (lead) => {
        setEditingFinancials(lead.id);
        setEditDealValue(lead.deal_value?.toString() || '');
        setEditCommissionValue(lead.commission_value?.toString() || '');
    };
    const saveFinancials = async () => {
        if (!editingFinancials)
            return;
        try {
            const dealValue = editDealValue ? parseFloat(editDealValue) : null;
            const commissionValue = editCommissionValue ? parseFloat(editCommissionValue) : null;
            const { error } = await client_1.supabase
                .from('leads')
                .update({
                deal_value: dealValue,
                commission_value: commissionValue,
                deal_closed_at: dealValue ? new Date().toISOString() : null
            })
                .eq('id', editingFinancials);
            if (error)
                throw error;
            setLeads(leads.map(lead => lead.id === editingFinancials
                ? {
                    ...lead,
                    deal_value: dealValue || undefined,
                    commission_value: commissionValue || undefined,
                    deal_closed_at: dealValue ? new Date().toISOString() : undefined
                }
                : lead));
            setEditingFinancials(null);
            setEditDealValue('');
            setEditCommissionValue('');
            toast({
                title: "Valores financeiros atualizados",
                description: "Os valores do negócio foram atualizados com sucesso."
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating financial values:', error);
            toast({
                title: "Erro ao atualizar valores",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const cancelEditFinancials = () => {
        setEditingFinancials(null);
        setEditDealValue('');
        setEditCommissionValue('');
    };
    const getFinancialSummary = () => {
        const convertedLeads = getLeadsByStatus('converted');
        const totalDealValue = convertedLeads
            .filter(lead => lead.deal_value)
            .reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
        const totalCommission = convertedLeads
            .filter(lead => lead.commission_value)
            .reduce((sum, lead) => sum + (lead.commission_value || 0), 0);
        return { totalDealValue, totalCommission, convertedCount: convertedLeads.length };
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    const assignRealtorToLead = async (leadId, realtorId) => {
        try {
            const finalRealtorId = realtorId === 'none' ? null : realtorId;
            const { error } = await client_1.supabase
                .from('leads')
                .update({ realtor_id: finalRealtorId })
                .eq('id', leadId);
            if (error)
                throw error;
            setLeads(leads.map(lead => lead.id === leadId
                ? {
                    ...lead,
                    realtor_id: finalRealtorId || undefined,
                    realtor: finalRealtorId ? realtors.find(r => r.id === finalRealtorId) : undefined
                }
                : lead));
            const realtorName = finalRealtorId ? realtors.find(r => r.id === finalRealtorId)?.name : 'Nenhum';
            toast({
                title: "Corretor atribuído",
                description: `Lead foi atribuído para: ${realtorName}`
            });
        }
        catch (error) {
            logger_1.logger.error('Error assigning realtor:', error);
            toast({
                title: "Erro ao atribuir corretor",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const deleteLeads = async () => {
        if (deleteConfirmText !== 'Excluir lead(s)') {
            toast({
                title: "Confirmação incorreta",
                description: "Digite exatamente 'Excluir lead(s)' para confirmar.",
                variant: "destructive"
            });
            return;
        }
        try {
            logger_1.logger.debug('Tentando excluir leads:', selectedLeads);
            const { error, data } = await client_1.supabase
                .from('leads')
                .delete()
                .in('id', selectedLeads)
                .select();
            logger_1.logger.debug('Resultado da exclusão:', { error, data });
            if (error) {
                logger_1.logger.error('Erro do Supabase na exclusão:', error);
                throw error;
            }
            logger_1.logger.info('Exclusão bem-sucedida, atualizando estado local');
            setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
            setSelectedLeads([]);
            setShowDeleteDialog(false);
            setDeleteConfirmText('');
            toast({
                title: "Leads excluídos",
                description: `${selectedLeads.length} lead(s) foram excluídos com sucesso.`
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting leads:', error);
            toast({
                title: "Erro ao excluir leads",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'new':
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: "Novo" });
            case 'contacted':
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "secondary", children: "Contatado" });
            case 'qualified':
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", children: "Qualificado" });
            case 'converted':
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-green-500 hover:bg-green-600", children: "Convertido" });
            case 'lost':
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "destructive", children: "Perdido" });
            default:
                return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", children: status });
        }
    };
    const getLeadsByStatus = (status) => {
        return leads.filter(lead => lead.status === status);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const renderPropertyInfo = (lead) => {
        if (lead.property && lead.property.title) {
            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-1 mt-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-4 w-4 mt-0.5 text-muted-foreground" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-primary", children: "Interesse no im\u00F3vel:" }), (0, jsx_runtime_1.jsx)("p", { children: lead.property.title }), lead.property.property_code && ((0, jsx_runtime_1.jsxs)("p", { className: "text-muted-foreground", children: ["C\u00F3digo: ", lead.property.property_code] }))] })] }));
        }
        if (lead.message) {
            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-1 mt-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-4 w-4 mt-0.5 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", children: lead.message })] }));
        }
        return null;
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-32 bg-muted rounded-md animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-64 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 md:grid-cols-4", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-row items-center justify-between space-y-0 p-6 pb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-4 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-6 pt-0", children: (0, jsx_runtime_1.jsx)("div", { className: "h-8 w-16 bg-muted rounded animate-pulse" }) })] }, i))) }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground animate-pulse mb-6" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: "bg-card rounded-lg shadow-sm border p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-48 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-6 w-16 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 w-40 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-32 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-12 w-full bg-muted rounded animate-pulse mt-3" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-8 w-32 bg-muted rounded animate-pulse ml-4" })] }) }, i))) })] })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)(DashboardLayout_1.default, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 md:space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl md:text-2xl lg:text-3xl font-bold", children: "Leads" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm lg:text-base text-muted-foreground", children: "Gerencie os contatos interessados em seus im\u00F3veis" })] }) }), leads.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2 md:gap-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.length === leads.length, onCheckedChange: handleSelectAll }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-muted-foreground", children: "Selecionar todos" }), selectedLeads.length > 0 && ((0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "destructive", size: "sm", onClick: () => setShowDeleteDialog(true), className: "text-xs md:text-sm h-8 md:h-9", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" }), "Excluir (", selectedLeads.length, ")"] }))] }), (0, jsx_runtime_1.jsxs)(toggle_group_1.ToggleGroup, { type: "single", value: viewMode, onValueChange: (v) => { if (v) {
                                                localStorage.setItem('leads_view_mode', v);
                                                setViewMode(v);
                                            } }, children: [(0, jsx_runtime_1.jsx)(toggle_group_1.ToggleGroupItem, { value: "grid", "aria-label": "Visualizar em grade", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LayoutGrid, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(toggle_group_1.ToggleGroupItem, { value: "list", "aria-label": "Visualizar em lista", children: (0, jsx_runtime_1.jsx)(lucide_react_1.List, { className: "h-4 w-4" }) })] })] }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Total" }), (0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm sm:text-base md:text-lg lg:text-xl font-bold", children: leads.length }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Novos" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm sm:text-base md:text-lg lg:text-xl font-bold", children: getLeadsByStatus('new').length }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Convertidos" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm sm:text-base md:text-lg lg:text-xl font-bold", children: getLeadsByStatus('converted').length }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Taxa" }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-sm sm:text-base md:text-lg lg:text-xl font-bold", children: [leads.length > 0
                                                    ? Math.round((getLeadsByStatus('converted').length / leads.length) * 100)
                                                    : 0, "%"] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Valor Total" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsx)("div", { className: "text-xs sm:text-sm md:text-base font-bold", children: formatCurrency(getFinancialSummary().totalDealValue) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-1 px-2 sm:px-3 py-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs font-medium", children: "Comiss\u00F5es" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-3 w-3 text-muted-foreground" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-2 sm:px-3 pb-2", children: (0, jsx_runtime_1.jsx)("div", { className: "text-xs sm:text-sm md:text-base font-bold", children: formatCurrency(getFinancialSummary().totalCommission) }) })] })] }), (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, { defaultValue: "all", className: "w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 md:space-y-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:hidden space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex gap-1", children: (0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { className: "grid grid-cols-3 flex-1 h-9", children: [(0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "all", className: "text-xs px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Todos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", leads.length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "new", className: "text-xs px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Novos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('new').length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "contacted", className: "text-xs px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Contatados" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('contacted').length, ")"] })] }) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-1 justify-center", children: (0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { className: "grid grid-cols-2 w-full h-9", children: [(0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "qualified", className: "text-xs px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Qualificados" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('qualified').length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "converted", className: "text-xs px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Convertidos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('converted').length, ")"] })] }) })] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "hidden md:block", children: (0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { className: "grid w-full grid-cols-5 h-10", children: [(0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "all", className: "text-sm px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Todos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", leads.length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "new", className: "text-sm px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Novos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('new').length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "contacted", className: "text-sm px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Contatados" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('contacted').length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "qualified", className: "text-sm px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Qualificados" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('qualified').length, ")"] })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "converted", className: "text-sm px-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center w-full", children: [(0, jsx_runtime_1.jsx)("span", { children: "Convertidos" }), (0, jsx_runtime_1.jsxs)("span", { className: "ml-1", children: ["(", getLeadsByStatus('converted').length, ")"] })] }) })] }) })] }), (0, jsx_runtime_1.jsx)(tabs_1.TabsContent, { value: "all", className: "space-y-3 md:space-y-4", children: leads.length === 0 ? ((0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-8 md:p-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-base md:text-lg font-semibold mb-2", children: "Nenhum lead ainda" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Os leads aparecer\u00E3o aqui quando algu\u00E9m demonstrar interesse em seus im\u00F3veis." })] }) }) })) : (viewMode === 'grid' ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 md:gap-4 grid-cols-1", children: leads.map((lead) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "h-full", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-3 md:p-4 h-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 space-y-2 min-w-0", children: (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2", children: editingLead === lead.id ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-1", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: editName, onChange: (e) => setEditName(e.target.value), className: "h-7 md:h-8 text-sm font-semibold", placeholder: "Nome do lead" }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: saveEdit, className: "h-7 w-7 md:h-8 md:w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-3 w-3 md:h-4 md:w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: cancelEdit, className: "h-7 w-7 md:h-8 md:w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3 md:h-4 md:w-4" }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0 flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm md:text-base font-semibold truncate", children: lead.name === 'Visitante do Site' ||
                                                                                            lead.email === 'visitante@exemplo.com' ||
                                                                                            !lead.name ?
                                                                                            'Visitante' :
                                                                                            lead.name }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => startEdit(lead), className: "h-6 w-6 p-0 flex-shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) })] }), getStatusBadge(lead.status)] })) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground ml-0 md:ml-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3 flex-shrink-0" }), editingLead === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { value: editEmail, onChange: (e) => setEditEmail(e.target.value), className: "h-6 text-xs", placeholder: "Email do lead", type: "email" })) : ((0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email }))] }), lead.phone && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 sm:col-span-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs", children: formatDate(lead.created_at) })] })] }), renderPropertyInfo(lead) && ((0, jsx_runtime_1.jsx)("div", { className: "ml-0 md:ml-8", children: renderPropertyInfo(lead) })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 ml-0 md:ml-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [lead.status === 'new' && ((0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", onClick: () => updateLeadStatus(lead.id, 'contacted'), className: "text-xs h-7 md:h-8", children: [(0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Marcar como " }), "Contatado"] })), lead.status === 'contacted' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => updateLeadStatus(lead.id, 'qualified'), className: "text-xs h-7 md:h-8", children: "Qualificar" })), lead.status === 'qualified' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "bg-green-500 hover:bg-green-600 text-xs h-7 md:h-8", onClick: () => updateLeadStatus(lead.id, 'converted'), children: "Converter" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 text-muted-foreground flex-shrink-0" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: lead.realtor_id || "none", onValueChange: (value) => assignRealtorToLead(lead.id, value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-full sm:w-[180px] md:w-[200px] h-7 md:h-8 text-xs", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Atribuir corretor" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "none", children: "Nenhum corretor" }), realtors.map((realtor) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: realtor.id, children: realtor.name }, realtor.id)))] })] })] })] })] }) }) }, lead.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-md border divide-y bg-card", children: leads.map((lead) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 md:p-4 flex flex-col gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold truncate", children: lead.name === 'Visitante do Site' || lead.email === 'visitante@exemplo.com' || !lead.name ? 'Visitante' : lead.name }), getStatusBadge(lead.status)] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email })] }), lead.phone && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] })), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { children: formatDate(lead.created_at) })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [lead.status === 'new' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", onClick: () => updateLeadStatus(lead.id, 'contacted'), className: "h-7 text-xs", children: "Contatar" })), lead.status === 'contacted' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => updateLeadStatus(lead.id, 'qualified'), className: "h-7 text-xs", children: "Qualificar" })), lead.status === 'qualified' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "h-7 text-xs bg-green-500 hover:bg-green-600", onClick: () => updateLeadStatus(lead.id, 'converted'), children: "Converter" })), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => startEdit(lead), className: "h-7 w-7 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) })] })] }), renderPropertyInfo(lead), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: lead.realtor_id || 'none', onValueChange: (value) => assignRealtorToLead(lead.id, value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-full sm:w-[220px] h-7 text-xs", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Atribuir corretor" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "none", children: "Nenhum corretor" }), realtors.map((realtor) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: realtor.id, children: realtor.name }, realtor.id)))] })] })] })] }, lead.id))) }))) }), ['new', 'contacted', 'qualified'].map((status) => ((0, jsx_runtime_1.jsx)(tabs_1.TabsContent, { value: status, className: "space-y-3 md:space-y-4", children: viewMode === 'grid' ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 md:gap-4 grid-cols-1", children: getLeadsByStatus(status).map((lead) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "h-full", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-3 md:p-4 h-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 space-y-2 min-w-0", children: (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2", children: editingLead === lead.id ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-1", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { value: editName, onChange: (e) => setEditName(e.target.value), className: "h-7 md:h-8 text-sm font-semibold", placeholder: "Nome do lead" }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: saveEdit, className: "h-7 w-7 md:h-8 md:w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-3 w-3 md:h-4 md:w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: cancelEdit, className: "h-7 w-7 md:h-8 md:w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3 md:h-4 md:w-4" }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0 flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm md:text-base font-semibold truncate", children: lead.name === 'Visitante do Site' ||
                                                                                            lead.email === 'visitante@exemplo.com' ||
                                                                                            !lead.name ?
                                                                                            'Visitante' :
                                                                                            lead.name }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => startEdit(lead), className: "h-6 w-6 p-0 flex-shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) })] }), getStatusBadge(lead.status)] })) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground ml-0 md:ml-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3 flex-shrink-0" }), editingLead === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { value: editEmail, onChange: (e) => setEditEmail(e.target.value), className: "h-6 text-xs", placeholder: "Email do lead", type: "email" })) : ((0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email }))] }), lead.phone && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 sm:col-span-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs", children: formatDate(lead.created_at) })] })] }), renderPropertyInfo(lead) && ((0, jsx_runtime_1.jsx)("div", { className: "ml-0 md:ml-8", children: renderPropertyInfo(lead) })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 ml-0 md:ml-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [status === 'new' && ((0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", onClick: () => updateLeadStatus(lead.id, 'contacted'), className: "text-xs h-7 md:h-8", children: [(0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Marcar como " }), "Contatado"] })), status === 'contacted' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => updateLeadStatus(lead.id, 'qualified'), className: "text-xs h-7 md:h-8", children: "Qualificar" })), status === 'qualified' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "bg-green-500 hover:bg-green-600 text-xs h-7 md:h-8", onClick: () => updateLeadStatus(lead.id, 'converted'), children: "Converter" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 text-muted-foreground flex-shrink-0" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: lead.realtor_id || "none", onValueChange: (value) => assignRealtorToLead(lead.id, value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-full sm:w-[180px] md:w-[200px] h-7 md:h-8 text-xs", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Atribuir corretor" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "none", children: "Nenhum corretor" }), realtors.map((realtor) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: realtor.id, children: realtor.name }, realtor.id)))] })] })] })] })] }) }) }, lead.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-md border divide-y bg-card", children: getLeadsByStatus(status).map((lead) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 md:p-4 flex flex-col gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold truncate", children: lead.name === 'Visitante do Site' || lead.email === 'visitante@exemplo.com' || !lead.name ? 'Visitante' : lead.name }), getStatusBadge(lead.status)] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email })] }), lead.phone && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] })), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { children: formatDate(lead.created_at) })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [status === 'new' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", onClick: () => updateLeadStatus(lead.id, 'contacted'), className: "h-7 text-xs", children: "Contatar" })), status === 'contacted' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => updateLeadStatus(lead.id, 'qualified'), className: "h-7 text-xs", children: "Qualificar" })), status === 'qualified' && ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "h-7 text-xs bg-green-500 hover:bg-green-600", onClick: () => updateLeadStatus(lead.id, 'converted'), children: "Converter" })), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => startEdit(lead), className: "h-7 w-7 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 w-3" }) })] })] }), renderPropertyInfo(lead), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: lead.realtor_id || 'none', onValueChange: (value) => assignRealtorToLead(lead.id, value), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-full sm:w-[220px] h-7 text-xs", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Atribuir corretor" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "none", children: "Nenhum corretor" }), realtors.map((realtor) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: realtor.id, children: realtor.name }, realtor.id)))] })] })] })] }, lead.id))) })) }, status))), (0, jsx_runtime_1.jsx)(tabs_1.TabsContent, { value: "converted", className: "space-y-4", children: getLeadsByStatus('converted').length === 0 ? ((0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold mb-2", children: "Nenhum lead convertido ainda" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Os leads convertidos aparecer\u00E3o aqui quando voc\u00EA marcar leads como convertidos." })] }) }) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4 md:mb-6", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 py-2 md:py-3", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs md:text-sm font-medium", children: "Leads Convertidos" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "h-3 md:h-4 w-3 md:w-4 text-green-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-3 md:px-6 pb-2 md:pb-3", children: (0, jsx_runtime_1.jsx)("div", { className: "text-lg md:text-xl lg:text-2xl font-bold text-green-600", children: getFinancialSummary().convertedCount }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 py-2 md:py-3", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs md:text-sm font-medium", children: "Volume Total" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-3 md:h-4 w-3 md:w-4 text-blue-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-3 md:px-6 pb-2 md:pb-3", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm md:text-lg lg:text-xl font-bold text-blue-600", children: formatCurrency(getFinancialSummary().totalDealValue) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 py-2 md:py-3", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xs md:text-sm font-medium", children: "Comiss\u00F5es" }), (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-3 md:h-4 w-3 md:w-4 text-purple-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "px-3 md:px-6 pb-2 md:pb-3", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm md:text-lg lg:text-xl font-bold text-purple-600", children: formatCurrency(getFinancialSummary().totalCommission) }) })] })] }), viewMode === 'grid' ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 md:gap-4 grid-cols-1", children: getLeadsByStatus('converted').map((lead) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "h-full", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-3 md:p-4 lg:p-6 h-full", children: (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:gap-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 md:gap-3 flex-1", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 space-y-2 md:space-y-3 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm md:text-base lg:text-lg font-semibold truncate", children: lead.name === 'Visitante do Site' ||
                                                                                        lead.email === 'visitante@exemplo.com' ||
                                                                                        !lead.name ?
                                                                                        'Visitante' :
                                                                                        lead.name }), getStatusBadge(lead.status), lead.deal_closed_at && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 text-xs md:text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "h-3 md:h-4 w-3 md:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Fechado em " }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: formatDate(lead.deal_closed_at) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 md:h-4 w-3 md:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email })] }), lead.phone && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 md:h-4 w-3 md:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] }))] }), renderPropertyInfo(lead), (0, jsx_runtime_1.jsxs)("div", { className: "bg-muted/30 rounded-lg p-3 md:p-4 mt-3 md:mt-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3 mb-3", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium text-xs md:text-sm", children: "Informa\u00E7\u00F5es Financeiras" }), !editingFinancials || editingFinancials !== lead.id ? ((0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "outline", onClick: () => startEditFinancials(lead), className: "text-xs h-8 w-full md:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-3 md:h-4 w-3 md:w-4 mr-1" }), "Editar"] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 w-full md:w-auto", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", onClick: saveFinancials, className: "text-xs h-8 flex-1 md:flex-none", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-3 md:h-4 w-3 md:w-4 mr-1" }), "Salvar"] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "outline", onClick: cancelEditFinancials, className: "text-xs h-8 flex-1 md:flex-none", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 md:h-4 w-3 md:w-4 mr-1" }), "Cancelar"] })] }))] }), lead.realtor && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 text-xs md:text-sm text-muted-foreground mb-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { className: "h-3 md:h-4 w-3 md:w-4 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Corretor: ", lead.realtor.name] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs md:text-sm font-medium block mb-1", children: "Valor do Neg\u00F3cio" }), editingFinancials === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", step: "0.01", value: editDealValue, onChange: (e) => setEditDealValue(e.target.value), placeholder: "0,00", className: "h-8 text-xs md:text-sm" })) : ((0, jsx_runtime_1.jsx)("div", { className: "text-sm md:text-base lg:text-lg font-semibold text-blue-600", children: lead.deal_value ? formatCurrency(lead.deal_value) : 'Não informado' }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs md:text-sm font-medium block mb-1", children: "Valor da Comiss\u00E3o" }), editingFinancials === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", step: "0.01", value: editCommissionValue, onChange: (e) => setEditCommissionValue(e.target.value), placeholder: "0,00", className: "h-8 text-xs md:text-sm" })) : ((0, jsx_runtime_1.jsx)("div", { className: "text-sm md:text-base lg:text-lg font-semibold text-purple-600", children: lead.commission_value ? formatCurrency(lead.commission_value) : 'Não informado' }))] })] }), lead.deal_value && lead.commission_value && ((0, jsx_runtime_1.jsx)("div", { className: "mt-3 pt-3 border-t", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-xs md:text-sm text-muted-foreground", children: ["Taxa de comiss\u00E3o: ", ((lead.commission_value / lead.deal_value) * 100).toFixed(2), "%"] }) }))] })] })] }) }) }) }, lead.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-md border divide-y bg-card", children: getLeadsByStatus('converted').map((lead) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 md:p-4 flex flex-col gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)(checkbox_1.Checkbox, { checked: selectedLeads.includes(lead.id), onCheckedChange: (checked) => handleSelectLead(lead.id, checked), className: "mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold truncate", children: lead.name === 'Visitante do Site' || lead.email === 'visitante@exemplo.com' || !lead.name ? 'Visitante' : lead.name }), getStatusBadge(lead.status), lead.deal_closed_at && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: formatDate(lead.deal_closed_at) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.email })] }), lead.phone && ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3 w-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: lead.phone })] }))] })] })] }), !editingFinancials || editingFinancials !== lead.id ? ((0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => startEditFinancials(lead), className: "h-8 text-xs", children: "Editar" })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", onClick: saveFinancials, className: "h-8 text-xs", children: "Salvar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: cancelEditFinancials, className: "h-8 text-xs", children: "Cancelar" })] }))] }), renderPropertyInfo(lead), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs text-muted-foreground", children: "Valor do Neg\u00F3cio" }), editingFinancials === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", step: "0.01", value: editDealValue, onChange: (e) => setEditDealValue(e.target.value), className: "h-8 text-xs" })) : ((0, jsx_runtime_1.jsx)("div", { className: "font-semibold text-blue-600", children: lead.deal_value ? formatCurrency(lead.deal_value) : 'Não informado' }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs text-muted-foreground", children: "Valor da Comiss\u00E3o" }), editingFinancials === lead.id ? ((0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", step: "0.01", value: editCommissionValue, onChange: (e) => setEditCommissionValue(e.target.value), className: "h-8 text-xs" })) : ((0, jsx_runtime_1.jsx)("div", { className: "font-semibold text-purple-600", children: lead.commission_value ? formatCurrency(lead.commission_value) : 'Não informado' }))] }), lead.deal_value && lead.commission_value && ((0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-muted-foreground self-end", children: ["Taxa: ", ((lead.commission_value / lead.deal_value) * 100).toFixed(2), "%"] }))] })] }, lead.id))) }))] })) })] })] }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogHeader, { children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Confirmar Exclus\u00E3o" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-muted-foreground", children: ["Voc\u00EA est\u00E1 prestes a excluir permanentemente ", selectedLeads.length, " lead(s). Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita."] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium", children: ["Para confirmar, digite exatamente: ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono bg-muted px-2 py-1 rounded", children: "Excluir lead(s)" })] }), (0, jsx_runtime_1.jsx)(input_1.Input, { value: deleteConfirmText, onChange: (e) => setDeleteConfirmText(e.target.value), placeholder: "Digite aqui para confirmar", className: "font-mono" })] }), (0, jsx_runtime_1.jsxs)(dialog_1.DialogFooter, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", onClick: () => {
                                        setShowDeleteDialog(false);
                                        setDeleteConfirmText('');
                                    }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "destructive", onClick: deleteLeads, disabled: deleteConfirmText !== 'Excluir lead(s)', children: "Excluir Permanentemente" })] })] }) })] }));
};
exports.default = Leads;
