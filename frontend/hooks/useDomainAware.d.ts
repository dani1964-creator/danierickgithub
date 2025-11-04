export declare function useDomainAware(): {
    getCurrentDomain: () => any;
    isCustomDomain: () => any;
    getBrokerByDomainOrSlug: (slug?: string) => Promise<any>;
    getPropertiesByDomainOrSlug: (slug?: string, limit?: number, offset?: number) => Promise<any>;
    getBrokerContactInfo: (slug?: string) => Promise<any>;
};
