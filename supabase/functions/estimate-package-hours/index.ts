import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TaskSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  kind: z.string().max(50),
  category: z.string().max(120),
  requirementCount: z.number().int().min(0).max(500),
});

const BodySchema = z.object({
  framework_name: z.string().min(1).max(200),
  language: z.enum(["no", "en"]).optional(),
  tasks: z.array(TaskSchema).min(1).max(300),
});

/** Rund til nærmeste halve time og hold innenfor fornuftige grenser. */
function clampHours(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(40, Math.max(0.5, Math.round(n * 2) / 2));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Ugyldig input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { framework_name, tasks } = parsed.data;
    const isNorwegian = parsed.data.language !== "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const taskList = tasks
      .map(
        (t) =>
          `- id="${t.id}" | ${t.name} | type: ${t.kind} | område: ${t.category} | dekker ${t.requirementCount} krav`,
      )
      .join("\n");

    const systemPrompt = isNorwegian
      ? `Du er Lara, en erfaren compliance-rådgiver som hjelper IT-partnere (MSP) med å prissette aktiveringspakker for regelverk.

OPPGAVE: Lag et GROVT timeestimat per oppgave for hva det typisk tar en rådgiver å levere aktivering av regelverket "${framework_name}" hos en mellomstor kunde.

RETNINGSLINJER:
1. Estimater skal være realistiske spenn (min–maks) i hele/halve timer, typisk 0.5–8 timer per oppgave.
2. Type "ai-draft" betyr at en AI-agent lager førsteutkast — rådgiveren kvalitetssikrer og tilpasser (lavere timer).
3. Type "advisory" er møtebasert rådgivning/workshops. Type "technical" er konkret teknisk leveranse (konfigurasjon, testing, rapporter).
4. Oppgaver som dekker mange krav tar typisk lengre tid.
5. Gi en kort begrunnelse (maks 15 ord, norsk) per oppgave.
6. Bruk eksakt oppgave-id-en som ble gitt.`
      : `You are Lara, an experienced compliance advisor helping IT partners (MSPs) price activation packages for frameworks.

TASK: Provide a ROUGH hourly estimate per task for what it typically takes an advisor to deliver activation of the "${framework_name}" framework for a mid-sized customer.

GUIDELINES:
1. Estimates should be realistic ranges (min–max) in whole/half hours, typically 0.5–8 hours per task.
2. Kind "ai-draft" means an AI agent produces the first draft — the advisor reviews and adapts (fewer hours).
3. Kind "advisory" is meeting-based advisory/workshops. Kind "technical" is concrete technical delivery (configuration, testing, reports).
4. Tasks covering many requirements typically take longer.
5. Give a short rationale (max 15 words, English) per task.
6. Use the exact task ids provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: isNorwegian
              ? `Estimer timer for disse oppgavene i "${framework_name}":\n${taskList}`
              : `Estimate hours for these tasks in "${framework_name}":\n${taskList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "estimate_hours",
              description: "Return rough hour estimates per task",
              parameters: {
                type: "object",
                properties: {
                  estimates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_id: { type: "string" },
                        hours_min: { type: "number" },
                        hours_max: { type: "number" },
                        rationale: { type: "string" },
                      },
                      required: ["task_id", "hours_min", "hours_max", "rationale"],
                    },
                  },
                },
                required: ["estimates"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "estimate_hours" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "Forespørselsgrense nådd, prøv igjen senere." : "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "Kreditt oppbrukt, vennligst legg til kreditt." : "Credits exhausted, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    logAiUsage("estimate-package-hours", data);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      const validIds = new Set(tasks.map((t) => t.id));
      const estimates = (Array.isArray(result.estimates) ? result.estimates : [])
        .filter((e: { task_id?: unknown }) => typeof e?.task_id === "string" && validIds.has(e.task_id as string))
        .map((e: { task_id: string; hours_min?: unknown; hours_max?: unknown; rationale?: unknown }) => {
          const min = clampHours(e.hours_min, 1);
          const max = Math.max(min, clampHours(e.hours_max, min));
          return {
            taskId: e.task_id,
            hoursMin: min,
            hoursMax: max,
            rationale: typeof e.rationale === "string" ? e.rationale.slice(0, 200) : "",
          };
        });
      return new Response(JSON.stringify({ estimates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ estimates: [], error: "No estimates generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-package-hours error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
