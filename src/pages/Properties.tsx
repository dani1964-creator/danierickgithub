
import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Eye, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  
  // ✅ HOOK OTIMIZADO - SUBSTITUI fetchProperties
  const { 
    data: properties, 
    loading, 
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    refresh: refreshProperties,
    loadNextPage,
    loadPrevPage,
    clearCache
  } = useOptimizedProperties(brokerId || '', {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    propertyType: propertyTypeFilter !== 'all' ? propertyTypeFilter : undefined,
    search: searchTerm ? `%${searchTerm}%` : undefined
  }, {
    limit: 12, // ✅ PAGINAÇÃO AUTOMÁTICA
    enableCache: true,
    memoryTTL: 3, // Cache curto - dados mudam frequentemente
    sessionTTL: 10,
    logQueries: true,
    realtime: true // ✅ REALTIME OTIMIZADO
  });

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
        console.error('Error fetching broker:', brokerError);
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
      console.error('Error fetching broker data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    }
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

  if (loading) {
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
          <div className="flex justify-between items-center bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Imóveis
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Gerencie seus imóveis cadastrados ({totalCount || properties.length} imóveis - Página {currentPage} de {totalPages})
              </p>
            </div>
            <AddPropertyDialog onPropertyAdded={refreshProperties} />
          </div>

        {/* Search, Filters and View Toggle */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título, endereço, bairro, cidade ou código..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 text-sm bg-background/80 backdrop-blur-sm border-border/50"
                  maxLength={100}
                />
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 sm:w-32 bg-background/80 backdrop-blur-sm border-border/50">
                    <SelectValue placeholder="Status" />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary">{properties.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total de Imóveis</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-emerald-500">
                {properties.filter(p => p.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-amber-500">
                {properties.filter(p => p.is_featured).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Em Destaque</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-500">
                {properties.reduce((acc, p) => acc + p.views_count, 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Visualizações</p>
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
                    <img
                      src={property.main_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                      Sem imagem
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
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1">
                      {property.title}
                    </CardTitle>
                    {property.property_code && (
                      <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20">
                        {property.property_code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {formatPrice(property.price)}
                    </span>
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    📍 {property.address}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-3">
                    {property.bedrooms && (
                      <span>🛏️ {property.bedrooms} quartos</span>
                    )}
                    {property.bathrooms && (
                      <span>🚿 {property.bathrooms} banheiros</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{property.views_count}</span>
                    </div>
                    
                     <div className="flex items-center gap-1">
                       <EditPropertyButton property={property} onPropertyUpdated={refreshProperties} />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
                      <img
                        src={property.main_image_url}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{property.views_count} visualizações</span>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border/50">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * 12) + 1} - {Math.min(currentPage * 12, totalCount)} de {totalCount} imóveis
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

export default Properties;
