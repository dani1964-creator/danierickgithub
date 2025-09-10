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
import { Building2, Users, Globe, Trash2, Plus, Eye, EyeOff, ExternalLink, Settings, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from 'react-helmet-async';

interface BrokerData {
  id: string;
  user_id: string;
  business_name: string;
  display_name: string;
  email: string;
  website_slug: string;
  phone: string;
  whatsapp_number: string;
  contact_email: string;
  is_active: boolean;
  plan_type: string;
  max_properties: number;
  created_at: string;
  updated_at: string;
  properties_count: number;
  custom_domain?: string;
}

export default function SuperAdminPage() {
  // Internal Super Admin credentials (frontend-only)
  const SUPER_ADMIN_EMAIL = "erickjq123@gmail.com";
  const SUPER_ADMIN_PASSWORD = "Danis0133";
  const SUPER_ADMIN_TOKEN_KEY = "sa_auth";
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newBrokerEmail, setNewBrokerEmail] = useState("");
  const [newBrokerPassword, setNewBrokerPassword] = useState("");
  const [newBrokerBusinessName, setNewBrokerBusinessName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Check internal Super Admin token on mount and setup realtime
  useEffect(() => {
    const token = localStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
    if (token === "1") {
      setIsAuthorized(true);
      fetchBrokers();
      
      // Setup realtime subscription for broker changes
      const channel = supabase
        .channel('admin-brokers-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'brokers' 
          }, 
          () => {
            console.log('Broker data changed, refreshing...');
            fetchBrokers();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'properties' 
          }, 
          () => {
            console.log('Properties data changed, refreshing...');
            fetchBrokers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsAuthorized(false);
      setShowLoginDialog(true);
      setLoading(false);
    }
  }, []);

  const fetchBrokers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-brokers', {
        body: {
          action: 'list',
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD
        }
      });
      
      if (error) throw error;
      setBrokers(data?.brokers || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Erro ao carregar imobiliárias",
        description: "Não foi possível carregar a lista de imobiliárias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBrokerStatus = async (brokerId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-brokers', {
        body: {
          action: 'toggle',
          brokerId,
          newStatus: !currentStatus,
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: `Imobiliária ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });
      
      fetchBrokers();
    } catch (error) {
      console.error('Error toggling broker status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da imobiliária.",
        variant: "destructive",
      });
    }
  };

  const deleteBroker = async (brokerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-brokers', {
        body: {
          action: 'delete',
          brokerId,
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Imobiliária excluída",
        description: "A imobiliária foi removida com sucesso.",
      });
      
      fetchBrokers();
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a imobiliária.",
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
      fetchBrokers();
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
        setLoading(true);
        await fetchBrokers();
      } else {
        throw new Error("Credenciais inválidas.");
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas ou sem permissão.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
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

  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.is_active).length;
  const totalProperties = brokers.reduce((sum, b) => sum + b.properties_count, 0);

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
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
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
          <h2 className="text-lg sm:text-xl font-semibold">Gerenciar Imobiliárias</h2>
          
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
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-sm font-medium">📋 Importante - Configuração de Domínio</Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Após criar a imobiliária, o usuário deve:
                  </p>
                  <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                    <li>Fazer login em <strong>{newBrokerEmail}</strong></li>
                    <li>Ir em Configurações → Geral</li>
                    <li>Configurar o domínio personalizado (ex: minhasite.com)</li>
                    <li>Seguir as instruções de DNS na Vercel</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    ⚠️ Cada imobiliária terá acesso exclusivo ao seu domínio personalizado
                  </p>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Empresa</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Plano</TableHead>
                    <TableHead className="min-w-[80px]">Imóveis</TableHead>
                    <TableHead className="min-w-[150px]">Domínio</TableHead>
                    <TableHead className="min-w-[60px]">Site</TableHead>
                    <TableHead className="min-w-[100px]">Criado em</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokers.map((broker) => (
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
                      <TableCell className="min-w-[80px] text-sm">{broker.properties_count}</TableCell>
                      <TableCell className="min-w-[150px]">
                        {broker.custom_domain ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-primary" />
                            <span className="text-xs font-mono">{broker.custom_domain}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não configurado</span>
                        )}
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
          </CardContent>
        </Card>

        {/* Brokers Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {brokers.map((broker) => (
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
                    <p className="text-sm font-medium">{broker.properties_count}</p>
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
          ))}
        </div>
      </div>
    </div>
  );
}