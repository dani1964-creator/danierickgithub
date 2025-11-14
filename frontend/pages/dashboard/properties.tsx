
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Search, Trash2, Eye, Filter, RefreshCw, ChevronLeft, ChevronRight, Building, Star, AlertCircle, Edit, Power } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
    
    return statusMap[status as keyof typeof statusMap] || { label: 'Ativo', variant: 'default' as const };
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
                Imóveis
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base lg:text-lg break-words">
                Gerencie seus imóveis cadastrados
                <span className="block sm:inline sm:ml-1">({totalCount || properties.length} imóveis - Página {currentPage} de {totalPages})</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <AddPropertyDialog onPropertyAdded={refreshProperties} />
            </div>
          </div>

        {/* Search, Filters and View Toggle */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-border/50">
          <div className="flex flex-col gap-3 sm:gap-4">
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
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32 bg-background/80 backdrop-blur-sm border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="sold">Vendido</SelectItem>
                    <SelectItem value="rented">Alugado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center sm:justify-end">
              <PropertyViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Properties Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{properties.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total de Imóveis</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-500">
                {properties.filter(p => p.is_active).length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                {properties.filter(p => p.is_featured).length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Em Destaque</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                {properties.reduce((acc, p) => acc + p.views_count, 0)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Visualizações</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.'
                    : 'Comece adicionando seu primeiro imóvel ao sistema.'
                  }
                </p>
                {!searchTerm && (
                  <AddPropertyDialog onPropertyAdded={refreshProperties} />
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="relative aspect-video overflow-hidden">
                  {property.main_image_url ? (
                    <Image
                      src={property.main_image_url}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                      <Building className="h-12 w-12 mb-2 opacity-50" />
                      <span className="text-xs">Sem imagem</span>
                    </div>
                  )}
                  
                  {/* Badges de Status */}
                  <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-2">
                    {!property.is_active && (
                      <Badge className="bg-slate-900/90 text-white border-slate-700 backdrop-blur-sm">
                        <Power className="h-3 w-3 mr-1" /> Inativo
                      </Badge>
                    )}
                    {property.is_featured && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg backdrop-blur-sm border-0">
                        <Star className="h-3 w-3 mr-1" /> Destaque
                      </Badge>
                    )}
                    {property.status === 'sold' && (
                      <Badge className="bg-green-600/90 text-white backdrop-blur-sm">
                        ✓ Vendido
                      </Badge>
                    )}
                    {property.status === 'rented' && (
                      <Badge className="bg-blue-600/90 text-white backdrop-blur-sm">
                        ✓ Alugado
                      </Badge>
                    )}
                  </div>

                  {/* Código do imóvel no canto */}
                  {property.property_code && (
                    <Badge variant="outline" className="absolute bottom-2 right-2 text-xs bg-black/60 text-white border-white/20 backdrop-blur-sm">
                      #{property.property_code}
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="pb-2 space-y-2">
                  <CardTitle className="text-base line-clamp-2 leading-tight">
                    {property.title}
                  </CardTitle>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {formatPrice(property.price)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
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
                        <span>🛏️</span> {property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}
                      </div>
                    ) : null}
                    {property.bathrooms ? (
                      <div className="flex items-center gap-1">
                        <span>🚿</span> {property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}
                      </div>
                    ) : null}
                    {property.area_m2 ? (
                      <div className="flex items-center gap-1">
                        <span>📐</span> {property.area_m2}m²
                      </div>
                    ) : null}
                    {property.parking_spaces ? (
                      <div className="flex items-center gap-1">
                        <span>🚗</span> {property.parking_spaces} {property.parking_spaces === 1 ? 'vaga' : 'vagas'}
                      </div>
                    ) : null}
                  </div>

                  {/* Visualizações */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                    <Eye className="h-3 w-3" />
                    <span>{property.views_count} visualizações</span>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="space-y-2 pt-2 border-t">
                    {/* Toggle Ativo */}
                    <div className="flex items-center justify-between">
                      <label htmlFor={`active-${property.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-2">
                        <Power className="h-3 w-3" />
                        Status Ativo
                      </label>
                      <Switch
                        id={`active-${property.id}`}
                        checked={property.is_active}
                        onCheckedChange={() => handleToggleActive(property.id, property.is_active)}
                      />
                    </div>

                    {/* Toggle Destaque */}
                    <div className="flex items-center justify-between">
                      <label htmlFor={`featured-${property.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-2">
                        <Star className="h-3 w-3" />
                        Destaque
                      </label>
                      <Switch
                        id={`featured-${property.id}`}
                        checked={property.is_featured}
                        onCheckedChange={() => handleToggleFeatured(property.id, property.is_featured)}
                      />
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-2 pt-2">
                    <EditPropertyButton property={property} onPropertyUpdated={refreshProperties} />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteProperty(property.id)}
                      className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List/Detailed View
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative w-full h-48 lg:w-72 lg:h-48 flex-shrink-0 overflow-hidden">
                    {property.main_image_url ? (
                      <Image
                        src={property.main_image_url}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                        sizes="(max-width: 1024px) 100vw, 288px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                        📷 Sem imagem
                      </div>
                    )}
                    {property.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg" variant="default">
                        ⭐ Destaque
                      </Badge>
                    )}
                    {property.status && property.status !== 'active' && (
                      <Badge className="absolute top-3 left-3 shadow-lg" variant={getStatusBadge(property.status).variant}>
                        {getStatusBadge(property.status).label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl lg:text-2xl font-bold line-clamp-2 flex-1 pr-4">
                            {property.title}
                          </h3>
                          {property.property_code && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                              {property.property_code}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                          <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {formatPrice(property.price)}
                          </span>
                          <Badge variant="outline" className="w-fit bg-muted/50">
                            {property.transaction_type === 'sale' ? '🏠 Venda' : '🏠 Aluguel'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>📍</span>
                        <span>{property.address}</span>
                      </p>
                      
                      {(property.neighborhood || property.city) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>🏙️</span>
                          <span>{[property.neighborhood, property.city, property.uf].filter(Boolean).join(', ')}</span>
                        </p>
                      )}
                      
                      {property.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-2">
                          <span className="flex-shrink-0">📝</span>
                          <span>{property.description}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 md:flex md:items-center text-xs sm:text-sm text-muted-foreground mb-6 bg-muted/20 rounded-lg p-4">
                      {property.bedrooms && (
                        <span className="flex items-center gap-2">🛏️ {property.bedrooms} quartos</span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-2">🚿 {property.bathrooms} banheiros</span>
                      )}
                      {property.area_m2 && (
                        <span className="flex items-center gap-2">📐 {property.area_m2}m²</span>
                      )}
                      {property.parking_spaces && (
                        <span className="flex items-center gap-2">🚗 {property.parking_spaces} vagas</span>
                      )}
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{property.views_count} visualizações</span>
                        </div>
                        
                        {/* Toggles inline para lista */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`list-active-${property.id}`}
                              checked={property.is_active}
                              onCheckedChange={() => handleToggleActive(property.id, property.is_active)}
                            />
                            <label htmlFor={`list-active-${property.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-1">
                              <Power className="h-3 w-3" />
                              Ativo
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`list-featured-${property.id}`}
                              checked={property.is_featured}
                              onCheckedChange={() => handleToggleFeatured(property.id, property.is_featured)}
                            />
                            <label htmlFor={`list-featured-${property.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Destaque
                            </label>
                          </div>
                        </div>
                      </div>
                      
                       <div className="flex items-center gap-2">
                         <EditPropertyButton property={property} onPropertyUpdated={refreshProperties} />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteProperty(property.id)}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
          </div>
          {/* ✅ PAGINAÇÃO OTIMIZADA */}
          {totalPages && totalPages > 1 && (
            <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border/50">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * 12) + 1} - {Math.min(currentPage * 12, totalCount || 0)} de {totalCount || 0} imóveis
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadPrevPage}
                  disabled={!hasPrevPage || loading}
                  className="h-8"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Anterior
                </Button>
                
                <span className="text-sm px-3 py-1 bg-primary/10 rounded">
                  Página {currentPage} de {totalPages}
                </span>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadNextPage}
                  disabled={!hasNextPage || loading}
                  className="h-8"
                >
                  Próxima
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={refreshProperties}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  };

const DynamicProperties = dynamic(() => Promise.resolve(Properties), { ssr: false });
export default DynamicProperties;
