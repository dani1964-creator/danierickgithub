import type { Database } from '../../frontend/integrations/supabase/types';

// Fonte única de verdade para o perfil da imobiliária/corretor
export type BrokerProfile = Database['public']['Tables']['brokers']['Row'] & {
  // Campos adicionados recentemente que podem não estar nos types gerados ainda
  header_brand_image_url?: string | null;
  detail_header_text_color?: string | null;
  detail_button_color?: string | null;
  search_button_color?: string | null;
};

// Tipo compartilhado para contatos públicos do corretor (RPC get_public_broker_contact)
export interface BrokerContact {
  whatsapp_number: string | null;
  contact_email: string | null;
  creci: string | null;
}

// Tipos adicionais para broker management
export interface BrokerData {
  id: string;
  business_name: string;
  email: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  website_slug?: string;
  properties_count?: number;
  display_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  about_text?: string | null;
  footer_text?: string | null;
  whatsapp_number?: string | null;
  creci?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
  logo_size?: number | null;
  header_brand_image_url?: string | null; // Logo + nome combinado em uma imagem
  detail_header_text_color?: string | null;
  detail_button_color?: string | null;
  search_button_color?: string | null;
  whatsapp_button_text?: string | null;
  whatsapp_button_color?: string | null;
  sections_background_style?: string | null;
  sections_background_color_1?: string | null;
  sections_background_color_2?: string | null;
  sections_background_color_3?: string | null;
}