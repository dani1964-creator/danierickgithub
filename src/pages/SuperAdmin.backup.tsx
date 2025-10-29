import { useState, useEffect } from "react";
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
import { Helmet } from 'react-helmet-async';

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

export default function SuperAdminPage() {
  const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SA_EMAIL || "";
  const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SA_PASSWORD || "";
  const SUPER_ADMIN_TOKEN_KEY = "sa_auth";
  const { toast } = useToast();
  
  // ✅ ESTADO SIMPLES - SEM HOOKS COMPLEXOS
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ✅ FUNÇÃO SIMPLES PARA BUSCAR BROKERS
  const fetchBrokers = async () => {
    try {
      setLoading(true);
      
      // Buscar brokers
      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
        .order('created_at', { ascending: false });

      if (brokersError) throw brokersError;

      // Buscar contagem de propriedades para cada broker
      const brokersWithCounts = await Promise.all(
        brokersData.map(async (broker) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('broker_id', broker.id);

          return { ...broker, properties_count: count || 0 };
        })
      );

      setBrokers(brokersWithCounts);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as imobiliárias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

    // Check internal Super Admin token on mount and setup realtime
  useEffect(() => {
    const token = localStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
    if (token === "1") {
      setIsAuthorized(true);
      // ✅ Dados carregados automaticamente pelo hook otimizado
      
      // ✅ Setup realtime subscription para mudanças específicas (com debounce)
      let refreshTimeout: NodeJS.Timeout;
      const debouncedRefresh = () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          refreshBrokers();
        }, 2500); // 2.5 segundo debounce para evitar loops
      };
      
      // Setup realtime subscription para eventos específicos
      const channel = supabase
        .channel('admin-brokers-changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'brokers' 
          }, 
          debouncedRefresh
        )
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'brokers' 
          }, 
          debouncedRefresh
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'brokers' 
          }, 
          debouncedRefresh
        )
        .subscribe();

      return () => {
        clearTimeout(refreshTimeout);
        supabase.removeChannel(channel);
      };
    } else {
      setIsAuthorized(false);
      setShowLoginDialog(true);
    }
  }, []); // Array vazio para executar apenas no mount

  const toggleBrokerStatus = async (brokerId: string, currentStatus: boolean) => {
    try {
      // ✅ FAZER UPDATE NO BANCO PRIMEIRO
      const { error } = await supabase
        .from('brokers')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', brokerId);
      
      if (error) throw error;
      
      // ✅ ATUALIZAR ESTADOS LOCAIS SEM REFRESH COMPLETO
      setBrokersWithCounts(prev => prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, is_active: !currentStatus }
          : broker
      ));

      toast({
        title: "Status atualizado",
        description: `Imobiliária ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });

    } catch (error) {
      console.error('Error toggling broker status:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar status",
        description: `Não foi possível atualizar o status: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const deleteBroker = async (brokerId: string) => {
    try {
      // ✅ USAR DELETE DIRETO - mais confiável que Edge Function
      // Primeiro deletar dados relacionados
      const deleteOps = [
        supabase.from('properties').delete().eq('broker_id', brokerId),
        supabase.from('realtors').delete().eq('broker_id', brokerId),
        supabase.from('leads').delete().eq('broker_id', brokerId),
        supabase.from('social_links').delete().eq('broker_id', brokerId),
      ];

      for (const op of deleteOps) {
        const { error } = await op;
        if (error) console.warn('Error deleting related data:', error);
      }

      // Deletar o broker
      const { data, error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', brokerId)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Imobiliária excluída",
        description: "A imobiliária foi removida com sucesso.",
      });
      
      // ✅ REFRESH MANUAL - sem realtime não atualiza automaticamente
      console.log('🔍 SuperAdmin DEBUG: Delete realizado, fazendo refresh manual...');
      await refreshBrokers();
    } catch (error) {
      console.error('Error deleting broker:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir a imobiliária: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const createNewBroker = async () => {
    if (!newBrokerEmail || !newBrokerPassword || !newBrokerBusinessName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar uma nova imobiliária.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newBrokerEmail,
        password: newBrokerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            business_name: newBrokerBusinessName
          }
        }
      });

      if (authError) throw authError;

      toast({
        title: "Imobiliária criada",
        description: "Nova imobiliária foi criada com sucesso.",
      });

      setNewBrokerEmail("");
      setNewBrokerPassword("");
      setNewBrokerBusinessName("");
      setShowCreateDialog(false);
      // ✅ REFRESH MANUAL - sem realtime não atualiza automaticamente
      console.log('🔍 SuperAdmin DEBUG: Broker criado, fazendo refresh manual...');
      await refreshBrokers();
    } catch (error) {
      console.error('Error creating broker:', error);
      toast({
        title: "Erro ao criar imobiliária",
        description: "Não foi possível criar a nova imobiliária.",
        variant: "destructive",
      });
    }
  };

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
      if (loginEmail === SUPER_ADMIN_EMAIL && loginPassword === SUPER_ADMIN_PASSWORD) {
        localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, "1");
        setIsAuthorized(true);
        setShowLoginDialog(false);
        setLoginEmail("");
        setLoginPassword("");
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao painel Super Admin.",
        });
        console.log('🔍 SuperAdmin DEBUG: Login realizado, dados carregados pelo hook otimizado automaticamente');
        // refreshBrokers() removido - hook otimizado já carrega os dados após setIsAuthorized(true)
      } else {
        throw new Error("Credenciais inválidas.");
      }
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas ou sem permissão.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do painel Super Admin.",
    });
    // Recarregar a página para limpar o estado
    window.location.reload();
  };

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

  // ✅ TRATAMENTO DE ERRO
  if (brokersError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Erro ao Carregar Dados</CardTitle>
            <CardDescription>
              Ocorreu um erro ao carregar as imobiliárias: {typeof brokersError === 'string' ? brokersError : 'Erro desconhecido'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={refreshBrokers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página. Apenas super administradores podem acessar o painel de controle.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Dialog */}
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
                  placeholder="erickjq123@gmail.com"
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
      </div>
    );
  }

  // ✅ DADOS PARA RENDERIZAÇÃO - SEMPRE usar brokers como base
  const dataToRender = brokers || [];
  const totalBrokers = totalCount || brokers?.length || 0;
  const activeBrokers = dataToRender.filter(b => b.is_active).length;
  // ✅ AGREGAÇÃO REAL: Usar brokersWithCounts se disponível, senão broker base
  const brokersForStats = brokersWithCounts.length > 0 ? brokersWithCounts : dataToRender;
  const totalProperties = brokersForStats.reduce((sum, broker) => {
    return sum + (broker.properties_count || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Super Admin — Controle de Imobiliárias</title>
        <meta name="description" content="Painel do super admin para gerenciar imobiliárias, acessos e sites." />
        <link rel="canonical" href={`${window.location.origin}/admin`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
                {((activeBrokers / totalBrokers) * 100).toFixed(1)}% do total
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
            {totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({totalBrokers} total)
              </span>
            )}
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova Imobiliária
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Imobiliária</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Nome da Empresa</Label>
                  <Input
                    id="business-name"
                    value={newBrokerBusinessName}
                    onChange={(e) => setNewBrokerBusinessName(e.target.value)}
                    placeholder="Nome da imobiliária"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newBrokerEmail}
                    onChange={(e) => setNewBrokerEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newBrokerPassword}
                    onChange={(e) => setNewBrokerPassword(e.target.value)}
                    placeholder="Senha forte"
                  />
                </div>
                <Button onClick={createNewBroker} className="w-full">
                  Criar Imobiliária
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Brokers Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            {dataToRender.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  {loading ? 'Carregando imobiliárias...' : 'Nenhuma imobiliária encontrada.'}
                </p>
                {!loading && (
                  <Button
                    variant="outline"
                    onClick={refreshBrokers}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar
                  </Button>
                )}
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
                    {dataToRender.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="min-w-[150px]">
                        <div>
                          <div className="font-medium text-sm">{broker.business_name}</div>
                          <div className="text-xs text-muted-foreground">{broker.display_name}</div>
                        </div>
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
                        {brokersWithCounts.find(b => b.id === broker.id)?.properties_count || 0}
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
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Imobiliária</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{broker.business_name}"? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteBroker(broker.id)}
                                  className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
          {dataToRender.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {loading ? 'Carregando imobiliárias...' : 'Nenhuma imobiliária encontrada.'}
              </p>
              {!loading && (
                <Button
                  variant="outline"
                  onClick={refreshBrokers}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              )}
            </Card>
          ) : (
            dataToRender.map((broker) => (
            <Card key={broker.id} className="p-4">
              <div className="space-y-3">
                {/* Header with company name and status */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{broker.business_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{broker.display_name}</p>
                  </div>
                  <Badge variant={broker.is_active ? "default" : "secondary"} className="text-xs ml-2">
                    {broker.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>

                {/* Email */}
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm break-all">{broker.email}</p>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {broker.plan_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Imóveis</p>
                    <p className="text-sm font-medium">
                      {brokersWithCounts.find(b => b.id === broker.id)?.properties_count || 0}
                    </p>
                  </div>
                </div>

                {/* Date and site */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-xs">{format(new Date(broker.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Site</p>
                    {broker.website_slug ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open(`/${broker.website_slug}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver site
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="mx-2 w-[calc(100vw-1rem)] max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Imobiliária</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{broker.business_name}"? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteBroker(broker.id)}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
        
        {/* ✅ PAGINAÇÃO OTIMIZADA */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-card rounded-lg p-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalBrokers)} de {totalBrokers} imobiliárias
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadPrevPage}
                disabled={!hasPrevPage || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <span className="text-sm px-3 py-1 bg-primary/10 rounded">
                {currentPage} / {totalPages}
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadNextPage}
                disabled={!hasNextPage || loading}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshBrokers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}