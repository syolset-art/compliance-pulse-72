// AI Act suggestions based on process type and name
export interface ProcessAISuggestion {
  likelyAI: boolean;
  suggestedRiskCategory: 'minimal' | 'limited' | 'high' | 'unacceptable';
  suggestedChecks: string[];
  aiActNote: string;
  suggestedAIFeatures: string[];
}

// Extended checklist item with consequence metadata
export interface ChecklistMetadata {
  question: string;
  helpText: string;
  consequence: string;
  aiActReference: string;
  responsibility: 'tilbyder' | 'bruker' | 'begge';
  suggestedAction: string;
}

// Feature-based checklist questions — maps AI feature keywords to relevant questions
const FEATURE_CHECKLIST_MAP: Record<string, ChecklistMetadata[]> = {
  'screening': [
    {
      question: 'Blir brukere informert om at KI brukes i screeningprosessen?',
      helpText: 'KI-forordningen krever transparens når KI brukes til å vurdere personer. Dokumenter hvordan berørte informeres.',
      consequence: 'Brudd på KI-forordningen Art. 13 og 14 — manglende transparens overfor berørte personer kan medføre bøter opptil 3 % av global omsetning.',
      aiActReference: 'Art. 13, 14 (Transparens og informasjon)',
      responsibility: 'bruker',
      suggestedAction: 'Implementer skriftlig informasjon til alle som screenes, inkludert formål, omfang og klageadgang.',
    },
    {
      question: 'Kan et menneske overprøve KI-anbefalingene?',
      helpText: 'For høy-risiko KI kreves menneskelig tilsyn. Sørg for at ansvarlige personer kan overstyre KI-beslutninger.',
      consequence: 'Brudd på KI-forordningen Art. 14 — høy-risiko KI-systemer skal utformes slik at mennesker effektivt kan føre tilsyn. Manglende tilsyn kan medføre bøter og pålegg.',
      aiActReference: 'Art. 14 (Menneskelig tilsyn)',
      responsibility: 'bruker',
      suggestedAction: 'Etabler en prosedyre der en kvalifisert person gjennomgår og kan overstyre alle KI-anbefalinger før de iverksettes.',
    },
  ],
  'rangering': [
    {
      question: 'Er rangeringskriteriene dokumentert og forklarbare?',
      helpText: 'KI-forordningen krever at beslutningskriterier er sporbare. Dokumenter hvordan KI rangerer og hvilke faktorer som vektes.',
      consequence: 'Brudd på KI-forordningen Art. 13 — utilstrekkelig dokumentasjon av KI-systemets virkemåte. Kan medføre pålegg om stans av systemet.',
      aiActReference: 'Art. 13 (Transparens og informasjon til brukere)',
      responsibility: 'tilbyder',
      suggestedAction: 'Dokumenter alle rangeringskriterier, vektingsfaktorer og beslutningslogikk i et tilgjengelig format.',
    },
    {
      question: 'Overvåkes KI-rangeringen for diskriminering eller skjevhet?',
      helpText: 'KI-forordningen forbyr diskriminerende KI. Regelmessig testing for bias er nødvendig.',
      consequence: 'Brudd på KI-forordningen Art. 10 — systematisk skjevhet kan føre til diskriminering og brudd på likestillingsloven. Bøter opptil 3 % av global omsetning.',
      aiActReference: 'Art. 10 (Data og datastyring)',
      responsibility: 'begge',
      suggestedAction: 'Gjennomfør regelmessig bias-testing (minst kvartalsvis) og dokumenter resultatene. Korriger identifiserte skjevheter.',
    },
  ],
  'kandidat': [
    {
      question: 'Informeres kandidater om at KI brukes i prosessen?',
      helpText: 'Kandidater har rett til å vite at KI er involvert i vurderingen av dem.',
      consequence: 'Brudd på KI-forordningen Art. 50 og GDPR Art. 22 — berørte har rett til informasjon om automatisert behandling. Kan medføre klager til Datatilsynet.',
      aiActReference: 'Art. 50 (Transparensforpliktelser), GDPR Art. 22',
      responsibility: 'bruker',
      suggestedAction: 'Inkluder tydelig informasjon i stillingsutlysning og søknadsprosess om at KI benyttes, og gi kandidater mulighet til å reservere seg.',
    },
  ],
  'chatbot': [
    {
      question: 'Informeres brukerne om at de kommuniserer med KI?',
      helpText: 'KI-forordningen Art. 50 krever at brukere vet når de interagerer med en KI.',
      consequence: 'Brudd på KI-forordningen Art. 50 — brukere har rett til å vite at de samhandler med et KI-system. Manglende informasjon kan medføre bøter opptil 3 % av global omsetning.',
      aiActReference: 'Art. 50 (Transparensforpliktelser)',
      responsibility: 'bruker',
      suggestedAction: 'Implementer tydelig merking i brukergrensesnittet som informerer om at brukeren kommuniserer med en KI (f.eks. banner, ikon eller innledende melding).',
    },
    {
      question: 'Kan brukere enkelt nå et menneske ved behov?',
      helpText: 'God praksis tilsier at det alltid skal finnes en vei til menneskelig kontakt.',
      consequence: 'Selv om ikke et eksplisitt krav i KI-forordningen, anses manglende eskaleringsmulighet som et tegn på utilstrekkelig menneskelig tilsyn (Art. 14). Kan svekke organisasjonens posisjon ved klager.',
      aiActReference: 'Art. 14 (Menneskelig tilsyn)',
      responsibility: 'bruker',
      suggestedAction: 'Legg til en synlig «Snakk med et menneske»-knapp i chatgrensesnittet, med maks 2 klikk for å nå en menneskelig kontakt.',
    },
  ],
  'beslutning': [
    {
      question: 'Er det dokumentert hvordan KI-beslutningen tas?',
      helpText: 'Forklarbarhet er viktig for å oppfylle transparenskravene i KI-forordningen.',
      consequence: 'Brudd på KI-forordningen Art. 13 — høy-risiko KI krever at beslutningslogikken er forståelig for brukerne. Manglende forklarbarhet kan medføre pålegg og bøter.',
      aiActReference: 'Art. 13 (Transparens og informasjon til brukere)',
      responsibility: 'tilbyder',
      suggestedAction: 'Utarbeid teknisk dokumentasjon som forklarer beslutningslogikken, inkludert inputvariabler, modelltype og begrensninger.',
    },
    {
      question: 'Kan berørte personer klage på eller bestride KI-beslutninger?',
      helpText: 'Berørte har rett til innsyn og mulighet for overprøving av automatiserte avgjørelser.',
      consequence: 'Brudd på GDPR Art. 22 og KI-forordningen Art. 14 — berørte personer har rett til menneskelig behandling av sin sak. Manglende klageadgang er et alvorlig regelbrudd.',
      aiActReference: 'Art. 14 (Menneskelig tilsyn), GDPR Art. 22',
      responsibility: 'bruker',
      suggestedAction: 'Etabler en formell klageprosedyre med definert saksbehandlingstid og mulighet for menneskelig overprøving.',
    },
  ],
  'analyse': [
    {
      question: 'Er formålet med KI-analysen klart definert?',
      helpText: 'Formålsbegrensning er et grunnleggende prinsipp i GDPR og KI-forordningen.',
      consequence: 'Brudd på GDPR Art. 5(1)(b) — personopplysninger skal bare behandles for spesifikke, uttrykkelig angitte formål. Uklart formål kan medføre pålegg fra Datatilsynet.',
      aiActReference: 'GDPR Art. 5(1)(b), KI-forordningen Art. 9',
      responsibility: 'bruker',
      suggestedAction: 'Definer og dokumenter et klart, avgrenset formål for KI-analysen. Sørg for at formålet er forenlig med det opprinnelige innsamlingsformålet.',
    },
  ],
  'automatiser': [
    {
      question: 'Er det klart hva som skjer hvis KI-automatiseringen feiler?',
      helpText: 'En fallback-plan sikrer at prosessen kan fortsette selv om KI-systemet er utilgjengelig.',
      consequence: 'Manglende beredskapsplan kan føre til driftsavbrudd og brudd på KI-forordningen Art. 9 (risikostyring). Organisasjonen kan holdes ansvarlig for konsekvensene av KI-svikt.',
      aiActReference: 'Art. 9 (Risikostyringssystem)',
      responsibility: 'bruker',
      suggestedAction: 'Utarbeid en beredskapsplan (fallback-prosedyre) som beskriver manuell håndtering ved KI-svikt, inkludert varsling og gjenopprettingstid.',
    },
  ],
  'prediksjon': [
    {
      question: 'Valideres KI-prediksjonene regelmessig mot faktiske resultater?',
      helpText: 'Nøyaktighet og ytelsesovervåking er krav for høy-risiko KI under KI-forordningen.',
      consequence: 'Brudd på KI-forordningen Art. 9 og 72 — manglende ytelsesovervåking av høy-risiko KI kan medføre at systemet gir feilaktige resultater uten at det oppdages.',
      aiActReference: 'Art. 9 (Risikostyringssystem), Art. 72 (Overvåking etter markedsføring)',
      responsibility: 'begge',
      suggestedAction: 'Etabler rutiner for regelmessig validering av prediksjoner mot faktiske utfall. Definer akseptable terskelverdier og korrigeringstiltak.',
    },
  ],
  'score': [
    {
      question: 'Er scoringsmodellen transparent og forklarbar?',
      helpText: 'KI-forordningen krever at scoringsalgoritmer kan forklares og begrunnes.',
      consequence: 'Brudd på KI-forordningen Art. 13 — en «svart boks»-modell oppfyller ikke transparenskravene. Berørte har rett til å forstå hvordan scoren deres beregnes.',
      aiActReference: 'Art. 13 (Transparens og informasjon til brukere)',
      responsibility: 'tilbyder',
      suggestedAction: 'Dokumenter scoringsmodellens variabler, vektinger og beslutningsgrenser. Gjør en forenklet forklaring tilgjengelig for berørte.',
    },
  ],
  'generert': [
    {
      question: 'Merkes KI-generert innhold tydelig?',
      helpText: 'KI-forordningen Art. 50 krever merking av innhold som er generert av KI.',
      consequence: 'Brudd på KI-forordningen Art. 50 — KI-generert innhold (tekst, bilde, lyd, video) skal merkes tydelig. Manglende merking kan medføre bøter og tillitssvikt.',
      aiActReference: 'Art. 50 (Transparensforpliktelser)',
      responsibility: 'bruker',
      suggestedAction: 'Implementer automatisk merking av alt KI-generert innhold med tydelig etikett eller metadata som identifiserer opphavet.',
    },
  ],
  'overvåk': [
    {
      question: 'Er det gjort en vurdering av personvernkonsekvenser (DPIA)?',
      helpText: 'GDPR Art. 35 krever DPIA for systematisk overvåking.',
      consequence: 'Brudd på GDPR Art. 35 — systematisk overvåking av fysiske personer krever en DPIA. Manglende DPIA kan medføre bøter opptil 2 % av global omsetning fra Datatilsynet.',
      aiActReference: 'GDPR Art. 35, KI-forordningen Art. 27 (Grunnleggende rettighetsvurdering)',
      responsibility: 'bruker',
      suggestedAction: 'Gjennomfør en DPIA i samarbeid med personvernombud (DPO). Dokumenter risikoer, tiltak og konsulter eventuelt Datatilsynet.',
    },
  ],
};

