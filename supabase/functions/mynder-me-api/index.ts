import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-employee-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const employeeToken = req.headers.get("x-employee-token");

    // Actions that require employee token
    const tokenActions = ["get-policies", "get-incidents", "get-courses", "submit-course-completion", "get-consents", "get-ai-systems"];

    if (tokenActions.includes(action || "") && !employeeToken) {
      return new Response(JSON.stringify({ error: "Missing employee token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token if provided
    if (employeeToken) {
      const { data: conn } = await supabase
        .from("employee_connections")
        .select("id, status")
        .eq("employee_token", employeeToken)
        .eq("status", "active")
        .maybeSingle();

      if (!conn) {
        return new Response(JSON.stringify({ error: "Invalid or inactive token" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update last seen
      await supabase
        .from("employee_connections")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("employee_token", employeeToken);
    }

    let result: unknown;

    switch (action) {
      case "get-courses": {
        const { data } = await supabase
          .from("security_micro_courses")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        // Get completions for this employee
        const { data: completions } = await supabase
          .from("course_completions")
          .select("course_id, completed_at, score")
          .eq("employee_token", employeeToken!);

        result = { courses: data, completions };
        break;
      }

      case "submit-course-completion": {
        const body = await req.json();
        const { data } = await supabase
          .from("course_completions")
          .insert({
            employee_token: employeeToken!,
            course_id: body.course_id,
            score: body.score || null,
          })
          .select()
          .single();
        result = data;
        break;
      }

      case "get-incidents": {
        const { data } = await supabase
          .from("employee_notifications")
          .select("*")
          .eq("type", "incident")
          .order("created_at", { ascending: false })
          .limit(20);
        result = data;
        break;
      }

      case "get-policies": {
        const { data } = await supabase
          .from("employee_notifications")
          .select("*")
          .eq("type", "policy_update")
          .order("created_at", { ascending: false });
        result = data;
        break;
      }

      case "get-ai-systems": {
        const { data } = await supabase
          .from("ai_system_registry")
          .select("name, provider, risk_category, transparency_measures, human_oversight_level, status")
          .eq("status", "active");
        result = data;
        break;
      }

      case "get-consents": {
        // Return process records that involve personal data
        const { data } = await supabase
          .from("system_processes")
          .select("name, description, status")
          .eq("status", "active")
          .limit(50);
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action", available: tokenActions }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
