'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLeads = useLeads;
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const TenantContext_1 = require("../contexts/TenantContext");
function useLeads() {
    const { tenant } = (0, TenantContext_1.useTenant)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const submitLead = async (leadData) => {
        if (!tenant) {
            setError('Tenant não identificado');
            return false;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/public/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-domain': window.location.hostname
                },
                body: JSON.stringify({
                    ...leadData,
                    lead_source: 'website'
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao enviar contato');
            }
            const data = await response.json();
            setSuccess(true);
            logger_1.logger.info(`✅ Lead submitted successfully for ${tenant.business_name}`);
            return true;
        }
        catch (err) {
            logger_1.logger.error('Error submitting lead:', err);
            setError(err.message || 'Erro ao enviar contato');
            return false;
        }
        finally {
            setLoading(false);
        }
    };
    return {
        submitLead,
        loading,
        error,
        success
    };
}
