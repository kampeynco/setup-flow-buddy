-- Add unique constraint on profile_id in webhook_credentials table
-- This ensures each profile can only have one set of webhook credentials
-- and allows the upsert operation in create-hookdeck-webhook to work properly

ALTER TABLE public.webhook_credentials 
ADD CONSTRAINT webhook_credentials_profile_id_unique UNIQUE (profile_id);