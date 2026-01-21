-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
  display_name TEXT NOT NULL,
  price_monthly INTEGER DEFAULT 0, -- in øre/cents
  included_domains TEXT[] NOT NULL DEFAULT '{}',
  features JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company subscriptions table
CREATE TABLE company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profile(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start DATE,
  current_period_end DATE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Domain addons table
CREATE TABLE domain_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profile(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL, -- 'privacy', 'security', 'ai', 'other'
  monthly_price INTEGER DEFAULT 0, -- in øre/cents
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
  activated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_addons ENABLE ROW LEVEL SECURITY;

-- RLS policies (open for now, no auth)
CREATE POLICY "Allow all access to subscription_plans" ON subscription_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to company_subscriptions" ON company_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to domain_addons" ON domain_addons FOR ALL USING (true) WITH CHECK (true);

-- Add columns to selected_frameworks
ALTER TABLE selected_frameworks 
ADD COLUMN IF NOT EXISTS included_in_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_required BOOLEAN DEFAULT false;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, price_monthly, included_domains, features, sort_order) VALUES
('starter', 'Starter', 0, ARRAY['privacy'], '{"users": 1, "workAreas": 5, "support": "email"}', 1),
('professional', 'Professional', 249000, ARRAY['privacy', 'security', 'ai'], '{"users": 10, "workAreas": null, "support": "priority", "api": true, "customReports": true}', 2),
('enterprise', 'Enterprise', 0, ARRAY['privacy', 'security', 'ai', 'other'], '{"users": null, "workAreas": null, "support": "dedicated", "sla": true, "onPremise": true}', 3);

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_addons_updated_at
  BEFORE UPDATE ON domain_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();