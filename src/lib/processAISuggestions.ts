// AI Act suggestions based on process type and name
export interface ProcessAISuggestion {
  likelyAI: boolean;
  suggestedRiskCategory: 'minimal' | 'limited' | 'high' | 'unacceptable';
  suggestedChecks: string[];
  aiActNote: string;
  suggestedAIFeatures: string[];
}

// Keywords that suggest AI Act high-risk categories based on Annex III
const HIGH_RISK_KEYWORDS = [
  'rekruttering', 'ansettelse', 'hiring', 'recruitment',
  'kreditt', 'lån', 'credit', 'loan',
  'biometri', 'biometric', 'ansiktsgjenkjenning', 'facial recognition',
  'grensekontroll', 'border', 'immigration',
  'utdanning', 'education', 'eksamen', 'exam',
  'arbeidsledelse', 'workforce', 'employee monitoring',
  'forsikring', 'insurance',
  'medisinsk', 'medical', 'diagnose', 'diagnosis',
  'rettslig', 'legal', 'juridisk', 'court',
  'politi', 'police', 'law enforcement',
];

const LIMITED_RISK_KEYWORDS = [
  'chatbot', 'kundeservice', 'customer service', 'support',
  'transkripsjon', 'transcription',
  'oversettelse', 'translation',
  'oppsummering', 'summarization', 'summary',
  'anbefaling', 'recommendation',
];

const PROCESS_SUGGESTIONS: Record<string, Partial<ProcessAISuggestion>> = {
  // HR-related processes
  'rekruttering': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'AI brukes til å filtrere CV-er eller søknader',
      'AI brukes til å rangere kandidater',
      'Kandidater informeres om at AI brukes i prosessen',
      'Rekrutterer kan overprøve AI-anbefalinger',
      'AI-beslutninger logges for etterprøvbarhet',
      'Konsekvensanalyse (DPIA) er gjennomført',
    ],
    aiActNote: 'Rekruttering er klassifisert som høy-risiko i AI Act Annex III (5b). Krever full dokumentasjon, risikovurdering og menneskelig tilsyn.',
    suggestedAIFeatures: ['CV-screening', 'Kandidatrangering', 'Intervjuanalyse'],
  },
  'onboarding': {
    likelyAI: false,
    suggestedRiskCategory: 'minimal',
    suggestedChecks: [
      'AI-generert innhold brukes i opplæringen',
      'Automatiserte systemer tildeler oppgaver',
    ],
    aiActNote: 'Onboarding er vanligvis minimal risiko med mindre AI tar beslutninger som påvirker ansettelsesforholdet.',
    suggestedAIFeatures: ['Personalisert opplæring', 'Automatisk oppgavetildeling'],
  },
  'ytelsesovervåking': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'AI brukes til å vurdere ansattes ytelse',
      'AI-vurderinger påvirker lønns- eller karrierebeslutninger',
      'Ansatte har innsyn i hvordan de vurderes',
      'Ledere kan overprøve AI-vurderinger',
    ],
    aiActNote: 'Ytelsesovervåking i arbeidslivet er høy-risiko under AI Act Annex III (4). Krever transparens overfor ansatte.',
    suggestedAIFeatures: ['Ytelsesanalyse', 'Måloppfølging', 'Produktivitetsmåling'],
  },
  // Customer-related processes
  'kundeservice': {
    likelyAI: true,
    suggestedRiskCategory: 'limited',
    suggestedChecks: [
      'Chatbot eller virtuell assistent er i bruk',
      'Kunder informeres om at de snakker med AI',
      'Kunder kan enkelt nå et menneske',
      'Sentimentanalyse brukes på kundehenvendelser',
    ],
    aiActNote: 'Kundeservice-AI krever transparens under AI Act. Brukere må informeres når de interagerer med AI.',
    suggestedAIFeatures: ['Chatbot', 'Automatisk rutinghåndtering', 'Sentimentanalyse', 'Kundehenvendelsesklassifisering'],
  },
  'salg': {
    likelyAI: true,
    suggestedRiskCategory: 'limited',
    suggestedChecks: [
      'AI brukes til prisanbefalinger',
      'Prediktiv analyse brukes for leads',
      'Kundesegmentering er automatisert',
    ],
    aiActNote: 'Salgs-AI er vanligvis begrenset risiko, men krever transparens ved direkte kundeinteraksjon.',
    suggestedAIFeatures: ['Lead-scoring', 'Prisoptimalisering', 'Kundesegmentering', 'Salgsprediksjon'],
  },
  // Finance-related processes
  'kredittvurdering': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'AI brukes til å vurdere kredittverdighet',
      'AI kan avslå eller begrense kreditt',
      'Søkere informeres om AI-bruk',
      'Beslutningene er forklarbare',
      'AI overvåkes for diskriminering',
    ],
    aiActNote: 'Kredittvurdering er høy-risiko under AI Act Annex III (5b). Krever forklarbarhet og ikke-diskriminering.',
    suggestedAIFeatures: ['Automatisk kredittscore', 'Risikovurdering', 'Svindeldeteksjon'],
  },
  'fakturering': {
    likelyAI: false,
    suggestedRiskCategory: 'minimal',
    suggestedChecks: [
      'Automatisert beløpsberegning er i bruk',
      'AI-basert feildeteksjon er i bruk',
    ],
    aiActNote: 'Fakturering er vanligvis minimal risiko.',
    suggestedAIFeatures: ['Automatisk beløpsberegning', 'Anomalideteksjon'],
  },
};

