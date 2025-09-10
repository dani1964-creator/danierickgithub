-- Improve leads security and add audit logging for sensitive data access
-- Enhanced rate limiting function for leads
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit_enhanced(client_ip inet DEFAULT NULL::inet, user_email text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Enhanced rate limiting: 
  -- - Max 5 leads per email per hour (prevent spam from same email)
  -- - Max 20 leads total per hour (prevent general spam)
  SELECT 
    (
      CASE 
        WHEN user_email IS NOT NULL THEN
          (SELECT COUNT(*) FROM public.leads WHERE email = user_email AND created_at > NOW() - INTERVAL '1 hour') < 5
        ELSE true
      END
    )
    AND
    (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '1 hour') < 20;
$function$;

-- Create audit function for tracking sensitive lead data access
CREATE OR REPLACE FUNCTION public.audit_lead_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log for authenticated users accessing lead data
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.security_logs (
      event_type,
      user_id,
      metadata
    ) VALUES (
      'lead_data_access',
      auth.uid(),
      jsonb_build_object(
        'lead_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'broker_id', COALESCE(NEW.broker_id, OLD.broker_id),
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update remaining functions to fix search_path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.brokers (
    user_id, 
    business_name, 
    email,
    primary_color,
    secondary_color,
    plan_type,
    is_active,
    max_properties
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Minha Imobiliária'),
    NEW.email,
    '#2563eb',
    '#64748b', 
    'free',
    true,
    5
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_broker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.brokers (user_id, business_name, display_name, email, website_slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'Minha Imobiliária'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    user_id,
    record_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(), -- This can be NULL for anonymous users
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_contact_access(p_broker_id uuid, p_user_ip inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_access_type text DEFAULT 'contact_info'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check rate limit: max 10 contact accesses per IP per hour
  IF (
    SELECT COUNT(*)
    FROM public.contact_access_logs
    WHERE user_ip = p_user_ip
    AND accessed_at > NOW() - INTERVAL '1 hour'
  ) >= 10 THEN
    RETURN FALSE;
  END IF;

  -- Log the access
  INSERT INTO public.contact_access_logs (
    broker_id,
    user_ip,
    user_agent,
    access_type
  ) VALUES (
    p_broker_id,
    p_user_ip,
    p_user_agent,
    p_access_type
  );

  RETURN TRUE;
END;
$function$;