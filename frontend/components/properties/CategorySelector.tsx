import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Star, Home, TrendingUp, MapPin, DollarSign, Award, Sparkles, Tags, Check, Building, TreePine, Briefcase, Waves, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/shared/hooks/useAuth';
import { logger } from '@/lib/logger';

// Categorias predefinidas
const CATEGORIAS_PREDEFINIDAS = [
  { nome: 'Apartamentos', icone: Building, cor: '#3B82F6' },
  { nome: 'Casas', icone: Home, cor: '#10B981' },
  { nome: 'Terrenos', icone: TreePine, cor: '#8B5CF6' },
  { nome: 'Comercial', icone: Briefcase, cor: '#F59E0B' },
  { nome: 'Lançamentos', icone: Sparkles, cor: '#EF4444' },
  { nome: 'Luxo & Alto Padrão', icone: Award, cor: '#F59E0B' },
  { nome: 'Ótimos Negócios', icone: DollarSign, cor: '#10B981' },
  { nome: 'Beira-Mar', icone: Waves, cor: '#06B6D4' },
  { nome: 'Condomínio Fechado', icone: Shield, cor: '#6366F1' }
];

interface PropertyCategory {
  id: string;
  broker_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
}

interface CategorySelectorProps {
  propertyId: string;
  onCategoriesChange?: () => void;
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

export default function CategorySelector({ propertyId, onCategoriesChange }: CategorySelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
    icon: 'Star',
    show_on_homepage: true,
  });

  const loadCategoriesAndAssignments = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar broker do usuário
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!brokerData) return;

      // Buscar categorias do broker
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('property_categories')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Buscar associações do imóvel
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('property_category_assignments')
        .select('category_id')
        .eq('property_id', propertyId);

      if (assignmentsError) throw assignmentsError;

      setCategories(categoriesData || []);
      setSelectedCategories(assignmentsData?.map(a => a.category_id) || []);
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
  }, [user?.id, propertyId, toast]);

  useEffect(() => {
    if (user && propertyId) {
      loadCategoriesAndAssignments();
    }
  }, [user, propertyId, loadCategoriesAndAssignments]);

  const createCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'O nome da categoria é obrigatório.',
          variant: 'destructive'
        });
        return;
      }

      // Buscar broker do usuário
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!brokerData) return;

      const slug = newCategory.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Criar categoria
      const { data: categoryData, error: categoryError } = await supabase
        .from('property_categories')
        .insert({
          broker_id: brokerData.id,
          name: newCategory.name.trim(),
          slug: slug,
          description: newCategory.description.trim() || null,
          color: newCategory.color,
          icon: newCategory.icon,
          is_active: true,
          show_on_homepage: newCategory.show_on_homepage,
          display_order: categories.length,
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Associar ao imóvel automaticamente
      const { error: assignmentError } = await supabase
        .from('property_category_assignments')
        .insert({
          property_id: propertyId,
          category_id: categoryData.id,
          broker_id: brokerData.id,
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Categoria criada',
        description: `A categoria "${newCategory.name}" foi criada e associada ao imóvel.`
      });

      // Reset e reload
      setNewCategory({
        name: '',
        description: '',
        color: COLOR_OPTIONS[0],
        icon: 'Star',
        show_on_homepage: true,
      });
      setIsCreatingNew(false);
      setIsCustomCategory(false);
      loadCategoriesAndAssignments();
      onCategoriesChange?.();
    } catch (error: any) {
      logger.error('Error creating category:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Nome já existe',
          description: 'Já existe uma categoria com esse nome.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao criar categoria',
          description: 'Ocorreu um erro ao criar a categoria.',
          variant: 'destructive'
        });
      }
    }
  };

  const toggleCategoryAssignment = async (categoryId: string) => {
    try {
      if (selectedCategories.includes(categoryId)) {
        // Remover associação
        const { error } = await supabase
          .from('property_category_assignments')
          .delete()
          .eq('property_id', propertyId)
          .eq('category_id', categoryId);

        if (error) throw error;

        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
        toast({
          title: 'Categoria removida',
          description: 'A categoria foi removida do imóvel.'
        });
      } else {
        // Buscar broker para a associação
        const { data: brokerData } = await supabase
          .from('brokers')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (!brokerData) return;

        // Adicionar associação
        const { error } = await supabase
          .from('property_category_assignments')
          .insert({
            property_id: propertyId,
            category_id: categoryId,
            broker_id: brokerData.id,
          });

        if (error) throw error;

        setSelectedCategories(prev => [...prev, categoryId]);
        toast({
          title: 'Categoria adicionada',
          description: 'A categoria foi associada ao imóvel.'
        });
      }

      onCategoriesChange?.();
    } catch (error) {
      logger.error('Error toggling category assignment:', error);
      toast({
        title: 'Erro ao atualizar categoria',
        description: 'Ocorreu um erro ao atualizar a categoria.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-8 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Categorias existentes */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const IconComponent = ICON_OPTIONS.find(opt => opt.value === category.icon)?.icon || Star;
              
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategoryAssignment(category.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#64748b' }}
                  />
                  <IconComponent className="h-3 w-3" />
                  <span className="text-sm font-medium">{category.name}</span>
                  {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão para criar nova categoria */}
      {!isCreatingNew && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Criar Nova Categoria
        </Button>
      )}

      {/* Formulário de nova categoria */}
      {isCreatingNew && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Nova Categoria</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreatingNew(false);
                  setIsCustomCategory(false);
                  setNewCategory({
                    name: '',
                    description: '',
                    color: COLOR_OPTIONS[0],
                    icon: 'Star',
                    show_on_homepage: true,
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                {!isCustomCategory ? (
                  <Select 
                    value={newCategory.name} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setIsCustomCategory(true);
                        setNewCategory(prev => ({ ...prev, name: '' }));
                      } else {
                        // Encontrar categoria predefinida e definir ícone/cor automaticamente
                        const categoriaPredefinida = CATEGORIAS_PREDEFINIDAS.find(cat => cat.nome === value);
                        setNewCategory(prev => ({ 
                          ...prev, 
                          name: value,
                          icon: categoriaPredefinida?.icone?.name || 'Star',
                          color: categoriaPredefinida?.cor || COLOR_OPTIONS[0]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_PREDEFINIDAS.map((categoria) => {
                        const IconComponent = categoria.icone;
                        return (
                          <SelectItem key={categoria.nome} value={categoria.nome}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" style={{ color: categoria.cor }} />
                              <span>{categoria.nome}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span>Criar nova categoria</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome da categoria personalizada..."
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setNewCategory(prev => ({ ...prev, name: '' }));
                      }}
                    >
                      ← Voltar para categorias predefinidas
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ícone</label>
                <Select 
                  value={newCategory.icon} 
                  onValueChange={(value) => setNewCategory(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
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
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Descrição da categoria..."
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newCategory.color === color ? 'border-foreground scale-110' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCategory.show_on_homepage}
                  onCheckedChange={(checked) => setNewCategory(prev => ({ ...prev, show_on_homepage: checked }))}
                />
                <label className="text-sm font-medium">
                  Exibir na homepage
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                onClick={createCategory}
              >
                Criar e Associar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreatingNew(false);
                  setIsCustomCategory(false);
                  setNewCategory({
                    name: '',
                    description: '',
                    color: COLOR_OPTIONS[0],
                    icon: 'Star',
                    show_on_homepage: true,
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso se nenhuma categoria selecionada */}
      {selectedCategories.length === 0 && !isCreatingNew && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Tags className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Nenhuma categoria selecionada.</strong> O imóvel não aparecerá em seções específicas.
          </div>
        </div>
      )}
    </div>
  );
}