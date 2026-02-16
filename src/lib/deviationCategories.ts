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
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    hoverBgColor: "hover:bg-red-500/20",
    defaultFrameworks: ["GDPR", "ISO27001"],
  },
  {
    id: "tilgangskontroll",
    label: "Tilgangskontroll",
    description: "Feil i tilgangsrettigheter eller identitetshåndtering",
    icon: KeyRound,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    hoverBgColor: "hover:bg-orange-500/20",
    defaultFrameworks: ["ISO27001", "NIS2"],
  },
  {
    id: "hendelseshåndtering",
    label: "Hendelseshåndtering",
    description: "Manglende respons på sikkerhetshendelser",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    hoverBgColor: "hover:bg-yellow-500/20",
    defaultFrameworks: ["ISO27001", "NIS2"],
  },
  {
    id: "prosess_og_rutiner",
    label: "Prosess og rutiner",
    description: "Brudd på interne prosedyrer og retningslinjer",
    icon: FileWarning,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverBgColor: "hover:bg-blue-500/20",
    defaultFrameworks: ["ISO27001"],
  },
  {
    id: "personvern",
    label: "Personvern",
    description: "Brudd på GDPR-krav og personvernregler",
    icon: UserX,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    hoverBgColor: "hover:bg-purple-500/20",
    defaultFrameworks: ["GDPR"],
  },
  {
    id: "ai_avvik",
    label: "AI-avvik",
    description: "Feil i AI-modell, bias, eller uventede beslutninger",
    icon: Brain,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    hoverBgColor: "hover:bg-pink-500/20",
    defaultFrameworks: ["AI Act", "ISO42001"],
  },
  {
    id: "sikkerhet",
    label: "Sikkerhet",
    description: "Generelle sikkerhetsavvik og sårbarheter",
    icon: Lock,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverBgColor: "hover:bg-emerald-500/20",
    defaultFrameworks: ["ISO27001", "NSM"],
  },
  {
    id: "hms",
    label: "HMS-avvik",
    description: "Personskade, nestenulykke eller farlige forhold",
    icon: HardHat,
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
    hoverBgColor: "hover:bg-amber-600/20",
    defaultFrameworks: ["HMS"],
  },
  {
    id: "kvalitet",
    label: "Kvalitetsavvik",
    description: "Kundereklamasjon, prosessavvik eller produktfeil",
    icon: ClipboardCheck,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    hoverBgColor: "hover:bg-sky-500/20",
    defaultFrameworks: ["ISO9001"],
  },
  {
    id: "miljo",
    label: "Miljøavvik",
    description: "Utslipp, avfall eller forurensning",
    icon: LeafIcon,
    color: "text-lime-600",
    bgColor: "bg-lime-600/10",
    hoverBgColor: "hover:bg-lime-600/20",
    defaultFrameworks: ["ISO14001"],
  },
];

export const getCategoryById = (id: string): DeviationCategory | undefined => {
  return deviationCategories.find((c) => c.id === id);
};

export const criticalityOptions = [
  { value: "critical", label: "Kritisk", color: "text-red-500", bgColor: "bg-red-500/20" },
  { value: "high", label: "Høy", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { value: "medium", label: "Middels", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  { value: "low", label: "Lav", color: "text-green-500", bgColor: "bg-green-500/20" },
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
