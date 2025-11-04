import type { Json } from '@/integrations/supabase/types';
interface TrackingScripts {
    google_analytics?: string;
    facebook_pixel?: string;
    tiktok_pixel?: string;
    linkedin_insight?: string;
    google_ads?: string;
    pinterest_tag?: string;
    snapchat_pixel?: string;
    twitter_pixel?: string;
    header_scripts?: string;
    body_scripts?: string;
    footer_scripts?: string;
    custom_scripts?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
}
interface TrackingScriptsProps {
    trackingScripts?: TrackingScripts | Json | null;
}
declare const TrackingScripts: ({ trackingScripts }: TrackingScriptsProps) => import("react/jsx-runtime").JSX.Element;
export default TrackingScripts;
