-- Make stripe_subscription_id nullable for free plans
ALTER TABLE public.user_subscriptions 
ALTER COLUMN stripe_subscription_id DROP NOT NULL;

-- Update the column to allow null values for free plans
COMMENT ON COLUMN public.user_subscriptions.stripe_subscription_id IS 'Stripe subscription ID - null for free plans';