-- Create app_role enum for different user roles
CREATE TYPE public.app_role AS ENUM (
  'daglig_leder',           -- CEO/Managing Director
  'personvernombud',        -- DPO/Privacy Officer  
  'sikkerhetsansvarlig',    -- CISO/Security Officer
  'compliance_ansvarlig',   -- Compliance Officer
  'ai_governance',          -- AI Governance Lead
  'operativ_bruker'         -- Regular operational user
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_primary = true
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
USING (true);

-- Create user_dashboard_preferences table for widget customization
CREATE TABLE public.user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hidden_widgets TEXT[] DEFAULT '{}',
  pinned_widgets TEXT[] DEFAULT '{}',
  widget_order JSONB DEFAULT '{}',
  active_view TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS for preferences
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for dashboard preferences
CREATE POLICY "Users can manage their dashboard preferences"
ON public.user_dashboard_preferences
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();