-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.handle_updated_at_usage_charges()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;