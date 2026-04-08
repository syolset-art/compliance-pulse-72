// AI Act suggestions based on process type and name
export interface ProcessAISuggestion {
  likelyAI: boolean;
  suggestedRiskCategory: 'minimal' | 'limited' | 'high' | 'unacceptable';
  suggestedChecks: string[];
  aiActNote: string;
  suggestedAIFeatures: string[];
}

// Feature-based checklist questions — maps AI feature keywords to relevant questions
const FEATURE_CHECKLIST_MAP: Record<string, { question: string; helpText: string }[]> = {
  'screening': [
    { question: 'Blir brukere informert om at AI brukes i screeningprosessen?', helpText: 'AI Act krever transparens når AI brukes til å vurdere personer. Dokumenter hvordan berørte informeres.' },
    { question: 'Kan et menneske overprøve AI-anbefalingene?', helpText: 'For høy-risiko AI kreves menneskelig tilsyn. Sørg for at ansvarlige personer kan overstyre AI-beslutninger.' },
  ],
  'rangering': [
    { question: 'Er rangeringskriteriene dokumentert og forklarbare?', helpText: 'AI Act krever at beslutningskriterier er sporbare. Dokumenter hvordan AI rangerer og hvilke faktorer som vektes.' },
    { question: 'Overvåkes AI-rangeringen for diskriminering eller skjevhet?', helpText: 'AI Act forbyr diskriminerende AI. Regelmessig testing for bias er nødvendig.' },
  ],
  'kandidat': [
    { question: 'Informeres kandidater om at AI brukes i prosessen?', helpText: 'Kandidater har rett til å vite at AI er involvert i vurderingen av dem.' },
  ],
  'chatbot': [
    { question: 'Informeres brukerne om at de kommuniserer med AI?', helpText: 'AI Act Art. 50 krever at brukere vet når de interagerer med en AI.' },
    { question: 'Kan brukere enkelt nå et menneske ved behov?', helpText: 'God praksis tilsier at det alltid skal finnes en vei til menneskelig kontakt.' },
  ],
  'beslutning': [
    { question: 'Er det dokumentert hvordan AI-beslutningen tas?', helpText: 'Forklarbarhet er viktig for å oppfylle transparenskravene i AI Act.' },
    { question: 'Kan berørte personer klage på eller bestride AI-beslutninger?', helpText: 'Berørte har rett til innsyn og mulighet for overprøving av automatiserte avgjørelser.' },
  ],
  'analyse': [
    { question: 'Er formålet med AI-analysen klart definert?', helpText: 'Formålsbegrensning er et grunnleggende prinsipp i GDPR og AI Act.' },
  ],
  'automatiser': [
    { question: 'Er det klart hva som skjer hvis AI-automatiseringen feiler?', helpText: 'En fallback-plan sikrer at prosessen kan fortsette selv om AI-systemet er utilgjengelig.' },
  ],
  'prediksjon': [
    { question: 'Valideres AI-prediksjonene regelmessig mot faktiske resultater?', helpText: 'Nøyaktighet og ytelsesovervåking er krav for høy-risiko AI under AI Act.' },
  ],
  'score': [
    { question: 'Er scoringsmodellen transparent og forklarbar?', helpText: 'AI Act krever at scoringsalgoritmer kan forklares og begrunnes.' },
  ],
  'generert': [
    { question: 'Merkes AI-generert innhold tydelig?', helpText: 'AI Act Art. 50 krever merking av innhold som er generert av AI.' },
  ],
  'overvåk': [
    { question: 'Er det gjort en vurdering av personvernkonsekvenser (DPIA)?', helpText: 'GDPR Art. 35 krever DPIA for systematisk overvåking.' },
  ],
};

// Generate checklist questions based on selected features
export function generateFeatureBasedChecks(selectedFeatures: string[]): { question: string; helpText: string }[] {
  const checks: { question: string; helpText: string }[] = [];
  const addedQuestions = new Set<string>();

  for (const feature of selectedFeatures) {
    const featureLower = feature.toLowerCase();
    for (const [keyword, questions] of Object.entries(FEATURE_CHECKLIST_MAP)) {
      if (featureLower.includes(keyword)) {
        for (const q of questions) {
          if (!addedQuestions.has(q.question)) {
            addedQuestions.add(q.question);
            checks.push(q);
          }
        }
      }
    }
  }

  // If no specific matches, add general questions
  if (checks.length === 0) {
    checks.push(
      { question: 'Er det dokumentert hvordan AI brukes i denne prosessen?', helpText: 'Grunnleggende dokumentasjon er nødvendig for å oppfylle AI Act-kravene.' },
      { question: 'Finnes det en ansvarlig person for AI-bruken?', helpText: 'En tydelig ansvarslinje sikrer at noen følger opp compliance og håndterer hendelser.' },
    );
  }

  // Cap at max 5 to keep it manageable
  return checks.slice(0, 5);
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
