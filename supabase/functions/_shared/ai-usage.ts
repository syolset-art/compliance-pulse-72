// Felles logging av AI-tokenbruk til public.ai_token_usage.
// Feiltolerant: skal aldri velte et AI-svar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

interface GatewayUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
}

interface GatewayPayload {
  model?: string;
  usage?: GatewayUsage;
}

/**
 * Logger tokenbruk fra et AI-gateway-svar.
 * Kall den uten await (fire-and-forget) rett etter at svaret er parset.
 */
export function logAiUsage(
  functionName: string,
  payload: GatewayPayload | null | undefined,
  opts?: { model?: string; userId?: string | null },
): void {
  try {
    const usage = payload?.usage;
    if (!usage) return;

    const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
    if (!totalTokens) return;

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    void client
      .from("ai_token_usage")
      .insert({
        function_name: functionName,
        model: opts?.model ?? payload?.model ?? null,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        user_id: opts?.userId ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("logAiUsage insert failed", error.message);
      });
  } catch (err) {
    console.error("logAiUsage failed", err);
  }
}

/** Trekker ut tokenbruk fra en SSE-strøm-linje (usage kommer i siste chunk). */
export function usageFromStreamChunk(chunk: unknown): GatewayPayload | null {
  const c = chunk as GatewayPayload;
  return c && c.usage ? c : null;
}
