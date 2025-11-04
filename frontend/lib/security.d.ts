export declare const sanitizeInput: (input: string) => string;
export declare const sanitizeHtml: (html: string) => string;
export declare const validateEmail: (email: string) => boolean;
export declare const validatePhone: (phone: string) => boolean;
export declare const validateRequired: (value: string) => boolean;
export declare const validateLength: (value: string, maxLength: number) => boolean;
export declare const checkRateLimit: (identifier: string, maxRequests?: number, windowMs?: number) => boolean;
export declare const contactFormSchema: {
    name: (value: string) => boolean;
    email: (value: string) => boolean;
    phone: (value: string) => boolean;
    message: (value: string) => boolean;
};
export declare const propertySearchSchema: {
    search: (value: string) => boolean;
    minPrice: (value: string) => boolean;
    maxPrice: (value: string) => boolean;
};
