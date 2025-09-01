-- Drop and recreate with a simpler hash function using SHA256 from pgcrypto
DROP FUNCTION IF EXISTS public.hash_password_with_salt(text, text);

CREATE OR REPLACE FUNCTION public.hash_password_with_salt(password text, salt text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT encode(sha256((password || salt)::bytea), 'hex');
$$;