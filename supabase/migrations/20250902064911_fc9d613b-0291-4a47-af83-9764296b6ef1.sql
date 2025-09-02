-- Add fields to track monthly billing for usage charges
ALTER TABLE public.usage_charges 
ADD COLUMN billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invoice_id TEXT,
ADD COLUMN billing_cycle_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN billing_cycle_end TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of unbilled charges
CREATE INDEX idx_usage_charges_unbilled ON public.usage_charges (profile_id, plan_type, billed_at) 
WHERE billed_at IS NULL;

-- Add index for billing cycle queries
CREATE INDEX idx_usage_charges_billing_cycle ON public.usage_charges (billing_cycle_start, billing_cycle_end);