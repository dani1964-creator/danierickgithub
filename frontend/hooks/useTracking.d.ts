declare global {
    interface Window {
        fbq?: (action: string, event: string, data?: Record<string, unknown>) => void;
        gtag?: (command: string, ...args: unknown[]) => void;
        ttq?: {
            track: (event: string, data?: Record<string, unknown>) => void;
            page: () => void;
        };
        lintrk?: (action: string, event: string, data?: Record<string, unknown>) => void;
        pintrk?: (action: string, event: string, data?: Record<string, unknown>) => void;
        snaptr?: (action: string, event: string, data?: Record<string, unknown>) => void;
        twq?: (action: string, event: string, data?: Record<string, unknown>) => void;
    }
}
export interface TrackingEvent {
    event: string;
    data?: Record<string, unknown>;
}
export declare const useTracking: () => {
    trackEvent: (event: TrackingEvent) => void;
    trackEventWithUTM: (event: TrackingEvent) => void;
    trackPropertyView: (propertyData: {
        property_id: string;
        title: string;
        price: number;
        type: string;
        city?: string;
    }) => void;
    trackPropertyInterest: (propertyData: {
        property_id: string;
        title: string;
        price: number;
        contact_method: "whatsapp" | "email" | "form";
    }) => void;
    trackSearch: (searchData: {
        search_term?: string;
        property_type?: string;
        location?: string;
        price_min?: number;
        price_max?: number;
    }) => void;
    trackContactForm: (formData: {
        form_name: string;
        property_id?: string;
    }) => void;
    trackWhatsAppClick: (data: {
        property_id?: string;
        source: string;
    }) => void;
    trackPageView: (pageData: {
        page_title: string;
        page_location: string;
        page_type?: string;
    }) => void;
    getUTMParameters: () => {
        utm_source: string;
        utm_medium: string;
        utm_campaign: string;
        utm_term: string;
        utm_content: string;
    };
    getStoredUTMData: () => any;
};
export default useTracking;
