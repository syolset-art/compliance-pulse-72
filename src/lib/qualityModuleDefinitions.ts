import { 
  Shield, 
  HardHat, 
  FileCheck, 
  Wrench, 
  FlaskConical, 
  Users, 
  AlertTriangle,
  Leaf,
  Heart,
  Factory,
  Laptop,
  Building2
} from "lucide-react";

export type QualityModuleType = 
  | 'hms-basis' 
  | 'hms-extended' 
  | 'quality-management' 
  | 'integrated-management';

export type IndustryType = 
  | 'health' 
  | 'construction' 
  | 'industry' 
  | 'tech' 
  | 'general';

export interface QualityModule {
  id: QualityModuleType;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  targetAudience: string;
  targetAudienceEn: string;
  price: number | null; // null = included
  icon: typeof Shield;
  color: string;
  bgColor: string;
  features: string[];
  featuresEn: string[];
  frameworks: string[];
}

export interface IndustryAdaptation {
  id: IndustryType;
  name: string;
  nameEn: string;
  icon: typeof Building2;
  color: string;
  modules: IndustryModule[];
}

export interface IndustryModule {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: typeof Shield;
  required?: boolean;
  recommended?: boolean;
}

export const qualityModules: QualityModule[] = [
  {
    id: 'hms-basis',
    name: 'HMS-basis',
    nameEn: 'HSE Basic',
    description: 'Grunnleggende internkontroll etter forskrift',
    descriptionEn: 'Basic internal control according to regulations',
    targetAudience: 'Alle virksomheter',
    targetAudienceEn: 'All businesses',
    price: null,
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      'Avviksregistrering og håndtering',
      'Grunnleggende risikovurdering',
      'Dokumentstyring',
      'Varslingsrutiner'
    ],
    featuresEn: [
      'Deviation registration and handling',
      'Basic risk assessment',
      'Document management',
      'Notification procedures'
    ],
    frameworks: ['hms', 'internkontroll']
  },
  {
    id: 'hms-extended',
    name: 'HMS-utvidet',
    nameEn: 'HSE Extended',
    description: 'HMS med bransjetilpassede krav og moduler',
    descriptionEn: 'HSE with industry-adapted requirements and modules',
    targetAudience: 'Bygg, industri, energi',
    targetAudienceEn: 'Construction, industry, energy',
    price: 490,
    icon: HardHat,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: [
      'SJA-register (Sikker Jobb Analyse)',
      'Stoffkartotek med HMS-datablad',
      'Utstyrsregister med vedlikeholdslogg',
      'Kompetanseoversikt med sertifikater',
      'Beredskapsplaner',
      'Bransjespesifikke sjekklister'
    ],
    featuresEn: [
      'SJA Register (Safe Job Analysis)',
      'Chemical registry with SDS',
      'Equipment registry with maintenance log',
      'Competency overview with certifications',
      'Emergency plans',
      'Industry-specific checklists'
    ],
    frameworks: ['hms', 'internkontroll', 'arbeidsmiljoloven']
  },
  {
    id: 'quality-management',
    name: 'Kvalitetsledelse',
    nameEn: 'Quality Management',
    description: 'ISO 9001-basert kvalitetsstyring',
    descriptionEn: 'ISO 9001-based quality management',
    targetAudience: 'Sertifiserte bedrifter',
    targetAudienceEn: 'Certified companies',
    price: 790,
    icon: FileCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: [
      'Prosessbasert kvalitetsstyring',
      'Internrevisjonsmodul',
      'Korrigerende og forebyggende tiltak',
      'Kundetilfredshet og klager',
      'Ledelsens gjennomgang',
      'Kontinuerlig forbedring (PDCA)'
    ],
    featuresEn: [
      'Process-based quality management',
      'Internal audit module',
      'Corrective and preventive actions',
      'Customer satisfaction and complaints',
      'Management review',
      'Continuous improvement (PDCA)'
    ],
    frameworks: ['iso9001']
  },
  {
    id: 'integrated-management',
    name: 'Integrert ledelsessystem',
    nameEn: 'Integrated Management System',
    description: 'HMS + Kvalitet + Miljø i ett system',
    descriptionEn: 'HSE + Quality + Environment in one system',
    targetAudience: 'Store virksomheter',
    targetAudienceEn: 'Large enterprises',
    price: 1290,
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      'Alt fra HMS-utvidet',
      'Alt fra Kvalitetsledelse',
      'Miljøledelse (ISO 14001)',
      'Arbeidsmiljøledelse (ISO 45001)',
      'Integrert rapportering',
      'Kryssfunksjonelle analyser',
      'Lederrapporter og KPI-dashboard'
    ],
    featuresEn: [
      'Everything from HSE Extended',
      'Everything from Quality Management',
      'Environmental management (ISO 14001)',
      'Occupational health & safety (ISO 45001)',
      'Integrated reporting',
      'Cross-functional analyses',
      'Management reports and KPI dashboard'
    ],
    frameworks: ['iso9001', 'iso14001', 'iso45001', 'hms']
  }
];

