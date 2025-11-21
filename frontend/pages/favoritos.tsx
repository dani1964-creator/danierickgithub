import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Heart, Filter, SortAsc, Trash2, Search, Home as HomeIcon, X, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { SafeImage } from '@/components/ui/SafeImage';
import { PropertyListSkeleton } from '@/components/skeletons/PropertySkeletons';
import { analytics } from '@/lib/analytics';
import { useDomainAware } from '@/hooks/useDomainAware';

/**
 * Página de Favoritos - Estilo premium (Airbnb/Booking.com)
 */
export default function FavoritesPage() {
  const router = useRouter();
  const { isCustomDomain } = useDomainAware();
  const {
    favorites,
    isLoading,
    count,
    removeFavorite,
    clearFavorites,
    getSortedFavorites,
    searchFavorites,
  } = useFavorites();

  const notifications = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'alphabetical'>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Rastrear visualização da página
  useEffect(() => {
    analytics.trackPageView('/favoritos', { favorites_count: count });
  }, [count]);

  // Filtrar e ordenar favoritos
  const displayedFavorites = searchQuery.trim()
    ? searchFavorites(searchQuery)
    : getSortedFavorites(sortBy);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePropertyClick = (slug: string, brokerSlug: string) => {
    // Para domínios customizados: URL limpa sem broker slug
    // Para subdomínios (*.adminimobiliaria.site): URL com broker slug
    if (isCustomDomain()) {
      // Domínio customizado: URL limpa /slug
      router.push(`/${slug}`);
    } else {
      // Subdomínio: URL com broker slug /broker/slug  
      router.push(`/${brokerSlug}/${slug}`);
    }
  };

  const handleRemoveFavorite = (propertyId: string, propertyTitle: string) => {
    removeFavorite(propertyId);
    notifications.showInfo('Removido dos favoritos', propertyTitle);
  };

  const handleClearAll = () => {
    clearFavorites();
    setShowClearConfirm(false);
    notifications.showSuccess('Todos os favoritos foram removidos');
  };

  // Estado vazio
  if (!isLoading && count === 0) {
    return (
      <>
        <Head>
          <title>Meus Favoritos | Imóveis Salvos</title>
          <meta name="description" content="Seus imóveis favoritos salvos" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
              >
                ← Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-pink-50 rounded-full p-6 mb-6">
                <Heart className="h-16 w-16 text-pink-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Nenhum favorito ainda
              </h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Comece a salvar imóveis que você gostou para acessá-los facilmente depois
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Explorar imóveis
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Meus Favoritos ({count}) | Imóveis Salvos</title>
        <meta name="description" content={`${count} imóveis salvos nos seus favoritos`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 hover:bg-gray-100"
            >
              ← Voltar
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
                  Meus Favoritos
                </h1>
                <p className="text-gray-600">
                  {count} {count === 1 ? 'imóvel salvo' : 'imóveis salvos'}
                </p>
              </div>

              {/* Clear All Button */}
              {count > 0 && (
                <div>
                  {showClearConfirm ? (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAll}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar tudo
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por título, cidade ou bairro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="sm:w-56">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="price_asc">Menor preço</SelectItem>
                    <SelectItem value="price_desc">Maior preço</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {searchQuery && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {displayedFavorites.length} resultado{displayedFavorites.length !== 1 ? 's' : ''} para "{searchQuery}"
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="h-6 text-xs"
                >
                  Limpar busca
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && <PropertyListSkeleton count={6} />}

          {/* Favorites Grid - PREMIUM DESIGN */}
          {!isLoading && displayedFavorites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedFavorites.map((property) => (
                <div
                  key={property.id}
                  className="property-card-premium"
                  onClick={() => handlePropertyClick(property.slug, property.broker_slug)}
                >
                  {/* Image Container */}
                  <div className="property-card-image">
                    <SafeImage
                      src={property.main_image_url}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105 will-change-transform"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                    />
                    
                    {/* Badges Premium */}
                    <div className="property-card-badges">
                      <div className="property-card-badge property-card-badge--sale">
                        {property.property_type}
                      </div>
                    </div>

                    {/* Action Buttons Premium */}
                    <div className="property-card-actions">
                      <button
                        className="property-card-action property-card-action--favorite is-favorited"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(property.id, property.title);
                        }}
                        title="Remover dos favoritos"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    
                    {/* Data Badge */}
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                      {new Date(property.favorited_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>

                  {/* Content Premium */}
                  <div className="property-card-content">
                    {/* Título e Localização */}
                    <div>
                      <h3 className="property-card-title">
                        {property.title}
                      </h3>
                      
                      <div className="property-card-location">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{property.city}{property.uf ? `, ${property.uf}` : ''}</span>
                      </div>
                    </div>
                    
                    {/* Preço Premium */}
                    <div className="property-card-price">
                      {formatPrice(property.price)}
                    </div>
                    
                    {/* Features Premium */}
                    <div className="property-card-features">
                      {property.bedrooms > 0 && (
                        <div className="property-card-feature">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="property-card-feature">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.area_m2 > 0 && (
                        <div className="property-card-feature">
                          <Square className="h-4 w-4" />
                          <span>{property.area_m2}m²</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchQuery && displayedFavorites.length === 0 && (
            <div className="text-center py-20">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Tente buscar com outros termos
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Limpar busca
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
