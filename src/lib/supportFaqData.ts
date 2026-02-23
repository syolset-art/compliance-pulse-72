// Local FAQ answers – zero cost, no AI calls needed
export const faqAnswers: Record<string, { q: string; a: string; category: string }[]> = {
  "mynder-help": [
    { q: "Hvordan legger jeg til et system?", a: "Gå til **Leverandører** i sidemenyen, klikk **Legg til** øverst til høyre, og velg systemtype. Du kan også bruke AI-forslag for automatisk utfylling.", category: "Systemer" },
    { q: "Hva er et arbeidsområde?", a: "Et arbeidsområde representerer en avdeling eller funksjon i organisasjonen din (f.eks. HR, IT, Salg). Det brukes til å strukturere ansvar og koble systemer til riktige prosesser.", category: "Organisasjon" },
    { q: "Hvordan genererer jeg en rapport?", a: "Gå til **Rapporter** i sidemenyen. Velg rapporttype (GDPR, ISO 27001, NIS2) og klikk **Generer**. Rapporten kan eksporteres som PDF.", category: "Rapporter" },
    { q: "Hva er en Trust Profil?", a: "Trust Profilen er din virksomhets selverklæring for compliance. Den viser samsvarsstatus, sertifiseringer og dokumentasjon. Du kan dele den med kunder via Mynder Trust Engine.", category: "Trust" },
    { q: "Hvordan registrerer jeg et avvik?", a: "Gå til **Avviksregister** i sidemenyen og klikk **Nytt avvik**. Fyll ut tittel, kategori, alvorlighetsgrad og beskrivelse. Mynder hjelper deg med oppfølging.", category: "Avvik" },
  ],
  "lara": [
    { q: "Hva er Lara?", a: "Lara er Mynders AI-assistent. Hun kan generere rapporter, analysere compliance-status, foreslå forbedringer og guide deg gjennom plattformen.", category: "Generelt" },
    { q: "Hvordan bruker jeg Lara?", a: "Klikk på Lara-ikonet nede til høyre for å åpne chatten. Still spørsmål på norsk eller engelsk – Lara forstår konteksten du er i og tilpasser svarene.", category: "Bruk" },
    { q: "Kan Lara generere dokumenter?", a: "Ja! Lara kan generere gap-analyser, compliance-rapporter, TIA-vurderinger og ROPA-oversikter. Be henne om det i chatten.", category: "Funksjoner" },
  ],
  "iso": [
    { q: "Hva er ISO 27001?", a: "ISO 27001 er den internasjonale standarden for informasjonssikkerhetsstyring (ISMS). Den gir et rammeverk for å beskytte informasjon systematisk.", category: "Grunnleggende" },
    { q: "Hvordan kommer jeg i gang med ISO-sertifisering?", a: "1. Start med en gap-analyse (be Lara om dette)\n2. Opprett arbeidsområder og tildel ansvar\n3. Dokumenter prosesser og kontroller\n4. Gjennomfør risikovurdering\n5. Implementer manglende kontroller\n6. Bestill ekstern revisjon", category: "Prosess" },
    { q: "Hvor lang tid tar sertifiseringen?", a: "For de fleste SMB-er tar det 3-6 måneder med Mynder. Tradisjonelt tar det 12-18 måneder. Mynder automatiserer mye av dokumentasjonen.", category: "Tidslinje" },
  ],
  "faq": [
    { q: "Hva koster Mynder?", a: "Mynder har ulike planer tilpasset virksomhetens størrelse. Se **Innstillinger > Abonnementer** for detaljer og priser.", category: "Priser" },
    { q: "Er dataene mine trygge?", a: "Ja. Mynder kjører på sikker infrastruktur med kryptering i transit og i ro. Vi følger selv ISO 27001 og GDPR.", category: "Sikkerhet" },
    { q: "Kan jeg dele data med kunder?", a: "Ja! Du kan dele compliance-dokumentasjon via Trust Profilen eller sende direkte via Kundeforespørsler.", category: "Deling" },
    { q: "Hva er ROPA?", a: "ROPA (Record of Processing Activities) er en oversikt over alle behandlingsaktiviteter i virksomheten. Det er et krav i GDPR Art. 30.", category: "GDPR" },
  ],
};

export const contextPrompts: Record<string, string> = {
  "mynder-help": "Brukeren trenger hjelp med å bruke Mynder-plattformen. Svar basert på plattformkunnskap.",
  "lara": "Brukeren vil vite mer om Lara, Mynders AI-assistent.",
  "iso": "Brukeren har spørsmål om ISO 27001-sertifisering og prosessen.",
  "faq": "Brukeren har generelle spørsmål om Mynder, priser, sikkerhet eller deling.",
  "regulatory": "Brukeren trenger faglig veiledning om GDPR, NIS2, AI Act eller annet regelverk. Gi utfyllende, faglige svar.",
  "foundation": "Brukeren er i fundamentfasen av compliance-prosessen. Hjelp med kontekstanalyse, scope-definisjon, gap-analyse og rollefordeling. Forklar grunnleggende konsepter.",
  "implementation": "Brukeren er i implementeringsfasen. Hjelp med policy-utvikling, risikovurdering, risikobehandling og målsetting. Gi konkrete og praktiske råd.",
  "operation": "Brukeren er i driftsfasen. Hjelp med kontrollimplementering, dokumentasjon, awareness-trening og overvåking. Fokuser på kontinuerlig forbedring.",
  "audit": "Brukeren vurderer intern audit. Hjelp med internrevisjon, ledelsesgjennomgang og korrigerende tiltak. Forklar prosessen steg for steg.",
  "certification": "Brukeren vurderer sertifisering. Hjelp med Stage 1 og Stage 2 audit, sertifikatprosessen og vedlikehold. Vær ærlig om at dette er valgfritt.",
  "gdpr": "Brukeren vil lære om GDPR. Gi faglige svar om personvern, rettigheter, behandlingsgrunnlag, ROPA, avviksvarsling og databehandleravtaler. Vær konkret og praktisk.",
  "nis2": "Brukeren vil lære om NIS2-direktivet. Forklar cybersikkerhetskrav, meldeplikt, ledelsesansvar og leverandørkjedesikkerhet.",
  "iso27001": "Brukeren vil lære om ISO 27001. Forklar ISMS, Annex A-kontroller, risikovurdering, sertifiseringsprosessen og kontinuerlig forbedring.",
  "aiact": "Brukeren vil lære om EU AI Act. Forklar risikoklassifisering, forbudte systemer, krav til høyrisiko-AI, transparens og AI-register.",
};
