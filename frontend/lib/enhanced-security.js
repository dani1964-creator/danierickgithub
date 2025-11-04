"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSecurity = void 0;
const client_1 = require("@/integrations/supabase/client");
const security_monitor_1 = require("./security-monitor");
const logger_1 = require("@/lib/logger");
class EnhancedSecurity {
    /**
     * Securely get broker contact information with enhanced authentication and logging
     * This function now uses the new secure database function that properly controls access
     */
    static async getBrokerContactInfo(brokerSlug) {
        try {
            // Get current user for authentication check
            const { data: { user } } = await client_1.supabase.auth.getUser();
            const userAgent = navigator.userAgent;
            // Use the new secure function that properly validates access
            const { data, error } = await client_1.supabase.rpc('get_broker_contact_secure', {
                broker_website_slug: brokerSlug,
                requesting_user_id: user?.id || undefined
            });
            if (error) {
                logger_1.logger.error('Error fetching broker contact:', error);
                security_monitor_1.SecurityMonitor.logSuspiciousActivity('contact_fetch_error', {
                    broker_slug: brokerSlug,
                    error: error.message,
                    user_id: user?.id || 'anonymous'
                });
                return null;
            }
            if (data && data.length > 0) {
                const result = data[0];
                if (!result.access_granted) {
                    security_monitor_1.SecurityMonitor.logSuspiciousActivity('contact_access_denied', {
                        broker_slug: brokerSlug,
                        user_agent: userAgent,
                        reason: result.access_reason || 'unknown'
                    });
                    return null;
                }
                // Log successful contact access with the access reason
                security_monitor_1.SecurityMonitor.logEvent({
                    event_type: 'contact_info_accessed',
                    metadata: {
                        broker_slug: brokerSlug,
                        access_reason: result.access_reason,
                        success: true,
                        user_id: user?.id || 'anonymous'
                    }
                });
                return {
                    whatsapp_number: result.whatsapp_number,
                    contact_email: result.contact_email,
                    creci: result.creci,
                    access_allowed: result.access_granted
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Security error accessing broker contact:', error);
            security_monitor_1.SecurityMonitor.logSuspiciousActivity('contact_access_exception', {
                broker_slug: brokerSlug,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }
    /**
     * Get public broker branding information (safe, non-sensitive data only)
     */
    static async getPublicBrokerBranding(brokerSlug) {
        try {
            const { data, error } = await client_1.supabase.rpc('get_public_broker_branding_secure', {
                broker_website_slug: brokerSlug
            });
            if (error) {
                logger_1.logger.error('Error fetching broker branding:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        }
        catch (error) {
            logger_1.logger.error('Error accessing broker branding:', error);
            return null;
        }
    }
    /**
     * Get public properties using secure function (no sensitive broker data exposed)
     */
    static async getPublicProperties(limit = 50, offset = 0) {
        try {
            const { data, error } = await client_1.supabase.rpc('get_public_properties', {
                property_limit: limit,
                property_offset: offset
            });
            if (error) {
                logger_1.logger.error('Error fetching public properties:', error);
                security_monitor_1.SecurityMonitor.logSuspiciousActivity('property_fetch_error', {
                    error: error.message,
                    limit,
                    offset
                });
                return [];
            }
            return data || [];
        }
        catch (error) {
            logger_1.logger.error('Security error accessing properties:', error);
            security_monitor_1.SecurityMonitor.logSuspiciousActivity('property_access_exception', {
                error: error instanceof Error ? error.message : 'Unknown error',
                limit,
                offset
            });
            return [];
        }
    }
    /**
     * Enhanced property search with security logging
     */
    static async searchProperties(searchTerm, filters = {}, limit = 20) {
        try {
            // Log search activity for monitoring
            security_monitor_1.SecurityMonitor.logEvent({
                event_type: 'property_search',
                metadata: {
                    search_term: searchTerm.substring(0, 50), // Truncate for privacy
                    filters: filters,
                    results_limit: limit
                }
            });
            // Get all properties first, then filter (since we can't modify the RPC easily)
            const allProperties = await this.getPublicProperties(200, 0);
            let filteredProperties = allProperties;
            // Apply search filter
            if (searchTerm.trim()) {
                const searchLower = searchTerm.toLowerCase().trim();
                filteredProperties = filteredProperties.filter(property => property.title.toLowerCase().includes(searchLower) ||
                    property.description?.toLowerCase().includes(searchLower) ||
                    property.address.toLowerCase().includes(searchLower) ||
                    property.neighborhood?.toLowerCase().includes(searchLower) ||
                    property.city?.toLowerCase().includes(searchLower));
            }
            // Apply filters
            if (filters.property_type) {
                filteredProperties = filteredProperties.filter(p => p.property_type === filters.property_type);
            }
            if (filters.transaction_type) {
                filteredProperties = filteredProperties.filter(p => p.transaction_type === filters.transaction_type);
            }
            if (filters.min_price) {
                filteredProperties = filteredProperties.filter(p => p.price >= filters.min_price);
            }
            if (filters.max_price) {
                filteredProperties = filteredProperties.filter(p => p.price <= filters.max_price);
            }
            if (filters.bedrooms) {
                filteredProperties = filteredProperties.filter(p => p.bedrooms >= filters.bedrooms);
            }
            return filteredProperties.slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error('Security error in property search:', error);
            security_monitor_1.SecurityMonitor.logSuspiciousActivity('property_search_exception', {
                search_term: searchTerm.substring(0, 20),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }
    /**
     * Check if user has exceeded rate limits for sensitive operations
     */
    static async checkOperationRateLimit(operation) {
        try {
            const result = await security_monitor_1.SecurityMonitor.checkRateLimit({
                action: operation,
                max_requests: 10,
                window_minutes: 5
            });
            if (result.rate_limited) {
                security_monitor_1.SecurityMonitor.logSuspiciousActivity('operation_rate_limited', {
                    operation,
                    timestamp: new Date().toISOString()
                });
            }
            return result.allowed;
        }
        catch (error) {
            logger_1.logger.error('Rate limit check failed:', error);
            // On error, allow the operation but log it
            security_monitor_1.SecurityMonitor.logSuspiciousActivity('rate_limit_check_failed', {
                operation,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return true;
        }
    }
    /**
     * Enhanced form submission with security validation
     */
    static async secureFormSubmit(formType, formData, submitFunction) {
        try {
            // Check rate limits first
            const rateLimitOk = await this.checkOperationRateLimit(`form_${formType}`);
            if (!rateLimitOk) {
                return {
                    success: false,
                    error: 'Too many requests. Please try again later.'
                };
            }
            // Log form attempt
            security_monitor_1.SecurityMonitor.logEvent({
                event_type: 'form_submission_attempt',
                metadata: {
                    form_type: formType,
                    timestamp: new Date().toISOString()
                }
            });
            // Execute the form submission
            const result = await submitFunction();
            // Log success
            security_monitor_1.SecurityMonitor.logFormSubmission(formType, true);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error(`Secure form submission failed for ${formType}:`, error);
            // Log failure
            security_monitor_1.SecurityMonitor.logFormSubmission(formType, false);
            security_monitor_1.SecurityMonitor.logSuspiciousActivity('form_submission_error', {
                form_type: formType,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Form submission failed'
            };
        }
    }
}
exports.EnhancedSecurity = EnhancedSecurity;
