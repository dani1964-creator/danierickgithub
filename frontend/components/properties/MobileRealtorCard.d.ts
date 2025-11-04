interface Property {
    id: string;
    title: string;
    price: number;
    property_code: string;
    realtor_name?: string;
    realtor_avatar_url?: string;
    realtor_creci?: string;
    realtor_bio?: string;
    realtor_whatsapp_button_text?: string;
}
interface BrokerProfile {
    id: string;
    business_name: string;
    logo_url: string | null;
    primary_color: string | null;
    whatsapp_button_color: string | null;
    whatsapp_button_text: string | null;
}
interface MobileRealtorCardProps {
    property: Property;
    brokerProfile: BrokerProfile;
    onWhatsAppClick: () => void;
}
declare const MobileRealtorCard: ({ property, brokerProfile, onWhatsAppClick }: MobileRealtorCardProps) => import("react/jsx-runtime").JSX.Element;
export default MobileRealtorCard;
