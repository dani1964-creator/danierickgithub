import type { BrokerProfile } from '@/shared/types/broker';
interface HeroBannerProps {
    brokerProfile: BrokerProfile;
    onContactClick?: () => void;
}
declare const HeroBanner: ({ brokerProfile, onContactClick }: HeroBannerProps) => import("react/jsx-runtime").JSX.Element;
export default HeroBanner;
