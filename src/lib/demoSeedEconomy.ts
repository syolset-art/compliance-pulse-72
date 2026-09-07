/**
 * Demo-seed for én sammenhengende historie: arbeidsområdet Økonomi.
 *
 * Hensikten er at demoen ikke skal være avhengig av at et AI-kall lykkes live.
 * Vi legger inn arbeidsområde, systemer, prosesser og ferdige AI-anbefalinger,
 * slik at flyten Oversikt → AI-mulighet → prosess → AI-oppsett kan klikkes.
 */

import { supabase } from "@/integrations/supabase/client";

export const ECONOMY_WORK_AREA_NAME = "Økonomi";
export const INVOICE_PROCESS_NAME = "Leverandørfaktura";

interface DemoSystemSeed {
  name: string;
  description: string;
  category: string;
  vendor: string;
  risk_level: string;
}

const DEMO_SYSTEMS: DemoSystemSeed[] = [
  {
    name: "Visma Business ERP",
    description: "Økonomisystem for regnskap, faktura og reskontro",
    category: "ERP",
    vendor: "Visma",
    risk_level: "high",
  },
  {
    name: "DNB Bedriftsbank",
    description: "Bankintegrasjon for utbetaling og avstemming",
    category: "Bank",
    vendor: "DNB",
    risk_level: "high",
  },
  {
    name: "Microsoft 365",
    description: "E-post og dokumenter brukt i økonomiarbeidet",
    category: "Produktivitet",
    vendor: "Microsoft",
    risk_level: "medium",
  },
];

interface DemoProcessSeed {
  name: string;
  description: string;
  purpose: string;
  data_class: string;
  legal_basis: string;
  /** Navnet på systemet prosessen hører hjemme i */
  system: string;
  recommendation: "autonomous" | "copilot" | "manual";
  rationale: string;
  role: string;
  hours: number;
}

const DEMO_PROCESSES: DemoProcessSeed[] = [
  {
    name: INVOICE_PROCESS_NAME,
    description:
      "Fakturaer fra leverandører mottas på e-post, kontrolleres mot bestilling, konteres og sendes til godkjenning før utbetaling.",
    purpose: "Behandle og betale fakturaer fra leverandører",
    data_class: "ordinary",
    legal_basis: "legal_obligation",
    system: "Visma Business ERP",
    recommendation: "autonomous",
    rationale:
      "Arbeidet er regelstyrt og gjentakende. Agenten kan lese fakturaen, kontrollere den mot bestilling og foreslå kontering. Beløp over terskel sendes alltid til et menneske.",
    role: "Fakturaflyt-agent",
    hours: 40,
  },
  {
    name: "Reiseregning",
    description:
      "Ansatte leverer reiseregninger med kvitteringer. Økonomi kontrollerer satser og vedlegg før utbetaling over lønn.",
    purpose: "Kontrollere og utbetale reiseutgifter til ansatte",
    data_class: "ordinary",
    legal_basis: "contract",
    system: "Visma Business ERP",
    recommendation: "copilot",
    rationale:
      "Agenten kan lese kvitteringer og flagge avvik mot statens satser, men ansattdata gjør at et menneske bør se over.",
    role: "Reiseregningsassistent",
    hours: 12,
  },
  {
    name: "Månedsavslutning",
    description:
      "Avstemming av bank, reskontro og periodiseringer før rapport til ledelsen.",
    purpose: "Avstemme regnskapet ved månedsslutt",
    data_class: "none",
    legal_basis: "legal_obligation",
    system: "DNB Bedriftsbank",
    recommendation: "copilot",
    rationale:
      "Agenten kan foreslå avstemminger og peke på differanser. Selve godkjenningen er et faglig skjønn.",
    role: "Avstemmingsassistent",
    hours: 8,
  },
  {
    name: "Kundefakturering",
    description:
      "Fakturagrunnlag hentes fra prosjekt og time, kvalitetssikres og sendes til kunde.",
    purpose: "Fakturere kunder for levert arbeid",
    data_class: "ordinary",
    legal_basis: "contract",
    system: "Visma Business ERP",
    recommendation: "manual",
    rationale:
      "Grunnlaget varierer for mye mellom kunder til at en agent kan overta arbeidet nå.",
    role: "—",
    hours: 0,
  },
];

