CREATE TABLE public.ai_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  model text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_token_usage TO authenticated;
GRANT ALL ON public.ai_token_usage TO service_role;

ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ai token usage"
  ON public.ai_token_usage FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_ai_token_usage_created_at ON public.ai_token_usage (created_at DESC);

CREATE OR REPLACE FUNCTION public.get_usage_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT jsonb_build_object(
    'tokens_day', COALESCE((SELECT SUM(total_tokens) FROM public.ai_token_usage WHERE created_at > now() - interval '1 day'), 0),
    'tokens_month', COALESCE((SELECT SUM(total_tokens) FROM public.ai_token_usage WHERE created_at > now() - interval '30 days'), 0),
    'tokens_in_month', COALESCE((SELECT SUM(prompt_tokens) FROM public.ai_token_usage WHERE created_at > now() - interval '30 days'), 0),
    'tokens_out_month', COALESCE((SELECT SUM(completion_tokens) FROM public.ai_token_usage WHERE created_at > now() - interval '30 days'), 0),
    'calls_month', COALESCE((SELECT COUNT(*) FROM public.ai_token_usage WHERE created_at > now() - interval '30 days'), 0),
    'bytes_day', COALESCE((SELECT SUM((metadata->>'size')::bigint) FROM storage.objects WHERE bucket_id IN ('documents','vendor-documents') AND created_at > now() - interval '1 day'), 0),
    'bytes_month', COALESCE((SELECT SUM((metadata->>'size')::bigint) FROM storage.objects WHERE bucket_id IN ('documents','vendor-documents') AND created_at > now() - interval '30 days'), 0),
    'bytes_total', COALESCE((SELECT SUM((metadata->>'size')::bigint) FROM storage.objects WHERE bucket_id IN ('documents','vendor-documents')), 0),
    'files_total', COALESCE((SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('documents','vendor-documents')), 0)
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_summary() TO authenticated;