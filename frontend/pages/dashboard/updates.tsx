import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Bug, 
  Megaphone, 
  TrendingUp, 
  ThumbsUp, 
  Plus,
  Zap,
  Palette,
  Gauge,
  Package
} from 'lucide-react';

const UpdatesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'updates' | 'suggestions'>('updates');

  // Form state
  const [newSuggestion, setNewSuggestion] = useState({
    title: '',
    description: '',
    category: 'feature' as SuggestionCategory
  });

  // Funções de carregamento
  const loadUpdates = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('app_updates')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20);

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
        description: 'Erro ao carregar atualizações e sugestões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [loadUpdates, loadSuggestions, toast]);

  useEffect(() => {
    const loadBrokerAndData = async () => {
      if (!user?.id) return;
      const { data } = await (supabase as any)
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data?.id) {
        setBrokerId(data.id);
        loadData();
      }
    };
    loadBrokerAndData();
  }, [user, loadData]);

  const handleSubmitSuggestion = async () => {
    if (!brokerId) return;
    
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e descrição',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await (supabase as any)
        .from('improvement_suggestions')
        .insert({
          title: newSuggestion.title.trim(),
          description: newSuggestion.description.trim(),
          category: newSuggestion.category,
          broker_id: brokerId
        });

      if (error) throw error;

      toast({
        title: 'Sugestão enviada!',
        description: 'Sua sugestão foi enviada com sucesso'
      });

      setNewSuggestion({ title: '', description: '', category: 'feature' });
      setIsDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      logger.error('Erro ao enviar sugestão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar sugestão',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVote = async (suggestionId: string) => {
    try {
      const { data, error } = await (supabase as any).rpc('toggle_suggestion_vote', {
        p_suggestion_id: suggestionId
      });

      if (error) throw error;

      // Recarregar sugestões para atualizar votos
      loadSuggestions();

      toast({
        title: data ? 'Voto registrado' : 'Voto removido',
        description: data ? 'Seu voto foi registrado' : 'Seu voto foi removido'
      });
    } catch (error) {
      logger.error('Erro ao votar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao registrar voto',
        variant: 'destructive'
      });
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="h-5 w-5" />;
      case 'improvement': return <TrendingUp className="h-5 w-5" />;
      case 'bugfix': return <Bug className="h-5 w-5" />;
      case 'announcement': return <Megaphone className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <Package className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'bugfix': return <Bug className="h-4 w-4" />;
      case 'ux': return <Palette className="h-4 w-4" />;
      case 'performance': return <Gauge className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'planned': return 'secondary';
      case 'under_review': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      under_review: 'Em Análise',
      planned: 'Planejado',
      in_progress: 'Em Desenvolvimento',
      completed: 'Concluído',
      rejected: 'Rejeitado'
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      feature: 'Nova Funcionalidade',
      improvement: 'Melhoria',
      bugfix: 'Correção de Bug',
      ux: 'Experiência do Usuário',
      performance: 'Performance',
      other: 'Outro'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Atualizações & Sugestões</h1>
        <p className="text-muted-foreground">
          Acompanhe novidades do sistema e sugira melhorias
        </p>
      </div>

      <div className="mb-6">
        <div className="flex border-b">
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
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'suggestions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsUp className="h-4 w-4 inline mr-2" />
            Sugestões
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'updates' ? (
        <div className="space-y-4">
          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma atualização publicada ainda
              </CardContent>
            </Card>
          ) : (
            updates.map((update) => (
              <Card key={update.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {getUpdateIcon(update.update_type)}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="capitalize mb-2 w-fit">
                        {update.update_type === 'feature' ? 'Novidade' : 
                         update.update_type === 'improvement' ? 'Melhoria' : 
                         update.update_type === 'bugfix' ? 'Correção' : 
                         update.update_type === 'announcement' ? 'Anúncio' : 
                         update.update_type}
                      </Badge>
                      <CardTitle className="text-xl mb-2">{update.title}</CardTitle>
                      <CardDescription>
                        {new Date(update.published_at || update.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">{update.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Vote nas melhores ideias e sugira novas funcionalidades
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Sugestão
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Enviar Sugestão</DialogTitle>
                  <DialogDescription>
                    Sua opinião é importante! Sugira melhorias para o sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Adicionar filtro por bairro"
                      value={newSuggestion.title}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newSuggestion.category}
                      onValueChange={(value: any) => setNewSuggestion({ ...newSuggestion, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                        <SelectItem value="improvement">Melhoria</SelectItem>
                        <SelectItem value="bugfix">Correção de Bug</SelectItem>
                        <SelectItem value="ux">Experiência do Usuário</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua sugestão em detalhes..."
                      rows={6}
                      value={newSuggestion.description}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitSuggestion} disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar Sugestão'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma sugestão enviada ainda. Seja o primeiro!
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Votos */}
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant={suggestion.user_has_voted ? 'default' : 'outline'}
                        size="sm"
                        className="h-12 w-12 p-0"
                        onClick={() => handleToggleVote(suggestion.id)}
                      >
                        <ThumbsUp className={`h-5 w-5 ${suggestion.user_has_voted ? 'fill-current' : ''}`} />
                      </Button>
                      <span className="text-sm font-bold">{suggestion.votes_count}</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{suggestion.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="gap-1">
                              {getCategoryIcon(suggestion.category)}
                              {getCategoryLabel(suggestion.category)}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(suggestion.status)}>
                              {getStatusLabel(suggestion.status)}
                            </Badge>
                            {suggestion.priority && (
                              <Badge variant="secondary" className="capitalize">
                                {suggestion.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                        {suggestion.description}
                      </p>

                      {suggestion.admin_notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-semibold mb-1 text-primary">Nota do Admin:</p>
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
        </div>
      )}
    </div>
  );
};

export default UpdatesPage;
