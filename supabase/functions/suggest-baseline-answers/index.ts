import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BaselineQuestion {
  id: string;
  text: string;
  article: string;
}

interface BaselineArea {
  id: string;
  title: string;
  questions: BaselineQuestion[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { customerName, customerDomain, industry, areas } = (await req.json()) as {
      customerName: string;
      customerDomain?: string;
      industry?: string;
      areas: BaselineArea[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const flatQuestions = areas.flatMap((a) =>
      a.questions.map((q) => ({ id: q.id, area: a.title, text: q.text, article: q.article })),
    );

    const questionList = flatQuestions
      .map((q, i) => `${i + 1}. [${q.id}] (${q.area} · ${q.article}) ${q.text}`)
      .join("\n");

    const prompt = `Du er Lara — en GDPR- og sikkerhetsekspert som hjelper en MSP-partner med å foreslå en baseline-status for kunden sin.

Kunde: ${customerName}
${customerDomain ? `Domene: ${customerDomain}` : ""}
${industry ? `Bransje: ${industry}` : ""}

Du skal foreslå et konservativt utgangspunkt for hvert spørsmål. Bruk:
- "done" KUN når det er svært vanlig at en typisk norsk SMB i denne bransjen har dette på plass (f.eks. publisert personvernerklæring for kunder med nettside).
- "in_progress" når det er sannsynlig at noe arbeid er gjort, men ikke ferdig.
- "not_started" når det er sannsynlig at det IKKE er på plass uten aktiv jobb, eller når du er usikker.
- "not_relevant" når spørsmålet trolig ikke er relevant for denne kunden.

Vær konservativ: foretrekk "not_started" framfor å gjette "done". Partneren skal bekrefte hver suggestion.

For hvert spørsmål gi en kort begrunnelse (maks 1 setning, norsk) som forklarer hvorfor.

Spørsmål:
${questionList}

Svar ved å kalle suggest_baseline_answers-funksjonen med ett svar per spørsmål-id.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du er Lara, en konservativ GDPR- og informasjonssikkerhetsekspert." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_baseline_answers",
              description: "Return suggested baseline answer + short rationale for each question id",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_id: { type: "string" },
                        answer: { type: "string", enum: ["not_started", "in_progress", "done", "not_relevant"] },
                        rationale: { type: "string", description: "Kort begrunnelse på norsk, maks 1 setning" },
                      },
                      required: ["question_id", "answer", "rationale"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_baseline_answers" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    logAiUsage("suggest-baseline-answers", data);
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No suggestion returned" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-baseline-answers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
