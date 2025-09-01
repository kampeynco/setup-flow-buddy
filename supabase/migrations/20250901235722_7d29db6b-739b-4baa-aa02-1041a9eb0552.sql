-- Add onboarding tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_step INTEGER DEFAULT 0,
ADD COLUMN webhook_setup_completed BOOLEAN DEFAULT FALSE;