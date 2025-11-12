
import { useEffect } from 'react';
import PropertyCard from '@/components/properties/PropertyCard';
import BackgroundRenderer from '@/components/backgrounds/BackgroundRenderer';
import SectionHeader from '@/components/common/SectionHeader';
import { Property } from '@/shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';
import { logger } from '@/lib/logger';

interface FeaturedPropertiesProps {
  properties: Property[];
  brokerProfile: BrokerProfile | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: Property) => void;
  onFavorite: (propertyId: string) => void;
  isFavorited: (propertyId: string) => boolean;
  onImageClick: (images: string[], index: number, title: string) => void;
}

const FeaturedProperties = ({
  properties,
  brokerProfile,
  onContactLead,
  onShare,
  onFavorite,
  isFavorited,
  onImageClick
}: FeaturedPropertiesProps) => {
  // Filter featured properties (for now show all since we don't have is_featured field)
  const featuredProperties = properties.slice(0, 8);

  // Restaurar scroll ao voltar da página de detalhes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const lastViewedPropertyId = sessionStorage.getItem('lastViewedPropertyId');
    if (lastViewedPropertyId) {
      // Verificar se o imóvel está na seção de destaques
      const isFeatured = featuredProperties.some(p => p.id === lastViewedPropertyId);
      
      if (isFeatured) {
        logger.debug('Restoring scroll position to featured property:', lastViewedPropertyId);
        
        // Aguardar um pouco para o DOM atualizar
        setTimeout(() => {
          const propertyElement = document.getElementById(`property-featured-${lastViewedPropertyId}`);
          if (propertyElement) {
            // Scroll suave até o elemento com offset para header fixo
            const headerOffset = 100;
            const elementPosition = propertyElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            logger.debug('Scrolled to featured property:', lastViewedPropertyId);
            
            // Limpar o sessionStorage após o scroll
            sessionStorage.removeItem('lastViewedPropertyId');
          } else {
            logger.warn('Featured property element not found:', `property-featured-${lastViewedPropertyId}`);
          }
        }, 300);
      }
    }
  }, [featuredProperties]);

  if (featuredProperties.length === 0) return null;

  return (
    <section id="imoveis-destaque" className="bg-surface">
      <BackgroundRenderer
        style={brokerProfile?.sections_background_style || 'pro-minimal'}
        color1={brokerProfile?.sections_background_color_1 || brokerProfile?.primary_color || '#2563eb'}
        color2={brokerProfile?.sections_background_color_2 || brokerProfile?.secondary_color || '#64748b'}
        color3={brokerProfile?.sections_background_color_3 || '#ffffff'}
        className="py-16"
      >
        <div className="content-container">
          <SectionHeader
            title="Imóveis em Destaque"
            subtitle="Propriedades selecionadas especialmente para você"
            className="mb-8"
          />

          {/* Grid responsivo igual ao PropertiesGrid para consistência */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{
              gap: 'var(--spacing-6)',
            }}
          >
            {featuredProperties.map((property) => (
              <PropertyCard 
                key={property.id}
                id={`property-featured-${property.id}`}
                property={property} 
                brokerProfile={brokerProfile} 
                onContactLead={onContactLead}
                onShare={onShare}
                onFavorite={onFavorite}
                isFavorited={isFavorited}
                onImageClick={onImageClick}
              />
            ))}
          </div>
        </div>
      </BackgroundRenderer>
    </section>
  );
};

export default FeaturedProperties;
