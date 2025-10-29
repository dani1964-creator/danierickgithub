-- Create table to track unique property views by IP
CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_ip inet NOT NULL,
  user_agent text,
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one view per IP per property
  UNIQUE(property_id, viewer_ip)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_ip ON public.property_views(viewer_ip);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at);

-- RLS policies
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert their own views
CREATE POLICY "Allow anonymous view tracking" ON public.property_views
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to view their own views
CREATE POLICY "Allow authenticated view tracking" ON public.property_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Function to track unique property view
CREATE OR REPLACE FUNCTION public.track_unique_property_view(
  p_property_id uuid,
  p_viewer_ip inet,
  p_user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_new_view boolean := false;
  total_views integer := 0;
BEGIN
  -- Try to insert new view (will fail if IP already viewed this property)
  BEGIN
    INSERT INTO public.property_views (property_id, viewer_ip, user_agent)
    VALUES (p_property_id, p_viewer_ip, p_user_agent);
    
    is_new_view := true;
    
    -- Update the property views_count with unique count
    UPDATE public.properties 
    SET views_count = (
      SELECT COUNT(*)::integer 
      FROM public.property_views 
      WHERE property_id = p_property_id
    )
    WHERE id = p_property_id;
    
  EXCEPTION WHEN unique_violation THEN
    -- View already exists for this IP, don't increment
    is_new_view := false;
  END;
  
  -- Get current total views
  SELECT COALESCE(views_count, 0) INTO total_views
  FROM public.properties 
  WHERE id = p_property_id;
  
  RETURN json_build_object(
    'success', true,
    'is_new_view', is_new_view,
    'total_views', total_views
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.track_unique_property_view(uuid, inet, text) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';