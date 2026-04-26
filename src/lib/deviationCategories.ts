import {
  ShieldX,
  KeyRound,
  AlertTriangle,
  FileWarning,
  UserX,
  Brain,
  Lock,
  HardHat,
  ClipboardCheck,
  Leaf as LeafIcon,
  type LucideIcon,
} from "lucide-react";

export interface DeviationCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  defaultFrameworks: string[];
}

export const deviationCategories: DeviationCategory[] = [
  {
    id: "datainnbrudd",
    label: "Datainnbrudd",
    description: "Uautorisert tilgang til persondata eller sensitiv informasjon",
    icon: ShieldX,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    hoverBgColor: "hover:bg-destructive/20",
    defaultFrameworks: ["GDPR", "ISO27001"],
  },
  {
    id: "tilgangskontroll",
    label: "Tilgangskontroll",
    description: "Feil i tilgangsrettigheter eller identitetshåndtering",
    icon: KeyRound,
    color: "text-warning",
    bgColor: "bg-warning/10",
    hoverBgColor: "hover:bg-warning/20",
    defaultFrameworks: ["ISO27001", "NIS2"],
  },
  {
    id: "hendelseshåndtering",
    label: "Hendelseshåndtering",
    description: "Manglende respons på sikkerhetshendelser",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    hoverBgColor: "hover:bg-warning/20",
    defaultFrameworks: ["ISO27001", "NIS2"],
  },
  {
    id: "prosess_og_rutiner",
    label: "Prosess og rutiner",
    description: "Brudd på interne prosedyrer og retningslinjer",
    icon: FileWarning,
    color: "text-primary",
    bgColor: "bg-primary/10",
    hoverBgColor: "hover:bg-primary/20",
    defaultFrameworks: ["ISO27001"],
  },
  {
    id: "personvern",
    label: "Personvern",
    description: "Brudd på GDPR-krav og personvernregler",
    icon: UserX,
    color: "text-accent",
    bgColor: "bg-accent/10",
    hoverBgColor: "hover:bg-accent/20",
    defaultFrameworks: ["GDPR"],
  },
  {
    id: "ai_avvik",
    label: "AI-avvik",
    description: "Feil i AI-modell, bias, eller uventede beslutninger",
    icon: Brain,
    color: "text-accent",
    bgColor: "bg-accent/10",
    hoverBgColor: "hover:bg-accent/20",
    defaultFrameworks: ["AI Act", "ISO42001"],
  },
  {
    id: "sikkerhet",
    label: "Sikkerhet",
    description: "Generelle sikkerhetsavvik og sårbarheter",
    icon: Lock,
    color: "text-status-closed",
    bgColor: "bg-status-closed/10",
    hoverBgColor: "hover:bg-status-closed/20",
    defaultFrameworks: ["ISO27001", "NSM"],
  },
  {
    id: "hms",
    label: "HMS-avvik",
    description: "Personskade, nestenulykke eller farlige forhold",
    icon: HardHat,
    color: "text-warning",
    bgColor: "bg-warning/10",
    hoverBgColor: "hover:bg-warning/20",
    defaultFrameworks: ["HMS"],
  },
  {
    id: "kvalitet",
    label: "Kvalitetsavvik",
    description: "Kundereklamasjon, prosessavvik eller produktfeil",
    icon: ClipboardCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    hoverBgColor: "hover:bg-primary/20",
    defaultFrameworks: ["ISO9001"],
  },
  {
    id: "miljo",
    label: "Miljøavvik",
    description: "Utslipp, avfall eller forurensning",
    icon: LeafIcon,
    color: "text-status-closed",
    bgColor: "bg-status-closed/10",
    hoverBgColor: "hover:bg-status-closed/20",
    defaultFrameworks: ["ISO14001"],
  },
];

export const getCategoryById = (id: string): DeviationCategory | undefined => {
  return deviationCategories.find((c) => c.id === id);
};

export const criticalityOptions = [
  { value: "critical", label: "Kritisk", color: "text-destructive", bgColor: "bg-destructive/20" },
  { value: "high", label: "Høy", color: "text-warning", bgColor: "bg-warning/20" },
  { value: "medium", label: "Middels", color: "text-warning", bgColor: "bg-warning/20" },
  { value: "low", label: "Lav", color: "text-status-closed", bgColor: "bg-status-closed/20" },
];

export const availableFrameworks = [
  "GDPR",
  "ISO27001",
  "NIS2",
  "AI Act",
  "ISO42001",
  "NSM",
  "SOC2",
  "HMS",
  "ISO9001",
  "ISO14001",
];
