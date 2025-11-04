"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMonitor = void 0;
const client_1 = require("@/integrations/supabase/client");
const utils_1 = require("@/lib/utils");
const logger_1 = require("@/lib/logger");
class SecurityMonitor {
    static async logEvent(event) {
        try {
            const { data, error } = await client_1.supabase.functions.invoke('security-monitor', {
                body: {
                    ...event,
                    user_agent: navigator.userAgent,
                    user_id: (await client_1.supabase.auth.getUser()).data.user?.id
                }
            });
            if (error) {
                logger_1.logger.error('Failed to log security event:', error);
                return false;
            }
            return data?.success || false;
        }
        catch (error) {
            logger_1.logger.error('Security monitor error:', (0, utils_1.getErrorMessage)(error));
            return false;
        }
    }
    static async checkRateLimit(options) {
        try {
            const user = (await client_1.supabase.auth.getUser()).data.user;
            const identifier = user?.id || 'anonymous';
            const { data, error } = await client_1.supabase.functions.invoke('rate-limiter', {
                body: {
                    identifier,
                    ...options
                }
            });
            if (error) {
                logger_1.logger.error('Rate limit check failed:', error);
                // On error, allow the request but log it
                this.logEvent({
                    event_type: 'rate_limit_error',
                    metadata: { error: error.message, action: options.action }
                });
                return { allowed: true, rate_limited: false };
            }
            return {
                allowed: data?.allowed || false,
                rate_limited: data?.rate_limited || false
            };
        }
        catch (error) {
            logger_1.logger.error('Rate limiter error:', (0, utils_1.getErrorMessage)(error));
            return { allowed: true, rate_limited: false };
        }
    }
    // Predefined event types
    static async logAuthAttempt(success, email) {
        return this.logEvent({
            event_type: success ? 'auth_success' : 'auth_failure',
            endpoint: '/auth',
            metadata: { success, email: email ? email.substring(0, 3) + '***' : undefined }
        });
    }
    static async logFormSubmission(formType, success) {
        return this.logEvent({
            event_type: 'form_submission',
            metadata: { form_type: formType, success }
        });
    }
    static async logSuspiciousActivity(activity, details) {
        return this.logEvent({
            event_type: 'suspicious_activity',
            metadata: { activity, ...details }
        });
    }
    // Rate limiting helpers
    static async checkAuthRateLimit() {
        return this.checkRateLimit({
            action: 'auth_attempt',
            max_requests: 5,
            window_minutes: 5
        });
    }
    static async checkContactFormRateLimit() {
        return this.checkRateLimit({
            action: 'contact_form',
            max_requests: 30,
            window_minutes: 10
        });
    }
}
exports.SecurityMonitor = SecurityMonitor;
