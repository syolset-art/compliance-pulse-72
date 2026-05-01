// Analyze processes in a work area and recommend AI agent fit (autonomous / copilot / manual)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";

interface ProcessInput {
  id: string;
  name: string;
  description: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { workAreaId, language = "nb", processIds } = await req.json();
    if (!workAreaId) {
      return new Response(JSON.stringify({ error: "workAreaId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch work area
    const { data: workArea } = await supabase
      .from("work_areas")
      .select("id, name, description")
      .eq("id", workAreaId)
      .maybeSingle();

    // Fetch all systems in the work area
    const { data: systems } = await supabase
      .from("systems")
      .select("id, name")
      .eq("work_area_id", workAreaId);

    const systemIds = (systems || []).map((s: any) => s.id);
    if (systemIds.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "no_processes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch processes (optionally narrowed to specific IDs for incremental analysis)
    let procQuery = supabase
      .from("system_processes")
      .select("id, name, description")
      .in("system_id", systemIds);
    if (Array.isArray(processIds) && processIds.length > 0) {
      procQuery = procQuery.in("id", processIds);
    }
    const { data: processes } = await procQuery;

    const procList: ProcessInput[] = (processes || []) as any;
    if (procList.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "no_processes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isNb = language === "nb";
    const sysPrompt = isNb
      ? `Du er Lara, en AI-rådgiver som hjelper ledere å identifisere hvor en AI-agent kan ta over eller assistere arbeid i en virksomhet. For hver prosess: vurder om en autonom AI-agent kan utføre arbeidet alene, om den bør være co-pilot for et menneske, eller om prosessen krever skjønn/relasjoner og bør forbli manuell.`
      : `You are Lara, an AI advisor who helps leaders identify where an AI agent can take over or assist work in a business. For each process, decide if an autonomous AI agent can do it alone, if it should be a co-pilot to a human, or if it requires judgment/relationships and should remain manual.`;

    const userPrompt =
      (isNb
        ? `Arbeidsområde: ${workArea?.name || "Ukjent"}\n\nProsesser:\n`
        : `Work area: ${workArea?.name || "Unknown"}\n\nProcesses:\n`) +
      procList
        .map(
          (p, i) =>
            `${i + 1}. ${p.name}${p.description ? " — " + p.description : ""}`
        )
        .join("\n");

    const tool = {
      type: "function",
      function: {
        name: "submit_recommendations",
        description: "Return AI agent fit recommendations for each process",
        parameters: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  process_index: {
                    type: "integer",
                    description: "1-based index of the process from the list",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["autonomous", "copilot", "manual"],
                  },
                  rationale: {
                    type: "string",
                    description: "One short sentence explaining the choice",
                  },
                  suggested_agent_role: {
                    type: "string",
                    description:
                      "Concise role name for the AI agent, e.g. 'DPA-overvåker', 'Onboarding-screener'",
                  },
                  estimated_hours_saved_per_month: {
                    type: "number",
                    description:
                      "Rough estimate of hours saved per month if the recommendation is followed",
                  },
                },
                required: [
                  "process_index",
                  "recommendation",
                  "rationale",
                  "suggested_agent_role",
                  "estimated_hours_saved_per_month",
                ],
              },
            },
          },
          required: ["recommendations"],
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_recommendations" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error("AI gateway error: " + text);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const args = JSON.parse(toolCall.function.arguments);
    const recs: any[] = args.recommendations || [];

    // Map back to process IDs and upsert
    const rows = recs
      .map((r) => {
        const proc = procList[r.process_index - 1];
        if (!proc) return null;
        return {
          process_id: proc.id,
          work_area_id: workAreaId,
          recommendation: r.recommendation,
          rationale: r.rationale,
          suggested_agent_role: r.suggested_agent_role,
          estimated_hours_saved_per_month: r.estimated_hours_saved_per_month || 0,
          generated_by_model: MODEL,
          generated_at: new Date().toISOString(),
          status: "proposed",
        };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("process_agent_recommendations")
        .upsert(rows as any, { onConflict: "process_id" });
      if (upsertErr) throw upsertErr;
    }

    return new Response(
      JSON.stringify({ recommendations: rows, count: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("analyze-process-agent-fit error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
