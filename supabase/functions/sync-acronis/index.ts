import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcronisDevice {
  id: string;
  name: string;
  hostname: string;
  type: string;
  os?: string;
  status: string;
  last_seen?: string;
}

// Simulerer Acronis API-respons for demo
function mockAcronisDevices(): AcronisDevice[] {
  return [
    { id: "acr-001", name: "SRV-DC01", hostname: "srv-dc01.company.local", type: "server", os: "Windows Server 2022", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-002", name: "SRV-SQL01", hostname: "srv-sql01.company.local", type: "server", os: "Windows Server 2019", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-003", name: "SRV-FILE01", hostname: "srv-file01.company.local", type: "server", os: "Windows Server 2022", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-004", name: "WS-ADMIN01", hostname: "ws-admin01.company.local", type: "workstation", os: "Windows 11 Pro", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-005", name: "WS-DEV01", hostname: "ws-dev01.company.local", type: "workstation", os: "Windows 11 Pro", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-006", name: "WS-DEV02", hostname: "ws-dev02.company.local", type: "workstation", os: "macOS Sonoma", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-007", name: "SRV-WEB01", hostname: "srv-web01.company.local", type: "server", os: "Ubuntu 22.04 LTS", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-008", name: "SRV-APP01", hostname: "srv-app01.company.local", type: "server", os: "Windows Server 2022", status: "warning", last_seen: new Date().toISOString() },
    { id: "acr-009", name: "NAS-BACKUP01", hostname: "nas-backup01.company.local", type: "storage", os: "Synology DSM 7", status: "protected", last_seen: new Date().toISOString() },
    { id: "acr-010", name: "WS-SALES01", hostname: "ws-sales01.company.local", type: "workstation", os: "Windows 11 Pro", status: "protected", last_seen: new Date().toISOString() },
  ];
}

function mapAcronisToAsset(device: AcronisDevice) {
  // Map Acronis device type to asset_type
  const typeMap: Record<string, string> = {
    server: "hardware",
    workstation: "hardware",
    storage: "hardware",
    virtual_machine: "hardware",
  };

  // Map to risk level based on status
  const riskMap: Record<string, string> = {
    protected: "low",
    warning: "medium",
    critical: "high",
    unprotected: "high",
  };

  return {
    name: device.name,
    description: `${device.hostname} - ${device.os || "Ukjent OS"}`,
    asset_type: typeMap[device.type] || "hardware",
    vendor: "Acronis",
    category: device.type,
    risk_level: riskMap[device.status] || "medium",
    external_source_id: device.id,
    external_source_provider: "acronis",
    metadata: {
      hostname: device.hostname,
      os: device.os,
      status: device.status,
      last_seen: device.last_seen,
      device_type: device.type,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, api_key, asset_ids, enable_sync, sync_frequency } = await req.json();

    console.log(`Acronis sync action: ${action}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case "test_connection": {
        // In production, this would verify the API key with Acronis
        // For demo, we simulate a successful connection
        if (!api_key || api_key.length < 10) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Ugyldig API-nøkkel. Sjekk at nøkkelen er korrekt." 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Store the connection
        const { data: connection, error: connError } = await supabase
          .from("integration_connections")
          .upsert({
            provider: "acronis",
            display_name: "Acronis Cyber Protect",
            api_key_encrypted: api_key, // In production, encrypt this!
            is_active: true,
            sync_status: "connected",
          }, { onConflict: "provider" })
          .select()
          .single();

        if (connError) {
          console.error("Error storing connection:", connError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Tilkobling til Acronis vellykket!",
            connection_id: connection?.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "fetch_assets": {
        // In production, call Acronis API to get devices
        // For demo, return mock data
        const devices = mockAcronisDevices();
        const assets = devices.map(mapAcronisToAsset);

        // Check which assets already exist
        const { data: existingAssets } = await supabase
          .from("assets")
          .select("external_source_id")
          .eq("external_source_provider", "acronis");

        const existingIds = new Set(existingAssets?.map(a => a.external_source_id) || []);

        const assetsWithStatus = assets.map(asset => ({
          ...asset,
          already_imported: existingIds.has(asset.external_source_id),
        }));

        return new Response(
          JSON.stringify({ 
            success: true, 
            assets: assetsWithStatus,
            total: assets.length,
            new_count: assets.filter(a => !existingIds.has(a.external_source_id)).length,
            existing_count: assets.filter(a => existingIds.has(a.external_source_id)).length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "import_assets": {
        if (!asset_ids || asset_ids.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Ingen eiendeler valgt for import" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the assets to import from mock data (in production, fetch from Acronis)
        const devices = mockAcronisDevices();
        const assetsToImport = devices
          .filter(d => asset_ids.includes(d.id))
          .map(d => ({
            ...mapAcronisToAsset(d),
            sync_enabled: enable_sync || false,
            last_synced_at: new Date().toISOString(),
          }));

        // Insert assets
        const { data: insertedAssets, error: insertError } = await supabase
          .from("assets")
          .upsert(assetsToImport, { 
            onConflict: "external_source_id,external_source_provider",
            ignoreDuplicates: false
          })
          .select();

        if (insertError) {
          console.error("Error inserting assets:", insertError);
          return new Response(
            JSON.stringify({ success: false, error: "Kunne ikke importere eiendeler" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update sync settings if enabled
        if (enable_sync) {
          await supabase
            .from("integration_connections")
            .update({ 
              sync_frequency: sync_frequency || "daily",
              sync_status: "active",
              last_sync_at: new Date().toISOString()
            })
            .eq("provider", "acronis");
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            imported_count: insertedAssets?.length || 0,
            message: `${insertedAssets?.length || 0} eiendeler importert fra Acronis`,
            sync_enabled: enable_sync || false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync": {
        // Called by cron job for automatic sync
        const { data: connection } = await supabase
          .from("integration_connections")
          .select("*")
          .eq("provider", "acronis")
          .eq("is_active", true)
          .single();

        if (!connection) {
          return new Response(
            JSON.stringify({ success: false, error: "Ingen aktiv Acronis-tilkobling" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch and sync all devices
        const devices = mockAcronisDevices();
        const assets = devices.map(d => ({
          ...mapAcronisToAsset(d),
          sync_enabled: true,
          last_synced_at: new Date().toISOString(),
        }));

        const { data: syncedAssets, error: syncError } = await supabase
          .from("assets")
          .upsert(assets, { 
            onConflict: "external_source_id,external_source_provider",
            ignoreDuplicates: false
          })
          .select();

        await supabase
          .from("integration_connections")
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_status: syncError ? "error" : "active"
          })
          .eq("provider", "acronis");

        return new Response(
          JSON.stringify({ 
            success: !syncError, 
            synced_count: syncedAssets?.length || 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Ukjent handling" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Acronis sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Ukjent feil" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
