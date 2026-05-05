import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mock 7 Security customer database for prototype
const VALID_CUSTOMER_IDS = [
  "7SEC-CUSTOMER-12345",
  "7SEC-CUSTOMER-67890",
  "7SEC-DEMO-00001",
];

// Generic placeholder assets used by the demo prototype.
// Do NOT include real hostnames, network ranges, addresses, hardware models or vendor names here.
const MOCK_ACRONIS_ASSETS = [
  { id: "sys-1", name: "Productivity Suite", hostname: "suite.example.com", type: "system", os: "SaaS", status: "protected", lastSeen: "1 min ago", complianceScore: 92, frameworks: ["ISO 27001", "GDPR"], vendor: "Example Vendor A" },
  { id: "sys-2", name: "ERP Platform", hostname: "erp.example.com", type: "system", os: "SaaS", status: "protected", lastSeen: "3 min ago", complianceScore: 88, frameworks: ["ISO 27001", "SOC 2"], vendor: "Example Vendor B" },
  { id: "sys-3", name: "CRM Platform", hostname: "crm.example.com", type: "system", os: "SaaS", status: "protected", lastSeen: "2 min ago", complianceScore: 95, frameworks: ["ISO 27001", "GDPR", "SOC 2"], vendor: "Example Vendor C" },
  { id: "sys-4", name: "ITSM Platform", hostname: "itsm.example.com", type: "system", os: "SaaS", status: "warning", lastSeen: "8 min ago", complianceScore: 78, frameworks: ["ISO 27001"], vendor: "Example Vendor D" },
  { id: "sys-5", name: "Finance System", hostname: "finance.example.com", type: "system", os: "SaaS", status: "protected", lastSeen: "5 min ago", complianceScore: 85, frameworks: ["GDPR"], vendor: "Example Vendor E" },
  { id: "loc-1", name: "Headquarters", hostname: "hq.example.com", type: "location", os: "Primary office", status: "protected", lastSeen: "1 min ago", complianceScore: 94, frameworks: ["ISO 27001"] },
  { id: "loc-2", name: "Branch Office", hostname: "branch.example.com", type: "location", os: "Secondary office", status: "protected", lastSeen: "2 min ago", complianceScore: 89, frameworks: ["ISO 27001"] },
  { id: "loc-3", name: "Data Center", hostname: "dc.example.com", type: "location", os: "Tier III facility", status: "protected", lastSeen: "30 sec ago", complianceScore: 98, frameworks: ["ISO 27001", "SOC 2"] },
  { id: "net-1", name: "Office LAN", hostname: "lan.example.com", type: "network", os: "Managed switch", status: "protected", lastSeen: "1 min ago", complianceScore: 90, frameworks: ["ISO 27001"], vendor: "Example Vendor F" },
  { id: "net-2", name: "Cloud Network", hostname: "cloud-net.example.com", type: "network", os: "Virtual network", status: "protected", lastSeen: "2 min ago", complianceScore: 94, frameworks: ["ISO 27001", "SOC 2"], vendor: "Example Vendor G" },
  { id: "hw-1", name: "Application Server", hostname: "srv-01.example.com", type: "hardware", os: "Server OS", status: "protected", lastSeen: "1 min ago", complianceScore: 92, frameworks: ["ISO 27001"], vendor: "Example Vendor H" },
  { id: "hw-2", name: "Network Firewall", hostname: "fw-01.example.com", type: "hardware", os: "Firewall OS", status: "protected", lastSeen: "30 sec ago", complianceScore: 97, frameworks: ["ISO 27001", "PCI DSS"], vendor: "Example Vendor I" },
  { id: "ven-1", name: "Example IT Services", hostname: "services.example.com", type: "vendor", os: "IT operations and development", status: "protected", lastSeen: "1 day ago", complianceScore: 91, frameworks: ["ISO 27001", "SOC 2"] },
  { id: "ven-2", name: "Example Infrastructure", hostname: "infra.example.com", type: "vendor", os: "Hardware and infrastructure", status: "protected", lastSeen: "2 days ago", complianceScore: 88, frameworks: ["ISO 27001"] },
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
            customer_name: "Demo Company AS", // Would come from 7 Security
            partner: "7 Security",
            message: "Customer ID verified with 7 Security"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            verified: false,
            message: "Customer ID not found at 7 Security. Please verify the ID is correct or request access."
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
          estimated_activation: "24 hours",
          message: "Access request sent to 7 Security. You will receive an email when access is activated."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "fetch_acronis_assets": {
        // Verify customer first
        if (!customer_id) {
          return new Response(JSON.stringify({
            success: false,
            error: "Customer ID is required"
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
          message: "Awaiting approval from 7 Security"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in fetch-7security-data:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
