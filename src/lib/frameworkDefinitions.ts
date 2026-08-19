import { Shield, Lock, Brain, Scale, HardHat, Globe2, BookOpen } from "lucide-react";

export interface Framework {
  id: string;
  name: string;
  description: string;
  category: 'privacy' | 'security' | 'ai' | 'guideline' | 'other';
  type: 'regulation' | 'standard' | 'guideline' | 'framework';
  isMandatory?: boolean;
  isRecommended?: boolean;
  triggerQuestion?: string;
  estimatedCredits?: number;
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
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 5
  },
  {
    id: 'personopplysningsloven',
    name: 'Personopplysningsloven',
    description: 'Norsk lov som utfyller GDPR',
    category: 'privacy',
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 3
  },
  
  // Information Security
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Internasjonal standard for informasjonssikkerhetsstyring',
    category: 'security',
    type: 'standard',
    isRecommended: true,
    triggerQuestion: 'Har dere kunder som krever ISO-sertifisering?',
    estimatedCredits: 12
  },
  {
    id: 'iso27701',
    name: 'ISO 27701',
    description: 'Utvidelse av ISO 27001 for personvernadministrasjon (PIMS)',
    category: 'security',
    type: 'standard',
    isRecommended: false,
    triggerQuestion: 'Ønsker dere å utvide ISO 27001 med personvernadministrasjon?',
    estimatedCredits: 8
  },
  {
    id: 'nis2',
    name: 'NIS2-direktivet',
    description: 'EUs direktiv om sikkerhet i nettverks- og informasjonssystemer',
    category: 'security',
    type: 'regulation',
    triggerQuestion: 'Er virksomheten innen kritisk infrastruktur eller digital tjenesteleveranse?',
    estimatedCredits: 15
  },
  {
    id: 'normen',
    name: 'Normen for informasjonssikkerhet og personvern (helsesektoren)',
    description: 'Bransjenorm for informasjonssikkerhet og personvern i helse- og omsorgssektoren',
    category: 'security',
    type: 'standard',
    triggerQuestion: 'Behandler virksomheten helse- eller pasientopplysninger?',
    estimatedCredits: 12
  },
  {
    id: 'nsm',
    name: 'NSMs grunnprinsipper',
    description: 'Nasjonal sikkerhetsmyndighets anbefalinger for IKT-sikkerhet',
    category: 'security',
    type: 'guideline',
    isRecommended: true,
    estimatedCredits: 8
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    description: 'Service Organization Control - sikkerhet, tilgjengelighet og konfidensialitet',
    category: 'security',
    type: 'standard',
    triggerQuestion: 'Har dere amerikanske kunder som krever SOC 2-sertifisering?',
    estimatedCredits: 15
  },
  {
    id: 'dora',
    name: 'DORA',
    description: 'Digital Operational Resilience Act – EUs forordning om digital operasjonell motstandsdyktighet for finanssektoren',
    category: 'security',
    type: 'regulation',
    triggerQuestion: 'Er virksomheten i finanssektoren eller leverer IKT-tjenester til finansforetak?',
    estimatedCredits: 12
  },
  {
    id: 'cra',
    name: 'Cyber Resilience Act (CRA)',
    description: 'EUs forordning om cybersikkerhetskrav for produkter med digitale elementer',
    category: 'security',
    type: 'regulation',
    triggerQuestion: 'Utvikler eller selger dere produkter med digitale elementer i EU?',
    estimatedCredits: 10
  },
  
  // AI Governance
  {
    id: 'ai-act',
    name: 'EU AI Act',
    description: 'EUs forordning om kunstig intelligens',
    category: 'ai',
    type: 'regulation',
    triggerQuestion: 'Bruker virksomheten AI-systemer eller utvikler AI-løsninger?',
    estimatedCredits: 12
  },
  {
    id: 'iso42001',
    name: 'ISO/IEC 42001',
    description: 'Internasjonal standard for AI Management Systems (AIMS)',
    category: 'ai',
    type: 'standard',
    isRecommended: true,
    triggerQuestion: 'Ønsker dere å sertifisere AI-styringssystemet etter ISO-standard?',
    estimatedCredits: 10
  },
  {
    id: 'iso42005',
    name: 'ISO/IEC 42005',
    description: 'Standard for konsekvensanalyse (Impact Assessment) av AI-systemer',
    category: 'ai',
    type: 'standard',
    triggerQuestion: 'Trenger dere strukturert metodikk for AI-konsekvensanalyser?',
    estimatedCredits: 8
  },
  {
    id: 'ai-ethics',
    name: 'Etiske retningslinjer for AI',
    description: 'Interne retningslinjer for ansvarlig bruk av AI',
    category: 'ai',
    type: 'guideline',
    isRecommended: true,
    triggerQuestion: 'Bruker virksomheten AI-systemer?',
    estimatedCredits: 5
  },
  
  // Quality Management
  {
    id: 'iso9001',
    name: 'ISO 9001',
    description: 'Internasjonal standard for kvalitetsstyring',
    category: 'other',
    type: 'standard',
    isRecommended: true,
    triggerQuestion: 'Ønsker dere å sertifisere kvalitetsstyringssystemet?',
    estimatedCredits: 10
  },
  {
    id: 'iso14001',
    name: 'ISO 14001',
    description: 'Internasjonal standard for miljøledelse',
    category: 'other',
    type: 'standard',
    triggerQuestion: 'Ønsker dere å implementere et miljøledelsessystem?',
    estimatedCredits: 8
  },
  {
    id: 'iso45001',
    name: 'ISO 45001',
    description: 'Internasjonal standard for arbeidsmiljøledelse (HMS)',
    category: 'other',
    type: 'standard',
    triggerQuestion: 'Ønsker dere å sertifisere HMS-systemet?',
    estimatedCredits: 8
  },
  {
    id: 'internkontroll',
    name: 'Internkontrollforskriften',
    description: 'Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid',
    category: 'other',
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 5
  },
  {
    id: 'arbeidsmiljoloven',
    name: 'Arbeidsmiljøloven',
    description: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern',
    category: 'other',
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 4
  },
  
  // Other
  {
    id: 'apenhetsloven',
    name: 'Åpenhetsloven',
    description: 'Krav til aktsomhetsvurderinger og transparens i leverandørkjeder',
    category: 'other',
    type: 'regulation',
    triggerQuestion: 'Har virksomheten over 50 ansatte eller over 70 MNOK i omsetning?',
    estimatedCredits: 8
  },
  {
    id: 'hms',
    name: 'HMS-lovgivningen',
    description: 'Helse, miljø og sikkerhet på arbeidsplassen',
    category: 'other',
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 4
  },
  {
    id: 'bokforingsloven',
    name: 'Bokføringsloven',
    description: 'Krav til oppbevaring og dokumentasjon av regnskapsmateriale',
    category: 'other',
    type: 'regulation',
    isMandatory: true,
    estimatedCredits: 3
  },
  {
    id: 'hvitvasking',
    name: 'Hvitvaskingsloven',
    description: 'Tiltak mot hvitvasking og terrorfinansiering',
    category: 'other',
    type: 'regulation',
    triggerQuestion: 'Er virksomheten rapporteringspliktig etter hvitvaskingsloven?',
    estimatedCredits: 6
  },
  {
    id: 'csrd',
    name: 'CSRD',
    description: 'Corporate Sustainability Reporting Directive - bærekraftsrapportering',
    category: 'other',
    type: 'regulation',
    triggerQuestion: 'Er virksomheten omfattet av krav til bærekraftsrapportering?',
    estimatedCredits: 10
  },

  // Retningslinjer og rammeverk (ikke lovpålagt, men styrende praksis)
  {
    id: 'nsm-grunnprinsipper',
    name: 'NSM grunnprinsipper for IKT-sikkerhet',
    description: 'Nasjonal sikkerhetsmyndighets anbefalte grunnprinsipper for IKT-sikkerhet',
    category: 'guideline',
    type: 'guideline',
    isRecommended: true,
    triggerQuestion: 'Ønsker dere å følge NSMs anbefalte praksis?',
    estimatedCredits: 6
  },
  {
    id: 'cis-controls',
    name: 'CIS Controls',
    description: 'Prioriterte sikkerhetstiltak fra Center for Internet Security',
    category: 'guideline',
    type: 'framework',
    triggerQuestion: 'Ønsker dere et prioritert rammeverk for sikkerhetstiltak?',
    estimatedCredits: 6
  },
  {
    id: 'nist-csf',
    name: 'NIST Cybersecurity Framework',
    description: 'Rammeverk for å identifisere, beskytte, oppdage, respondere og gjenopprette',
    category: 'guideline',
    type: 'framework',
    triggerQuestion: 'Ønsker dere å styre sikkerhetsarbeidet etter NIST CSF?',
    estimatedCredits: 8
  },
  {
    id: 'normen',
    name: 'Normen (helse og omsorg)',
    description: 'Norm for informasjonssikkerhet og personvern i helse- og omsorgssektoren',
    category: 'guideline',
    type: 'standard',
    triggerQuestion: 'Leverer dere tjenester i helse- og omsorgssektoren?',
    estimatedCredits: 8
  },
  {
    id: 'iso27002',
    name: 'ISO/IEC 27002',
    description: 'Veiledning for utforming og bruk av sikkerhetstiltak',
    category: 'guideline',
    type: 'standard',
    triggerQuestion: 'Ønsker dere veiledning til tiltakene i ISO 27001?',
    estimatedCredits: 6
  }
];

export const categories: FrameworkCategory[] = [
  { id: 'privacy', name: 'Personvern', nameEn: 'Privacy', icon: Shield, color: 'text-mynder-blue', bgColor: 'bg-mynder-blue/10' },
  { id: 'security', name: 'Informasjonssikkerhet', nameEn: 'Information Security', icon: Lock, color: 'text-mynder-blue', bgColor: 'bg-mynder-blue/10' },
  { id: 'ai', name: 'AI Governance', nameEn: 'AI Governance', icon: Brain, color: 'text-purple-accent', bgColor: 'bg-purple-accent/10' },
  { id: 'guideline', name: 'Retningslinjer og rammeverk', nameEn: 'Guidelines and frameworks', icon: BookOpen, color: 'text-mynder-blue', bgColor: 'bg-mynder-blue/10' },
  { id: 'other', name: 'Øvrige regelverk', nameEn: 'Other Regulations', icon: Scale, color: 'text-mynder-blue', bgColor: 'bg-mynder-blue/10' }
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
