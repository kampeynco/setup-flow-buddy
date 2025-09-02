-- Create missing subscription record for existing user who completed payment
INSERT INTO public.user_subscriptions (
  profile_id,
  plan_id,
  status,
  stripe_customer_id,
  current_period_start,
  current_period_end
) VALUES (
  '0915128d-5bf0-4d12-9cfa-3c3ea819350f',
  1, -- Free plan ID
  'active',
  'temp_customer_id', -- Temporary placeholder
  now(),
  null -- Pay as you go doesn't have periods
) ON CONFLICT DO NOTHING;