import { supabase } from "@/integrations/supabase/client";

const DEMO_SYSTEMS = [
  { name: "Microsoft 365", description: "Office-pakke med e-post, dokumenter og samarbeid", category: "Produktivitet", vendor: "Microsoft", status: "active", risk_level: "low" },
  { name: "Salesforce CRM", description: "Kundebehandling og salgsstøtte", category: "CRM", vendor: "Salesforce", status: "active", risk_level: "medium" },
  { name: "SAP Business One", description: "ERP-system for økonomi og logistikk", category: "ERP", vendor: "SAP", status: "active", risk_level: "high" },
  { name: "Slack", description: "Intern kommunikasjon og meldinger", category: "Kommunikasjon", vendor: "Slack Technologies", status: "active", risk_level: "low" },
  { name: "GitHub Enterprise", description: "Versjonskontroll og kodelagring", category: "Utvikling", vendor: "GitHub (Microsoft)", status: "active", risk_level: "medium" },
  { name: "Visma.net", description: "Regnskapssystem og fakturering", category: "Økonomi", vendor: "Visma", status: "active", risk_level: "medium" },
  { name: "Jira Software", description: "Prosjektstyring og oppgavehåndtering", category: "Prosjektstyring", vendor: "Atlassian", status: "active", risk_level: "low" },
  { name: "AWS Cloud Services", description: "Skyinfrastruktur og hosting", category: "Infrastruktur", vendor: "Amazon Web Services", status: "active", risk_level: "high" },
  { name: "Zendesk Support", description: "Kundeservice og henvendelseshåndtering", category: "Kundeservice", vendor: "Zendesk", status: "active", risk_level: "low" },
  { name: "HubSpot Marketing", description: "Markedsføring og lead-generering", category: "Markedsføring", vendor: "HubSpot", status: "active", risk_level: "medium" },
  { name: "Zoom Meetings", description: "Videomøter og webinarer", category: "Kommunikasjon", vendor: "Zoom", status: "active", risk_level: "low" },
  { name: "Tripletex", description: "Norsk regnskapssystem", category: "Økonomi", vendor: "Tripletex AS", status: "active", risk_level: "low" },
];

export async function seedDemoSystems(): Promise<number> {
  // Check if demo data already exists
  const { data: existing } = await supabase
    .from("systems")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Det finnes allerede systemer. Slett eksisterende først.");
  }

  const { data, error } = await supabase
    .from("systems")
    .insert(DEMO_SYSTEMS)
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}

export async function deleteDemoSystems(): Promise<number> {
  const { data: existing } = await supabase
    .from("systems")
    .select("id");

  if (!existing || existing.length === 0) return 0;

  const { error } = await supabase
    .from("systems")
    .delete()
    .in("id", existing.map(s => s.id));

  if (error) throw error;
  return existing.length;
}
