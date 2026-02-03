import { Shield, Lock, Brain, Scale, HardHat, Globe2 } from "lucide-react";

export interface Framework {
  id: string;
  name: string;
  description: string;
  category: 'privacy' | 'security' | 'ai' | 'other';
  isMandatory?: boolean;
  isRecommended?: boolean;
  triggerQuestion?: string;
}

export interface FrameworkCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
}

export const frameworks: Framework[] = [
  // Privacy
  {
    id: 'gdpr',
    name: 'GDPR / Personvernforordningen',
    description: 'EUs personvernlovgivning - gjelder alle som behandler personopplysninger',
    category: 'privacy',
    isMandatory: true
  },
  {
    id: 'personopplysningsloven',
    name: 'Personopplysningsloven',
    description: 'Norsk lov som utfyller GDPR',
    category: 'privacy',
    isMandatory: true
  },
  
  // Information Security
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Internasjonal standard for informasjonssikkerhetsstyring',
    category: 'security',
    isRecommended: true,
    triggerQuestion: 'Har dere kunder som krever ISO-sertifisering?'
  },
  {
    id: 'iso27701',
    name: 'ISO 27701',
    description: 'Utvidelse av ISO 27001 for personvernadministrasjon (PIMS)',
    category: 'security',
    isRecommended: false,
    triggerQuestion: 'Ønsker dere å utvide ISO 27001 med personvernadministrasjon?'
  },
  {
    id: 'nis2',
    name: 'NIS2-direktivet',
    description: 'EUs direktiv om sikkerhet i nettverks- og informasjonssystemer',
    category: 'security',
    triggerQuestion: 'Er virksomheten innen kritisk infrastruktur eller digital tjenesteleveranse?'
  },
  {
    id: 'nsm',
    name: 'NSMs grunnprinsipper',
    description: 'Nasjonal sikkerhetsmyndighets anbefalinger for IKT-sikkerhet',
    category: 'security',
    isRecommended: true
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    description: 'Service Organization Control - sikkerhet, tilgjengelighet og konfidensialitet',
    category: 'security',
    triggerQuestion: 'Har dere amerikanske kunder som krever SOC 2-sertifisering?'
  },
  {
    id: 'cra',
    name: 'Cyber Resilience Act (CRA)',
    description: 'EUs forordning om cybersikkerhetskrav for produkter med digitale elementer',
    category: 'security',
    triggerQuestion: 'Utvikler eller selger dere produkter med digitale elementer i EU?'
  },
  
  // AI Governance
  {
    id: 'ai-act',
    name: 'EU AI Act',
    description: 'EUs forordning om kunstig intelligens',
    category: 'ai',
    triggerQuestion: 'Bruker virksomheten AI-systemer eller utvikler AI-løsninger?'
  },
  {
    id: 'iso42001',
    name: 'ISO/IEC 42001',
    description: 'Internasjonal standard for AI Management Systems (AIMS)',
    category: 'ai',
    isRecommended: true,
    triggerQuestion: 'Ønsker dere å sertifisere AI-styringssystemet etter ISO-standard?'
  },
  {
    id: 'iso42005',
    name: 'ISO/IEC 42005',
    description: 'Standard for konsekvensanalyse (Impact Assessment) av AI-systemer',
    category: 'ai',
    triggerQuestion: 'Trenger dere strukturert metodikk for AI-konsekvensanalyser?'
  },
  {
    id: 'ai-ethics',
    name: 'Etiske retningslinjer for AI',
    description: 'Interne retningslinjer for ansvarlig bruk av AI',
    category: 'ai',
    isRecommended: true,
    triggerQuestion: 'Bruker virksomheten AI-systemer?'
  },
  
  // Quality Management
  {
    id: 'iso9001',
    name: 'ISO 9001',
    description: 'Internasjonal standard for kvalitetsstyring',
    category: 'other',
    isRecommended: true,
    triggerQuestion: 'Ønsker dere å sertifisere kvalitetsstyringssystemet?'
  },
  {
    id: 'iso14001',
    name: 'ISO 14001',
    description: 'Internasjonal standard for miljøledelse',
    category: 'other',
    triggerQuestion: 'Ønsker dere å implementere et miljøledelsessystem?'
  },
  {
    id: 'iso45001',
    name: 'ISO 45001',
    description: 'Internasjonal standard for arbeidsmiljøledelse (HMS)',
    category: 'other',
    triggerQuestion: 'Ønsker dere å sertifisere HMS-systemet?'
  },
  {
    id: 'internkontroll',
    name: 'Internkontrollforskriften',
    description: 'Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid',
    category: 'other',
    isMandatory: true
  },
  {
    id: 'arbeidsmiljoloven',
    name: 'Arbeidsmiljøloven',
    description: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern',
    category: 'other',
    isMandatory: true
  },
  
  // Other
  {
    id: 'apenhetsloven',
    name: 'Åpenhetsloven',
    description: 'Krav til aktsomhetsvurderinger og transparens i leverandørkjeder',
    category: 'other',
    triggerQuestion: 'Har virksomheten over 50 ansatte eller over 70 MNOK i omsetning?'
  },
  {
    id: 'hms',
    name: 'HMS-lovgivningen',
    description: 'Helse, miljø og sikkerhet på arbeidsplassen',
    category: 'other',
    isMandatory: true
  },
  {
    id: 'bokforingsloven',
    name: 'Bokføringsloven',
    description: 'Krav til oppbevaring og dokumentasjon av regnskapsmateriale',
    category: 'other',
    isMandatory: true
  },
  {
    id: 'hvitvasking',
    name: 'Hvitvaskingsloven',
    description: 'Tiltak mot hvitvasking og terrorfinansiering',
    category: 'other',
    triggerQuestion: 'Er virksomheten rapporteringspliktig etter hvitvaskingsloven?'
  },
  {
    id: 'csrd',
    name: 'CSRD',
    description: 'Corporate Sustainability Reporting Directive - bærekraftsrapportering',
    category: 'other',
    triggerQuestion: 'Er virksomheten omfattet av krav til bærekraftsrapportering?'
  }
];

export const categories: FrameworkCategory[] = [
  { id: 'privacy', name: 'Personvern', nameEn: 'Privacy', icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'security', name: 'Informasjonssikkerhet', nameEn: 'Information Security', icon: Lock, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'ai', name: 'AI Management', nameEn: 'AI Management', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'other', name: 'Øvrige regelverk', nameEn: 'Other Regulations', icon: Scale, color: 'text-orange-500', bgColor: 'bg-orange-500/10' }
];

export const getCategoryById = (categoryId: string) => {
  return categories.find(c => c.id === categoryId);
};

export const getFrameworkById = (frameworkId: string) => {
  return frameworks.find(f => f.id === frameworkId);
};

export const getFrameworksByCategory = (categoryId: string) => {
  return frameworks.filter(f => f.category === categoryId);
};