export const industryAdaptations: IndustryAdaptation[] = [
  {
    id: 'health',
    name: 'Helse og omsorg',
    nameEn: 'Health and Care',
    icon: Heart,
    color: 'text-red-500',
    modules: [
      {
        id: 'patient-safety',
        name: 'Pasientsikkerhet',
        nameEn: 'Patient Safety',
        description: 'Meldeplikt, avvikshåndtering for pasienthendelser',
        descriptionEn: 'Reporting obligations, deviation handling for patient events',
        icon: Heart,
        required: true
      },
      {
        id: 'medication-handling',
        name: 'Legemiddelhåndtering',
        nameEn: 'Medication Handling',
        description: 'Rutiner for håndtering og administrering av legemidler',
        descriptionEn: 'Procedures for handling and administering medications',
        icon: FlaskConical,
        recommended: true
      },
      {
        id: 'infection-control',
        name: 'Smittevern og hygiene',
        nameEn: 'Infection Control and Hygiene',
        description: 'Smittevernrutiner og hygieneprosedyrer',
        descriptionEn: 'Infection control procedures and hygiene protocols',
        icon: Shield,
        required: true
      },
      {
        id: 'medical-equipment',
        name: 'Medisinsk utstyr',
        nameEn: 'Medical Equipment',
        description: 'Register og vedlikehold av medisinsk utstyr',
        descriptionEn: 'Registry and maintenance of medical equipment',
        icon: Wrench,
        recommended: true
      }
    ]
  },
  {
    id: 'construction',
    name: 'Bygg og anlegg',
    nameEn: 'Construction',
    icon: HardHat,
    color: 'text-orange-500',
    modules: [
      {
        id: 'sha-plan',
        name: 'SHA-plan',
        nameEn: 'SHA Plan',
        description: 'Sikkerhet, Helse og Arbeidsmiljø-plan for prosjekter',
        descriptionEn: 'Safety, Health and Work Environment plan for projects',
        icon: FileCheck,
        required: true
      },
      {
        id: 'sja-register',
        name: 'SJA-register',
        nameEn: 'SJA Register',
        description: 'Sikker Jobb Analyse med digital signering',
        descriptionEn: 'Safe Job Analysis with digital signing',
        icon: AlertTriangle,
        required: true
      },
      {
        id: 'equipment-register',
        name: 'Utstyrsregister',
        nameEn: 'Equipment Register',
        description: 'Sertifikater, inspeksjoner og vedlikehold',
        descriptionEn: 'Certificates, inspections and maintenance',
        icon: Wrench,
        required: true
      },
      {
        id: 'chemical-registry',
        name: 'Stoffkartotek',
        nameEn: 'Chemical Registry',
        description: 'HMS-datablad og faremerking',
        descriptionEn: 'SDS sheets and hazard labeling',
        icon: FlaskConical,
        recommended: true
      }
    ]
  },
  {
    id: 'industry',
    name: 'Industri og produksjon',
    nameEn: 'Industry and Manufacturing',
    icon: Factory,
    color: 'text-slate-500',
    modules: [
      {
        id: 'chemical-registry',
        name: 'Stoffkartotek',
        nameEn: 'Chemical Registry',
        description: 'HMS-datablad med utløpsdato og faremerking',
        descriptionEn: 'SDS with expiry dates and hazard labeling',
        icon: FlaskConical,
        required: true
      },
      {
        id: 'equipment-maintenance',
        name: 'Utstyr og vedlikehold',
        nameEn: 'Equipment and Maintenance',
        description: 'Vedlikeholdslogg, kalibrering og sertifikater',
        descriptionEn: 'Maintenance log, calibration and certificates',
        icon: Wrench,
        required: true
      },
      {
        id: 'production-control',
        name: 'Produksjonskontroll',
        nameEn: 'Production Control',
        description: 'Kvalitetskontroll i produksjonsprosesser',
        descriptionEn: 'Quality control in production processes',
        icon: FileCheck,
        recommended: true
      },
      {
        id: 'environmental-monitoring',
        name: 'Miljøovervåking',
        nameEn: 'Environmental Monitoring',
        description: 'Utslipp, avfall og miljømål',
        descriptionEn: 'Emissions, waste and environmental targets',
        icon: Leaf,
        recommended: true
      }
    ]
  },
  {
    id: 'tech',
    name: 'Tech og SaaS',
    nameEn: 'Tech and SaaS',
    icon: Laptop,
    color: 'text-blue-500',
    modules: [
      {
        id: 'information-security',
        name: 'Informasjonssikkerhet',
        nameEn: 'Information Security',
        description: 'ISO 27001-tilpasset sikkerhetsstyring',
        descriptionEn: 'ISO 27001-aligned security management',
        icon: Shield,
        required: true
      },
      {
        id: 'continuous-improvement',
        name: 'Kontinuerlig forbedring',
        nameEn: 'Continuous Improvement',
        description: 'Retrospektiver, forbedringsforslag og måling',
        descriptionEn: 'Retrospectives, improvement suggestions and measurement',
        icon: FileCheck,
        recommended: true
      },
      {
        id: 'incident-management',
        name: 'Hendelseshåndtering',
        nameEn: 'Incident Management',
        description: 'IT-hendelser, postmortems og rotårsaksanalyse',
        descriptionEn: 'IT incidents, postmortems and root cause analysis',
        icon: AlertTriangle,
        required: true
      },
      {
        id: 'change-management',
        name: 'Endringsledelse',
        nameEn: 'Change Management',
        description: 'Strukturert håndtering av endringer',
        descriptionEn: 'Structured handling of changes',
        icon: Wrench,
        recommended: true
      }
    ]
  },
  {
    id: 'general',
    name: 'Generell virksomhet',
    nameEn: 'General Business',
    icon: Building2,
    color: 'text-gray-500',
    modules: [
      {
        id: 'competency-management',
        name: 'Kompetansestyring',
        nameEn: 'Competency Management',
        description: 'Kurs, sertifiseringer og opplæringsplaner',
        descriptionEn: 'Courses, certifications and training plans',
        icon: Users,
        recommended: true
      },
      {
        id: 'document-control',
        name: 'Dokumentstyring',
        nameEn: 'Document Control',
        description: 'Versjonering, godkjenning og distribusjon',
        descriptionEn: 'Versioning, approval and distribution',
        icon: FileCheck,
        recommended: true
      },
      {
        id: 'emergency-preparedness',
        name: 'Beredskap',
        nameEn: 'Emergency Preparedness',
        description: 'Beredskapsplaner og øvelser',
        descriptionEn: 'Emergency plans and exercises',
        icon: AlertTriangle,
        recommended: true
      }
    ]
  }
];

