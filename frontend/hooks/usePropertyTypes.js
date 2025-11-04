"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyTypes = usePropertyTypes;
const react_1 = require("react");
const utils_1 = require("@/lib/utils");
const client_1 = require("@/integrations/supabase/client");
const property_types_1 = require("@/components/properties/property-types");
function usePropertyTypes() {
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [types, setTypes] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                // Carrega apenas tipos globais ativos (broker_id IS NULL)
                const { data, error } = await client_1.supabase
                    .from('property_types')
                    .select('id, broker_id, value, label, group_label, is_active')
                    .is('broker_id', null)
                    .eq('is_active', true)
                    .order('group_label', { ascending: true })
                    .order('label', { ascending: true });
                if (error)
                    throw error;
                if (!cancelled)
                    setTypes(data || []);
            }
            catch (e) {
                if (!cancelled)
                    setError((0, utils_1.getErrorMessage)(e));
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);
    const groups = (0, react_1.useMemo)(() => {
        if (!types || types.length === 0)
            return property_types_1.PROPERTY_TYPE_GROUPS;
        // Merge by group_label preserving order
        const byGroup = new Map();
        for (const t of types) {
            const g = byGroup.get(t.group_label) || { label: t.group_label, options: [] };
            g.options.push({ value: t.value, label: t.label, id: t.id });
            byGroup.set(t.group_label, g);
        }
        return Array.from(byGroup.values());
    }, [types]);
    // Map value -> id for saving property_type_id if desired
    const valueToId = (0, react_1.useMemo)(() => {
        const map = new Map();
        if (types) {
            for (const t of types)
                map.set(t.value, t.id);
        }
        return map;
    }, [types]);
    return { groups, loading, error, valueToId };
}
