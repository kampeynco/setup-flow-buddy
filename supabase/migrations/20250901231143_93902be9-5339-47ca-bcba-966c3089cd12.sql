-- Simplify webhook_credentials table by removing hashing
-- This will allow users to access their raw webhook passwords

-- First, rename password_hash column to raw_password
ALTER TABLE public.webhook_credentials 
RENAME COLUMN password_hash TO raw_password;

-- Remove the salt column as it's no longer needed
ALTER TABLE public.webhook_credentials 
DROP COLUMN salt;

-- Drop the password hashing and verification functions as they're no longer needed
DROP FUNCTION IF EXISTS public.hash_password_with_salt(text, text);
DROP FUNCTION IF EXISTS public.verify_password(text, text, text);