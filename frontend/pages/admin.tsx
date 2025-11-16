import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, Globe, Trash2, Plus, Eye, EyeOff, ExternalLink, RefreshCw, LogOut, Sparkles, CreditCard, CheckCircle, MessageSquare, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Head from 'next/head';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import AdminUpdatesContent from '@/components/admin/AdminUpdatesContent';

interface BrokerData {
  id: string;
  business_name: string;
  email: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  website_slug?: string;
  properties_count?: number;
}

function SuperAdminPage() {
  const router = useRouter();
  const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SA_EMAIL as string) || "";
  const SUPER_ADMIN_PASSWORD = (process.env.NEXT_PUBLIC_SA_PASSWORD as string) || "";
  const SUPER_ADMIN_TOKEN_KEY = "sa_auth";
  const { toast } = useToast();
  // Safe origin for Helmet canonical when rendering on server
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';
  
  // NOTE: Do NOT instantiate a Service Role client in the browser.
  // Server-side endpoints under /api/superadmin/* provide privileged operations.
  
  // Estados simples
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'brokers' | 'subscriptions' | 'updates' | 'tickets'>('brokers');
  const [loginLoading, setLoginLoading] = useState(false);

  // Debug: Log sempre que brokers mudar
  useEffect(() => {
    logger.debug('🔄 [useState] Estado brokers mudou:', {
      length: brokers.length,
      brokers: brokers.map(b => ({ name: b.business_name, email: b.email }))
    });
  }, [brokers]);

  // Função para buscar brokers via endpoint server-side (não usar Service Role no cliente)
  const fetchBrokers = async () => {
    try {
      setLoading(true);
      logger.info('� [fetchBrokers] Chamando /api/superadmin/brokers');
      const res = await fetch('/api/superadmin/brokers');
      const json = await res.json();
      if (!res.ok) {
        logger.error('❌ [fetchBrokers] API error:', json);
        throw new Error(json?.error || 'Erro ao buscar brokers');
      }

      const brokersWithCounts = json.data || [];
      logger.info('✅ [fetchBrokers] Dados recebidos:', brokersWithCounts.length);
      setBrokers(brokersWithCounts);
      toast({ title: 'Sucesso', description: `${brokersWithCounts.length} imobiliárias carregadas com sucesso!` });
    } catch (error) {
      logger.error('❌ [fetchBrokers] Erro:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as imobiliárias.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Função para toggle status via API server-side
  const toggleBrokerStatus = async (brokerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/superadmin/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerId,
          currentStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao atualizar status');
      }
      
      // Atualizar estado local com o newStatus retornado pela API
      setBrokers(prev => prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, is_active: json.newStatus }
          : broker
      ));

      toast({
        title: "Status atualizado",
        description: `Imobiliária ${json.newStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });

    } catch (error) {
      logger.error('Error toggling broker status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status.",
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
      
      logger.debug('🔑 [Frontend] Tentativa de login:', { loginEmail, validEmail });
      
      if (loginEmail === validEmail && loginPassword === validPassword) {
        // Fazer login REAL no Supabase Auth
        logger.info('🔐 [Frontend] Fazendo login no Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword
        });

        if (authError) {
          logger.error('❌ [Frontend] Erro no login Supabase:', authError);
          throw new Error('Erro ao autenticar no Supabase: ' + authError.message);
        }

        logger.info('✅ [Frontend] Login Supabase bem-sucedido:', authData.user?.id);
        
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
      } else {
        throw new Error("Credenciais inválidas.");
      }
    } catch (error: unknown) {
  logger.error('Error logging in:', error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      // Logout do Supabase Auth
      await supabase.auth.signOut();
      
      // Remover token localStorage
      localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado do painel Super Admin.",
      });
      
      window.location.reload();
    } catch (error) {
      logger.error('Erro no logout:', error);
      // Mesmo com erro, limpar e recarregar
      localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
      window.location.reload();
    }
  };

  // Verificar auth no mount
  useEffect(() => {
  logger.debug('🔍 [Frontend] Verificando autenticação...');
  const token = localStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
  logger.debug('🔍 [Frontend] Token encontrado:', token);
    
    if (token === "1") {
  logger.info('✅ [Frontend] Token válido, fazendo login...');
      setIsAuthorized(true);
      fetchBrokers();
    } else {
  logger.debug('ℹ️ [Frontend] Nenhum token encontrado, exibindo tela de login...');
      setIsAuthorized(false);
      setShowLoginDialog(true);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando painel de administração...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página. Apenas super administradores podem acessar o painel de controle.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Dialog open={showLoginDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Acesso Super Admin</DialogTitle>
              <DialogDescription>
                Faça login com suas credenciais de super administrador para acessar o painel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Digite seu email"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
              <Button 
                type="submit"
                className="w-full"
                disabled={loginLoading}
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.is_active).length;
  const totalProperties = brokers.reduce((sum, broker) => sum + (broker.properties_count || 0), 0);

  // Log do estado atual dos brokers
  logger.debug('📊 [Render] Estado atual dos brokers:', {
    totalBrokers,
    activeBrokers,
    brokersArray: brokers.map(b => ({ name: b.business_name, email: b.email, active: b.is_active }))
  });

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Super Admin — Controle de Imobiliárias</title>
        <meta name="description" content="Painel do super admin para gerenciar imobiliárias, acessos e sites." />
        <link rel="canonical" href={`${origin}/admin`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="container mx-auto p-3 sm:p-6">
        <div className="mb-6 sm:mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel Super Admin</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie todas as imobiliárias e seus acessos no sistema
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBrokers}</div>
              <p className="text-xs text-muted-foreground">
                {activeBrokers} ativas de {totalBrokers} totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBrokers}</div>
              <p className="text-xs text-muted-foreground">
                {totalBrokers > 0 ? ((activeBrokers / totalBrokers) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Imóveis</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                Todos os imóveis cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Navigation Tabs */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('brokers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'brokers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Imobiliárias
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Assinaturas
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'updates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4 inline mr-2" />
              Atualizações
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tickets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Tickets
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'brokers' ? (
          <BrokersTab 
            brokers={brokers}
            loading={loading}
            fetchBrokers={fetchBrokers}
            toggleBrokerStatus={toggleBrokerStatus}
            baseDomain={baseDomain}
          />
        ) : activeTab === 'subscriptions' ? (
          <SubscriptionsTab />
        ) : activeTab === 'updates' ? (
          <UpdatesTab />
        ) : (
          <TicketsTab />
        )}
      </div>
    </div>
  );
}

// Component for Brokers tab
function BrokersTab({ brokers, loading, fetchBrokers, toggleBrokerStatus, baseDomain }: any) {
  return (
    <>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Gerenciar Imobiliárias</h2>
        </div>
        
        <Button onClick={fetchBrokers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      {/* Brokers Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {brokers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma imobiliária encontrada.</p>
              <Button
                variant="outline"
                onClick={fetchBrokers}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Empresa</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Plano</TableHead>
                    <TableHead className="min-w-[80px]">Imóveis</TableHead>
                    <TableHead className="min-w-[60px]">Site</TableHead>
                    <TableHead className="min-w-[100px]">Criado em</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokers.map((broker: any) => (
                    <TableRow key={broker.id}>
                      <TableCell className="min-w-[150px]">
                        <div className="font-medium text-sm">{broker.business_name}</div>
                      </TableCell>
                      <TableCell className="min-w-[200px] text-sm">{broker.email}</TableCell>
                      <TableCell className="min-w-[80px]">
                        <Badge variant={broker.is_active ? "default" : "secondary"} className="text-xs">
                          {broker.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <Badge variant="outline" className="text-xs">{broker.plan_type}</Badge>
                      </TableCell>
                      <TableCell className="min-w-[80px] text-sm">
                        {broker.properties_count || 0}
                      </TableCell>
                      <TableCell className="min-w-[60px]">
                        {broker.website_slug && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://${broker.website_slug}.${baseDomain}`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                      </TableCell>
                      <TableCell className="min-w-[100px] text-sm">
                        {format(new Date(broker.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBrokerStatus(broker.id, broker.is_active)}
                            className="h-8 w-8 p-0"
                          >
                            {broker.is_active ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brokers Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {brokers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma imobiliária encontrada.</p>
            <Button
              variant="outline"
              onClick={fetchBrokers}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </Card>
        ) : (
          brokers.map((broker: any) => (
            <Card key={broker.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{broker.business_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{broker.email}</p>
                  </div>
                  <Badge variant={broker.is_active ? "default" : "secondary"} className="text-xs ml-2">
                    {broker.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {broker.plan_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Imóveis</p>
                    <p className="text-sm font-medium">{broker.properties_count || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => toggleBrokerStatus(broker.id, broker.is_active)}
                  >
                    {broker.is_active ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

// Component for Subscriptions tab
function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'x-admin-auth': 'admin-access', // Token básico de autenticação
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível carregar assinaturas.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar assinaturas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const renewSubscription = async (brokerId: string, days = 30) => {
    try {
      const response = await fetch('/api/admin/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId, days }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Assinatura renovada por ${days} dias.`,
        });
        loadSubscriptions();
        setShowRenewDialog(false);
      } else {
        throw new Error('Erro ao renovar assinatura');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível renovar a assinatura.',
        variant: 'destructive',
      });
    }
  };

  const cancelSubscription = async (brokerId: string) => {
    try {
      const response = await fetch('/api/admin/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Assinatura cancelada. Site desativado.',
        });
        loadSubscriptions();
        setShowCancelDialog(false);
      } else {
        throw new Error('Erro ao cancelar assinatura');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a assinatura.',
        variant: 'destructive',
      });
    }
  };

  const updatePaymentInfo = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/admin/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          pixKey: pixKey.trim(),
          qrCodeUrl: qrCodeUrl.trim(),
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Informações de pagamento atualizadas.',
        });
        loadSubscriptions();
        setSelectedSubscription(null);
        setPixKey('');
        setQrCodeUrl('');
        setNotes('');
      } else {
        throw new Error('Erro ao atualizar informações');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as informações.',
        variant: 'destructive',
      });
    }
  };

  const sendAdminMessage = async () => {
    if (!selectedSubscription || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/admin/subscriptions/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: selectedSubscription.broker_id,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Mensagem enviada ao cliente.',
        });
        setNewMessage('');
        setShowCommunicationDialog(false);
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'trial': return 'default';
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Gestão de Assinaturas</h2>
        </div>
        
        <Button onClick={loadSubscriptions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      {/* Subscriptions Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma assinatura encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.business_name}</div>
                        <div className="text-sm text-muted-foreground">{sub.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(sub.status)}>
                          {sub.status_label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${
                          sub.days_remaining <= 3 ? 'text-red-500' : 
                          sub.days_remaining <= 7 ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {sub.days_remaining} dias
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sub.plan_type === 'trial' ? 'Teste' : 'Mensal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end ? 
                          new Date(sub.current_period_end).toLocaleDateString('pt-BR') : '-'
                        }
                      </TableCell>
                      <TableCell>
                        R$ {(sub.monthly_price_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setPixKey(sub.pix_key || '');
                              setQrCodeUrl(sub.pix_qr_code_image_url || '');
                              setNotes(sub.notes || '');
                            }}
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowRenewDialog(true);
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowCommunicationDialog(true);
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowCancelDialog(true);
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {subscriptions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma assinatura encontrada.</p>
          </Card>
        ) : (
          subscriptions.map((sub: any) => (
            <Card key={sub.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{sub.business_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(sub.status)} className="text-xs ml-2">
                    {sub.status_label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Dias restantes</p>
                    <p className={`text-sm font-bold ${
                      sub.days_remaining <= 3 ? 'text-red-500' : 
                      sub.days_remaining <= 7 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {sub.days_remaining} dias
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-medium">R$ {(sub.monthly_price_cents / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setShowRenewDialog(true);
                    }}
                  >
                    Renovar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setShowCommunicationDialog(true);
                    }}
                  >
                    Mensagem
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Payment Info Dialog */}
      {selectedSubscription && !showRenewDialog && !showCancelDialog && !showCommunicationDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedSubscription(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Pagamento PIX</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pix-key">Chave PIX</Label>
                <Input
                  id="pix-key"
                  placeholder="CPF, email, telefone..."
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="qr-code">URL da Imagem QR Code</Label>
                <Input
                  id="qr-code"
                  placeholder="https://..."
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas internas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={() => updatePaymentInfo(selectedSubscription.id)}
                className="w-full"
              >
                Salvar Informações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Renew Subscription Dialog */}
      {showRenewDialog && selectedSubscription && (
        <AlertDialog open={true} onOpenChange={setShowRenewDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Renovar Assinatura</AlertDialogTitle>
              <AlertDialogDescription>
                Renovar assinatura de {selectedSubscription.business_name} por mais 30 dias?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowRenewDialog(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => renewSubscription(selectedSubscription.broker_id)}
              >
                Renovar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && selectedSubscription && (
        <AlertDialog open={true} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
              <AlertDialogDescription>
                Cancelar assinatura de {selectedSubscription.business_name}? 
                Esta ação desativará o site público da imobiliária.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => cancelSubscription(selectedSubscription.broker_id)}
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Communication Dialog */}
      {showCommunicationDialog && selectedSubscription && (
        <Dialog open={true} onOpenChange={setShowCommunicationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Mensagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para: {selectedSubscription.business_name}
              </p>
              
              <div>
                <Label htmlFor="admin-message">Mensagem</Label>
                <Textarea
                  id="admin-message"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowCommunicationDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={sendAdminMessage}
                  className="flex-1"
                  disabled={!newMessage.trim()}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Component for Updates tab
function UpdatesTab() {
  return <AdminUpdatesContent />;
}

// Component for Tickets tab  
// Função para extrair nome amigável do arquivo a partir da URL
const getFileDisplayName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || 'arquivo';
    
    const extensionMap: { [key: string]: string } = {
      'jpg': 'comprovante.jpg',
      'jpeg': 'comprovante.jpg',
      'png': 'comprovante.png',
      'pdf': 'documento.pdf',
      'doc': 'documento.doc',
      'docx': 'documento.docx',
    };
    
    return extensionMap[extension] || `anexo.${extension}`;
  } catch {
    return 'arquivo-anexo';
  }
};

// Função para processar mensagem e extrair anexos
const formatMessageWithAttachment = (message: string): { text: string; attachmentUrl?: string; fileName?: string; fileType?: 'image' | 'pdf' | 'other' } => {
  const attachmentRegex = /📎\s*Anexo:\s*(https?:\/\/[^\s]+)/i;
  const match = message.match(attachmentRegex);
  
  if (match) {
    const url = match[1];
    const fileName = getFileDisplayName(url);
    const textWithoutUrl = message.replace(attachmentRegex, '').trim();
    
    // Determinar tipo de arquivo
    const extension = url.split('.').pop()?.toLowerCase() || '';
    let fileType: 'image' | 'pdf' | 'other' = 'other';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      fileType = 'image';
    } else if (extension === 'pdf') {
      fileType = 'pdf';
    }
    
    return {
      text: textWithoutUrl,
      attachmentUrl: url,
      fileName,
      fileType
    };
  }
  
  return { text: message };
};

function TicketsTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const { toast } = useToast();

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tickets', {
        headers: {
          'x-admin-auth': 'admin-access',
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setTickets(data.tickets || []);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível carregar tickets.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tickets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const markAsRead = async (ticketId: string) => {
    try {
      const response = await fetch('/api/admin/tickets/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'admin-access',
        },
        body: JSON.stringify({ ticketId }),
      });

      if (response.ok) {
        loadTickets();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const response = await fetch('/api/admin/tickets/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'admin-access',
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyMessage,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Resposta enviada com sucesso!',
        });
        setReplyMessage('');
        setSelectedTicket(null);
        loadTickets();
      } else {
        throw new Error('Erro ao enviar resposta');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a resposta.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Carregando tickets...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte - Pagamentos</CardTitle>
          <CardDescription>
            Mensagens de imobiliárias sobre pagamentos e comprovantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum ticket recebido
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket: any) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer transition-colors ${
                    !ticket.is_read ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    if (!ticket.is_read) {
                      markAsRead(ticket.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{ticket.broker_name}</p>
                        <p className="text-sm text-muted-foreground">{ticket.broker_email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={ticket.is_read ? 'secondary' : 'default'}>
                          {ticket.is_read ? 'Lido' : 'Novo'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ticket.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {ticket.subject && (
                      <p className="font-medium text-sm mb-1">{ticket.subject}</p>
                    )}
                    <p className="text-sm line-clamp-2">{ticket.message}</p>
                    {ticket.priority === 'high' && (
                      <Badge variant="destructive" className="mt-2">Alta Prioridade</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de resposta */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>De:</Label>
                <p className="text-sm">{selectedTicket.broker_name} ({selectedTicket.broker_email})</p>
              </div>
              <div>
                <Label>Mensagem:</Label>
                <div className="bg-muted p-3 rounded-lg mt-1">
                  {(() => {
                    const { text, attachmentUrl, fileName, fileType } = formatMessageWithAttachment(selectedTicket.message);
                    return (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{text}</p>
                        {attachmentUrl && (
                          <div className="mt-4 border-t pt-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">📎 Anexo: {fileName}</p>
                            {fileType === 'image' && (
                              <div className="mt-2">
                                <img 
                                  src={attachmentUrl} 
                                  alt={fileName}
                                  className="max-w-full h-auto rounded-lg border shadow-sm"
                                  style={{ maxHeight: '400px' }}
                                />
                              </div>
                            )}
                            {fileType === 'pdf' && (
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(attachmentUrl, '_blank')}
                                  className="w-full"
                                >
                                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  Visualizar PDF
                                </Button>
                                <iframe
                                  src={attachmentUrl}
                                  className="w-full mt-3 rounded-lg border"
                                  style={{ height: '500px' }}
                                  title={fileName}
                                />
                              </div>
                            )}
                            {fileType === 'other' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(attachmentUrl, '_blank')}
                              >
                                Baixar arquivo
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div>
                <Label htmlFor="reply">Responder:</Label>
                <Textarea
                  id="reply"
                  placeholder="Digite sua resposta..."
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Fechar
                </Button>
                <Button onClick={sendReply} disabled={!replyMessage.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Resposta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default dynamic(() => Promise.resolve(SuperAdminPage), { ssr: false });