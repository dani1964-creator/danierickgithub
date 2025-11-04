interface UseSecureDataOptions {
    enabled?: boolean;
    refetchInterval?: number;
    onError?: (error: Error) => void;
}
export declare function useSecureProperties(limit?: number, options?: UseSecureDataOptions): {
    data: PublicProperty[];
    loading: boolean;
    error: Error;
    refetch: () => Promise<void>;
};
export declare function useSecureBrokerContact(brokerSlug: string | null): {
    contactInfo: any;
    loading: boolean;
    error: Error;
    fetchContactInfo: () => Promise<any>;
};
export declare function useSecurePropertySearch(): {
    results: PublicProperty[];
    loading: boolean;
    error: Error;
    search: (searchTerm: string, filters?: Record<string, unknown>, limit?: number) => Promise<any>;
};
export {};
