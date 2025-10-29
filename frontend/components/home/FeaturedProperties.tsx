
import { SwipeableCarousel } from '@/components/ui/swipeable-carousel';
import PropertyCard from '@/components/properties/PropertyCard';
import BackgroundRenderer from '@/components/backgrounds/BackgroundRenderer';
import SectionHeader from '@/components/common/SectionHeader';
import { Property } from '@shared/types/tenant';
import { BrokerProfile } from '@src/types/broker';

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

          <SwipeableCarousel autoplay={true} autoplayDelay={5000}>
            {featuredProperties.map((property) => (
              <div key={property.id} className="flex-none w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 px-1 sm:px-2">
                <PropertyCard 
                  id={`property-featured-${property.id}`}
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
          </SwipeableCarousel>
        </div>
      </BackgroundRenderer>
    </section>
  );
};

export default FeaturedProperties;
