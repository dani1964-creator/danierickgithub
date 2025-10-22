export interface TenantData {
  id: string;
  name: string;
  business_name: string;
  email: string;
  website_slug: string;
  theme_settings: any;
  site_title?: string;
  site_description?: string;
  site_favicon_url?: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city: string | null;
  status: string | null;
  address: string | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  area_m2?: number | null;
  photos: string[] | null;
  property_type: string | null;
  year_built: number | null;
  garage_spots: number | null;
  parking_spaces?: number | null;
  amenities: string | null;
  broker_id: string;
  views_count: number | null;
  created_at: string;
  updated_at: string | null;
  // Campos extras para compatibilidade
  transaction_type?: string;
  uf?: string;
  is_featured?: boolean;
  main_image_url?: string;
  images?: string[];
  features?: string[];
  property_code?: string;
  slug?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_id: string;
  message: string | null;
  broker_id: string;
  created_at: string;
  deal_value: number | null;
  deal_closed_at: string | null;
  commission_value: number | null;
  status: string | null;
  updated_at: string | null;
  property?: Property | null;
}

export interface Realtor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  creci: string | null;
  bio: string | null;
  avatar_url: string | null;
  whatsapp_button_text: string;
  is_active: boolean;
  commission_percentage: number | null;
  broker_id: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerProfile {
  id: string;
  business_name: string;
  display_name: string | null;
  email: string;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  about_text: string | null;
  footer_text: string | null;
  whatsapp_number: string | null;
  creci: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
  whatsapp_button_text: string | null;
  whatsapp_button_color: string | null;
  sections_background_style?: string | null;
  sections_background_color_1?: string | null;
  sections_background_color_2?: string | null;
  sections_background_color_3?: string | null;
  website_slug?: string | null;
}
