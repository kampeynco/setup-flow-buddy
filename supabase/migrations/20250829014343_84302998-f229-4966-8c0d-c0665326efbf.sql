-- Fix the security warnings for function search path
DROP FUNCTION IF EXISTS public.hash_password_with_salt(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT, TEXT);

-- Create the functions with proper search_path setting
CREATE OR REPLACE FUNCTION public.hash_password_with_salt(password TEXT, salt TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT, salt TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = encode(digest(password || salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create a table to map refcodes to profile IDs for secure webhook attribution
CREATE TABLE public.campaign_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  refcode TEXT UNIQUE NOT NULL,
  campaign_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own campaign mappings" 
ON public.campaign_mappings 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage campaign mappings" 
ON public.campaign_mappings 
FOR ALL 
USING (auth.role() = 'service_role');

-- Insert the default mapping for the current hardcoded profile
INSERT INTO public.campaign_mappings (profile_id, refcode, campaign_name) 
VALUES ('bfcee165-f32d-48af-8f27-a3533541f807', 'julian-for-senate', 'Julian for U.S. Senate')
ON CONFLICT (refcode) DO NOTHING;