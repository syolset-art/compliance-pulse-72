import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOCK_INCIDENTS = [
  {
    title: "Ransomware-forsøk blokkert på SRV-SQL01",
    description: "Automatisk blokkering av mistenkelig krypteringsforsøk på databaseserver. Ingen data kompromittert.",
    severity: "critical",
    source_incident_id: "7SEC-2026-0451",
  },
  {
    title: "Uautorisert tilgangsforsøk fra ekstern IP",
    description: "Gjentatte påloggingsforsøk fra IP 185.220.101.x mot VPN-gateway. IP blokkert automatisk.",
    severity: "high",
    source_incident_id: "7SEC-2026-0449",
  },
  {
    title: "SSL-sertifikat utløpt på webserver",
    description: "Sertifikat for portal.example.no utløp 14.02.2026. Automatisk fornyelse feilet.",
    severity: "medium",
    source_incident_id: "7SEC-2026-0447",
  },
  {
    title: "Mislykket backup på NAS-BACKUP01",
    description: "Nattlig backup feilet grunnet fullt diskvolum. Manuell opprydding nødvendig.",
    severity: "high",
    source_incident_id: "7SEC-2026-0445",
  },
  {
    title: "Phishing-epost oppdaget og blokkert",
    description: "E-post med ondsinnet vedlegg sendt til 12 ansatte. Blokkert av e-postsikkerhet, ingen klikk registrert.",
    severity: "medium",
    source_incident_id: "7SEC-2026-0443",
  },
];

const severityToRisk: Record<string, string> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, asset_id } = await req.json();

    if (action === "fetch_recent_incidents") {
      // Find existing source_incident_ids to avoid duplicates
      const { data: existing } = await supabase
        .from("lara_inbox")
        .select("subject")
        .eq("sender_name", "7 Security")
        .in("status", ["new", "auto_matched"]);

      const existingTitles = new Set((existing || []).map((e: any) => e.subject));

      const newIncidents = MOCK_INCIDENTS.filter(
        (m) => !existingTitles.has(m.title)
      );

      if (newIncidents.length === 0) {
        return new Response(
          JSON.stringify({ message: "Ingen nye hendelser fra 7 Security", count: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into lara_inbox as incident type
      const inboxItems = newIncidents.map((incident) => ({
        sender_email: "soc@7security.se",
        sender_name: "7 Security",
        subject: incident.title,
        file_name: `${incident.source_incident_id}.json`,
        matched_document_type: "incident",
        matched_asset_id: asset_id || null,
        confidence_score: 0.92,
        status: "new",
        received_at: new Date().toISOString(),
        file_path: incident.description,
      }));

      const { error } = await supabase.from("lara_inbox").insert(inboxItems);
      if (error) throw error;

      return new Response(
        JSON.stringify({ message: `${newIncidents.length} hendelser mottatt fra 7 Security`, count: newIncidents.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve_incident") {
      const { inbox_item_id, system_id } = await req.json();

      // Get inbox item
      const { data: item, error: fetchErr } = await supabase
        .from("lara_inbox")
        .select("*")
        .eq("id", inbox_item_id)
        .single();
      if (fetchErr) throw fetchErr;

      // Determine severity from file_name (contains source_incident_id)
      const mockMatch = MOCK_INCIDENTS.find((m) => item.file_name?.includes(m.source_incident_id));
      const severity = mockMatch?.severity || "medium";

      // Create system_incident
      const { error: insertErr } = await supabase.from("system_incidents").insert({
        system_id: system_id || item.matched_asset_id,
        title: item.subject,
        description: item.file_path, // We stored description in file_path
        risk_level: severityToRisk[severity] || "medium",
        criticality: severity,
        status: "open",
        source: "7security",
        source_incident_id: mockMatch?.source_incident_id || null,
        source_severity: severity,
        auto_created: true,
        category: "sikkerhetshendelse",
      });
      if (insertErr) throw insertErr;

      // Update inbox status
      await supabase
        .from("lara_inbox")
        .update({ status: "manually_assigned", processed_at: new Date().toISOString() })
        .eq("id", inbox_item_id);

      return new Response(
        JSON.stringify({ message: "Hendelse godkjent og opprettet som avvik" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
