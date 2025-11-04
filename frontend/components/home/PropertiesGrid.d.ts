import { Property } from '@shared/types/tenant';
import { BrokerProfile } from '@src/types/broker';
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
declare const PropertiesGrid: ({ properties, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }: PropertiesGridProps) => import("react/jsx-runtime").JSX.Element;
export default PropertiesGrid;
