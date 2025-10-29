-- Create table for tracking unique property views by IP
CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  referrer text,
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT property_views_unique_daily UNIQUE (property_id, ip_address, DATE(viewed_at))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views (property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_ip_date ON public.property_views (ip_address, DATE(viewed_at));
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views (viewed_at);

-- Function to get unique views count for a property
CREATE OR REPLACE FUNCTION public.get_property_unique_views(property_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT ip_address)
    FROM public.property_views 
    WHERE property_id = property_uuid
  );
END;
$$;

-- Function to record a property view (returns true if it's a new unique view)
CREATE OR REPLACE FUNCTION public.record_property_view(
  property_uuid uuid,
  visitor_ip inet,
  visitor_user_agent text DEFAULT NULL,
  visitor_referrer text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_new_view boolean := false;
BEGIN
  -- Try to insert the view (will fail if IP already viewed today due to unique constraint)
  BEGIN
    INSERT INTO public.property_views (property_id, ip_address, user_agent, referrer)
    VALUES (property_uuid, visitor_ip, visitor_user_agent, visitor_referrer);
    
    is_new_view := true;
    
    -- Update the views_count in properties table with current unique count
    UPDATE public.properties 
    SET views_count = public.get_property_unique_views(property_uuid)
    WHERE id = property_uuid;
    
  EXCEPTION WHEN unique_violation THEN
    -- IP already viewed this property today, not a new unique view
    is_new_view := false;
  END;
  
  RETURN is_new_view;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.property_views TO anon, authenticated;
GRANT INSERT ON public.property_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_unique_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_property_view(uuid, inet, text, text) TO anon, authenticated;

-- Clean up old views (optional - keep only last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_property_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.property_views 
  WHERE viewed_at < (NOW() - INTERVAL '90 days');
END;
$$;

COMMENT ON TABLE public.property_views IS 'Tracks unique property views by IP address to prevent view count inflation';
COMMENT ON FUNCTION public.record_property_view IS 'Records a property view and returns true if it is a new unique view for that IP today';
COMMENT ON FUNCTION public.get_property_unique_views IS 'Returns the count of unique IP addresses that have viewed a property';