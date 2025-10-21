
import { useState, useMemo } from 'react';
import PropertyCard from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/button';
import BackgroundRenderer from '@/components/backgrounds/BackgroundRenderer';
import SectionHeader from '@/components/common/SectionHeader';

interface Property {
  id: string;
  title: string;
  description: string;
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
}

interface BrokerProfile {
  id: string;
  business_name: string;
  display_name: string | null;
  about_text: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  background_image_url: string | null;
  overlay_color: string | null;
  overlay_opacity: string | null;
  whatsapp_button_text: string | null;
  whatsapp_button_color: string | null;
  address: string | null;
  cnpj: string | null;
  sections_background_style?: string | null;
  sections_background_color_1?: string | null;
  sections_background_color_2?: string | null;
  sections_background_color_3?: string | null;
}

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
  const ensurePropertyVisible = (propertyId: string) => {
    const propertyIndex = regularProperties.findIndex(p => p.id === propertyId);
    if (propertyIndex >= 0 && propertyIndex >= visibleCount) {
      console.log(`Expanding grid to show property ${propertyId} at index ${propertyIndex}`);
      setVisibleCount(Math.ceil((propertyIndex + 1) / 12) * 12);
    }
  };

  // Expose function globally for navigation restoration
  window.ensurePropertyVisible = ensurePropertyVisible;

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
        <div className="content-container">
        <SectionHeader
          title="Todos os Imóveis"
          subtitle="Explore nossa seleção completa de propriedades"
          className="mb-8"
        />

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 desktop-grid">
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
          <div className="text-center mt-6 sm:mt-8">
            <Button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-6 sm:px-8 py-2 text-sm sm:text-base"
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