export const getModuleById = (id: QualityModuleType) => {
  return qualityModules.find(m => m.id === id);
};

export const getIndustryById = (id: IndustryType) => {
  return industryAdaptations.find(i => i.id === id);
};

export const getRecommendedModules = (industryId: IndustryType) => {
  const industry = getIndustryById(industryId);
  if (!industry) return [];
  return industry.modules.filter(m => m.required || m.recommended);
};

export const mapCompanyIndustryToType = (industry: string): IndustryType => {
  const lowerIndustry = industry.toLowerCase();
  
  if (lowerIndustry.includes('helse') || lowerIndustry.includes('health') || 
      lowerIndustry.includes('omsorg') || lowerIndustry.includes('care')) {
    return 'health';
  }
  if (lowerIndustry.includes('bygg') || lowerIndustry.includes('construction') || 
      lowerIndustry.includes('anlegg') || lowerIndustry.includes('engineering')) {
    return 'construction';
  }
  if (lowerIndustry.includes('industri') || lowerIndustry.includes('manufacturing') || 
      lowerIndustry.includes('produksjon') || lowerIndustry.includes('factory')) {
    return 'industry';
  }
  if (lowerIndustry.includes('tech') || lowerIndustry.includes('it') || 
      lowerIndustry.includes('software') || lowerIndustry.includes('saas')) {
    return 'tech';
  }
  
  return 'general';
};
