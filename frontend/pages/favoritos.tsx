import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Heart, Filter, SortAsc, Trash2, Search, Home as HomeIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { SafeImage } from '@/components/ui/SafeImage';
import { PropertyListSkeleton } from '@/components/skeletons/PropertySkeletons';
import { analytics } from '@/lib/analytics';

/**
 * Página de Favoritos - Estilo premium (Airbnb/Booking.com)
 */
export default function FavoritesPage() {
  const router = useRouter();
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
    router.push(`/${brokerSlug}/${slug}`);
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

          {/* Favorites Grid */}
          {!isLoading && displayedFavorites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedFavorites.map((property) => (
                <div
                  key={property.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer"
                >
                  {/* Image */}
                  <div
                    className="relative h-64 overflow-hidden"
                    onClick={() => handlePropertyClick(property.slug, property.broker_slug)}
                  >
                    <SafeImage
                      src={property.main_image_url}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(property.id, property.title);
                      }}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 hover:scale-110 z-10"
                      title="Remover dos favoritos"
                    >
                      <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                    </button>

                    {/* Transaction Type Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-600 text-white">
                        {property.transaction_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="p-4"
                    onClick={() => handlePropertyClick(property.slug, property.broker_slug)}
                  >
                    {/* Price */}
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {formatPrice(property.price)}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <p className="text-sm text-gray-600 mb-3">
                      {property.neighborhood}, {property.city}
                    </p>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {property.bedrooms > 0 && (
                        <span>{property.bedrooms} quartos</span>
                      )}
                      {property.bathrooms > 0 && (
                        <span>{property.bathrooms} banheiros</span>
                      )}
                      {property.area_m2 > 0 && (
                        <span>{property.area_m2}m²</span>
                      )}
                    </div>

                    {/* Favorited Date */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Salvo em {new Date(property.favorited_at).toLocaleDateString('pt-BR')}
                      </p>
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
