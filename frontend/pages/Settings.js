"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAuth_1 = require("@shared/hooks/useAuth");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
const switch_1 = require("@/components/ui/switch");
const table_1 = require("@/components/ui/table");
const Settings = () => {
    const { user } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [profile, setProfile] = (0, react_1.useState)(null);
    // Domínios personalizados
    const [domains, setDomains] = (0, react_1.useState)([]);
    const [domainsLoading, setDomainsLoading] = (0, react_1.useState)(false);
    const [domainInput, setDomainInput] = (0, react_1.useState)('');
    const [savingDomain, setSavingDomain] = (0, react_1.useState)(false);
    const appUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) || (typeof window !== 'undefined' ? window.location.origin : '');
    const appHost = (() => {
        try {
            return new URL(appUrl).host;
        }
        catch {
            return (appUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
    })();
    const cnameTarget = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CNAME_TARGET) || appHost;
    const getErrorMessage = (err) => (err instanceof Error ? err.message : typeof err === 'string' ? err : 'Erro desconhecido');
    const isLikelyApex = (d) => {
        const dom = normalizeDomain(d);
        if (!dom || !dom.includes('.'))
            return false;
        const parts = dom.split('.');
        const last2 = parts.slice(-2).join('.');
        const last3 = parts.slice(-3).join('.');
        const brPublic = new Set(['com.br', 'net.br', 'org.br', 'art.br', 'eco.br', 'blog.br', 'tv.br']);
        if (brPublic.has(last2)) {
            // ex.: cliente.com.br => parts === 3 é apex
            return parts.length === 3;
        }
        // gen TLD: apex quando há apenas 2 labels (ex.: cliente.com)
        return parts.length === 2;
    };
    const fetchDomains = (0, react_1.useCallback)(async (brokerId) => {
        try {
            setDomainsLoading(true);
            const { data, error } = await client_1.supabase
                .from('broker_domains')
                .select('id, broker_id, domain, is_active, created_at')
                .eq('broker_id', brokerId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setDomains(data || []);
        }
        catch (err) {
            toast({
                title: 'Erro ao carregar domínios',
                description: getErrorMessage(err),
                variant: 'destructive',
            });
        }
        finally {
            setDomainsLoading(false);
        }
    }, []); // Removido dependências desnecessárias
    const fetchProfile = (0, react_1.useCallback)(async (currentUser) => {
        const userToUse = currentUser || user;
        if (!userToUse?.id)
            return;
        try {
            const { data, error } = await client_1.supabase
                .from('brokers')
                .select('id, business_name, display_name, email, contact_email, phone, address, about_text, footer_text, whatsapp_number, creci')
                .eq('user_id', userToUse.id)
                .single();
            if (error)
                throw error;
            setProfile(data);
            // Carrega domínios após obter o broker_id
            if (data?.id) {
                fetchDomains(data.id);
            }
        }
        catch (err) {
            toast({
                title: "Erro ao carregar perfil",
                description: getErrorMessage(err),
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }, []); // Removido dependências para evitar re-renders constantes
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchProfile(user);
        }
    }, [user]); // Precisa depender do user para executar quando ele estiver disponível
    const saveProfile = async () => {
        if (!profile)
            return;
        setSaving(true);
        try {
            const { error } = await client_1.supabase
                .from('brokers')
                .update({
                business_name: profile.business_name,
                display_name: profile.display_name,
                contact_email: profile.contact_email,
                phone: profile.phone,
                address: profile.address,
                about_text: profile.about_text,
                footer_text: profile.footer_text,
                whatsapp_number: profile.whatsapp_number,
                creci: profile.creci,
            })
                .eq('user_id', user.id);
            if (error)
                throw error;
            toast({
                title: "Perfil atualizado",
                description: "Suas configurações foram salvas com sucesso."
            });
        }
        catch (err) {
            toast({
                title: "Erro ao salvar",
                description: getErrorMessage(err),
                variant: "destructive"
            });
        }
        finally {
            setSaving(false);
        }
    };
    const updateProfile = (field, value) => {
        if (profile) {
            setProfile({ ...profile, [field]: value });
        }
    };
    const normalizeDomain = (value) => {
        let v = (value || '').trim().toLowerCase();
        v = v.replace(/^https?:\/\//, '');
        v = v.replace(/\/$/, '');
        return v;
    };
    const isValidDomain = (value) => {
        const re = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
        return re.test(value);
    };
    const addDomain = async () => {
        if (!profile)
            return;
        const dom = normalizeDomain(domainInput);
        if (!isValidDomain(dom)) {
            toast({ title: 'Domínio inválido', description: 'Informe um domínio válido. Ex: vitrine.seudominio.com.br', variant: 'destructive' });
            return;
        }
        setSavingDomain(true);
        try {
            const { data, error } = await client_1.supabase
                .from('broker_domains')
                .insert({ broker_id: profile.id, domain: dom })
                .select('id, broker_id, domain, is_active, created_at')
                .single();
            if (error)
                throw error;
            setDomains((prev) => [data, ...prev]);
            setDomainInput('');
            toast({ title: 'Domínio adicionado', description: 'Crie um CNAME no seu DNS apontando para o app e aguarde a propagação.' });
            // Tentativa opcional de provisionar automaticamente na DO (se função estiver configurada)
            try {
                const { error: fnError } = await client_1.supabase.functions.invoke('domain-provision', {
                    body: { domain: data.domain, broker_id: profile.id },
                });
                if (!fnError) {
                    toast({ title: 'Provisionamento solicitado', description: 'Solicitação enviada ao provedor para emitir SSL e vincular o domínio.' });
                }
            }
            catch (_) {
                // silencioso, botão manual abaixo cobre o caso
            }
        }
        catch (err) {
            toast({ title: 'Erro ao adicionar domínio', description: getErrorMessage(err), variant: 'destructive' });
        }
        finally {
            setSavingDomain(false);
        }
    };
    const toggleDomainActive = async (d, next) => {
        try {
            const { error } = await client_1.supabase
                .from('broker_domains')
                .update({ is_active: next })
                .eq('id', d.id);
            if (error)
                throw error;
            setDomains((prev) => prev.map((it) => (it.id === d.id ? { ...it, is_active: next } : it)));
        }
        catch (err) {
            toast({ title: 'Erro ao atualizar domínio', description: getErrorMessage(err), variant: 'destructive' });
        }
    };
    const removeDomain = async (d) => {
        if (!confirm(`Remover domínio ${d.domain}?`))
            return;
        try {
            const { error } = await client_1.supabase
                .from('broker_domains')
                .delete()
                .eq('id', d.id);
            if (error)
                throw error;
            setDomains((prev) => prev.filter((it) => it.id !== d.id));
            toast({ title: 'Domínio removido' });
        }
        catch (err) {
            toast({ title: 'Erro ao remover domínio', description: getErrorMessage(err), variant: 'destructive' });
        }
    };
    const provisionDomain = async (d) => {
        try {
            const { error: fnError } = await client_1.supabase.functions.invoke('domain-provision', {
                body: { domain: d.domain, broker_id: profile?.id },
            });
            if (fnError)
                throw fnError;
            toast({ title: 'Provisionamento solicitado', description: 'Verifique no provedor a emissão do certificado.' });
        }
        catch (err) {
            toast({ title: 'Erro ao provisionar domínio', description: getErrorMessage(err), variant: 'destructive' });
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-48 bg-muted rounded-md animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-64 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-10 w-40 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6 border-b", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-5 w-5 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-6 w-48 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-64 bg-muted rounded animate-pulse mt-2" })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-6 space-y-6", children: (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 md:grid-cols-2", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-10 w-full bg-muted rounded animate-pulse" })] }, i))) }) })] })] }) }));
    }
    if (!profile) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex flex-col items-center justify-center p-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold mb-2", children: "Erro ao carregar perfil" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "N\u00E3o foi poss\u00EDvel carregar suas configura\u00E7\u00F5es." })] }) }) }) }));
    }
    return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl sm:text-3xl font-bold", children: "Configura\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Configure as informa\u00E7\u00F5es do seu perfil" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: saveProfile, disabled: saving, className: "self-start sm:self-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { className: "h-4 w-4 mr-2" }), saving ? 'Salvando...' : 'Salvar Alterações'] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-5 w-5" }), "Informa\u00E7\u00F5es B\u00E1sicas"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Configure as informa\u00E7\u00F5es principais da sua imobili\u00E1ria" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email (Autentica\u00E7\u00E3o)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", value: profile.email, disabled: true, className: "bg-muted" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "contact_email", children: "Email de Contato" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "contact_email", value: profile.contact_email || '', onChange: (e) => updateProfile('contact_email', e.target.value), placeholder: "contato@imobiliaria.com" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "phone", children: "Telefone" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "phone", value: profile.phone || '', onChange: (e) => updateProfile('phone', e.target.value), placeholder: "(11) 99999-9999" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "whatsapp_number", children: "WhatsApp para Contato" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "whatsapp_number", value: profile.whatsapp_number || '', onChange: (e) => updateProfile('whatsapp_number', e.target.value), placeholder: "5511999999999" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "N\u00FAmero com c\u00F3digo do pa\u00EDs (sem s\u00EDmbolos). Ex: 5511999999999" })] })] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe2, { className: "h-5 w-5" }), "Dom\u00EDnios personalizados"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Cadastre dom\u00EDnios para sua vitrine p\u00FAblica. Crie um registro CNAME no seu provedor de DNS apontando o host para o dom\u00EDnio do app." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "custom-domain", children: "Adicionar dom\u00EDnio" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row gap-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { id: "custom-domain", value: domainInput, onChange: (e) => setDomainInput(e.target.value), placeholder: "vitrine.seudominio.com.br" }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: addDomain, disabled: savingDomain || !domainInput.trim(), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), savingDomain ? 'Adicionando...' : 'Adicionar'] })] }), domainInput && isLikelyApex(domainInput) && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-amber-600", children: "Detectei que este pode ser um dom\u00EDnio raiz. Para o raiz, use A/AAAA (ou ALIAS/ANAME) conforme instru\u00E7\u00F5es do provedor ao adicionar o dom\u00EDnio na plataforma." })), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-muted-foreground space-y-1", children: [(0, jsx_runtime_1.jsx)("p", { children: "Dica: use exatamente o host que os clientes acessar\u00E3o (ex.: vitrine.seudominio.com.br ou www.seudominio.com.br)." }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "CNAME alvo:" }), (0, jsx_runtime_1.jsx)("code", { className: "px-2 py-0.5 rounded bg-muted text-foreground", children: cnameTarget || '-' }), cnameTarget && ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", size: "icon", onClick: () => navigator.clipboard?.writeText(cnameTarget), title: "Copiar CNAME alvo", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "h-4 w-4" }) }))] }), (0, jsx_runtime_1.jsx)("p", { children: "Se o dom\u00EDnio for raiz (sem www), muitos provedores n\u00E3o permitem CNAME no raiz. Nesse caso, use os registros A/AAAA (ou ALIAS/ANAME) conforme instru\u00E7\u00F5es do provedor de hospedagem quando voc\u00EA adicionar o dom\u00EDnio na plataforma (ex.: DigitalOcean)." }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-md border p-3 mt-1 text-foreground bg-card/30", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium mb-1", children: "Guia r\u00E1pido:" }), (0, jsx_runtime_1.jsxs)("ul", { className: "list-disc ml-5 space-y-1", children: [(0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: "Subdom\u00EDnio" }), " (ex.: vitrine.cliente.com): criar ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: "CNAME" }), " apontando para ", (0, jsx_runtime_1.jsx)("code", { className: "px-1 rounded bg-muted", children: cnameTarget || 'seu-app-host' }), "."] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: "Dom\u00EDnio raiz" }), " (ex.: cliente.com): usar ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: "A/AAAA" }), " (ou ALIAS/ANAME) conforme instru\u00E7\u00F5es ao adicionar o dom\u00EDnio na plataforma. Isso garante o certificado SSL autom\u00E1tico."] })] })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "border rounded-md overflow-hidden", children: (0, jsx_runtime_1.jsxs)(table_1.Table, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHeader, { children: (0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "Dom\u00EDnio" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { children: "Status" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "hidden sm:table-cell", children: "Criado em" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "text-right", children: "A\u00E7\u00F5es" })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableBody, { children: domainsLoading ? ((0, jsx_runtime_1.jsx)(table_1.TableRow, { children: (0, jsx_runtime_1.jsx)(table_1.TableCell, { colSpan: 4, className: "py-6 text-center text-muted-foreground", children: "Carregando..." }) })) : domains.length === 0 ? ((0, jsx_runtime_1.jsx)(table_1.TableRow, { children: (0, jsx_runtime_1.jsx)(table_1.TableCell, { colSpan: 4, className: "py-6 text-center text-muted-foreground", children: "Nenhum dom\u00EDnio cadastrado" }) })) : (domains.map((d) => ((0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "font-medium", children: d.domain }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(switch_1.Switch, { checked: d.is_active, onCheckedChange: (v) => toggleDomainActive(d, v) }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-muted-foreground", children: d.is_active ? 'Ativo' : 'Inativo' })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "hidden sm:table-cell text-sm text-muted-foreground", children: new Date(d.created_at).toLocaleDateString() }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end gap-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "icon", onClick: () => provisionDomain(d), title: "Provisionar no provedor", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CloudCog, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "destructive", size: "icon", onClick: () => removeDomain(d), title: "Excluir dom\u00EDnio", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] }) })] }, d.id)))) })] }) })] })] })] }) }));
};
exports.default = Settings;
