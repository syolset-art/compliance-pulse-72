CREATE TABLE public.agent_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Min agent',
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_access_tokens TO authenticated;
GRANT ALL ON public.agent_access_tokens TO service_role;

ALTER TABLE public.agent_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own agent codes"
ON public.agent_access_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_access_tokens_user ON public.agent_access_tokens (user_id, created_at DESC);