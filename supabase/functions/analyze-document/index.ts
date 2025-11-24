import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing document: ${fileName}`);

    const systemPrompt = `Du er en ekspert på compliance-analyse og leverandørstyring. 
Analyser dokumentet grundig og identifiser:
1. Leverandører/systemer som nevnes
2. Avtaledetaljer (DPA, SLA, etc.)
3. Compliance-gap og mangler
4. Sikkerhetsstandarder og sertifiseringer

Vær presis og konkret i analysen.`;

    const userPrompt = `Analyser følgende dokument og identifiser leverandører, avtaler og compliance-gap:

Filnavn: ${fileName}

Innhold:
${documentText.substring(0, 10000)}`; // Limit to first 10k chars

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_info",
              description: "Ekstraher strukturert informasjon fra compliance-dokumenter",
              parameters: {
                type: "object",
                properties: {
                  suppliers: {
                    type: "array",
                    description: "Liste over leverandører/systemer funnet i dokumentet",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Navn på leverandør/system" },
                        type: { type: "string", description: "Type system (SaaS, Cloud, On-premise, etc.)" },
                        dataProcessing: { type: "boolean", description: "Behandler persondata" },
                        hasDPA: { type: "boolean", description: "Har databehandleravtale (DPA)" },
                        certifications: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Sertifiseringer (ISO 27001, SOC 2, etc.)"
                        }
                      },
                      required: ["name", "type", "dataProcessing"]
                    }
                  },
                  contracts: {
                    type: "array",
                    description: "Avtaler funnet i dokumentet",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", description: "Avtaletype (DPA, SLA, NDA, etc.)" },
                        supplier: { type: "string", description: "Leverandør avtalen gjelder" },
                        expiryDate: { type: "string", description: "Utløpsdato hvis nevnt" },
                        status: { type: "string", description: "Status (Active, Expired, Missing)" }
                      },
                      required: ["type", "supplier", "status"]
                    }
                  },
                  complianceGaps: {
                    type: "array",
                    description: "Compliance-gap og mangler identifisert",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "Område (GDPR, ISO 27001, etc.)" },
                        severity: { type: "string", enum: ["low", "medium", "high"], description: "Alvorlighetsgrad" },
                        description: { type: "string", description: "Beskrivelse av gapet" },
                        recommendation: { type: "string", description: "Anbefaling for å lukke gapet" }
                      },
                      required: ["area", "severity", "description", "recommendation"]
                    }
                  },
                  summary: {
                    type: "string",
                    description: "Kort oppsummering av dokumentets hovedinnhold"
                  }
                },
                required: ["suppliers", "contracts", "complianceGaps", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_document_info" } }
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
          JSON.stringify({ error: "AI-kreditter brukt opp. Legg til flere kreditter." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI-analyse feilet" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI Response received");

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response");
      return new Response(
        JSON.stringify({ error: "Kunne ikke analysere dokumentet" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log(`Analysis complete: ${analysis.suppliers.length} suppliers, ${analysis.complianceGaps.length} gaps found`);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-document function:", error);
    const errorMessage = error instanceof Error ? error.message : "En uventet feil oppstod";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
