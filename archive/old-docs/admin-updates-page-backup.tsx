import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';

// Tipos temporários até aplicar SQL
type UpdateType = 'feature' | 'improvement' | 'bugfix' | 'announcement';
type SuggestionCategory = 'feature' | 'improvement' | 'bugfix' | 'ux' | 'performance' | 'other';
type SuggestionStatus = 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';

interface AppUpdate {
  id: string;
  title: string;
  content: string;
  update_type: UpdateType;
  icon?: string;
  is_published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  priority?: string;
  votes_count: number;
  broker_id: string;
  broker_name?: string;
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  user_has_voted?: boolean;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  Bug, 
  Megaphone, 
  TrendingUp, 
  ThumbsUp, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const AdminUpdatesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdate | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<ImprovementSuggestion | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Form state para updates
  const [updateForm, setUpdateForm] = useState({
    title: '',
    content: '',
    update_type: 'feature' as UpdateType,
    is_published: false
  });

  // Form state para review de sugestões
  const [suggestionReview, setSuggestionReview] = useState({
    status: 'pending' as SuggestionStatus,
    priority: 'medium' as const,
    admin_notes: ''
  });

  // Funções de carregamento
  const loadUpdates = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('app_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao carregar atualizações:', error);
      return;
    }

    setUpdates(data || []);
  }, []);

  const loadSuggestions = useCallback(async () => {
    const { data, error } = await (supabase as any).rpc('get_suggestions_with_user_votes');

    if (error) {
      logger.error('Erro ao carregar sugestões:', error);
      return;
    }

    setSuggestions(data || []);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadUpdates(), loadSuggestions()]);
    } catch (error) {
      logger.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [loadUpdates, loadSuggestions, toast]);

  useEffect(() => {
    // Verificar se é super admin
    const checkAdmin = async () => {
      // OPÇÃO 1: Token localStorage (super admin puro, não é broker)
      const superAdminToken = typeof window !== 'undefined' 
        ? localStorage.getItem('sa_auth') 
        : null;

      if (superAdminToken === '1') {
        logger.info('✅ [AUTH] Super admin via localStorage token');
        setIsSuperAdmin(true);
        loadData();
        return;
      }

      // OPÇÃO 2: Usuário autenticado via Supabase Auth que também é broker super admin
      if (user?.id) {
        logger.info('🔍 [AUTH] Verificando user.id na tabela brokers...');
        const { data, error } = await (supabase as any)
          .from('brokers')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data?.is_super_admin) {
          logger.info('✅ [AUTH] Broker super admin encontrado');
          setIsSuperAdmin(true);
          loadData();
          return;
        }
      }

      // Se chegou aqui, não é super admin
      logger.warn('❌ [AUTH] Não autorizado, redirecionando...');
      router.push('/admin');
    };
    checkAdmin();
  }, [user, router, loadData]);

  const handleSubmitUpdate = async () => {
    // Usar user.id direto (agora temos sessão Auth real)
    const createdBy = user?.id;
    
    logger.info('🔍 [UPDATE] Iniciando criação/edição...', { 
      hasUserId: !!user?.id,
      userId: user?.id
    });
    
    if (!createdBy) {
      logger.error('❌ [UPDATE] Sem user.id - faça login novamente');
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente em /admin',
        variant: 'destructive'
      });
      router.push('/admin');
      return;
    }
    
    if (!updateForm.title.trim() || !updateForm.content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e conteúdo',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      logger.info('💾 Salvando atualização...', { 
        createdBy, 
        isEdit: !!editingUpdate,
        title: updateForm.title 
      });

      if (editingUpdate) {
        // Atualizar
        const { error } = await (supabase as any)
          .from('app_updates')
          .update({
            title: updateForm.title.trim(),
            content: updateForm.content.trim(),
            update_type: updateForm.update_type,
            is_published: updateForm.is_published
          })
          .eq('id', editingUpdate.id);

        if (error) {
          logger.error('❌ Erro ao atualizar:', error);
          throw error;
        }

        toast({
          title: 'Atualização editada!',
          description: 'A atualização foi editada com sucesso'
        });
      } else {
        // Criar nova - preparar dados
        const insertData: any = {
          title: updateForm.title.trim(),
          content: updateForm.content.trim(),
          update_type: updateForm.update_type,
          is_published: updateForm.is_published
        };

        // Adicionar created_by apenas se existir
        if (createdBy) {
          insertData.created_by = createdBy;
          logger.info('📝 Incluindo created_by:', createdBy);
        } else {
          logger.warn('📝 Criando sem created_by (campo é nullable)');
        }

        const { error, data } = await (supabase as any)
          .from('app_updates')
          .insert(insertData)
          .select();

        if (error) {
          logger.error('❌ Erro ao criar atualização:', error);
          toast({
            title: 'Erro ao criar',
            description: `${error.message || 'Erro desconhecido'}`,
            variant: 'destructive'
          });
          throw error;
        }

        logger.info('✅ Atualização criada:', data);

        toast({
          title: 'Atualização criada!',
          description: 'A atualização foi criada com sucesso'
        });
      }

      setUpdateForm({ title: '', content: '', update_type: 'feature', is_published: false });
      setEditingUpdate(null);
      setIsUpdateDialogOpen(false);
      loadUpdates();
    } catch (error) {
      logger.error('Erro ao salvar atualização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar atualização',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta atualização?')) return;

    try {
      const { error } = await (supabase as any)
        .from('app_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Atualização excluída',
        description: 'A atualização foi excluída com sucesso'
      });

      loadUpdates();
    } catch (error) {
      logger.error('Erro ao excluir atualização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir atualização',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePublish = async (update: AppUpdate) => {
    try {
      const { error } = await (supabase as any)
        .from('app_updates')
        .update({ is_published: !update.is_published })
        .eq('id', update.id);

      if (error) throw error;

      toast({
        title: update.is_published ? 'Atualização despublicada' : 'Atualização publicada',
        description: update.is_published 
          ? 'A atualização não está mais visível para os corretores'
          : 'A atualização agora está visível para os corretores'
      });

      loadUpdates();
    } catch (error) {
      logger.error('Erro ao alterar status de publicação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status de publicação',
        variant: 'destructive'
      });
    }
  };

  const handleReviewSuggestion = async () => {
    if (!editingSuggestion) return;

    // Buscar reviewed_by (pode ser user.id ou primeiro super admin)
    let reviewedBy = user?.id;
    
    if (!reviewedBy) {
      const { data: superAdminBroker } = await (supabase as any)
        .from('brokers')
        .select('user_id')
        .eq('is_super_admin', true)
        .limit(1)
        .single();
      
      reviewedBy = superAdminBroker?.user_id;
    }

    try {
      setSubmitting(true);

      const { error } = await (supabase as any)
        .from('improvement_suggestions')
        .update({
          status: suggestionReview.status,
          priority: suggestionReview.priority,
          admin_notes: suggestionReview.admin_notes.trim() || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy
        })
        .eq('id', editingSuggestion.id);

      if (error) throw error;

      toast({
        title: 'Sugestão atualizada',
        description: 'O status da sugestão foi atualizado'
      });

      setSuggestionReview({ status: 'pending', priority: 'medium', admin_notes: '' });
      setEditingSuggestion(null);
      setIsSuggestionDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      logger.error('Erro ao revisar sugestão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao revisar sugestão',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditUpdate = (update: AppUpdate) => {
    setEditingUpdate(update);
    setUpdateForm({
      title: update.title,
      content: update.content,
      update_type: update.update_type,
      is_published: update.is_published
    });
    setIsUpdateDialogOpen(true);
  };

  const openReviewSuggestion = (suggestion: ImprovementSuggestion) => {
    setEditingSuggestion(suggestion);
    setSuggestionReview({
      status: suggestion.status,
      priority: (suggestion.priority || 'medium') as any,
      admin_notes: suggestion.admin_notes || ''
    });
    setIsSuggestionDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Atualizações</h1>
        <p className="text-muted-foreground">
          Publique novidades e gerencie sugestões dos corretores
        </p>
      </div>

      <Tabs defaultValue="updates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="updates">
            <Sparkles className="h-4 w-4 mr-2" />
            Minhas Atualizações
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Sugestões Recebidas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerenciar Atualizações */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
              setIsUpdateDialogOpen(open);
              if (!open) {
                setEditingUpdate(null);
                setUpdateForm({ title: '', content: '', update_type: 'feature', is_published: false });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atualização
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingUpdate ? 'Editar Atualização' : 'Nova Atualização'}
                  </DialogTitle>
                  <DialogDescription>
                    Publique novidades, melhorias e avisos para os corretores
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-title">Título *</Label>
                    <Input
                      id="update-title"
                      placeholder="Ex: Nova funcionalidade de relatórios"
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-type">Tipo</Label>
                    <Select
                      value={updateForm.update_type}
                      onValueChange={(value: any) => setUpdateForm({ ...updateForm, update_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                        <SelectItem value="improvement">Melhoria</SelectItem>
                        <SelectItem value="bugfix">Correção de Bug</SelectItem>
                        <SelectItem value="announcement">Anúncio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-content">Conteúdo *</Label>
                    <Textarea
                      id="update-content"
                      placeholder="Descreva a atualização em detalhes..."
                      rows={8}
                      value={updateForm.content}
                      onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-published"
                      checked={updateForm.is_published}
                      onCheckedChange={(checked) => setUpdateForm({ ...updateForm, is_published: checked })}
                    />
                    <Label htmlFor="is-published" className="cursor-pointer">
                      Publicar imediatamente
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitUpdate} disabled={submitting}>
                    {submitting ? 'Salvando...' : (editingUpdate ? 'Salvar' : 'Criar')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma atualização criada ainda
              </CardContent>
            </Card>
          ) : (
            updates.map((update) => (
              <Card key={update.id} className={`overflow-hidden ${!update.is_published ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {update.update_type === 'feature' ? 'Novidade' : 
                         update.update_type === 'improvement' ? 'Melhoria' : 
                         update.update_type === 'bugfix' ? 'Correção' : 
                         update.update_type === 'announcement' ? 'Anúncio' : 
                         update.update_type}
                      </Badge>
                      {update.is_published ? (
                        <Badge className="gap-1">
                          <Eye className="h-3 w-3" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(update)}
                      >
                        {update.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditUpdate(update)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{update.title}</CardTitle>
                  <CardDescription>
                    {new Date(update.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{update.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab: Gerenciar Sugestões */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suggestions.filter(s => s.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suggestions.filter(s => s.status === 'under_review').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Planejadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suggestions.filter(s => ['planned', 'in_progress'].includes(s.status)).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {suggestions.filter(s => s.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma sugestão recebida ainda
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Votos */}
                    <div className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ThumbsUp className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xl font-bold">{suggestion.votes_count}</span>
                      <span className="text-xs text-muted-foreground">votos</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{suggestion.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {suggestion.category === 'feature' ? 'Novidade' : 
                               suggestion.category === 'improvement' ? 'Melhoria' : 
                               suggestion.category === 'bugfix' ? 'Correção' : 
                               suggestion.category === 'ux' ? 'UX' : 
                               suggestion.category === 'performance' ? 'Performance' : 
                               'Outro'}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              {getStatusIcon(suggestion.status)}
                              {suggestion.status === 'pending' ? 'Pendente' :
                               suggestion.status === 'under_review' ? 'Em Análise' :
                               suggestion.status === 'planned' ? 'Planejado' :
                               suggestion.status === 'in_progress' ? 'Em Desenvolvimento' :
                               suggestion.status === 'completed' ? 'Concluído' :
                               suggestion.status === 'rejected' ? 'Rejeitado' :
                               suggestion.status}
                            </Badge>
                            {suggestion.priority && (
                              <Badge className="capitalize">
                                Prioridade {suggestion.priority === 'low' ? 'Baixa' :
                                           suggestion.priority === 'medium' ? 'Média' :
                                           suggestion.priority === 'high' ? 'Alta' :
                                           suggestion.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => openReviewSuggestion(suggestion)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                        {suggestion.description}
                      </p>

                      {suggestion.admin_notes && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-xs font-semibold mb-1 text-primary">Suas Notas:</p>
                          <p className="text-sm">{suggestion.admin_notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span>Por: {suggestion.broker_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Dialog open={isSuggestionDialogOpen} onOpenChange={(open) => {
            setIsSuggestionDialogOpen(open);
            if (!open) {
              setEditingSuggestion(null);
              setSuggestionReview({ status: 'pending', priority: 'medium', admin_notes: '' });
            }
          }}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Revisar Sugestão</DialogTitle>
                <DialogDescription>
                  {editingSuggestion?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={suggestionReview.status}
                    onValueChange={(value: any) => setSuggestionReview({ ...suggestionReview, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="under_review">Em Análise</SelectItem>
                      <SelectItem value="planned">Planejado</SelectItem>
                      <SelectItem value="in_progress">Em Desenvolvimento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={suggestionReview.priority}
                    onValueChange={(value: any) => setSuggestionReview({ ...suggestionReview, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Notas Admin (visível para todos)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Adicione notas sobre esta sugestão..."
                    rows={4}
                    value={suggestionReview.admin_notes}
                    onChange={(e) => setSuggestionReview({ ...suggestionReview, admin_notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSuggestionDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleReviewSuggestion} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Revisão'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AdminUpdatesPage };
export default AdminUpdatesPage;
