import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, fileName } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Classifying document: ${fileName}, length: ${documentText.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du er en ekspert på dokumentklassifisering for compliance og leverandørstyring.
Analyser dokumentet og klassifiser det. Identifiser:
1. Dokumenttype
2. Om dokumentet har en utløpsdato eller gyldighetsdato - og om det er utgått
3. Hvilke regelverk dokumentet er relevant for (GDPR, ISO 27001, ISO 27701, SOC 2, NIS2, AI Act, DORA)
4. Hvis det er en leverandørliste, ekstraher leverandørnavnene.

Dagens dato er ${new Date().toISOString().split('T')[0]}.`
          },
          {
            role: "user",
            content: `Klassifiser dette dokumentet:\n\nFilnavn: ${fileName}\n\nInnhold:\n${documentText.substring(0, 12000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_document",
              description: "Klassifiser et dokument og ekstraher relevant informasjon",
              parameters: {
                type: "object",
                properties: {
                  documentType: {
                    type: "string",
                    enum: ["vendor_list", "policy", "dpa", "dpia", "certificate", "report", "agreement", "penetration_test", "soc2", "iso27001", "other"],
                    description: "Type dokument"
                  },
                  documentTypeLabel: {
                    type: "string",
                    description: "Norsk label for dokumenttypen, f.eks. 'Leverandørliste', 'Personvernpolicy', 'Databehandleravtale (DPA)', 'DPIA', 'Sertifikat', 'Rapport', 'Avtale', 'Penetrasjonstest', 'SOC 2', 'ISO 27001', 'Annet'"
                  },
                  confidence: {
                    type: "number",
                    description: "Konfidensgrad mellom 0 og 1"
                  },
                  summary: {
                    type: "string",
                    description: "Kort oppsummering av dokumentets innhold (1-2 setninger)"
                  },
                  validFrom: {
                    type: "string",
                    description: "Gyldig-fra dato i ISO-format (YYYY-MM-DD) hvis funnet i dokumentet, ellers null"
                  },
                  validTo: {
                    type: "string",
                    description: "Gyldig-til / utløpsdato i ISO-format (YYYY-MM-DD) hvis funnet i dokumentet, ellers null"
                  },
                  expiryStatus: {
                    type: "string",
                    enum: ["valid", "expired", "expiring_soon", "unknown"],
                    description: "Om dokumentet er gyldig, utgått, utløper snart (innen 30 dager), eller ukjent"
                  },
                  relevantRegulations: {
                    type: "array",
                    description: "Liste over relevante regelverk dette dokumentet dekker eller er relevant for",
                    items: {
                      type: "object",
                      properties: {
                        regulation: { type: "string", description: "Navn på regelverk (GDPR, ISO 27001, ISO 27701, SOC 2, NIS2, AI Act, DORA)" },
                        relevance: { type: "string", enum: ["high", "medium", "low"], description: "Hvor relevant dokumentet er for dette regelverket" },
                        reason: { type: "string", description: "Kort begrunnelse for hvorfor dokumentet er relevant (1 setning)" }
                      },
                      required: ["regulation", "relevance", "reason"]
                    }
                  },
                  extractedVendors: {
                    type: "array",
                    description: "Liste over leverandørnavn funnet i dokumentet (kun for vendor_list)",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Leverandørnavn" },
                        description: { type: "string", description: "Kort beskrivelse hvis tilgjengelig" }
                      },
                      required: ["name"]
                    }
                  }
                },
                required: ["documentType", "documentTypeLabel", "confidence", "summary", "expiryStatus", "relevantRegulations", "extractedVendors"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_document" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange forespørsler. Prøv igjen om litt." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-kreditter brukt opp." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI-klassifisering feilet" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Kunne ikke klassifisere dokumentet" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const classification = JSON.parse(toolCall.function.arguments);
    console.log(`Classification: ${classification.documentType} (${classification.confidence}), expiry: ${classification.expiryStatus}, regulations: ${classification.relevantRegulations?.length || 0}, vendors: ${classification.extractedVendors?.length || 0}`);

    return new Response(
      JSON.stringify({ classification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in classify-document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "En uventet feil oppstod" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
