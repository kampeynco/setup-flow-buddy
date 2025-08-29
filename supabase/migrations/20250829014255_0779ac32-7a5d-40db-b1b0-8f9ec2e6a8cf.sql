-- Create a table to store encrypted webhook credentials
CREATE TABLE public.webhook_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_credentials
CREATE POLICY "Users can view their own webhook credentials" 
ON public.webhook_credentials 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage webhook credentials" 
ON public.webhook_credentials 
FOR ALL 
USING (auth.role() = 'service_role');

-- Remove the webhook_password column from profiles table (security risk)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS webhook_password;

-- Add a function to hash passwords with salt
CREATE OR REPLACE FUNCTION public.hash_password_with_salt(password TEXT, salt TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT, salt TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = encode(digest(password || salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;