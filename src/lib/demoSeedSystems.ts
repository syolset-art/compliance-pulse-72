import { supabase } from "@/integrations/supabase/client";

interface DemoSystem {
  name: string;
  description: string;
  category: string;
  vendor: string;
  status: string;
  risk_level: string;
  /** Vendor name to match/create in assets table */
  vendorAssetName?: string;
  /** Related IoT/device asset names to create relationships with */
  relatedDevices?: { name: string; device_type: string; description: string }[];
}

const DEMO_SYSTEMS: DemoSystem[] = [
  {
    name: "Microsoft 365",
    description: "Office-pakke med e-post, dokumenter og samarbeid",
    category: "Produktivitet",
    vendor: "Microsoft",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Microsoft Corporation",
  },
  {
    name: "Salesforce CRM",
    description: "Kundebehandling og salgsstøtte",
    category: "CRM",
    vendor: "Salesforce",
    status: "active",
    risk_level: "medium",
    vendorAssetName: "Salesforce Inc.",
  },
  {
    name: "SAP Business One",
    description: "ERP-system for økonomi og logistikk",
    category: "ERP",
    vendor: "SAP",
    status: "active",
    risk_level: "high",
    vendorAssetName: "SAP SE",
  },
  {
    name: "Slack",
    description: "Intern kommunikasjon og meldinger",
    category: "Kommunikasjon",
    vendor: "Slack Technologies",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Salesforce Inc.", // Slack owned by Salesforce
  },
  {
    name: "GitHub Enterprise",
    description: "Versjonskontroll og kodelagring",
    category: "Utvikling",
    vendor: "GitHub (Microsoft)",
    status: "active",
    risk_level: "medium",
    vendorAssetName: "Microsoft Corporation",
  },
  {
    name: "Visma.net",
    description: "Regnskapssystem og fakturering",
    category: "Økonomi",
    vendor: "Visma",
    status: "active",
    risk_level: "medium",
    vendorAssetName: "Visma AS",
  },
  {
    name: "Jira Software",
    description: "Prosjektstyring og oppgavehåndtering",
    category: "Prosjektstyring",
    vendor: "Atlassian",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Atlassian Pty Ltd",
  },
  {
    name: "AWS Cloud Services",
    description: "Skyinfrastruktur og hosting",
    category: "Infrastruktur",
    vendor: "Amazon Web Services",
    status: "active",
    risk_level: "high",
    vendorAssetName: "Amazon Web Services",
    relatedDevices: [
      { name: "IOT-GW-AWS-01", device_type: "iot", description: "IoT Gateway koblet til AWS IoT Core" },
      { name: "SENSOR-TEMP-01", device_type: "iot", description: "Temperatursensor – serverrom" },
    ],
  },
  {
    name: "Zendesk Support",
    description: "Kundeservice og henvendelseshåndtering",
    category: "Kundeservice",
    vendor: "Zendesk",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Zendesk Inc.",
  },
  {
    name: "HubSpot Marketing",
    description: "Markedsføring og lead-generering",
    category: "Markedsføring",
    vendor: "HubSpot",
    status: "active",
    risk_level: "medium",
    vendorAssetName: "HubSpot Inc.",
  },
  {
    name: "Zoom Meetings",
    description: "Videomøter og webinarer",
    category: "Kommunikasjon",
    vendor: "Zoom",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Zoom Video Communications",
  },
  {
    name: "Tripletex",
    description: "Norsk regnskapssystem",
    category: "Økonomi",
    vendor: "Tripletex AS",
    status: "active",
    risk_level: "low",
    vendorAssetName: "Tripletex AS",
  },
  {
    name: "Cisco Meraki",
    description: "Nettverksadministrasjon og SD-WAN",
    category: "Nettverk",
    vendor: "Cisco",
    status: "active",
    risk_level: "medium",
    vendorAssetName: "Cisco Systems",
    relatedDevices: [
      { name: "SW-CORE-01", device_type: "network", description: "Kjernesvitsj – Cisco Meraki MS250" },
      { name: "AP-WIFI-01", device_type: "network", description: "Trådløst aksesspunkt – Cisco Meraki MR46" },
      { name: "FW-EDGE-01", device_type: "security", description: "Brannmur – Cisco Meraki MX67" },
    ],
  },
  {
    name: "Azure IoT Hub",
    description: "Plattform for IoT-enhetsadministrasjon og telemetri",
    category: "IoT / OT",
    vendor: "Microsoft",
    status: "active",
    risk_level: "high",
    vendorAssetName: "Microsoft Corporation",
    relatedDevices: [
      { name: "IOT-HVAC-01", device_type: "iot", description: "Smart HVAC-kontroller – ventilasjon" },
      { name: "IOT-ACCESS-01", device_type: "iot", description: "IoT adgangskontroll – hovedinngang" },
      { name: "SENSOR-FUKT-01", device_type: "iot", description: "Fuktighetssensor – arkiv" },
    ],
  },
];

