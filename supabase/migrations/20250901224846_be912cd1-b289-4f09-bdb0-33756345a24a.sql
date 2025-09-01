-- Drop and recreate the hash_password_with_salt function with correct syntax
DROP FUNCTION IF EXISTS public.hash_password_with_salt(text, text);

CREATE OR REPLACE FUNCTION public.hash_password_with_salt(password text, salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(digest(password || salt, 'sha256'::text), 'hex');
END;
$$;