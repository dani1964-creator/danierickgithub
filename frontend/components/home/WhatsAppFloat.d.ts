interface BrokerProfile {
    id: string;
    business_name: string;
    whatsapp_button_color?: string | null;
    whatsapp_button_text?: string | null;
    address: string | null;
    cnpj: string | null;
}
interface BrokerContact {
    whatsapp_number: string | null;
    contact_email: string | null;
    creci: string | null;
}
interface WhatsAppFloatProps {
    brokerProfile: BrokerProfile | null;
    onContactRequest: () => Promise<BrokerContact | null>;
}
declare const WhatsAppFloat: ({ brokerProfile, onContactRequest }: WhatsAppFloatProps) => import("react/jsx-runtime").JSX.Element;
export default WhatsAppFloat;