// Generate checklist questions based on selected features
export function generateFeatureBasedChecks(selectedFeatures: string[]): ChecklistMetadata[] {
  const checks: ChecklistMetadata[] = [];
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
      {
        question: 'Er det dokumentert hvordan KI brukes i denne prosessen?',
        helpText: 'Grunnleggende dokumentasjon er nødvendig for å oppfylle KI-forordningens krav.',
        consequence: 'Brudd på KI-forordningen Art. 11 og 12 — utilstrekkelig dokumentasjon gjør det umulig å demonstrere samsvar ved tilsyn.',
        aiActReference: 'Art. 11, 12 (Teknisk dokumentasjon og loggføring)',
        responsibility: 'bruker',
        suggestedAction: 'Opprett et dokument som beskriver KI-bruken, formål, datagrunnlag og ansvarlig person.',
      },
      {
        question: 'Finnes det en ansvarlig person for KI-bruken?',
        helpText: 'En tydelig ansvarslinje sikrer at noen følger opp compliance og håndterer hendelser.',
        consequence: 'Manglende ansvarslinje gjør at ingen følger opp KI-relaterte hendelser eller regulatoriske krav. Kan medføre organisatorisk ansvar ved tilsyn.',
        aiActReference: 'Art. 26 (Forpliktelser for brukere av høy-risiko KI)',
        responsibility: 'bruker',
        suggestedAction: 'Utpek en navngitt person som er ansvarlig for KI-bruken i prosessen, med dokumenterte oppgaver og myndighet.',
      },
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
  'rekruttering': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'KI brukes til å filtrere CV-er eller søknader',
      'KI brukes til å rangere kandidater',
      'Kandidater informeres om at KI brukes i prosessen',
      'Rekrutterer kan overprøve KI-anbefalinger',
      'KI-beslutninger logges for etterprøvbarhet',
      'Konsekvensanalyse (DPIA) er gjennomført',
    ],
    aiActNote: 'Rekruttering er klassifisert som høy-risiko i KI-forordningen Annex III (5b). Krever full dokumentasjon, risikovurdering og menneskelig tilsyn.',
    suggestedAIFeatures: ['CV-screening', 'Kandidatrangering', 'Intervjuanalyse'],
  },
  'onboarding': {
    likelyAI: false,
    suggestedRiskCategory: 'minimal',
    suggestedChecks: [
      'KI-generert innhold brukes i opplæringen',
      'Automatiserte systemer tildeler oppgaver',
    ],
    aiActNote: 'Onboarding er vanligvis minimal risiko med mindre KI tar beslutninger som påvirker ansettelsesforholdet.',
    suggestedAIFeatures: ['Personalisert opplæring', 'Automatisk oppgavetildeling'],
  },
  'ytelsesovervåking': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'KI brukes til å vurdere ansattes ytelse',
      'KI-vurderinger påvirker lønns- eller karrierebeslutninger',
      'Ansatte har innsyn i hvordan de vurderes',
      'Ledere kan overprøve KI-vurderinger',
    ],
    aiActNote: 'Ytelsesovervåking i arbeidslivet er høy-risiko under KI-forordningen Annex III (4). Krever transparens overfor ansatte.',
    suggestedAIFeatures: ['Ytelsesanalyse', 'Måloppfølging', 'Produktivitetsmåling'],
  },
  'kundeservice': {
    likelyAI: true,
    suggestedRiskCategory: 'limited',
    suggestedChecks: [
      'Chatbot eller virtuell assistent er i bruk',
      'Kunder informeres om at de snakker med KI',
      'Kunder kan enkelt nå et menneske',
      'Sentimentanalyse brukes på kundehenvendelser',
    ],
    aiActNote: 'Kundeservice-KI krever transparens under KI-forordningen. Brukere må informeres når de interagerer med KI.',
    suggestedAIFeatures: ['Chatbot', 'Automatisk rutinghåndtering', 'Sentimentanalyse', 'Kundehenvendelsesklassifisering'],
  },
  'salg': {
    likelyAI: true,
    suggestedRiskCategory: 'limited',
    suggestedChecks: [
      'KI brukes til prisanbefalinger',
      'Prediktiv analyse brukes for leads',
      'Kundesegmentering er automatisert',
    ],
    aiActNote: 'Salgs-KI er vanligvis begrenset risiko, men krever transparens ved direkte kundeinteraksjon.',
    suggestedAIFeatures: ['Lead-scoring', 'Prisoptimalisering', 'Kundesegmentering', 'Salgsprediksjon'],
  },
  'kredittvurdering': {
    likelyAI: true,
    suggestedRiskCategory: 'high',
    suggestedChecks: [
      'KI brukes til å vurdere kredittverdighet',
      'KI kan avslå eller begrense kreditt',
      'Søkere informeres om KI-bruk',
      'Beslutningene er forklarbare',
      'KI overvåkes for diskriminering',
    ],
    aiActNote: 'Kredittvurdering er høy-risiko under KI-forordningen Annex III (5b). Krever forklarbarhet og ikke-diskriminering.',
    suggestedAIFeatures: ['Automatisk kredittscore', 'Risikovurdering', 'Svindeldeteksjon'],
  },
  'fakturering': {
    likelyAI: false,
    suggestedRiskCategory: 'minimal',
    suggestedChecks: [
      'Automatisert beløpsberegning er i bruk',
      'KI-basert feildeteksjon er i bruk',
    ],
    aiActNote: 'Fakturering er vanligvis minimal risiko.',
    suggestedAIFeatures: ['Automatisk beløpsberegning', 'Anomalideteksjon'],
  },
};

