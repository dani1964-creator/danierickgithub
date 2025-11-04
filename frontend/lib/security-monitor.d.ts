interface SecurityEvent {
    event_type: string;
    endpoint?: string;
    metadata?: Record<string, unknown>;
}
interface RateLimitOptions {
    action: string;
    max_requests?: number;
    window_minutes?: number;
}
export declare class SecurityMonitor {
    static logEvent(event: SecurityEvent): Promise<boolean>;
    static checkRateLimit(options: RateLimitOptions): Promise<{
        allowed: boolean;
        rate_limited: boolean;
    }>;
    static logAuthAttempt(success: boolean, email?: string): Promise<boolean>;
    static logFormSubmission(formType: string, success: boolean): Promise<boolean>;
    static logSuspiciousActivity(activity: string, details?: Record<string, unknown>): Promise<boolean>;
    static checkAuthRateLimit(): Promise<{
        allowed: boolean;
        rate_limited: boolean;
    }>;
    static checkContactFormRateLimit(): Promise<{
        allowed: boolean;
        rate_limited: boolean;
    }>;
}
export {};
