"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@shared/hooks/useAuth");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const dialog_1 = require("@/components/ui/dialog");
const switch_1 = require("@/components/ui/switch");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
const platforms = [
    { value: 'facebook', label: 'Facebook', icon: lucide_react_1.Facebook },
    { value: 'instagram', label: 'Instagram', icon: lucide_react_1.Instagram },
    { value: 'youtube', label: 'YouTube', icon: lucide_react_1.Youtube },
    { value: 'linkedin', label: 'LinkedIn', icon: lucide_react_1.Linkedin },
    { value: 'twitter', label: 'Twitter/X', icon: lucide_react_1.Twitter },
    { value: 'website', label: 'Website', icon: lucide_react_1.Globe },
];
const SocialLinksManager = () => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [socialLinks, setSocialLinks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [editingLink, setEditingLink] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        platform: '',
        url: '',
        is_active: true,
    });
    const fetchSocialLinks = (0, react_1.useCallback)(async () => {
        try {
            const { data: brokerData } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            if (!brokerData)
                return;
            const { data, error } = await client_1.supabase
                .from('social_links')
                .select('*')
                .eq('broker_id', brokerData.id)
                .order('display_order');
            if (error)
                throw error;
            setSocialLinks(data || []);
        }
        catch (error) {
            toast({
                title: "Erro ao carregar redes sociais",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast, user?.id]);
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchSocialLinks();
        }
    }, [user, fetchSocialLinks]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: brokerData } = await client_1.supabase
                .from('brokers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            if (!brokerData)
                throw new Error('Broker não encontrado');
            const linkData = {
                broker_id: brokerData.id,
                platform: formData.platform,
                url: formData.url,
                is_active: formData.is_active,
                display_order: editingLink?.display_order || socialLinks.length,
            };
            if (editingLink) {
                const { error } = await client_1.supabase
                    .from('social_links')
                    .update(linkData)
                    .eq('id', editingLink.id);
                if (error)
                    throw error;
                toast({ title: "Link atualizado com sucesso!" });
            }
            else {
                const { error } = await client_1.supabase
                    .from('social_links')
                    .insert(linkData);
                if (error)
                    throw error;
                toast({ title: "Link criado com sucesso!" });
            }
            resetForm();
            setOpen(false);
            fetchSocialLinks();
        }
        catch (error) {
            toast({
                title: "Erro ao salvar link",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
        finally {
            setSaving(false);
        }
    };
    const deleteLink = async (id) => {
        try {
            const { error } = await client_1.supabase
                .from('social_links')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            toast({ title: "Link excluído com sucesso!" });
            fetchSocialLinks();
        }
        catch (error) {
            toast({
                title: "Erro ao excluir link",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const updateOrder = async (id, newOrder) => {
        try {
            const { error } = await client_1.supabase
                .from('social_links')
                .update({ display_order: newOrder })
                .eq('id', id);
            if (error)
                throw error;
            fetchSocialLinks();
        }
        catch (error) {
            toast({
                title: "Erro ao reordenar link",
                description: (0, utils_1.getErrorMessage)(error),
                variant: "destructive"
            });
        }
    };
    const resetForm = () => {
        setFormData({
            platform: '',
            url: '',
            is_active: true,
        });
        setEditingLink(null);
    };
    const openEditDialog = (link) => {
        setEditingLink(link);
        setFormData({
            platform: link.platform,
            url: link.url,
            is_active: link.is_active,
        });
        setOpen(true);
    };
    const getPlatformIcon = (platform) => {
        const platformData = platforms.find(p => p.value === platform);
        const IconComponent = platformData?.icon || lucide_react_1.Globe;
        return (0, jsx_runtime_1.jsx)(IconComponent, { className: "h-4 w-4" });
    };
    const getPlatformLabel = (platform) => {
        return platforms.find(p => p.value === platform)?.label || platform;
    };
    if (loading) {
        return (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" });
    }
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Redes Sociais" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Gerencie os links das redes sociais no rodap\u00E9 do site" })] }), (0, jsx_runtime_1.jsxs)(dialog_1.Dialog, { open: open, onOpenChange: setOpen, children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTrigger, { asChild: true, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: resetForm, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Novo Link"] }) }), (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { children: [(0, jsx_runtime_1.jsxs)(dialog_1.DialogHeader, { children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: editingLink ? 'Editar Link' : 'Novo Link' }), (0, jsx_runtime_1.jsx)(dialog_1.DialogDescription, { children: "Adicione um link para rede social" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Plataforma *" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: formData.platform, onValueChange: (value) => setFormData(prev => ({ ...prev, platform: value })), required: true, children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Selecione a plataforma" }) }), (0, jsx_runtime_1.jsx)(select_1.SelectContent, { children: platforms.map(platform => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: platform.value, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(platform.icon, { className: "h-4 w-4" }), platform.label] }) }, platform.value))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "url", children: "URL *" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "url", type: "url", value: formData.url, onChange: (e) => setFormData(prev => ({ ...prev, url: e.target.value })), placeholder: "https://www.facebook.com/minha-imobiliaria", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { id: "is_active", checked: formData.is_active, onCheckedChange: (checked) => setFormData(prev => ({ ...prev, is_active: checked })) }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "is_active", children: "Link ativo" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancelar" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: saving, children: saving ? 'Salvando...' : editingLink ? 'Atualizar' : 'Criar' })] })] })] })] })] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: socialLinks.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-8", children: (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Nenhum link cadastrado" }) })) : ((0, jsx_runtime_1.jsxs)(table_1.Table, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHeader, { children: (0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "Plataforma" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "URL" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "Status" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "Ordem" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "A\u00E7\u00F5es" })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableBody, { children: socialLinks.map((link, index) => ((0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [getPlatformIcon(link.platform), getPlatformLabel(link.platform)] }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsxs)("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:underline", children: [link.url.substring(0, 40), "..."] }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded-full text-xs ${link.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'}`, children: link.is_active ? 'Ativo' : 'Inativo' }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => updateOrder(link.id, link.display_order - 1), disabled: index === 0, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "h-3 w-3" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm", children: link.display_order }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => updateOrder(link.id, link.display_order + 1), disabled: index === socialLinks.length - 1, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "h-3 w-3" }) })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", onClick: () => openEditDialog(link), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "destructive", onClick: () => deleteLink(link.id), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] }) })] }, link.id))) })] })) })] }));
};
exports.default = SocialLinksManager;
