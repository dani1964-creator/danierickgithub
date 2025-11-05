import type { Database } from '@/integrations/supabase/types';

// Fonte única de verdade para o perfil da imobiliária/corretor
export type BrokerProfile = Database['public']['Tables']['brokers']['Row'];

// Tipo compartilhado para contatos públicos do corretor (RPC get_public_broker_contact)
export interface BrokerContact {
  whatsapp_number: string | null;
  contact_email: string | null;
  creci: string | null;
}
