import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestDeviationsRequest {
  category: string;
  industry?: string;
  existingSystems?: string[];
}

interface DeviationSuggestion {
  title: string;
  description: string;
  suggestedCriticality: "critical" | "high" | "medium" | "low";
  suggestedFrameworks: string[];
  reason: string;
}

const categoryPrompts: Record<string, string> = {
  datainnbrudd: "datainnbrudd, datalekkasje, eller uautorisert tilgang til persondata",
  tilgangskontroll: "feil i tilgangsrettigheter, manglende adgangskontroll, eller identitetshåndtering",
  hendelseshåndtering: "mangelfull respons på sikkerhetshendelser eller manglende varsling",
  prosess_og_rutiner: "brudd på interne prosedyrer, retningslinjer eller dokumentasjonskrav",
  personvern: "brudd på GDPR-krav, personvernregler eller behandling av personopplysninger",
  ai_avvik: "feil i AI-modeller, algoritmisk bias, uventede AI-beslutninger, eller manglende AI-transparens",
  sikkerhet: "generelle sikkerhetsavvik, sårbarheter, eller manglende sikkerhetstiltak",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, industry, existingSystems }: SuggestDeviationsRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryContext = categoryPrompts[category] || "generelle avvik";
    const industryContext = industry ? `Virksomheten opererer i ${industry}-bransjen.` : "";
    const systemsContext = existingSystems?.length
      ? `Virksomheten bruker følgende systemer: ${existingSystems.join(", ")}.`
      : "";

    const systemPrompt = `Du er en ekspert på compliance, informasjonssikkerhet og personvern i norske virksomheter.
Din oppgave er å generere realistiske og relevante avviksforslag basert på valgt kategori.
Svar ALLTID på norsk. Forslagene skal være konkrete, handlingsrettede og relevante for norske forhold.`;

    const userPrompt = `Generer 3-4 realistiske avviksforslag for kategorien: ${categoryContext}.

${industryContext}
${systemsContext}

For hvert forslag, inkluder:
- En konkret og beskrivende tittel (maks 60 tegn)
- En kort beskrivelse av avviket (1-2 setninger)
- Foreslått kritikalitet (critical, high, medium, low) basert på potensielle konsekvenser
- Relevante regelverk/standarder som berøres
- Kort begrunnelse for hvorfor dette er et vanlig avvik`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_deviations",
              description: "Return 3-4 deviation suggestions for the given category",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Konkret tittel for avviket" },
                        description: { type: "string", description: "Kort beskrivelse av avviket" },
                        suggestedCriticality: {
                          type: "string",
                          enum: ["critical", "high", "medium", "low"],
                          description: "Foreslått kritikalitet",
                        },
                        suggestedFrameworks: {
                          type: "array",
                          items: { type: "string" },
                          description: "Relevante regelverk (f.eks. GDPR, ISO27001, NIS2, AI Act)",
                        },
                        reason: { type: "string", description: "Kort begrunnelse" },
                      },
                      required: ["title", "description", "suggestedCriticality", "suggestedFrameworks", "reason"],
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
        tool_choice: { type: "function", function: { name: "suggest_deviations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const suggestions: { suggestions: DeviationSuggestion[] } = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-deviations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
