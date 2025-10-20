import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PROPERTY_TYPE_GROUPS, PropertyTypeGroup } from '@/components/properties/property-types';

type DbPropertyType = {
  id: string;
  broker_id: string | null;
  value: string;
  label: string;
  group_label: string;
  is_active: boolean;
};

export function usePropertyTypes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<DbPropertyType[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Carrega apenas tipos globais ativos (broker_id IS NULL)
        const { data, error } = await supabase
          .from('property_types')
          .select('id, broker_id, value, label, group_label, is_active')
          .is('broker_id', null)
          .eq('is_active', true)
          .order('group_label', { ascending: true })
          .order('label', { ascending: true });

        if (error) throw error;

        if (!cancelled) setTypes(data || []);
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups: PropertyTypeGroup[] = useMemo(() => {
    if (!types || types.length === 0) return PROPERTY_TYPE_GROUPS;

    // Merge by group_label preserving order
    const byGroup = new Map<string, { label: string; options: { value: string; label: string; id?: string }[] }>();
    for (const t of types) {
      const g = byGroup.get(t.group_label) || { label: t.group_label, options: [] };
      g.options.push({ value: t.value, label: t.label, id: t.id });
      byGroup.set(t.group_label, g);
    }
    return Array.from(byGroup.values());
  }, [types]);

  // Map value -> id for saving property_type_id if desired
  const valueToId = useMemo(() => {
    const map = new Map<string, string>();
    if (types) {
      for (const t of types) map.set(t.value, t.id);
    }
    return map;
  }, [types]);

  return { groups, loading, error, valueToId };
}
