interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (leadData: {
        broker_id: string;
        property_id: string | null;
        name: string;
        email: string;
        phone: string | null;
        message: string;
        source: string;
        status: string;
    }) => void;
    brokerProfile: {
        id: string;
        business_name: string;
        primary_color?: string;
        secondary_color?: string;
        logo_url?: string;
    };
    property?: {
        id: string;
        title: string;
    };
    source?: string;
}
declare const LeadModal: ({ isOpen, onClose, onSuccess, brokerProfile, property, source }: LeadModalProps) => import("react/jsx-runtime").JSX.Element;
export default LeadModal;
