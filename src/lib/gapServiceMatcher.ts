// Prototype-matcher: kobler regelverk-gap til partnerens tjenester.
// Deterministisk demo-logikk (ingen backend).

export interface MatchedService {
  id: string;
  name: string;
  description: string;
  unitPrice: number; // per gap/krav
}

export interface CustomerGapMatch {
  customerId: string;
  customerName: string;
  industry?: string;
  gapCount: number;
  services: { service: MatchedService; estimatedValue: number; coveredGaps: number }[];
  totalPotential: number;
}

const SERVICES: Record<string, MatchedService> = {
  core: {
    id: "core",
    name: "Mynder Core",
    description: "GRC-styringsverktøy – behandlingsprotokoll, systemoversikt, risiko og avvik.",
    unitPrice: 4500,
  },
  vendor: {
    id: "vendor",
    name: "Leverandørstyring",
    description: "Onboarding, DPA og løpende oppfølging av tredjeparter.",
    unitPrice: 3800,
  },
  pentest: {
    id: "pentest",
    name: "Penetrasjonstest",
    description: "Teknisk sikkerhetstest av applikasjoner og infrastruktur.",
    unitPrice: 12000,
  },
  backup: {
    id: "backup",
    name: "Backup & gjenoppretting",
    description: "Immutable backup, testing og gjenopprettingsplan.",
    unitPrice: 6500,
  },
  isms: {
    id: "isms",
    name: "ISMS-drift",
    description: "Løpende drift av ISO 27001-styringssystem.",
    unitPrice: 9500,
  },
  awareness: {
    id: "awareness",
    name: "Sikkerhetskultur",
    description: "Opplæring, phishing-simuleringer og målinger.",
    unitPrice: 2800,
  },
  dpo: {
    id: "dpo",
    name: "DPO-as-a-Service",
    description: "Personvernombud på deltid – råd, tilsyn og rapportering.",
    unitPrice: 5500,
  },
};

// Regelverk → foreslåtte tjenester (i prioritert rekkefølge)
const FRAMEWORK_MAP: Record<string, string[]> = {
  gdpr: ["core", "dpo", "vendor"],
  personopplysningsloven: ["core", "dpo"],
  iso27001: ["isms", "core", "pentest"],
  nis2: ["pentest", "backup", "core"],
  dora: ["backup", "vendor", "pentest"],
  aiact: ["core", "vendor"],
  transparency: ["vendor", "core"],
  aapenhet: ["vendor", "core"],
  aapenhetsloven: ["vendor", "core"],
};

// Deterministisk pseudo-tall fra en streng
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function matchCustomerGaps(
  customer: { id: string; customer_name?: string; industry?: string; compliance_score?: number },
  frameworkIds: string[],
): CustomerGapMatch {
  const seed = hash(customer.id + frameworkIds.join(","));
  const scoreFactor = Math.max(0, 100 - (customer.compliance_score || 40)) / 100;
  // Antall gap: 4-14 per regelverk avhengig av modenhet
  const gapCount = frameworkIds.reduce((sum, fw) => {
    const base = 4 + ((seed + hash(fw)) % 8);
    return sum + Math.round(base + scoreFactor * 6);
  }, 0);

  // Hvilke tjenester matcher?
  const serviceIds = new Set<string>();
  frameworkIds.forEach((fw) => (FRAMEWORK_MAP[fw] || ["core"]).forEach((s) => serviceIds.add(s)));

  const services = Array.from(serviceIds).slice(0, 4).map((sid, i) => {
    const service = SERVICES[sid];
    // Del gap-ene mellom tjenestene, med litt vekting
    const share = i === 0 ? 0.45 : i === 1 ? 0.3 : i === 2 ? 0.15 : 0.1;
    const coveredGaps = Math.max(1, Math.round(gapCount * share));
    return {
      service,
      coveredGaps,
      estimatedValue: coveredGaps * service.unitPrice,
    };
  });

  const totalPotential = services.reduce((s, x) => s + x.estimatedValue, 0);

  return {
    customerId: customer.id,
    customerName: customer.customer_name || "Ukjent kunde",
    industry: customer.industry,
    gapCount,
    services,
    totalPotential,
  };
}

export function matchAll(
  customers: any[],
  frameworkIds: string[],
): CustomerGapMatch[] {
  return customers.map((c) => matchCustomerGaps(c, frameworkIds));
}
