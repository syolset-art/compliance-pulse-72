import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mock 7 Security customer database for prototype
const VALID_CUSTOMER_IDS = [
  "7SEC-KUNDE-12345",
  "7SEC-KUNDE-67890",
  "7SEC-DEMO-00001",
];

// Mock Acronis assets from 7 Security
const MOCK_ACRONIS_ASSETS = [
  { id: "sys-1", name: "Microsoft 365", hostname: "m365.microsoft.com", type: "system", os: "SaaS", status: "protected", lastSeen: "1 min siden", complianceScore: 92, frameworks: ["ISO 27001", "GDPR"], vendor: "Microsoft" },
  { id: "sys-2", name: "SAP S/4HANA", hostname: "sap-prod.company.no", type: "system", os: "HANA DB", status: "protected", lastSeen: "3 min siden", complianceScore: 88, frameworks: ["ISO 27001", "SOC 2"], vendor: "SAP" },
  { id: "sys-3", name: "Salesforce CRM", hostname: "company.my.salesforce.com", type: "system", os: "SaaS", status: "protected", lastSeen: "2 min siden", complianceScore: 95, frameworks: ["ISO 27001", "GDPR", "SOC 2"], vendor: "Salesforce" },
  { id: "sys-4", name: "ServiceNow ITSM", hostname: "company.service-now.com", type: "system", os: "SaaS", status: "warning", lastSeen: "8 min siden", complianceScore: 78, frameworks: ["ISO 27001"], vendor: "ServiceNow" },
  { id: "sys-5", name: "Visma Business", hostname: "visma-prod.company.no", type: "system", os: "Windows Server 2022", status: "protected", lastSeen: "5 min siden", complianceScore: 85, frameworks: ["GDPR"], vendor: "Visma" },
  { id: "loc-1", name: "Hovedkontor Oslo", hostname: "oslo-hq.company.no", type: "location", os: "Akersgata 20, 0158 Oslo", status: "protected", lastSeen: "1 min siden", complianceScore: 94, frameworks: ["ISO 27001", "NS-EN 50600"] },
  { id: "loc-2", name: "Avdeling Bergen", hostname: "bergen.company.no", type: "location", os: "Bryggen 12, 5003 Bergen", status: "protected", lastSeen: "2 min siden", complianceScore: 89, frameworks: ["ISO 27001"] },
  { id: "loc-3", name: "Datasenter Green Mountain", hostname: "dc1.greenmountain.no", type: "location", os: "Rennesøy, Rogaland", status: "protected", lastSeen: "30 sek siden", complianceScore: 98, frameworks: ["ISO 27001", "SOC 2", "NS-EN 50600"] },
  { id: "net-1", name: "Hovedkontor LAN", hostname: "10.0.0.0/16", type: "network", os: "Cisco Catalyst 9300", status: "protected", lastSeen: "1 min siden", complianceScore: 90, frameworks: ["ISO 27001"], vendor: "Cisco" },
  { id: "net-2", name: "Azure Virtual Network", hostname: "vnet-prod-norway.azure", type: "network", os: "Azure VNET", status: "protected", lastSeen: "2 min siden", complianceScore: 94, frameworks: ["ISO 27001", "SOC 2"], vendor: "Microsoft" },
  { id: "hw-1", name: "Dell PowerEdge R750", hostname: "srv-prod-01.company.no", type: "hardware", os: "Windows Server 2022", status: "protected", lastSeen: "1 min siden", complianceScore: 92, frameworks: ["ISO 27001"], vendor: "Dell" },
  { id: "hw-2", name: "Fortinet FortiGate 600E", hostname: "fw-main.company.no", type: "hardware", os: "FortiOS 7.4.1", status: "protected", lastSeen: "30 sek siden", complianceScore: 97, frameworks: ["ISO 27001", "PCI DSS"], vendor: "Fortinet" },
  { id: "ven-1", name: "TietoEvry", hostname: "tietoevry.com", type: "vendor", os: "IT-drift og systemutvikling", status: "protected", lastSeen: "1 dag siden", complianceScore: 91, frameworks: ["ISO 27001", "SOC 2"] },
  { id: "ven-2", name: "Atea", hostname: "atea.no", type: "vendor", os: "Hardware og infrastruktur", status: "protected", lastSeen: "2 dager siden", complianceScore: 88, frameworks: ["ISO 27001"] },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, customer_id, asset_types, org_number, contact_name, contact_email, workspace_id } = await req.json();

    console.log(`7 Security Integration - Action: ${action}, Customer ID: ${customer_id}`);

    switch (action) {
      case "verify_customer": {
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const isValid = VALID_CUSTOMER_IDS.includes(customer_id) || customer_id?.startsWith("7SEC-");
        
        if (isValid) {
          return new Response(JSON.stringify({
            success: true,
            verified: true,
            customer_name: "Demo Bedrift AS", // Would come from 7 Security
            partner: "7 Security",
            message: "Kunde-ID verifisert hos 7 Security"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            verified: false,
            message: "Kunde-ID ikke funnet hos 7 Security. Sjekk at ID-en er korrekt eller be om tilgang."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "request_access": {
        // Simulate creating an access request
        console.log(`Access request for org: ${org_number}, contact: ${contact_name} (${contact_email})`);
        
        // In production, this would send a request to 7 Security
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate a pending request ID
        const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
        
        return new Response(JSON.stringify({
          success: true,
          request_id: requestId,
          estimated_activation: "24 timer",
          message: "Tilgangsforespørsel sendt til 7 Security. Du vil motta en e-post når tilgangen er aktivert."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "fetch_acronis_assets": {
        // Verify customer first
        if (!customer_id) {
          return new Response(JSON.stringify({
            success: false,
            error: "Kunde-ID er påkrevd"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Simulate fetching delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Filter assets based on requested types
        let assets = MOCK_ACRONIS_ASSETS;
        if (asset_types && asset_types.length > 0 && !asset_types.includes("all")) {
          assets = assets.filter(a => asset_types.includes(a.type));
        }

        return new Response(JSON.stringify({
          success: true,
          customer_id,
          source: "acronis",
          partner: "7 Security",
          assets,
          sync_token: `SYNC-${Date.now().toString(36)}`,
          fetched_at: new Date().toISOString(),
          next_sync_available: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_sync_status": {
        return new Response(JSON.stringify({
          success: true,
          status: "active",
          last_sync: new Date(Date.now() - 3600000).toISOString(),
          next_sync: new Date(Date.now() + 3600000).toISOString(),
          assets_synced: MOCK_ACRONIS_ASSETS.length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_pending_request": {
        // For demo purposes, always return pending
        return new Response(JSON.stringify({
          success: true,
          status: "pending",
          message: "Venter på godkjenning fra 7 Security"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Ukjent handling: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in fetch-7security-data:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "En ukjent feil oppstod"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
