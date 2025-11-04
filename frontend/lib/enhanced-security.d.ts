export interface ContactAccessResult {
    whatsapp_number: string | null;
    contact_email: string | null;
    creci: string | null;
    access_allowed: boolean;
}
export interface PublicProperty {
    id: string;
    title: string;
    description: string;
    property_type: string;
    transaction_type: string;
    address: string;
    neighborhood: string;
    city: string;
    uf: string;
    main_image_url: string;
    images: string[];
    features: string[];
    price: number;
    bedrooms: number;
    bathrooms: number;
    parking_spaces: number;
    area_m2: number;
    views_count: number;
    is_featured: boolean;
    status: string;
    slug: string;
    property_code: string;
    created_at: string;
    updated_at: string;
    broker_business_name: string;
    broker_website_slug: string;
    broker_display_name: string;
}
export declare class EnhancedSecurity {
    /**
     * Securely get broker contact information with enhanced authentication and logging
     * This function now uses the new secure database function that properly controls access
     */
    static getBrokerContactInfo(brokerSlug: string): Promise<ContactAccessResult | null>;
    /**
     * Get public broker branding information (safe, non-sensitive data only)
     */
    static getPublicBrokerBranding(brokerSlug: string): Promise<any>;
    /**
     * Get public properties using secure function (no sensitive broker data exposed)
     */
    static getPublicProperties(limit?: number, offset?: number): Promise<PublicProperty[]>;
    /**
     * Enhanced property search with security logging
     */
    static searchProperties(searchTerm: string, filters?: {
        property_type?: string;
        transaction_type?: string;
        min_price?: number;
        max_price?: number;
        bedrooms?: number;
    }, limit?: number): Promise<PublicProperty[]>;
    /**
     * Check if user has exceeded rate limits for sensitive operations
     */
    static checkOperationRateLimit(operation: string): Promise<boolean>;
    /**
     * Enhanced form submission with security validation
     */
    static secureFormSubmit<T>(formType: string, formData: Record<string, unknown>, submitFunction: () => Promise<T>): Promise<{
        success: boolean;
        data?: T;
        error?: string;
    }>;
}
