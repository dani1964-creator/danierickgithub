
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Search, Trash2, Eye, Filter, RefreshCw, ChevronLeft, ChevronRight, Building, Star, AlertCircle, Edit, Power, Tags, Plus } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryManager from '@/components/dashboard/CategoryManager';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AddPropertyDialog from '@/components/properties/AddPropertyDialog';
import PropertyViewToggle from '@/components/properties/PropertyViewToggle';
import EditPropertyButton from '@/components/properties/EditPropertyButton';
import { sanitizeInput } from '@/lib/security';
import { getErrorMessage } from '@/lib/utils';
// ✅ IMPORT DO HOOK OTIMIZADO
import { useOptimizedProperties } from '@/hooks/useOptimizedQuery';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  parking_spaces: number;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  main_image_url: string;
  images: string[];
  features: string[];
  property_code: string;
  status: string;
  realtor_id?: string;
}

const Properties = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ✅ ESTADOS PARA FILTROS E PAGINAÇÃO
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('properties');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // ✅ ESTADOS LOCAIS PARA CONTROLAR DADOS (corrigido igual ao /src/)
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ FUNÇÃO DE CARREGAMENTO (como na página de corretores)
  const fetchProperties = useCallback(async () => {
    if (!brokerId) return; // ✅ NÃO FAZ QUERY SEM BROKER_ID
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * 12, currentPage * 12 - 1);

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (propertyTypeFilter !== 'all') {
        query = query.eq('property_type', propertyTypeFilter);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setProperties(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / 12));
    } catch (err: any) {
      logger.error('Error fetching properties:', err);
      setError(err.message || 'Erro ao carregar propriedades');
    } finally {
      setLoading(false);
    }
  }, [brokerId, statusFilter, propertyTypeFilter, searchTerm, currentPage]);

  const refreshProperties = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ✅ MÉTODOS DE NAVEGAÇÃO DE PÁGINAS
  const loadNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const loadPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // ✅ CARREGAR PROPRIEDADES QUANDO BROKER_ID ESTIVER DISPONÍVEL
  useEffect(() => {
    if (brokerId) {
      fetchProperties();
    }
  }, [brokerId, fetchProperties]);

  // ✅ FUNÇÃO PARA BUSCAR BROKER ID (simplificada)
  const fetchBrokerData = useCallback(async (currentUser?: typeof user) => {
    const userToUse = currentUser || user;
    if (!userToUse?.id) return;
    
    try {
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', userToUse.id)
        .single();

      if (brokerError) {
        logger.error('Error fetching broker:', brokerError);
        toast({
          title: "Erro ao identificar corretor",
          description: getErrorMessage(brokerError),
          variant: "destructive"
        });
        return;
      }

      if (!brokerData) {
        toast({
          title: "Corretor não encontrado",
          description: "Não foi possível encontrar seus dados de corretor.",
          variant: "destructive"
        });
        return;
      }

      // ✅ SETAR BROKER ID PARA ATIVAR O HOOK OTIMIZADO
      setBrokerId(brokerData.id);
      
    } catch (error: unknown) {
      logger.error('Error fetching broker data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ✅ BUSCAR BROKER ID QUANDO USER ESTIVER DISPONÍVEL
  useEffect(() => {
    if (user) {
      fetchBrokerData(user);
    }
  }, [user, fetchBrokerData]);

  // Sanitize search input to prevent XSS
  const sanitizedSearchTerm = sanitizeInput(searchTerm);
  
  const filteredProperties = properties.filter(property => {
    const searchLower = sanitizedSearchTerm.toLowerCase();
    const matchesSearch = (
      property.title.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.neighborhood?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.property_code?.toLowerCase().includes(searchLower)
    );
    
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Imóvel excluído",
        description: "O imóvel foi removido com sucesso."
      });

      refreshProperties();
    } catch (error: unknown) {
      toast({
        title: "Erro ao excluir",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !currentStatus })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Imóvel ativado" : "Imóvel desativado",
        description: !currentStatus 
          ? "O imóvel agora está visível no site." 
          : "O imóvel foi ocultado do site."
      });

      refreshProperties();
    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar status",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleToggleFeatured = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: !currentStatus })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Adicionado aos destaques" : "Removido dos destaques",
        description: !currentStatus 
          ? "O imóvel agora aparece na seção de destaques." 
          : "O imóvel foi removido da seção de destaques."
      });

      refreshProperties();
    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar destaque",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleSearchChange = (value: string) => {
    // Limit search term length for security
    const limitedValue = value.substring(0, 100);
    setSearchTerm(limitedValue);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      sold: { label: 'Vendido', variant: 'destructive' as const },
      rented: { label: 'Alugado', variant: 'outline' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: 'Ativo', variant: 'default' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Mostrar skeleton completo apenas quando estiver carregando e ainda não houver propriedades
  if (loading && properties.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50">
              <div className="flex justify-between items-center">
                <div className="space-y-3">
                  <div className="h-10 w-48 bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse" />
                  <div className="h-6 w-64 bg-muted/70 rounded-md animate-pulse" />
                </div>
                <div className="h-12 w-36 bg-muted/70 rounded-lg animate-pulse" />
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="h-12 w-full bg-muted/70 rounded-lg animate-pulse" />
                  <div className="h-12 w-32 bg-muted/70 rounded-lg animate-pulse" />
                </div>
                <div className="h-12 w-20 bg-muted/70 rounded-lg animate-pulse" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 p-6">
                  <div className="h-10 w-20 bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse mb-3" />
                  <div className="h-5 w-28 bg-muted/70 rounded animate-pulse" />
                </div>
              ))}
            </div>
            
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 overflow-hidden">
                  <div className="h-48 w-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 w-3/4 bg-muted/70 rounded animate-pulse" />
                    <div className="h-5 w-1/2 bg-muted/50 rounded animate-pulse" />
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-20 bg-muted/50 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-border/50">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gestão de Imóveis
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base lg:text-lg break-words">
                Gerencie seus imóveis e organize por categorias
                <span className="block sm:inline sm:ml-1">({totalCount || properties.length} imóveis)</span>
              </p>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 h-auto rounded-none border-b">
                <TabsTrigger 
                  value="properties" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 font-medium text-sm flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Meus Imóveis
                  <Badge variant="secondary" className="text-xs">
                    {totalCount || properties.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 font-medium text-sm flex items-center gap-2"
                >
                  <Tags className="h-4 w-4" />
                  Categorias
                  <Badge variant="outline" className="text-xs">
                    Organizar
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Aba de Imóveis */}
              <TabsContent value="properties" className="p-0 m-0">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Barra de ações - Adicionar Imóvel */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Lista de Imóveis</span>
                    </div>
                    <AddPropertyDialog onPropertyAdded={refreshProperties} />
                  </div>

                  {/* Search, Filters and View Toggle */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar por título, endereço, bairro, cidade ou código..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10 text-sm bg-background/80 backdrop-blur-sm border-border/50 w-full"
                          maxLength={100}
                        />
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[130px] bg-background/80 backdrop-blur-sm border-border/50">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="sold">Vendido</SelectItem>
                            <SelectItem value="rented">Alugado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                          <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-sm border-border/50">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos Tipos</SelectItem>
                            <SelectItem value="house">Casa</SelectItem>
                            <SelectItem value="apartment">Apartamento</SelectItem>
                            <SelectItem value="land">Terreno</SelectItem>
                            <SelectItem value="commercial">Comercial</SelectItem>
                            <SelectItem value="farm">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                        <PropertyViewToggle view={viewMode} onViewChange={setViewMode} />
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-primary">{properties.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-emerald-500">
                          {properties.filter(p => p.is_active).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ativos</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-amber-500">
                          {properties.filter(p => p.is_featured).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Destaque</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-background/50">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-500">
                          {properties.reduce((acc, p) => acc + p.views_count, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Views</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Imóveis */}
                  {properties.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          Nenhum imóvel cadastrado
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md">
                          Comece adicionando seu primeiro imóvel ao sistema.
                        </p>
                        <AddPropertyDialog onPropertyAdded={refreshProperties} />
                      </CardContent>
                    </Card>
                  ) : viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                         style={{ minHeight: '400px' }}>
                      {properties.map((property) => (
                        <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                          {/* Imagem */}
                          {property.main_image_url && (
                            <div className="relative aspect-video overflow-hidden">
                              <Image
                                src={property.main_image_url}
                                alt={property.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                              
                              {/* Badges */}
                              <div className="absolute top-2 left-2 flex gap-1">
                                {property.is_featured && (
                                  <Badge className="bg-amber-500 text-white text-xs">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Destaque
                                  </Badge>
                                )}
                                {getStatusBadge(property.status)}
                              </div>
                              
                              {property.property_code && (
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="text-xs">
                                    #{property.property_code}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                              {property.title}
                            </CardTitle>
                            
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(property.price)}
                              </span>
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 space-y-3">
                            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                              <span className="text-primary">📍</span>
                              {property.address}
                            </p>
                            
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {property.bedrooms ? (
                                <div className="flex items-center gap-1">
                                  <span>🛏️</span> {property.bedrooms}
                                </div>
                              ) : null}
                              {property.bathrooms ? (
                                <div className="flex items-center gap-1">
                                  <span>🚿</span> {property.bathrooms}
                                </div>
                              ) : null}
                              {property.area_m2 ? (
                                <div className="flex items-center gap-1">
                                  <span>📐</span> {property.area_m2}m²
                                </div>
                              ) : null}
                              {property.parking_spaces ? (
                                <div className="flex items-center gap-1">
                                  <span>🚗</span> {property.parking_spaces}
                                </div>
                              ) : null}
                            </div>

                            {/* Views */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                              <Eye className="h-3 w-3" />
                              <span>{property.views_count} visualizações</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 pt-2 border-t">
                              <EditPropertyButton 
                                property={property} 
                                onPropertyUpdated={refreshProperties}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFeatured(property.id, property.is_featured)}
                                className="h-8 px-2"
                                title={property.is_featured ? 'Remover destaque' : 'Adicionar destaque'}
                              >
                                <Star className={`h-3 w-3 ${property.is_featured ? 'text-amber-500 fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(property.id, property.is_active)}
                                className="h-8 px-2"
                                title={property.is_active ? 'Desativar' : 'Ativar'}
                              >
                                <Power className={`h-3 w-3 ${property.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // List View - implementar se necessário
                    <div className="text-center text-muted-foreground py-8">
                      Vista em lista - Em desenvolvimento
                    </div>
                  )}

                  {/* Paginação */}
                  {totalPages && totalPages > 1 && (
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} ({totalCount} imóveis)
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage <= 1 || loading}
                          className="h-8"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage >= totalPages || loading}
                          className="h-8"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={fetchProperties}
                          disabled={loading}
                          className="h-8"
                        >
                          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba de Categorias */}
              <TabsContent value="categories" className="p-0 m-0">
                <div className="p-4 sm:p-6">
                  {brokerId ? (
                    <CategoryManager brokerId={brokerId} />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Tags className="h-12 w-12 text-muted-foreground/50 mb-4 mx-auto" />
                        <p className="text-muted-foreground">Carregando...</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const DynamicProperties = dynamic(() => Promise.resolve(Properties), { ssr: false });
export default DynamicProperties;
