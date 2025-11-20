import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Save, 
  X,
  Eye,
  EyeOff,
  Home,
  Star,
  TrendingUp,
  MapPin,
  DollarSign,
  Award,
  Sparkles
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNotifications } from '@/hooks/useNotifications';
import { logger } from '@/lib/logger';

interface PropertyCategory {
  id: string;
  broker_id: string;
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

export default function CategoriasPage() {
  const router = useRouter();
  const notifications = useNotifications();
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [brokerId, setBrokerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
    icon: 'Star',
    is_active: true,
    show_on_homepage: true,
  });

  const loadBrokerAndCategories = useCallback(async () => {
    try {
      setLoading(true);

      // Obter broker_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (brokerError || !brokerData) {
        notifications.showError('Erro', 'Corretor não encontrado');
        return;
      }

      setBrokerId(brokerData.id);

      // Carregar categorias
      // @ts-ignore - Tabela property_categories ainda não existe nos tipos gerados
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('property_categories')
        .select('*')
        .eq('broker_id', brokerData.id)
        .order('display_order', { ascending: true }) as { data: PropertyCategory[] | null; error: any };

      if (categoriesError) {
        logger.error('Error loading categories:', categoriesError);
        notifications.showError('Erro', 'Falha ao carregar categorias');
        return;
      }

      // Para cada categoria, contar os imóveis associados via property_category_assignments
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // @ts-ignore - Tabela property_category_assignments ainda não existe nos tipos gerados
          const { count } = await supabase
            .from('property_category_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          return {
            ...category,
            properties_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      logger.error('Error in loadBrokerAndCategories:', error);
      notifications.showError('Erro', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [router, notifications]);

  useEffect(() => {
    loadBrokerAndCategories();
  }, [loadBrokerAndCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreate = async () => {
    if (!brokerId || !formData.name.trim()) {
      notifications.showError('Erro', 'Nome da categoria é obrigatório');
      return;
    }

    try {
      const slug = generateSlug(formData.name);
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.display_order)) 
        : -1;

      // @ts-ignore - Tabela property_categories ainda não existe nos tipos gerados
      const { error } = await supabase
        .from('property_categories')
        .insert({
          broker_id: brokerId,
          name: formData.name.trim(),
          slug,
          description: formData.description.trim() || null,
          color: formData.color,
          icon: formData.icon,
          display_order: maxOrder + 1,
          is_active: formData.is_active,
          show_on_homepage: formData.show_on_homepage,
        });

      if (error) throw error;

      notifications.showSuccess('Sucesso!', 'Categoria criada com sucesso');
      setIsCreating(false);
      setFormData({
        name: '',
        description: '',
        color: COLOR_OPTIONS[0],
        icon: 'Star',
        is_active: true,
        show_on_homepage: true,
      });
      loadBrokerAndCategories();
    } catch (error: any) {
      logger.error('Error creating category:', error);
      notifications.showError('Erro', error.message || 'Falha ao criar categoria');
    }
  };

  const handleUpdate = async (categoryId: string) => {
    if (!formData.name.trim()) {
      notifications.showError('Erro', 'Nome da categoria é obrigatório');
      return;
    }

    try {
      // @ts-ignore - Tabela property_categories ainda não existe nos tipos gerados
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
        .eq('id', categoryId);

      if (error) throw error;

      notifications.showSuccess('Sucesso!', 'Categoria atualizada');
      setEditingId(null);
      loadBrokerAndCategories();
    } catch (error: any) {
      logger.error('Error updating category:', error);
      notifications.showError('Erro', error.message || 'Falha ao atualizar categoria');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os imóveis não serão excluídos.')) {
      return;
    }

    try {
      // @ts-ignore - Tabela property_categories ainda não existe nos tipos gerados
      const { error } = await supabase
        .from('property_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      notifications.showSuccess('Sucesso!', 'Categoria excluída');
      loadBrokerAndCategories();
    } catch (error: any) {
      logger.error('Error deleting category:', error);
      notifications.showError('Erro', error.message || 'Falha ao excluir categoria');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar display_order local imediatamente
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    setCategories(updatedItems);

    // Salvar no banco
    try {
      const updates = updatedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      for (const update of updates) {
        // @ts-ignore - Tabela property_categories ainda não existe nos tipos gerados
        await supabase
          .from('property_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      notifications.showSuccess('Sucesso!', 'Ordem atualizada');
    } catch (error: any) {
      logger.error('Error updating order:', error);
      notifications.showError('Erro', 'Falha ao atualizar ordem');
      loadBrokerAndCategories(); // Recarregar em caso de erro
    }
  };

  const startEdit = (category: PropertyCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || COLOR_OPTIONS[0],
      icon: category.icon || 'Star',
      is_active: category.is_active,
      show_on_homepage: category.show_on_homepage,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      color: COLOR_OPTIONS[0],
      icon: 'Star',
      is_active: true,
      show_on_homepage: true,
    });
  };

  const getIconComponent = (iconName: string) => {
    const option = ICON_OPTIONS.find(opt => opt.value === iconName);
    return option ? option.icon : Star;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Categorias de Imóveis</h1>
            <p className="text-muted-foreground mt-1">
              Organize seus imóveis em categorias personalizadas
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </div>

        {/* Formulário de Criação */}
        {isCreating && (
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Nova Categoria</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lançamentos, Alto Padrão"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ícone</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full border-2 ${
                        formData.color === color ? 'border-black scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Categoria ativa</label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mostrar na home</label>
                  <Switch
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Save className="h-4 w-4 mr-2" />
                Criar Categoria
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Categorias com Drag & Drop */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar as categorias (a ordem define a exibição no site público)
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {categories.map((category, index) => {
                    const IconComponent = getIconComponent(category.icon || 'Star');
                    const isEditing = editingId === category.id;

                    return (
                      <Draggable
                        key={category.id}
                        draggableId={category.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-card border rounded-lg p-4 ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            {isEditing ? (
                              // Modo de Edição
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Nome *</label>
                                    <Input
                                      value={formData.name}
                                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-2">Ícone</label>
                                    <select
                                      className="w-full border rounded-md px-3 py-2"
                                      value={formData.icon}
                                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    >
                                      {ICON_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Descrição</label>
                                    <Textarea
                                      value={formData.description}
                                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                      rows={2}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-2">Cor</label>
                                    <div className="flex gap-2">
                                      {COLOR_OPTIONS.map((color) => (
                                        <button
                                          key={color}
                                          className={`w-10 h-10 rounded-full border-2 ${
                                            formData.color === color ? 'border-black scale-110' : 'border-transparent'
                                          }`}
                                          style={{ backgroundColor: color }}
                                          onClick={() => setFormData({ ...formData, color })}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">Categoria ativa</label>
                                      <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">Mostrar na home</label>
                                      <Switch
                                        checked={formData.show_on_homepage}
                                        onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button onClick={() => handleUpdate(category.id)} size="sm">
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar
                                  </Button>
                                  <Button variant="outline" onClick={cancelEdit} size="sm">
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Modo de Visualização
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                  style={{ backgroundColor: category.color || '#64748b' }}
                                >
                                  <IconComponent className="h-5 w-5" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <span className="text-sm text-muted-foreground">
                                      ({category.properties_count || 0} imóveis)
                                    </span>
                                  </div>
                                  {category.description && (
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {category.is_active ? (
                                    <div title="Ativa">
                                      <Eye className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : (
                                    <div title="Inativa">
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(category)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(category.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {categories.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Nenhuma categoria criada ainda. Clique em "Nova Categoria" para começar.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
