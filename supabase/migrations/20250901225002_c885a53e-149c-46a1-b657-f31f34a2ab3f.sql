-- Update verify_password function to use the same hash method
DROP FUNCTION IF EXISTS public.verify_password(text, text, text);

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text, salt text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT hash = encode(sha256((password || salt)::bytea), 'hex');
$$;