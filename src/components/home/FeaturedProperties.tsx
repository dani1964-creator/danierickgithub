
import { SwipeableCarousel } from '@/components/ui/swipeable-carousel';
import PropertyCard from '@/components/properties/PropertyCard';
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
  const featuredProperties = properties.filter(p => p.is_featured);

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
          subtitle="Selecionamos os melhores imóveis para você"
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
