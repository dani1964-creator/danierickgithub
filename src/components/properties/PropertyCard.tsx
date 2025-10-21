import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Bed, Bath, Car, Eye, Heart, Share2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SwipeableCarousel } from '@/components/ui/swipeable-carousel';
import { setPrefetchedDetail } from '@/lib/detail-prefetch';
import { supabase } from '@/integrations/supabase/client';
import { useDomainAware } from '@/hooks/useDomainAware';


interface PropertyCardProps {
  id?: string;
  property: {
    id: string;
    title: string;
    price: number;
    property_type: string;
    transaction_type: string;
    address: string;
    neighborhood: string;
    uf: string;
    bedrooms: number;
    bathrooms: number;
    area_m2: number;
    parking_spaces: number;
    is_featured: boolean;
    views_count: number;
    main_image_url: string;
    images: string[];
    features: string[];
    property_code?: string;
    slug?: string;
  };
  brokerProfile: {
    id: string;
    business_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    whatsapp_button_text: string | null;
    whatsapp_button_color: string | null;
  } | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: {
    id: string;
    title: string;
    price: number;
    property_type: string;
    transaction_type: string;
    address: string;
    neighborhood: string;
    uf: string;
    bedrooms: number;
    bathrooms: number;
    area_m2: number;
    parking_spaces: number;
    is_featured: boolean;
    views_count: number;
    main_image_url: string;
    images: string[];
    features: string[];
    property_code?: string;
    slug?: string;
  }) => void;
  onFavorite: (propertyId: string) => void;
  isFavorited: (propertyId: string) => boolean;
  onImageClick: (images: string[], index: number, title: string) => void;
}

const PropertyCard = ({ 
  id,
  property, 
  brokerProfile, 
  onContactLead, 
  onShare, 
  onFavorite, 
  isFavorited, 
  onImageClick 
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { isCustomDomain, getBrokerByDomainOrSlug } = useDomainAware();

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
      const propertySlug = property.slug || property.id;
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
    // Dispara prefetch e navega em seguida
    prefetchDetail();
    const propertySlug = property.slug || property.id;
    if (isCustomDomain()) {
      navigate(`/${propertySlug}`);
    } else {
      navigate(`/${slug}/${propertySlug}`);
    }
  };

  return (
    <Card 
      id={id}
      className="overflow-hidden transition-all duration-300 group hover:shadow-soft-3 hover:scale-[1.02] cursor-pointer bg-background dark:bg-card"
      onClick={handleViewDetails}
      onMouseEnter={prefetchDetail}
    >
      {/* Layout sempre vertical para melhor experiência */}
      <div className="flex flex-col h-full">
        {/* Container da imagem - proporção 4:3 */}
        <div className="relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden">
          {propertyImages.length > 0 ? (
            <img
              src={propertyImages[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Sem imagem</span>
            </div>
          )}
          
          {/* Badges e botões sobrepostos */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-wrap gap-1.5">
              {/* Badge Destaque (apenas para propriedades em destaque) */}
              {property.is_featured && (
                <Badge 
                  className="text-white border-0 text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: brokerProfile?.primary_color || '#2563eb' }}
                >
                  Destaque
                </Badge>
              )}
              
              {/* Badge Tipo de Transação */}
              <Badge 
                className="text-white border-0 text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ backgroundColor: property.transaction_type === 'sale' ? '#10b981' : '#8b5cf6' }}
              >
                {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
              </Badge>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 bg-background/90 border-0 text-muted-foreground hover:bg-background hover:text-red-500 backdrop-blur-sm rounded-lg transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(property.id);
                }}
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorited(property.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 bg-background/90 border-0 text-muted-foreground hover:bg-background hover:text-primary backdrop-blur-sm rounded-lg transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(property);
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Contador de visualizações e fotos */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            <div className="flex items-center text-muted-foreground text-xs bg-background/90 px-2 py-1 rounded-md backdrop-blur-sm">
              <Eye className="h-3 w-3 mr-1" />
              <span>{property.views_count || 0}</span>
            </div>
            {propertyImages.length > 1 && (
              <div className="bg-background/90 text-muted-foreground text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                +{propertyImages.length - 1} fotos
              </div>
            )}
          </div>
        </div>

        {/* Container das informações - bem organizado */}
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Título e localização */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base line-clamp-2 leading-tight text-foreground">
              {property.title}
            </h3>
            
            <p className="text-xs text-muted-foreground flex items-center">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{property.neighborhood}, {property.uf}</span>
            </p>
          </div>
          
          {/* Preço destacado */}
          <div className="py-1">
            <p className="text-lg font-bold text-foreground">
              {formatPrice(property.price)}
            </p>
            {property.property_code && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Código: {property.property_code}
              </p>
            )}
          </div>
          
          {/* Características do imóvel */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {property.bedrooms > 0 && (
              <div className="flex items-center space-x-1">
                <Bed className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center space-x-1">
                <Bath className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{property.bathrooms}</span>
              </div>
            )}
            {property.parking_spaces > 0 && (
              <div className="flex items-center space-x-1">
                <Car className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{property.parking_spaces}</span>
              </div>
            )}
            {property.area_m2 && (
              <div className="flex items-center space-x-1">
                <Square className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{property.area_m2}m²</span>
              </div>
            )}
          </div>

          {/* Botão Ver Detalhes */}
          <Button
            className="w-full text-sm font-medium h-10 rounded-lg transition-all duration-200 mt-4"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            style={{ 
              backgroundColor: brokerProfile?.primary_color || '#2563eb',
              borderColor: brokerProfile?.primary_color || '#2563eb',
              color: 'white'
            }}
          >
            Ver Detalhes Completos
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};

export default PropertyCard;