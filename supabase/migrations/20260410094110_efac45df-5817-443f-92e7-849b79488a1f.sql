
-- Add price_yearly to subscription_plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS price_yearly integer;

-- Add billing_interval to company_subscriptions
ALTER TABLE public.company_subscriptions
ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly';

-- Update existing plans
UPDATE public.subscription_plans SET
  name = 'free',
  display_name = 'Gratis',
  price_monthly = 0,
  price_yearly = 0,
  included_domains = ARRAY['privacy', 'security']::text[],
  features = '{"maxSystems": 5, "maxVendors": 5, "frameworks": ["gdpr", "iso27001"], "trustCenter": true}'::jsonb,
  sort_order = 1
WHERE name = 'starter';

UPDATE public.subscription_plans SET
  name = 'basis',
  display_name = 'Basis',
  price_monthly = 149000,
  price_yearly = 1490000,
  included_domains = ARRAY['privacy', 'security']::text[],
  features = '{"maxSystems": 20, "maxVendors": 20, "frameworks": ["gdpr", "iso27001"], "trustCenter": true, "workAreas": true, "tasks": true}'::jsonb,
  sort_order = 2
WHERE name = 'professional';

UPDATE public.subscription_plans SET
  display_name = 'Enterprise',
  price_monthly = 0,
  price_yearly = 0,
  included_domains = ARRAY['privacy', 'security', 'ai', 'other']::text[],
  features = '{"maxSystems": 9999, "maxVendors": 9999, "frameworks": ["gdpr", "iso27001", "nis2", "dora", "transparency_act", "ai_act", "cra"], "trustCenter": true, "workAreas": true, "tasks": true, "prioritySupport": true, "custom": true}'::jsonb,
  sort_order = 4
WHERE name = 'enterprise';

-- Insert premium plan if it doesn't exist
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_yearly, included_domains, features, sort_order)
SELECT 'premium', 'Premium', 249000, 2490000,
  ARRAY['privacy', 'security']::text[],
  '{"maxSystems": 70, "maxVendors": 70, "frameworks": ["gdpr", "iso27001"], "trustCenter": true, "workAreas": true, "tasks": true, "prioritySupport": true}'::jsonb,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'premium');
