import { useEffect } from 'react';
import PropertyCard from '@/components/properties/PropertyCard';
import BackgroundRenderer from '@/components/backgrounds/BackgroundRenderer';
import SectionHeader from '@/components/common/SectionHeader';
import { Property } from '@/shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';
import { logger } from '@/lib/logger';

interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
}

interface CategorySectionProps {
  category: PropertyCategory;
  properties: Property[];
  brokerProfile: BrokerProfile | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: Property) => void;
  onFavorite: (propertyId: string) => void;
  isFavorited: (propertyId: string) => boolean;
  onImageClick: (images: string[], index: number, title: string) => void;
  isDarkMode?: boolean;
}

const CategorySection = ({
  category,
  properties,
  brokerProfile,
  onContactLead,
  onShare,
  onFavorite,
  isFavorited,
  onImageClick,
  isDarkMode = false
}: CategorySectionProps) => {
  // Restaurar scroll ao voltar da página de detalhes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const lastViewedPropertyId = sessionStorage.getItem('lastViewedPropertyId');
    if (lastViewedPropertyId) {
      // Verificar se o imóvel está nesta categoria
      const isInCategory = properties.some(p => p.id === lastViewedPropertyId);
      
      if (isInCategory) {
        logger.debug(`Restoring scroll position to property in category ${category.slug}:`, lastViewedPropertyId);
        
        // Aguardar um pouco para o DOM atualizar
        setTimeout(() => {
          const propertyElement = document.getElementById(`property-${category.slug}-${lastViewedPropertyId}`);
          if (propertyElement) {
            // Scroll suave até o elemento com offset para header fixo
            const headerOffset = 100;
            const elementPosition = propertyElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            logger.debug('Scrolled to property:', lastViewedPropertyId);
            
            // Limpar o sessionStorage após o scroll
            sessionStorage.removeItem('lastViewedPropertyId');
          }
        }, 300);
      }
    }
  }, [category.slug, properties]);

  if (properties.length === 0) return null;

  return (
    <section id={`categoria-${category.slug}`} className="bg-surface">
      <BackgroundRenderer
        style={brokerProfile?.sections_background_style || 'pro-minimal'}
        color1={brokerProfile?.sections_background_color_1 || category.color || brokerProfile?.primary_color || '#2563eb'}
        color2={brokerProfile?.sections_background_color_2 || brokerProfile?.secondary_color || '#64748b'}
        color3={brokerProfile?.sections_background_color_3 || '#ffffff'}
        className="py-16"
      >
        <div className="content-container">
          <SectionHeader
            title={category.name}
            subtitle={category.description || `Explore nossos imóveis em ${category.name.toLowerCase()}`}
            className="mb-8"
          />

          {/* Grid responsivo - Desktop usa grid, Mobile usa carousel com peek */}
          
          {/* Mobile: Carousel com peek (mostra laterais) */}
          <div className="block sm:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-4 px-6">
              {properties.map((property) => (
                <div 
                  key={property.id}
                  className="flex-shrink-0 snap-center"
                  style={{ 
                    width: 'calc(100vw - 80px)'
                  }}
                >
                  <PropertyCard 
                    id={`property-${category.slug}-${property.id}`}
                    property={property} 
                    brokerProfile={brokerProfile} 
                    onContactLead={onContactLead}
                    onShare={onShare}
                    onFavorite={onFavorite}
                    isFavorited={isFavorited}
                    onImageClick={onImageClick}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tablet e Desktop: Grid normal */}
          <div 
            className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{
              gap: 'var(--space-6)',
            }}
          >
            {properties.map((property) => (
              <PropertyCard 
                key={property.id}
                id={`property-${category.slug}-${property.id}`}
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

export default CategorySection;
