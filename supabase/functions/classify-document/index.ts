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
Analyser dokumentet og klassifiser det. Hvis det er en leverandørliste, ekstraher leverandørnavnene.`
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
                    enum: ["vendor_list", "policy", "dpa", "dpia", "certificate", "report", "other"],
                    description: "Type dokument"
                  },
                  documentTypeLabel: {
                    type: "string",
                    description: "Norsk label for dokumenttypen, f.eks. 'Leverandørliste', 'Personvernpolicy', 'Databehandleravtale (DPA)', 'DPIA', 'Sertifikat', 'Rapport', 'Annet'"
                  },
                  confidence: {
                    type: "number",
                    description: "Konfidensgrad mellom 0 og 1"
                  },
                  summary: {
                    type: "string",
                    description: "Kort oppsummering av dokumentets innhold (1-2 setninger)"
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
                required: ["documentType", "documentTypeLabel", "confidence", "summary", "extractedVendors"]
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
    console.log(`Classification: ${classification.documentType} (${classification.confidence}), vendors: ${classification.extractedVendors?.length || 0}`);

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
