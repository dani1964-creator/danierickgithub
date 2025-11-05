import { Property } from '@shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';
interface FeaturedPropertiesProps {
    properties: Property[];
    brokerProfile: BrokerProfile | null;
    onContactLead: (propertyId: string) => void;
    onShare: (property: Property) => void;
    onFavorite: (propertyId: string) => void;
    isFavorited: (propertyId: string) => boolean;
    onImageClick: (images: string[], index: number, title: string) => void;
}
declare const FeaturedProperties: ({ properties, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }: FeaturedPropertiesProps) => import("react/jsx-runtime").JSX.Element;
export default FeaturedProperties;