/** Finnes Økonomi-demoen allerede, med AI-muligheter og alt? */
export async function economyDemoExists(): Promise<boolean> {
  const { data: wa } = await supabase
    .from("work_areas")
    .select("id")
    .eq("name", ECONOMY_WORK_AREA_NAME)
    .maybeSingle();
  if (!wa) return false;
  const { data: recs } = await supabase
    .from("process_agent_recommendations" as never)
    .select("id")
    .eq("work_area_id", wa.id)
    .limit(1);
  return (recs?.length ?? 0) > 0;
}

/**
 * Legger inn Økonomi-demoen. Idempotent og tåler halvferdige forsøk:
 * det som allerede finnes gjenbrukes, bare det som mangler opprettes.
 */
export async function seedDemoEconomy(): Promise<number> {
  if (await economyDemoExists()) return 0;

  // Arbeidsområde
  const { data: existingWa } = await supabase
    .from("work_areas")
    .select("id")
    .eq("name", ECONOMY_WORK_AREA_NAME)
    .maybeSingle();

  let workAreaId = existingWa?.id;
  if (!workAreaId) {
    const { data: created, error: waErr } = await supabase
      .from("work_areas")
      .insert({
        name: ECONOMY_WORK_AREA_NAME,
        description:
          "Regnskap, fakturabehandling, lønnsgrunnlag og rapportering til ledelsen.",
        responsible_person: "Maria Johansen",
        is_active: true,
      })
      .select("id")
      .single();
    if (waErr || !created) throw waErr ?? new Error("Kunne ikke opprette arbeidsområdet");
    workAreaId = created.id;
  }

  // Systemer
  const { data: existingSystems } = await supabase
    .from("systems")
    .select("id, name")
    .eq("work_area_id", workAreaId);
  const systemIdByName: Record<string, string> = Object.fromEntries(
    (existingSystems ?? []).map((s) => [s.name, s.id])
  );

  const missingSystems = DEMO_SYSTEMS.filter((s) => !systemIdByName[s.name]);
  if (missingSystems.length > 0) {
    const { data: created, error: sysErr } = await supabase
      .from("systems")
      .insert(
        missingSystems.map((s) => ({
          ...s,
          work_area_id: workAreaId,
          status: "in_use",
          system_manager: "Maria Johansen",
        }))
      )
      .select("id, name");
    if (sysErr || !created) throw sysErr ?? new Error("Kunne ikke opprette systemer");
    created.forEach((s) => {
      systemIdByName[s.name] = s.id;
    });
  }

  // Prosesser
  const systemIds = Object.values(systemIdByName);
  const { data: existingProcesses } = await supabase
    .from("system_processes")
    .select("id, name")
    .in("system_id", systemIds);
  const processIdByName: Record<string, string> = Object.fromEntries(
    (existingProcesses ?? []).map((p) => [p.name, p.id])
  );

  const missingProcesses = DEMO_PROCESSES.filter((p) => !processIdByName[p.name]);
  if (missingProcesses.length > 0) {
    const { data: created, error: procErr } = await supabase
      .from("system_processes")
      .insert(
        missingProcesses.map((p) => ({
          system_id: systemIdByName[p.system],
          name: p.name,
          description: p.description,
          purpose: p.purpose,
          data_class: p.data_class,
          legal_basis: p.legal_basis,
          status: "active",
          ai_suggested_fields: {},
        }))
      )
      .select("id, name");
    if (procErr || !created) throw procErr ?? new Error("Kunne ikke opprette prosesser");
    created.forEach((p) => {
      processIdByName[p.name] = p.id;
    });
  }


  const { error: recErr } = await supabase
    .from("process_agent_recommendations" as never)
    .insert(
      DEMO_PROCESSES.map((p) => ({
        process_id: processIdByName[p.name],
        work_area_id: workArea.id,
        recommendation: p.recommendation,
        rationale: p.rationale,
        suggested_agent_role: p.role,
        estimated_hours_saved_per_month: p.hours,
        status: "proposed",
        generated_by_model: "demo",
      })) as never
    );
  if (recErr) throw recErr;

  return processes.length;
}
