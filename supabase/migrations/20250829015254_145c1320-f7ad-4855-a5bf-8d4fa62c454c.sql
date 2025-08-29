-- Make current_period_end nullable for unlimited plans
ALTER TABLE public.user_subscriptions 
ALTER COLUMN current_period_end DROP NOT NULL;

-- Update the column to allow null values for unlimited plans
COMMENT ON COLUMN public.user_subscriptions.current_period_end IS 'Current period end date - null for unlimited plans';