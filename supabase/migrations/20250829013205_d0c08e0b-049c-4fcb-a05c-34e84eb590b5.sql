-- Update subscription_plans table to match Free/Pro pricing model
TRUNCATE TABLE public.subscription_plans RESTART IDENTITY CASCADE;

INSERT INTO public.subscription_plans (id, name, monthly_fee, per_mailing_fee, stripe_price_id) VALUES
(1, 'Free', 0.00, 1.99, 'price_1S0UkYBQLl5BjAnkjr91tAcT'),
(2, 'Pro', 99.00, 0.99, 'price_1S0UksBQLl5BjAnkb2JTms6I');

-- Add trial tracking to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;

-- Add usage billing tracking to postcards table
ALTER TABLE public.postcards 
ADD COLUMN IF NOT EXISTS usage_billed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_invoice_item_id TEXT;

-- Create usage_charges table for detailed billing history
CREATE TABLE IF NOT EXISTS public.usage_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  postcard_id UUID NOT NULL REFERENCES public.postcards(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_invoice_item_id TEXT,
  plan_type TEXT NOT NULL, -- 'free' or 'pro'
  charged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on usage_charges table
ALTER TABLE public.usage_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage_charges
CREATE POLICY "Users can view their own usage charges" 
ON public.usage_charges 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage usage charges" 
ON public.usage_charges 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at_usage_charges()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for usage_charges updated_at
CREATE TRIGGER update_usage_charges_updated_at
  BEFORE UPDATE ON public.usage_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_usage_charges();