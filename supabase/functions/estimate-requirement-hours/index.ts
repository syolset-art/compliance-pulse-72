import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequirementSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
});

const BodySchema = z.object({
  framework_name: z.string().min(1).max(200),
  language: z.enum(["no", "en"]).optional(),
  requirements: z.array(RequirementSchema).min(1).max(150),
});

/** Rund til nærmeste kvarter og hold innenfor fornuftige grenser per krav. */
function clampHours(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(4, Math.max(0.25, Math.round(n * 4) / 4));
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
    const { framework_name, requirements } = parsed.data;
    const isNorwegian = parsed.data.language !== "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const reqList = requirements.map((r) => `- id="${r.id}" | ${r.name}`).join("\n");

    const systemPrompt = isNorwegian
      ? `Du er Lara, en erfaren compliance-rådgiver som hjelper IT-partnere (MSP) med å anslå rådgivningsbehov ved aktivering av regelverk.

OPPGAVE: Anslå hvor lang tid det typisk tar en rådgiver å hjelpe en mellomstor virksomhet med å oppfylle HVERT ENKELT krav i regelverket "${framework_name}" — fra gjennomgang av dagens tilstand til kravet er dokumentert oppfylt.

RETNINGSLINJER:
1. Estimat per krav i timer, typisk 0.25–4 timer. Enkle krav (policyavklaring, kort dokumentasjon) er nær 0.25–0.5; krevende krav (tekniske tiltak, prosessetablering) er nær 2–4.
2. Husk at en AI-agent (Sara/Lara) ofte lager førsteutkast til dokumentasjon — rådgiveren kvalitetssikrer og tilpasser. Ikke estimert full skriving fra scratch.
3. Generiske kravnavn (f.eks. «Krav 12») uten innhold: bruk et typisk snitt for regelverket, ofte rundt 1 time.
4. Gi en kort begrunnelse (maks 12 ord, norsk) per krav.
5. Bruk eksakt krav-id-en som ble gitt. Returner ett estimat for HVERT krav i listen.`
      : `You are Lara, an experienced compliance advisor helping IT partners (MSPs) estimate advisory effort for framework activation.

TASK: Estimate how long it typically takes an advisor to help a mid-sized organization satisfy EACH requirement in the "${framework_name}" framework — from reviewing current state to documented compliance.

GUIDELINES:
1. Estimate per requirement in hours, typically 0.25–4. Simple requirements (policy decisions, brief documentation) near 0.25–0.5; demanding ones (technical controls, process establishment) near 2–4.
2. Remember an AI agent often produces first drafts — the advisor reviews and adapts. Do not estimate full authoring from scratch.
3. Generic requirement names (e.g. "Requirement 12") without content: use a typical average for the framework, often around 1 hour.
4. Give a short rationale (max 12 words, English) per requirement.
5. Use the exact requirement ids provided. Return one estimate for EVERY requirement in the list.`;

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
              ? `Estimer timer per krav i "${framework_name}" (${requirements.length} krav):\n${reqList}`
              : `Estimate hours per requirement in "${framework_name}" (${requirements.length} requirements):\n${reqList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "estimate_requirement_hours",
              description: "Return hour estimates per requirement",
              parameters: {
                type: "object",
                properties: {
                  estimates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        requirement_id: { type: "string" },
                        hours: { type: "number" },
                        rationale: { type: "string" },
                      },
                      required: ["requirement_id", "hours", "rationale"],
                    },
                  },
                },
                required: ["estimates"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "estimate_requirement_hours" } },
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
    logAiUsage("estimate-requirement-hours", data);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      const validIds = new Set(requirements.map((r) => r.id));
      const estimates = (Array.isArray(result.estimates) ? result.estimates : [])
        .filter((e: { requirement_id?: unknown }) => typeof e?.requirement_id === "string" && validIds.has(e.requirement_id as string))
        .map((e: { requirement_id: string; hours?: unknown; rationale?: unknown }) => ({
          reqId: e.requirement_id,
          hours: clampHours(e.hours, 1),
          rationale: typeof e.rationale === "string" ? e.rationale.slice(0, 160) : "",
        }));
      return new Response(JSON.stringify({ estimates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ estimates: [], error: "No estimates generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-requirement-hours error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