export function getProcessAISuggestion(processName: string, processDescription?: string): ProcessAISuggestion {
  const nameLower = processName.toLowerCase();
  const descLower = (processDescription || '').toLowerCase();
  const combined = `${nameLower} ${descLower}`;

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

  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (combined.includes(keyword)) {
      return {
        likelyAI: true,
        suggestedRiskCategory: 'high',
        suggestedChecks: [
          'KI brukes til å ta eller støtte beslutninger',
          'KI-beslutninger påvirker personer vesentlig',
          'Menneskelig tilsyn er på plass',
          'KI-bruk dokumenteres tilstrekkelig',
        ],
        aiActNote: 'Prosessen kan inneholde høy-risiko KI basert på nøkkelord. Vurder nøye om KI-forordningen Annex III gjelder.',
        suggestedAIFeatures: [],
      };
    }
  }

  for (const keyword of LIMITED_RISK_KEYWORDS) {
    if (combined.includes(keyword)) {
      return {
        likelyAI: true,
        suggestedRiskCategory: 'limited',
        suggestedChecks: [
          'Brukere informeres om KI-interaksjon',
          'KI-generert innhold er merket',
        ],
        aiActNote: 'Prosessen kan involvere KI med transparenskrav under KI-forordningen.',
        suggestedAIFeatures: [],
      };
    }
  }

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
