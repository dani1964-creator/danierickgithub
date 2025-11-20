import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Save, 
  X,
  Eye,
  EyeOff,
  Star,
  Home,
  TrendingUp,
  MapPin,
  DollarSign,
  Award,
  Sparkles,
  Tags
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface PropertyCategory {
  id: string;
  broker_id?: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  properties_count?: number;
  created_at: string;
  updated_at: string;
}

const ICON_OPTIONS = [
  { value: 'Star', label: 'Estrela', icon: Star },
  { value: 'Home', label: 'Casa', icon: Home },
  { value: 'TrendingUp', label: 'Tendência', icon: TrendingUp },
  { value: 'MapPin', label: 'Localização', icon: MapPin },
  { value: 'DollarSign', label: 'Dinheiro', icon: DollarSign },
  { value: 'Award', label: 'Prêmio', icon: Award },
  { value: 'Sparkles', label: 'Brilho', icon: Sparkles },
];

const COLOR_OPTIONS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#64748b', // slate
];

interface CategoryManagerProps {
  brokerId: string;
}

export default function CategoryManager({ brokerId }: CategoryManagerProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
    icon: 'Star',
    is_active: true,
    show_on_homepage: true,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_broker_categories_with_counts', {
          p_broker_id: brokerId
        });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      logger.error('Error loading categories:', error);
      toast({
        title: 'Erro ao carregar categorias',
        description: 'Não foi possível carregar as categorias.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [brokerId, toast]);

  useEffect(() => {
    if (brokerId) {
      loadCategories();
    }
  }, [brokerId, loadCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLOR_OPTIONS[0],
      icon: 'Star',
      is_active: true,
      show_on_homepage: true,
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'O nome da categoria é obrigatório.',
          variant: 'destructive'
        });
        return;
      }

      const slug = formData.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (editingId) {
        // Editar categoria existente
        const { error } = await supabase
          .from('property_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Categoria atualizada',
          description: `A categoria "${formData.name}" foi atualizada com sucesso.`
        });
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('property_categories')
          .insert({
            broker_id: brokerId,
            name: formData.name.trim(),
            slug: slug,
            description: formData.description.trim() || null,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
            display_order: categories.length,
          });

        if (error) throw error;

        toast({
          title: 'Categoria criada',
          description: `A categoria "${formData.name}" foi criada com sucesso.`
        });
      }

      resetForm();
      loadCategories();
    } catch (error: any) {
      logger.error('Error saving category:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Nome já existe',
          description: 'Já existe uma categoria com esse nome.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar a categoria.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleEdit = (category: PropertyCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || COLOR_OPTIONS[0],
      icon: category.icon || 'Star',
      is_active: category.is_active,
      show_on_homepage: category.show_on_homepage,
    });
    setEditingId(category.id);
    setIsCreating(true);
  };

  const handleDelete = async (category: PropertyCategory) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: 'Categoria excluída',
        description: `A categoria "${category.name}" foi excluída com sucesso.`
      });

      loadCategories();
    } catch (error) {
      logger.error('Error deleting category:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Ocorreu um erro ao excluir a categoria.',
        variant: 'destructive'
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar ordem local imediatamente
    const reorderedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }));
    setCategories(reorderedItems);

    try {
      // Atualizar ordem no banco
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('property_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast({
        title: 'Ordem atualizada',
        description: 'A ordem das categorias foi atualizada.'
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      // Reverter em caso de erro
      loadCategories();
      toast({
        title: 'Erro ao reordenar',
        description: 'Ocorreu um erro ao atualizar a ordem.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Categorias de Imóveis</span>
          <Badge variant="secondary">
            {categories.length} categorias
          </Badge>
        </div>
        
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      {isCreating && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {editingId ? 'Editar Categoria' : 'Nova Categoria'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Categoria *</label>
                <Input
                  placeholder="Ex: Imóveis em Destaque, Lançamentos..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ícone</label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição opcional da categoria..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-foreground scale-110' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Categoria ativa
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_on_homepage"
                  checked={formData.show_on_homepage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_on_homepage: checked }))}
                />
                <label htmlFor="show_on_homepage" className="text-sm font-medium">
                  Exibir na homepage
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
              <Button onClick={resetForm} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de categorias */}
      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tags className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma categoria criada
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Crie categorias para organizar seus imóveis e melhorar a navegação no seu site.
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar primeira categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar as categorias. A ordem aqui define como aparecem no site.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-all ${
                            snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: category.color || '#64748b' }}
                                    />
                                    <h3 className="font-medium truncate">{category.name}</h3>
                                  </div>
                                  {category.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {category.description}
                                    </p>
                                  )}
                                </div>

                                <div className="md:col-span-2 flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {category.properties_count || 0} imóveis
                                  </Badge>
                                </div>

                                <div className="md:col-span-3 flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {category.is_active ? (
                                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Ativa
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Inativa
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {category.show_on_homepage && (
                                    <Badge variant="outline" className="text-xs">
                                      <Home className="h-3 w-3 mr-1" />
                                      Homepage
                                    </Badge>
                                  )}
                                </div>

                                <div className="md:col-span-3 flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(category)}
                                    className="h-8 px-2"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(category)}
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}