export function getProcessAISuggestion(processName: string, processDescription?: string): ProcessAISuggestion {
  const nameLower = processName.toLowerCase();
  const descLower = (processDescription || '').toLowerCase();
  const combined = `${nameLower} ${descLower}`;

  // Check for exact match in our suggestions
  for (const [key, suggestion] of Object.entries(PROCESS_SUGGESTIONS)) {
    if (nameLower.includes(key) || descLower.includes(key)) {
      return {
        likelyAI: suggestion.likelyAI ?? false,
        suggestedRiskCategory: suggestion.suggestedRiskCategory ?? 'minimal',
        suggestedChecks: suggestion.suggestedChecks ?? [],
        aiActNote: suggestion.aiActNote ?? '',
        suggestedAIFeatures: suggestion.suggestedAIFeatures ?? [],
      };
    }
  }

  // Check for high-risk keywords
  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (combined.includes(keyword)) {
      return {
        likelyAI: true,
        suggestedRiskCategory: 'high',
        suggestedChecks: [
          'AI brukes til å ta eller støtte beslutninger',
          'AI-beslutninger påvirker personer vesentlig',
          'Menneskelig tilsyn er på plass',
          'AI-bruk dokumenteres tilstrekkelig',
        ],
        aiActNote: 'Prosessen kan inneholde høy-risiko AI basert på nøkkelord. Vurder nøye om AI Act Annex III gjelder.',
        suggestedAIFeatures: [],
      };
    }
  }

  // Check for limited-risk keywords
  for (const keyword of LIMITED_RISK_KEYWORDS) {
    if (combined.includes(keyword)) {
      return {
        likelyAI: true,
        suggestedRiskCategory: 'limited',
        suggestedChecks: [
          'Brukere informeres om AI-interaksjon',
          'AI-generert innhold er merket',
        ],
        aiActNote: 'Prosessen kan involvere AI med transparenskrav under AI Act.',
        suggestedAIFeatures: [],
      };
    }
  }

  // Default - no specific AI suggestion
  return {
    likelyAI: false,
    suggestedRiskCategory: 'minimal',
    suggestedChecks: [],
    aiActNote: '',
    suggestedAIFeatures: [],
  };
}

// Get AI features from linked systems
export interface SystemAIInfo {
  systemName: string;
  hasAI: boolean;
  aiFeatures: string[];
  riskCategory?: string;
}

export function aggregateSystemAIInfo(systems: SystemAIInfo[]): {
  totalWithAI: number;
  allFeatures: string[];
  highestRisk: string;
} {
  const systemsWithAI = systems.filter(s => s.hasAI);
  const allFeatures = [...new Set(systemsWithAI.flatMap(s => s.aiFeatures))];
  
  const riskOrder = ['unacceptable', 'high', 'limited', 'minimal'];
  let highestRisk = 'minimal';
  
  for (const system of systemsWithAI) {
    if (system.riskCategory) {
      const currentIndex = riskOrder.indexOf(highestRisk);
      const newIndex = riskOrder.indexOf(system.riskCategory);
      if (newIndex < currentIndex) {
        highestRisk = system.riskCategory;
      }
    }
  }

  return {
    totalWithAI: systemsWithAI.length,
    allFeatures,
    highestRisk,
  };
}
