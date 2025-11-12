import { useState } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Bed, Bath, Car, Eye, Heart, Share2, Square } from 'lucide-react';
import { setPrefetchedDetail } from '@/lib/detail-prefetch';
import { supabase } from '@/integrations/supabase/client';
import { useDomainAware } from '@/hooks/useDomainAware';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { SafeImage } from '@/components/ui/SafeImage';
import { Property } from '@/shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  id?: string;
  property: Property;
  brokerProfile: BrokerProfile | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: Property) => void;
  onFavorite?: (propertyId: string) => void; // Mantido para compatibilidade
  isFavorited?: (propertyId: string) => boolean; // Mantido para compatibilidade
  onImageClick: (images: string[], index: number, title: string) => void;
}

const PropertyCard = ({ 
  id,
  property, 
  brokerProfile, 
  onContactLead, 
  onShare, 
  onImageClick 
}: PropertyCardProps) => {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const { isCustomDomain, getBrokerByDomainOrSlug } = useDomainAware();
  const { toggleFavorite, isFavorited } = useFavorites();
  const notifications = useNotifications();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const propertyImages = property.images && property.images.length > 0 
    ? property.images 
    : property.main_image_url 
      ? [property.main_image_url] 
      : [];

  const prefetchDetail = async () => {
    try {
      // Determina o slug efetivo do corretor
      let effectiveSlug = slug as string | undefined;
      if (isCustomDomain() || !effectiveSlug) {
        const broker = await getBrokerByDomainOrSlug(undefined);
        effectiveSlug = (broker as unknown as { website_slug?: string })?.website_slug || effectiveSlug;
      }
      const propertySlug = property.slug;
      if (!effectiveSlug || !propertySlug) return;
      // Busca RPCs em paralelo
      const [propertyResult, brokerResult] = await Promise.all([
        supabase.rpc('get_public_property_detail_with_realtor', {
          broker_slug: effectiveSlug,
          property_slug: propertySlug,
        }),
        supabase.rpc('get_public_broker_branding', { broker_website_slug: effectiveSlug }),
      ]);
      const { data: propertyArr } = propertyResult;
      const { data: brokerArr } = brokerResult;
      if (propertyArr && propertyArr[0] && brokerArr && brokerArr[0]) {
        setPrefetchedDetail(effectiveSlug, propertySlug, {
          property: propertyArr[0],
          brokerProfile: brokerArr[0] as any,
        });
      }
    } catch (e) {
      // ignora erros de prefetch
    }
  };

  const handleViewDetails = async () => {
    // Salva o ID do imóvel para restaurar a posição ao voltar
    if (typeof window !== 'undefined' && property.id) {
      sessionStorage.setItem('lastViewedPropertyId', property.id);
    }
    
    // Dispara prefetch e navega em seguida
    prefetchDetail();
    const propertySlug = property.slug;
    // Em subdomínios (*.adminimobiliaria.site), o slug está no host, não na URL
    // Apenas em domínios customizados precisamos incluir o broker slug na URL
    if (isCustomDomain()) {
      router.push(`/${brokerProfile?.website_slug || slug || ''}/${propertySlug}`);
    } else {
      router.push(`/${propertySlug}`);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita navegação ao clicar no coração
    
    // Usa brokerProfile.website_slug (mais confiável) ou fallback para slug da URL
    const brokerSlug = brokerProfile?.website_slug || slug;
    
    if (!brokerSlug) {
      notifications.showError('Erro ao favoritar', 'Não foi possível identificar a imobiliária.');
      return;
    }

    const isNowFavorited = toggleFavorite({
      id: property.id,
      slug: property.slug || '',
      title: property.title,
      price: property.price,
      main_image_url: property.main_image_url || propertyImages[0] || '',
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area_m2: property.area_m2,
      city: property.city || '',
      uf: property.uf,
      broker_slug: String(brokerSlug),
    });

    if (isNowFavorited) {
      notifications.showFavoriteAdded();
    } else {
      notifications.showFavoriteRemoved();
    }
  };

  return (
    <div 
      id={id}
      className="property-card-premium"
      onClick={handleViewDetails}
      onMouseEnter={prefetchDetail}
    >
      {/* Image Container com Aspect Ratio 4:3 */}
      <div className="property-card-image">
        {propertyImages.length > 0 ? (
          <SafeImage
            src={propertyImages[0]}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            fallbackColor={brokerProfile?.primary_color}
          />
        ) : (
          <div className="property-card-no-image">
            <span>Sem imagem</span>
          </div>
        )}
        
        {/* Badges Premium */}
        <div className="property-card-badges">
          {property.is_featured && (
            <div className="property-card-badge property-card-badge--featured">
              Destaque
            </div>
          )}
          <div className={`property-card-badge ${property.transaction_type === 'sale' ? 'property-card-badge--sale' : 'property-card-badge--rent'}`}>
            {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
          </div>
        </div>

        {/* Action Buttons Premium */}
        <div className="property-card-actions">
          <button
            className={cn(
              "property-card-action property-card-action--favorite",
              isFavorited(property.id) && "is-favorited"
            )}
            onClick={handleFavoriteClick}
            title={isFavorited(property.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={cn("h-4 w-4", isFavorited(property.id) && "fill-current")} />
          </button>
          <button
            className="property-card-action property-card-action--share"
            onClick={(e) => {
              e.stopPropagation();
              onShare(property);
            }}
            title="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        
        {/* Info Badges no Bottom */}
        <div className="property-card-info">
          <Eye className="h-3 w-3" />
          <span>{property.views_count || 0}</span>
        </div>
        
        {propertyImages.length > 1 && (
          <div className="property-card-photo-count">
            +{propertyImages.length - 1} fotos
          </div>
        )}
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
            <span className="truncate">{property.neighborhood}, {property.uf}</span>
          </div>
        </div>
        
        {/* Preço Premium */}
        <div className="property-card-price">
          {formatPrice(property.price)}
        </div>
        
        {property.property_code && (
          <p className="text-xs text-neutral-500 -mt-2">
            Código: {property.property_code}
          </p>
        )}
        
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
          {property.parking_spaces > 0 && (
            <div className="property-card-feature">
              <Car className="h-4 w-4" />
              <span>{property.parking_spaces}</span>
            </div>
          )}
          {property.area_m2 && (
            <div className="property-card-feature">
              <Square className="h-4 w-4" />
              <span>{property.area_m2}m²</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;