export async function seedDemoSystems(): Promise<number> {
  const { data: existing } = await supabase
    .from("systems")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Det finnes allerede systemer. Slett eksisterende først.");
  }

  // 1. Insert systems
  const systemRows = DEMO_SYSTEMS.map(({ vendorAssetName, relatedDevices, ...rest }) => rest);
  const { data: insertedSystems, error: sysErr } = await supabase
    .from("systems")
    .insert(systemRows)
    .select("id, name, vendor");
  if (sysErr) throw sysErr;
  if (!insertedSystems) return 0;

  // 2. Collect unique vendor names and create vendor assets (skip duplicates)
  const vendorNames = [...new Set(DEMO_SYSTEMS.map(s => s.vendorAssetName).filter(Boolean))] as string[];
  
  // Check which vendors already exist
  const { data: existingVendors } = await supabase
    .from("assets")
    .select("id, name")
    .eq("asset_type", "vendor")
    .in("name", vendorNames);

  const existingVendorMap = new Map((existingVendors || []).map(v => [v.name, v.id]));
  const vendorsToCreate = vendorNames.filter(n => !existingVendorMap.has(n));

  if (vendorsToCreate.length > 0) {
    const { data: newVendors, error: vErr } = await supabase
      .from("assets")
      .insert(vendorsToCreate.map(name => ({
        name,
        asset_type: "vendor",
        description: `Leverandør: ${name}`,
        risk_level: "medium",
        lifecycle_status: "active",
      })))
      .select("id, name");
    if (!vErr && newVendors) {
      newVendors.forEach(v => existingVendorMap.set(v.name, v.id));
    }
  }

  // 3. Create IoT/device assets for systems that have relatedDevices
  const relationships: { source_asset_id: string; target_asset_id: string; relationship_type: string; description: string }[] = [];

  for (const demoDef of DEMO_SYSTEMS) {
    const insertedSystem = insertedSystems.find(s => s.name === demoDef.name);
    if (!insertedSystem) continue;

    // System → Vendor relationship (use a synthetic asset ID approach via name matching)
    // We'll create these after device assets

    if (demoDef.relatedDevices && demoDef.relatedDevices.length > 0) {
      const deviceInserts = demoDef.relatedDevices.map(d => ({
        name: d.name,
        asset_type: "hardware",
        description: d.description,
        risk_level: d.device_type === "iot" ? "high" : "medium",
        criticality: d.device_type === "security" ? "high" : "medium",
        lifecycle_status: "active",
        metadata: {
          is_demo_device: true,
          device_type: d.device_type,
          linked_system: demoDef.name,
          os: d.device_type === "iot" ? "Embedded Linux" : d.device_type === "network" ? "Cisco IOS" : "Firmware",
          status: "protected",
          hostname: d.name,
        },
      }));

      const { data: createdDevices, error: dErr } = await supabase
        .from("assets")
        .insert(deviceInserts)
        .select("id, name");

      if (!dErr && createdDevices) {
        // Create relationships: system (as source concept) → device asset
        // We need to find or create an asset representation for the system
        // Use vendor asset as the linking node: Vendor → Device
        const vendorId = demoDef.vendorAssetName ? existingVendorMap.get(demoDef.vendorAssetName) : null;
        
        for (const device of createdDevices) {
          if (vendorId) {
            relationships.push({
              source_asset_id: vendorId,
              target_asset_id: device.id,
              relationship_type: "manages_device",
              description: `${demoDef.vendorAssetName} leverer ${demoDef.name} som bruker ${device.name}`,
            });
          }
        }
      }
    }
  }

  // 4. Insert relationships
  if (relationships.length > 0) {
    await supabase.from("asset_relationships").insert(relationships);
  }

  return insertedSystems.length;
}

export async function deleteDemoSystems(): Promise<number> {
  // Delete systems
  const { data: existing } = await supabase
    .from("systems")
    .select("id");

  if (!existing || existing.length === 0) return 0;

  // Delete demo IoT/device assets created by seed
  const { data: demoDevices } = await supabase
    .from("assets")
    .select("id")
    .eq("asset_type", "hardware")
    .not("metadata->is_demo_device", "is", null);

  if (demoDevices && demoDevices.length > 0) {
    const deviceIds = demoDevices.map(d => d.id);
    // Delete relationships involving these devices
    await supabase
      .from("asset_relationships")
      .delete()
      .or(`source_asset_id.in.(${deviceIds.join(",")}),target_asset_id.in.(${deviceIds.join(",")})`);
    // Delete the devices
    await supabase.from("assets").delete().in("id", deviceIds);
  }

  const { error } = await supabase
    .from("systems")
    .delete()
    .in("id", existing.map(s => s.id));

  if (error) throw error;
  return existing.length;
}
