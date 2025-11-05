import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, Globe, Trash2, Plus, Eye, EyeOff, ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Head from 'next/head';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

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
  const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SA_EMAIL as string) || "";
  const SUPER_ADMIN_PASSWORD = (process.env.NEXT_PUBLIC_SA_PASSWORD as string) || "";
  const SUPER_ADMIN_TOKEN_KEY = "sa_auth";
  const { toast } = useToast();
  // Safe origin for Helmet canonical when rendering on server
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // NOTE: Do NOT instantiate a Service Role client in the browser.
  // Server-side endpoints under /api/superadmin/* provide privileged operations.
  
  // Estados simples
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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
  const handleLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do painel Super Admin.",
    });
    window.location.reload();
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
  logger.warn('❌ [Frontend] Token inválido, mostrando login...');
      setIsAuthorized(false);
      setShowLoginDialog(true);
      setLoading(false);
    }
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
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça login com suas credenciais de super administrador para acessar o painel.
              </p>
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Digite seu email"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={loginLoading}
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
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
                    {brokers.map((broker) => (
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
                              onClick={() => window.open(`/${broker.website_slug}`, '_blank')}
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
            brokers.map((broker) => (
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
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SuperAdminPage), { ssr: false });