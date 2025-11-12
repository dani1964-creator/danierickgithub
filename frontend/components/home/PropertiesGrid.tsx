
import { useState, useMemo, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import PropertyCard from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/button';
import BackgroundRenderer from '@/components/backgrounds/BackgroundRenderer';
import SectionHeader from '@/components/common/SectionHeader';
import { Property } from '@/shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';

interface PropertiesGridProps {
  properties: Property[];
  brokerProfile: BrokerProfile | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: Property) => void;
  onFavorite: (propertyId: string) => void;
  isFavorited: (propertyId: string) => boolean;
  onImageClick: (images: string[], index: number, title: string) => void;
}

declare global {
  interface Window {
    ensurePropertyVisible?: (propertyId: string) => void;
  }
}

const PropertiesGrid = ({
  properties,
  brokerProfile,
  onContactLead,
  onShare,
  onFavorite,
  isFavorited,
  onImageClick
}: PropertiesGridProps) => {
  const regularProperties = properties.filter(p => !p.is_featured);
  const [visibleCount, setVisibleCount] = useState(12); // Mostrar apenas 12 inicialmente

  const visibleProperties = useMemo(() => 
    regularProperties.slice(0, visibleCount), 
    [regularProperties, visibleCount]
  );

  // Function to ensure specific property is visible
  const ensurePropertyVisible = useCallback((propertyId: string) => {
    const propertyIndex = regularProperties.findIndex(p => p.id === propertyId);
    if (propertyIndex >= 0 && propertyIndex >= visibleCount) {
      logger.debug(`Expanding grid to show property ${propertyId} at index ${propertyIndex}`);
      setVisibleCount(Math.ceil((propertyIndex + 1) / 12) * 12);
    }
  }, [regularProperties, visibleCount]);

  // Expose function globally for navigation restoration
  useEffect(() => {
    // Re-assign to ensure latest closure is used by external callers
    window.ensurePropertyVisible = ensurePropertyVisible;
    return () => {
      // Clean up global to avoid stale refs
      if (window.ensurePropertyVisible === ensurePropertyVisible) {
        delete window.ensurePropertyVisible;
      }
    };
  }, [ensurePropertyVisible]);

  // Restaurar scroll ao voltar da página de detalhes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const lastViewedPropertyId = sessionStorage.getItem('lastViewedPropertyId');
    if (lastViewedPropertyId) {
      logger.debug('Restoring scroll position to property:', lastViewedPropertyId);
      
      // Primeiro, garantir que o imóvel está visível no grid
      ensurePropertyVisible(lastViewedPropertyId);
      
      // Aguardar um pouco para o DOM atualizar
      setTimeout(() => {
        const propertyElement = document.getElementById(`property-${lastViewedPropertyId}`);
        if (propertyElement) {
          // Scroll suave até o elemento com offset para header fixo
          const headerOffset = 100; // Espaço para o header fixo
          const elementPosition = propertyElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          logger.debug('Scrolled to property:', lastViewedPropertyId);
        } else {
          logger.warn('Property element not found:', `property-${lastViewedPropertyId}`);
        }
        
        // Limpar o sessionStorage após o scroll
        sessionStorage.removeItem('lastViewedPropertyId');
      }, 300); // Delay para garantir que o grid foi expandido
    }
  }, [ensurePropertyVisible]); // Executa quando ensurePropertyVisible (e suas deps) mudam

  const hasMoreProperties = regularProperties.length > visibleCount;

  if (regularProperties.length === 0) return null;

  return (
  <section id="todos-imoveis" className="bg-surface">
      <BackgroundRenderer
        style={brokerProfile?.sections_background_style || 'pro-minimal'}
        color1={brokerProfile?.sections_background_color_1 || brokerProfile?.primary_color || '#2563eb'}
        color2={brokerProfile?.sections_background_color_2 || brokerProfile?.secondary_color || '#64748b'}
        color3={brokerProfile?.sections_background_color_3 || '#ffffff'}
        className="py-16"
      >
        <div className="ds-container">
        <SectionHeader
          title="Todos os Imóveis"
          subtitle="Explore nossa seleção completa de propriedades"
          className="mb-8"
        />

        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{
            gap: 'var(--spacing-6)',
            marginBottom: 'var(--spacing-12)'
          }}
        >
          {visibleProperties.map((property) => (
            <PropertyCard 
              key={property.id}
              id={`property-${property.id}`}
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

        {hasMoreProperties && (
          <div className="text-center">
            <Button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-8 py-3 text-base font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ 
                backgroundColor: brokerProfile?.primary_color || '#2563eb',
                borderColor: brokerProfile?.primary_color || '#2563eb',
                color: 'white'
              }}
            >
              <span className="hidden sm:inline">Ver Mais Imóveis ({regularProperties.length - visibleCount} restantes)</span>
              <span className="sm:hidden">Ver Mais ({regularProperties.length - visibleCount})</span>
            </Button>
          </div>
        )}

        </div>
      </BackgroundRenderer>
    </section>
  );
};

export default PropertiesGrid;
