import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';
type SocialLink = {
    id: string | number;
    platform: string;
    url: string;
};
interface FooterProps {
    brokerProfile: BrokerProfile | null;
    socialLinks?: SocialLink[];
    onContactRequest: () => Promise<BrokerContact | null>;
}
declare const Footer: ({ brokerProfile, socialLinks, onContactRequest }: FooterProps) => import("react/jsx-runtime").JSX.Element;
export default Footer;
