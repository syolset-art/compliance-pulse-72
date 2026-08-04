// Classifies an uploaded document for the Trust Profile evidence register.
// Returns suggested document type, control areas (one or more of the five),
// supported controls, extracted metadata, quality findings and a suggested
// sharing level. Returns confidence in 0..1.
//
// IMPORTANT: This function NEVER sets evidence_status to 'evidence' or
// 'verified'. A human must take that action explicitly in the UI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTROL_AREA_KEYS = [
  "governance",
  "operations",
  "identityAccess",
  "privacy",
  "vendor",
] as const;

const FINDING_TYPES = [
  "missing_owner",
  "missing_approval",
  "missing_version",
  "missing_review_date",
  "looks_like_draft",
  "outdated",
  "sensitive_info",
] as const;

const TIER_LEVELS = ["accredited", "certified", "signed", "unverified"] as const;

const SYSTEM_PROMPT = `Du er Lara, en ekspert på klassifisering av samsvarsdokumenter for Mynder Trust Profile.

Mynder Trust Profile har FEM kontrollområder:
1. governance  — Styring og ansvar (roller, policyer, ledelsesforankring)
2. operations  — Drift og sikkerhet (hendelser, backup, logging, endringer, pentest)
3. identityAccess — Identitet og tilgang (MFA, tilgangsstyring, least privilege)
4. privacy     — Personvern og datahåndtering (GDPR, DPA, DPIA, oppbevaring)
5. vendor      — Tredjepart og verdikjede (leverandøroversikt, oppfølging)

Analyser dokumentet og foreslå:
- dokumenttype og menneskelig lesbar etikett
- ETT ELLER FLERE kontrollområder (bruk de eksakte nøklene)
- støttede kontrollpunkter (f.eks. "ISO 27001 A.5.1", "GDPR Art. 32")
- konfidens 0..1 (vær konservativ; < 0.6 hvis uklart)
- kort sammendrag (norsk, maks 2 setninger)
- ekstraherte metadata: eier, versjon, sist oppdatert, godkjenningsdato, godkjent av, neste revisjon, utløpsdato
- documentDate (ISO YYYY-MM-DD): dokumentets utgivelses- eller signeringsdato hvis synlig
- kvalitetsfunn fra: ${FINDING_TYPES.join(", ")}
- forslag til delingsnivå: internal | partners | public

TIER (utledet vekting — ALDRI brukervalg):
- "accredited" (1.00): GDPR-sertifisert eller akkreditert revisjon (nevnt akkrediteringsorgan).
- "certified"  (0.85): ISO 27001, SOC 2, ISO 27701, ISO 9001 eller tilsvarende sertifikat.
- "signed"     (0.60): Signert avtale/policy med navngitt godkjenner (DPA, policy m/ signatur).
- "unverified" (0.30): Egenerklært eller uverifisert.
Returner både 'tier' og en liste 'tierSignals' med konkrete funn (key + labelNb + labelEn), f.eks.
{ "key": "iso_27001_certificate", "labelNb": "ISO 27001-sertifikat funnet", "labelEn": "ISO 27001 certificate found" }
Andre nyttige signal-keys: accredited_audit, gdpr_certified, iso_accredited, soc2_report, iso_27701_certificate, iso_9001_certificate, signed_document, has_approver.

Foreslå også 'suggestedControls' — 1–3 spesifikke kontrollpunkter dokumentet dekker (controlId + label + confidence 0..1).

Dagens dato er ${new Date().toISOString().split("T")[0]}.`;


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentText, fileName } = await req.json();
    if (!documentText) {
      return new Response(JSON.stringify({ error: "documentText required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Klassifiser dette dokumentet for Trust Profile bevisregister.\n\nFilnavn: ${fileName}\n\nInnhold:\n${String(documentText).substring(0, 12000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_evidence",
              description: "Returner strukturert klassifisering av dokumentet for bevisregisteret.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  documentType: { type: "string" },
                  documentTypeLabel: { type: "string" },
                  controlAreas: {
                    type: "array",
                    items: { type: "string", enum: [...CONTROL_AREA_KEYS] },
                  },
                  supportedControls: {
                    type: "array",
                    items: { type: "string" },
                  },
                  confidence: { type: "number" },
                  summary: { type: "string" },
                  suggestedSharingLevel: {
                    type: "string",
                    enum: ["internal", "partners", "public"],
                  },
                  extractedMetadata: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      owner: { type: "string" },
                      version: { type: "string" },
                      lastUpdated: { type: "string" },
                      approvalDate: { type: "string" },
                      approvedBy: { type: "string" },
                      nextReviewDate: { type: "string" },
                      expiryDate: { type: "string" },
                    },
                  },
                  qualityFindings: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        type: { type: "string", enum: [...FINDING_TYPES] },
                        severity: { type: "string", enum: ["info", "warning", "critical"] },
                        messageNb: { type: "string" },
                        messageEn: { type: "string" },
                      },
                      required: ["type", "severity", "messageNb", "messageEn"],
                    },
                  },
                  documentDate: { type: "string" },
                  tier: { type: "string", enum: [...TIER_LEVELS] },
                  tierSignals: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        key: { type: "string" },
                        labelNb: { type: "string" },
                        labelEn: { type: "string" },
                      },
                      required: ["key", "labelNb", "labelEn"],
                    },
                  },
                  suggestedControls: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        controlId: { type: "string" },
                        labelNb: { type: "string" },
                        labelEn: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["controlId", "confidence"],
                    },
                  },
                },
                required: [
                  "documentType",
                  "documentTypeLabel",
                  "controlAreas",
                  "confidence",
                  "summary",
                  "suggestedSharingLevel",
                  "extractedMetadata",
                  "qualityFindings",
                  "supportedControls",
                  "tier",
                  "tierSignals",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_evidence" } },
      }),
    });


    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI call failed", status: aiResponse.status }), {
        status: aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    logAiUsage("classify-evidence-document", aiJson);
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No classification returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const classification = JSON.parse(toolCall.function.arguments);

    // Flag utdatert dokument (>6 mnd)
    if (classification.documentDate) {
      const then = Date.parse(classification.documentDate);
      if (!Number.isNaN(then)) {
        const cutoff = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
        classification.isOutdated = then < cutoff;
      }
    }

    return new Response(JSON.stringify({ classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("classify-evidence-document error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
