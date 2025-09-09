-- Add is_super_admin field to brokers table for super admin identification
ALTER TABLE public.brokers 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_email = 'erickjq123@gmail.com';
$$;

-- Create function to get all brokers for super admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_brokers_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  business_name text,
  display_name text,
  email text,
  website_slug text,
  phone text,
  whatsapp_number text,
  contact_email text,
  is_active boolean,
  plan_type text,
  max_properties integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  properties_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow access if user is super admin
  IF NOT public.is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.business_name,
    b.display_name,
    b.email,
    b.website_slug,
    b.phone,
    b.whatsapp_number,
    b.contact_email,
    b.is_active,
    b.plan_type,
    b.max_properties,
    b.created_at,
    b.updated_at,
    COUNT(p.id) as properties_count
  FROM public.brokers b
  LEFT JOIN public.properties p ON b.id = p.broker_id AND p.is_active = true
  GROUP BY b.id, b.user_id, b.business_name, b.display_name, b.email, b.website_slug, 
           b.phone, b.whatsapp_number, b.contact_email, b.is_active, b.plan_type, 
           b.max_properties, b.created_at, b.updated_at
  ORDER BY b.created_at DESC;
END;
$$;

-- Create function to toggle broker active status (super admin only)
CREATE OR REPLACE FUNCTION public.toggle_broker_status(broker_id uuid, new_status boolean)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow access if user is super admin
  IF NOT public.is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  UPDATE public.brokers 
  SET is_active = new_status, updated_at = now()
  WHERE id = broker_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to delete broker (super admin only)
CREATE OR REPLACE FUNCTION public.delete_broker_admin(broker_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow access if user is super admin
  IF NOT public.is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- First delete all properties associated with the broker
  DELETE FROM public.properties WHERE broker_id = broker_id;
  
  -- Delete all realtors associated with the broker
  DELETE FROM public.realtors WHERE broker_id = broker_id;
  
  -- Delete all leads associated with the broker
  DELETE FROM public.leads WHERE broker_id = broker_id;
  
  -- Delete all social links associated with the broker
  DELETE FROM public.social_links WHERE broker_id = broker_id;
  
  -- Finally delete the broker
  DELETE FROM public.brokers WHERE id = broker_id;
  
  RETURN TRUE;
END;
$$;