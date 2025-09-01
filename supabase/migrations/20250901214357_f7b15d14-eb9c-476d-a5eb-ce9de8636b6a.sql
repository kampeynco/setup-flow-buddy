-- Create account_balances table to track user credit balances
CREATE TABLE public.account_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  auto_topup_enabled BOOLEAN NOT NULL DEFAULT true,
  last_topup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create balance_transactions table to track all balance changes
CREATE TABLE public.balance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'topup', 'usage', 'adjustment'
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  postcard_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_balances
CREATE POLICY "Users can view their own balance" 
ON public.account_balances 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage balances" 
ON public.account_balances 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS policies for balance_transactions  
CREATE POLICY "Users can view their own transactions" 
ON public.balance_transactions 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage transactions" 
ON public.balance_transactions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_account_balances_profile_id ON public.account_balances(profile_id);
CREATE INDEX idx_balance_transactions_profile_id ON public.balance_transactions(profile_id);
CREATE INDEX idx_balance_transactions_created_at ON public.balance_transactions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for account_balances
CREATE TRIGGER update_account_balances_updated_at
BEFORE UPDATE ON public.account_balances
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_balance();