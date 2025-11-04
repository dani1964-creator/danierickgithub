import React from 'react';
import type { BrokerProfile } from '@src/types/broker';
type MinimalBrokerSEO = Partial<Pick<BrokerProfile, 'site_title' | 'site_description' | 'site_favicon_url' | 'site_share_image_url' | 'business_name' | 'logo_url' | 'website_slug'>>;
interface SEODebugPanelProps {
    brokerProfile: MinimalBrokerSEO | null;
    isVisible?: boolean;
}
export declare const SEODebugPanel: React.FC<SEODebugPanelProps>;
export {};
