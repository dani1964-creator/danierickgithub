"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SuperAdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("@/integrations/supabase/client");
const supabase_js_1 = require("@supabase/supabase-js");
const use_toast_1 = require("@/hooks/use-toast");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const table_1 = require("@/components/ui/table");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const dialog_1 = require("@/components/ui/dialog");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const react_helmet_async_1 = require("react-helmet-async");
const logger_1 = require("@/lib/logger");
function SuperAdminPage() {
    const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SA_EMAIL || "";
    const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SA_PASSWORD || "";
    const SUPER_ADMIN_TOKEN_KEY = "sa_auth";
    const { toast } = (0, use_toast_1.useToast)();
    // 🎯 Service Role client para SuperAdmin (memoizado para evitar recriação)
    const supabaseServiceRole = (0, react_1.useMemo)(() => (0, supabase_js_1.createClient)(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM"), []);
    // Estados simples
    const [brokers, setBrokers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isAuthorized, setIsAuthorized] = (0, react_1.useState)(false);
    const [showLoginDialog, setShowLoginDialog] = (0, react_1.useState)(false);
    const [loginEmail, setLoginEmail] = (0, react_1.useState)("");
    const [loginPassword, setLoginPassword] = (0, react_1.useState)("");
    const [loginLoading, setLoginLoading] = (0, react_1.useState)(false);
    // Debug: Log sempre que brokers mudar
    (0, react_1.useEffect)(() => {
        logger_1.logger.debug('🔄 [useState] Estado brokers mudou:', {
            length: brokers.length,
            brokers: brokers.map(b => ({ name: b.business_name, email: b.email }))
        });
    }, [brokers]);
    // Função simples para buscar brokers
    const fetchBrokers = async () => {
        try {
            logger_1.logger.info('🔍 [fetchBrokers] Iniciando busca...');
            setLoading(true);
            logger_1.logger.debug('🔍 [fetchBrokers] Service Role URL:', import.meta.env.VITE_SUPABASE_URL);
            logger_1.logger.debug('🔍 [fetchBrokers] Service Role Key existe:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
            // 🎯 TENTATIVA 1: Service Role
            let { data: brokersData, error: brokersError } = await supabaseServiceRole
                .from('brokers')
                .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
                .order('created_at', { ascending: false });
            logger_1.logger.info('📊 [Tentativa 1] Service Role:', { count: brokersData?.length || 0 });
            // 🎯 TENTATIVA 2: Se Service Role falhou, tentar com client normal
            if (!brokersData || brokersData.length < 6) {
                logger_1.logger.info('🔄 [Tentativa 2] Tentando com client normal...');
                const { data: normalData, error: normalError } = await client_1.supabase
                    .from('brokers')
                    .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
                    .order('created_at', { ascending: false });
                logger_1.logger.debug('📊 [Tentativa 2] Client Normal:', { count: normalData?.length || 0 });
                if (normalData && normalData.length > (brokersData?.length || 0)) {
                    brokersData = normalData;
                    brokersError = normalError;
                    logger_1.logger.info('✅ [Tentativa 2] Client normal retornou mais dados!');
                }
            }
            // 🎯 TENTATIVA 3: Query sem ORDER BY  
            if (!brokersData || brokersData.length < 6) {
                logger_1.logger.info('🔄 [Tentativa 3] Tentando sem ORDER BY...');
                const { data: noOrderData, error: noOrderError } = await supabaseServiceRole
                    .from('brokers')
                    .select('id, business_name, email, is_active, plan_type, created_at, website_slug');
                logger_1.logger.debug('📊 [Tentativa 3] Sem ORDER BY:', { count: noOrderData?.length || 0 });
                if (noOrderData && noOrderData.length > (brokersData?.length || 0)) {
                    brokersData = noOrderData;
                    brokersError = noOrderError;
                    logger_1.logger.info('✅ [Tentativa 3] Query sem ORDER BY funcionou!');
                }
            }
            logger_1.logger.debug('📊 [fetchBrokers] Resposta Supabase (Service Role):', {
                count: brokersData?.length || 0,
                error: brokersError?.message || 'sem erro',
                data: brokersData
            });
            if (brokersError)
                throw brokersError;
            // Buscar contagem de propriedades (também com Service Role)      
            const brokersWithCounts = await Promise.all(brokersData.map(async (broker) => {
                const { count } = await supabaseServiceRole
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('broker_id', broker.id);
                return { ...broker, properties_count: count || 0 };
            }));
            logger_1.logger.info('✅ [fetchBrokers] Dados processados:', brokersWithCounts);
            logger_1.logger.debug('🔍 [fetchBrokers] Chamando setBrokers com:', brokersWithCounts.length, 'brokers');
            // Log individual de cada broker
            brokersWithCounts.forEach((broker, i) => {
                logger_1.logger.info(`   ${i + 1}. ${broker.business_name} (${broker.email}) - Status: ${broker.is_active}`);
            });
            setBrokers(brokersWithCounts);
            logger_1.logger.debug('🎯 [fetchBrokers] setBrokers executado com:', brokersWithCounts.length, 'brokers');
            // 🎯 DIAGNÓSTICO DETALHADO
            if (brokersWithCounts.length !== 6) {
                logger_1.logger.error('🚨 [DIAGNÓSTICO] Esperava 6 brokers, mas chegaram:', brokersWithCounts.length);
                logger_1.logger.error('🚨 [DIAGNÓSTICO] Dados que chegaram:', brokersWithCounts);
            }
            else {
                logger_1.logger.info('✅ [DIAGNÓSTICO] Correto! 6 brokers carregados.');
            }
            toast({
                title: "Sucesso",
                description: `${brokersWithCounts.length} imobiliárias carregadas com sucesso!`,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ [fetchBrokers] Erro:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar as imobiliárias.",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    // Função simples para toggle status
    const toggleBrokerStatus = async (brokerId, currentStatus) => {
        try {
            const { error } = await supabaseServiceRole
                .from('brokers')
                .update({
                is_active: !currentStatus,
                updated_at: new Date().toISOString()
            })
                .eq('id', brokerId);
            if (error)
                throw error;
            // Atualizar estado local
            setBrokers(prev => prev.map(broker => broker.id === brokerId
                ? { ...broker, is_active: !currentStatus }
                : broker));
            toast({
                title: "Status atualizado",
                description: `Imobiliária ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
            });
        }
        catch (error) {
            logger_1.logger.error('Error toggling broker status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: "Não foi possível atualizar o status.",
                variant: "destructive",
            });
        }
    };
    // Login
    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha email e senha para fazer login.",
                variant: "destructive",
            });
            return;
        }
        setLoginLoading(true);
        try {
            // Credenciais hardcoded para desenvolvimento (as env vars não funcionam no cliente)
            const validEmail = SUPER_ADMIN_EMAIL || "erickjq123@gmail.com";
            const validPassword = SUPER_ADMIN_PASSWORD || "Danis0133.";
            logger_1.logger.debug('🔑 [Frontend] Tentativa de login:', { loginEmail, validEmail });
            if (loginEmail === validEmail && loginPassword === validPassword) {
                localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, "1");
                setIsAuthorized(true);
                setShowLoginDialog(false);
                setLoginEmail("");
                setLoginPassword("");
                toast({
                    title: "Login realizado",
                    description: "Bem-vindo ao painel Super Admin.",
                });
                fetchBrokers();
            }
            else {
                throw new Error("Credenciais inválidas.");
            }
        }
        catch (error) {
            logger_1.logger.error('Error logging in:', error);
            toast({
                title: "Erro no login",
                description: error instanceof Error ? error.message : "Credenciais inválidas.",
                variant: "destructive",
            });
        }
        finally {
            setLoginLoading(false);
        }
    };
    // Logout
    const handleLogout = () => {
        localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
        toast({
            title: "Logout realizado",
            description: "Você foi desconectado do painel Super Admin.",
        });
        window.location.reload();
    };
    // Verificar auth no mount
    (0, react_1.useEffect)(() => {
        logger_1.logger.debug('🔍 [Frontend] Verificando autenticação...');
        const token = localStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
        logger_1.logger.debug('🔍 [Frontend] Token encontrado:', token);
        if (token === "1") {
            logger_1.logger.info('✅ [Frontend] Token válido, fazendo login...');
            setIsAuthorized(true);
            fetchBrokers();
        }
        else {
            logger_1.logger.warn('❌ [Frontend] Token inválido, mostrando login...');
            setIsAuthorized(false);
            setShowLoginDialog(true);
            setLoading(false);
        }
    }, []);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-muted-foreground", children: "Carregando painel de administra\u00E7\u00E3o..." })] }) }));
    }
    if (!isAuthorized) {
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(card_1.Card, { className: "w-full max-w-md", children: (0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-destructive", children: "Acesso Negado" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Voc\u00EA n\u00E3o tem permiss\u00E3o para acessar esta p\u00E1gina. Apenas super administradores podem acessar o painel de controle." })] }) }) }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: showLoginDialog, onOpenChange: () => { }, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "sm:max-w-md", children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogHeader, { children: (0, jsx_runtime_1.jsx)(dialog_1.DialogTitle, { children: "Acesso Super Admin" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Fa\u00E7a login com suas credenciais de super administrador para acessar o painel." }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "login-email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "login-email", type: "email", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), placeholder: "Digite seu email", onKeyDown: (e) => e.key === 'Enter' && handleLogin() })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "login-password", children: "Senha" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "login-password", type: "password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), placeholder: "Digite sua senha", onKeyDown: (e) => e.key === 'Enter' && handleLogin() })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleLogin, className: "w-full", disabled: loginLoading, children: loginLoading ? "Entrando..." : "Entrar" })] })] }) })] }));
    }
    const totalBrokers = brokers.length;
    const activeBrokers = brokers.filter(b => b.is_active).length;
    const totalProperties = brokers.reduce((sum, broker) => sum + (broker.properties_count || 0), 0);
    // Log do estado atual dos brokers
    logger_1.logger.debug('📊 [Render] Estado atual dos brokers:', {
        totalBrokers,
        activeBrokers,
        brokersArray: brokers.map(b => ({ name: b.business_name, email: b.email, active: b.is_active }))
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-background", children: [(0, jsx_runtime_1.jsxs)(react_helmet_async_1.Helmet, { children: [(0, jsx_runtime_1.jsx)("title", { children: "Super Admin \u2014 Controle de Imobili\u00E1rias" }), (0, jsx_runtime_1.jsx)("meta", { name: "description", content: "Painel do super admin para gerenciar imobili\u00E1rias, acessos e sites." }), (0, jsx_runtime_1.jsx)("link", { rel: "canonical", href: `${window.location.origin}/admin` }), (0, jsx_runtime_1.jsx)("meta", { name: "robots", content: "noindex, nofollow" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "container mx-auto p-3 sm:p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6 sm:mb-8 flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight", children: "Painel Super Admin" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm sm:text-base text-muted-foreground", children: "Gerencie todas as imobili\u00E1rias e seus acessos no sistema" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", onClick: handleLogout, className: "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4 mr-2" }), "Sair"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3 mb-6 sm:mb-8", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Total de Imobili\u00E1rias" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { className: "h-4 w-4 text-muted-foreground" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: totalBrokers }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-muted-foreground", children: [activeBrokers, " ativas de ", totalBrokers, " totais"] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Imobili\u00E1rias Ativas" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-4 w-4 text-muted-foreground" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: activeBrokers }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-muted-foreground", children: [totalBrokers > 0 ? ((activeBrokers / totalBrokers) * 100).toFixed(1) : 0, "% do total"] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium", children: "Total de Im\u00F3veis" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { className: "h-4 w-4 text-muted-foreground" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: totalProperties }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Todos os im\u00F3veis cadastrados" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-4", children: (0, jsx_runtime_1.jsx)("h2", { className: "text-lg sm:text-xl font-semibold", children: "Gerenciar Imobili\u00E1rias" }) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: fetchBrokers, variant: "outline", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Recarregar"] })] }), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "hidden md:block", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-0", children: brokers.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "p-8 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Nenhuma imobili\u00E1ria encontrada." }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", onClick: fetchBrokers, className: "mt-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Recarregar"] })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)(table_1.Table, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHeader, { children: (0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[150px]", children: "Empresa" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[200px]", children: "Email" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[80px]", children: "Status" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[80px]", children: "Plano" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[80px]", children: "Im\u00F3veis" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[60px]", children: "Site" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "min-w-[100px]", children: "Criado em" }), (0, jsx_runtime_1.jsx)(table_1.TableHead, { className: "text-right min-w-[100px]", children: "A\u00E7\u00F5es" })] }) }), (0, jsx_runtime_1.jsx)(table_1.TableBody, { children: brokers.map((broker) => ((0, jsx_runtime_1.jsxs)(table_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[150px]", children: (0, jsx_runtime_1.jsx)("div", { className: "font-medium text-sm", children: broker.business_name }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[200px] text-sm", children: broker.email }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[80px]", children: (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: broker.is_active ? "default" : "secondary", className: "text-xs", children: broker.is_active ? "Ativa" : "Inativa" }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[80px]", children: (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-xs", children: broker.plan_type }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[80px] text-sm", children: broker.properties_count || 0 }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[60px]", children: broker.website_slug && ((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: () => window.open(`/${broker.website_slug}`, '_blank'), className: "h-8 w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "h-3 w-3" }) })) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "min-w-[100px] text-sm", children: (0, date_fns_1.format)(new Date(broker.created_at), "dd/MM/yyyy", { locale: locale_1.ptBR }) }), (0, jsx_runtime_1.jsx)(table_1.TableCell, { className: "text-right min-w-[100px]", children: (0, jsx_runtime_1.jsx)("div", { className: "flex gap-1 justify-end", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: () => toggleBrokerStatus(broker.id, broker.is_active), className: "h-8 w-8 p-0", children: broker.is_active ? ((0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { className: "h-3 w-3" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3 w-3" })) }) }) })] }, broker.id))) })] }) })) }) }), (0, jsx_runtime_1.jsx)("div", { className: "md:hidden space-y-4", children: brokers.length === 0 ? ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-8 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Nenhuma imobili\u00E1ria encontrada." }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", onClick: fetchBrokers, className: "mt-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }), "Recarregar"] })] })) : (brokers.map((broker) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium text-sm truncate", children: broker.business_name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground truncate", children: broker.email })] }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: broker.is_active ? "default" : "secondary", className: "text-xs ml-2", children: broker.is_active ? "Ativa" : "Inativa" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3 pt-1", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Plano" }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-xs mt-1", children: broker.plan_type })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Im\u00F3veis" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: broker.properties_count || 0 })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-end gap-2 pt-2 border-t", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", className: "h-8 px-3 text-xs", onClick: () => toggleBrokerStatus(broker.id, broker.is_active), children: broker.is_active ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { className: "h-3 w-3 mr-1" }), "Desativar"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3 w-3 mr-1" }), "Ativar"] })) }) })] }) }, broker.id)))) })] })] }));
}
