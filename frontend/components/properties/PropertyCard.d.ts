import { Property } from '@shared/types/tenant';
import { BrokerProfile } from '@/shared/types/broker';
interface PropertyCardProps {
    id?: string;
    property: Property;
    brokerProfile: BrokerProfile | null;
    onContactLead: (propertyId: string) => void;
    onShare: (property: Property) => void;
    onFavorite: (propertyId: string) => void;
    isFavorited: (propertyId: string) => boolean;
    onImageClick: (images: string[], index: number, title: string) => void;
}
declare const PropertyCard: ({ id, property, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }: PropertyCardProps) => import("react/jsx-runtime").JSX.Element;
export default PropertyCard;
