
-- Employee connections (token-based, anonymous)
CREATE TABLE public.employee_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.company_profile(id) ON DELETE CASCADE,
  employee_token text NOT NULL UNIQUE,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  last_seen_at timestamp with time zone
);

ALTER TABLE public.employee_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employee_connections" ON public.employee_connections
  FOR ALL USING (true) WITH CHECK (true);

-- Security micro courses
CREATE TABLE public.security_micro_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_no text,
  content text,
  content_no text,
  duration_minutes integer NOT NULL DEFAULT 5,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_micro_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to security_micro_courses" ON public.security_micro_courses
  FOR ALL USING (true) WITH CHECK (true);

-- Course completions
CREATE TABLE public.course_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_token text NOT NULL,
  course_id uuid REFERENCES public.security_micro_courses(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  score integer
);

ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to course_completions" ON public.course_completions
  FOR ALL USING (true) WITH CHECK (true);

-- Employee notifications
CREATE TABLE public.employee_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.company_profile(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'policy_update',
  title text NOT NULL,
  title_no text,
  content text,
  content_no text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.employee_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employee_notifications" ON public.employee_notifications
  FOR ALL USING (true) WITH CHECK (true);
