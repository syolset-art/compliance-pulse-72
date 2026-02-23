import { Shield, Scale, FileText, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RegulatoryKeyPoint {
  title: string;
  description: string;
}

export interface RegulatoryMynderHelp {
  title: string;
  description: string;
  route: string;
}

export interface RegulatoryTopic {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  summary_no: string;
  summary_en: string;
  keyPoints_no: RegulatoryKeyPoint[];
  mynderHelp_no: RegulatoryMynderHelp[];
}

export const REGULATORY_TOPICS: RegulatoryTopic[] = [
  {
    id: 'gdpr',
    title: 'GDPR',
    icon: Shield,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    summary_no: 'General Data Protection Regulation (GDPR) er EUs personvernforordning som gir enkeltpersoner kontroll over egne personopplysninger. Den gjelder alle virksomheter som behandler personopplysninger om personer i EØS-området.',
    summary_en: 'The General Data Protection Regulation (GDPR) is the EU\'s privacy regulation that gives individuals control over their personal data. It applies to all organizations that process personal data about individuals in the EEA.',
    keyPoints_no: [
      { title: 'Behandlingsgrunnlag', description: 'All behandling av personopplysninger må ha et lovlig grunnlag (samtykke, avtale, rettslig forpliktelse, vitale interesser, allmennhetens interesse, eller berettiget interesse).' },
      { title: 'Registrertes rettigheter', description: 'Personer har rett til innsyn, retting, sletting, dataportabilitet, protest og begrensning av behandling av egne data.' },
      { title: 'Behandlingsprotokoll (ROPA)', description: 'Virksomheter skal føre en oversikt over alle behandlingsaktiviteter (Art. 30). Dette er grunnlaget for compliance-dokumentasjonen.' },
      { title: 'Avviksvarsling', description: 'Brudd på personopplysningssikkerheten skal meldes til Datatilsynet innen 72 timer (Art. 33), og til berørte personer ved høy risiko (Art. 34).' },
      { title: 'Databehandleravtaler', description: 'Alle tredjeparter som behandler data på dine vegne må ha en skriftlig databehandleravtale (DPA) som regulerer ansvar og plikter.' },
      { title: 'Personvernkonsekvensvurdering (DPIA)', description: 'Ved høyrisiko-behandling skal det gjennomføres en DPIA for å identifisere og redusere personvernrisiko (Art. 35).' },
    ],
    mynderHelp_no: [
      { title: 'Behandlingsprotokoll', description: 'Automatisk generering av ROPA basert på registrerte prosesser', route: '/processing-records' },
      { title: 'Leverandørstyring', description: 'Oversikt over alle databehandlere med DPA-status og risikovurdering', route: '/assets' },
      { title: 'Avviksregister', description: 'Registrer og spor personvernbrudd med tidslinje', route: '/deviations' },
      { title: 'Rapporter', description: 'Generer GDPR-rapporter og gap-analyser', route: '/reports' },
    ],
  },
  {
    id: 'nis2',
    title: 'NIS2',
    icon: Scale,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    summary_no: 'NIS2-direktivet (Network and Information Security) er EUs regelverk for cybersikkerhet som stiller krav til risikostyring, hendelsesrapportering og ledelsesansvar for virksomheter i kritisk og viktig infrastruktur.',
    summary_en: 'The NIS2 Directive (Network and Information Security) is the EU\'s cybersecurity regulation requiring risk management, incident reporting and management accountability for organizations in critical and important infrastructure.',
    keyPoints_no: [
      { title: 'Ledelsesansvar', description: 'Toppledelsen har personlig ansvar for cybersikkerhet og må gjennomgå opplæring. Manglende etterlevelse kan medføre personlige sanksjoner.' },
      { title: 'Risikostyring', description: 'Virksomheter skal implementere tekniske og organisatoriske tiltak for å håndtere cybersikkerhetsrisiko, inkludert tilgangskontroll, kryptering og beredskapsplaner.' },
      { title: 'Hendelsesrapportering', description: 'Betydelige sikkerhetshendelser skal rapporteres til myndighetene innen 24 timer (tidlig varsel) og 72 timer (full rapport).' },
      { title: 'Leverandørkjedesikkerhet', description: 'Virksomheter må vurdere og håndtere cybersikkerhetsrisiko i hele leverandørkjeden, inkludert krav til leverandører.' },
      { title: 'Bøter og sanksjoner', description: 'Vesentlige virksomheter kan bøtelegges opptil €10M eller 2% av global omsetning. Viktige virksomheter opptil €7M eller 1.4%.' },
    ],
    mynderHelp_no: [
      { title: 'Risikovurdering', description: 'Strukturert cybersikkerhetsvurdering for alle systemer', route: '/tasks?view=readiness' },
      { title: 'Hendelseshåndtering', description: 'Registrer og følg opp sikkerhetshendelser', route: '/deviations' },
      { title: 'Leverandøroversikt', description: 'Vurder cybersikkerhet i leverandørkjeden', route: '/assets' },
    ],
  },
  {
    id: 'iso27001',
    title: 'ISO 27001',
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    summary_no: 'ISO/IEC 27001 er den internasjonale standarden for informasjonssikkerhetsstyring (ISMS). Den gir et systematisk rammeverk for å beskytte informasjonsverdier gjennom risikobaserte kontroller.',
    summary_en: 'ISO/IEC 27001 is the international standard for information security management systems (ISMS). It provides a systematic framework for protecting information assets through risk-based controls.',
    keyPoints_no: [
      { title: 'ISMS (styringssystem)', description: 'Et helhetlig system for å styre informasjonssikkerhet, inkludert policies, prosesser, prosedyrer og kontroller. Bygger på Plan-Do-Check-Act-modellen.' },
      { title: 'Annex A-kontroller', description: 'Standarden inneholder 93 kontroller fordelt på fire områder: organisatoriske, personrelaterte, fysiske og teknologiske tiltak.' },
      { title: 'Risikovurdering', description: 'Kjernen i ISO 27001 — identifiser informasjonsverdier, vurder trusler og sårbarheter, og velg passende kontrolltiltak basert på risiko.' },
      { title: 'Kontinuerlig forbedring', description: 'ISO 27001 krever jevnlig evaluering og forbedring av styringssystemet gjennom interne revisjoner og ledelsesgjennomgang.' },
      { title: 'Sertifisering', description: 'Valgfritt, men gir markedstillit. Krever ekstern revisjon i to steg (Stage 1 og 2). Sertifikatet gjelder i 3 år med årlige oppfølginger.' },
    ],
    mynderHelp_no: [
      { title: 'Compliance-sjekkliste', description: 'Automatisk sporing av ISO 27001-krav', route: '/compliance-checklist' },
      { title: 'ISO Readiness', description: 'Steg-for-steg forberedelse til sertifisering', route: '/tasks?view=readiness' },
      { title: 'Systemregistrering', description: 'Kartlegg og klassifiser informasjonsverdier', route: '/assets' },
      { title: 'Rapporter', description: 'Generer dokumentasjon for revisjon', route: '/reports' },
    ],
  },
  {
    id: 'aiact',
    title: 'AI Act',
    icon: Bot,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    summary_no: 'EU AI Act er verdens første helhetlige regulering av kunstig intelligens. Den klassifiserer AI-systemer etter risiko og stiller krav til transparens, menneskelig tilsyn og dokumentasjon.',
    summary_en: 'The EU AI Act is the world\'s first comprehensive regulation of artificial intelligence. It classifies AI systems by risk level and sets requirements for transparency, human oversight and documentation.',
    keyPoints_no: [
      { title: 'Risikoklassifisering', description: 'AI-systemer klassifiseres i fire nivåer: uakseptabel risiko (forbudt), høy risiko (strenge krav), begrenset risiko (transparenskrav), og minimal risiko (ingen krav).' },
      { title: 'Forbudte AI-systemer', description: 'Systemer for sosial scoring, manipulering av sårbare grupper, sanntids biometrisk identifikasjon i offentlige rom (med unntak), og prediktiv policing er forbudt.' },
      { title: 'Høyrisiko-krav', description: 'AI-systemer i Annex III (rekruttering, kredittvurdering, helse, etc.) må oppfylle krav til datakvalitet, transparens, menneskelig tilsyn og logging.' },
      { title: 'Transparens og informasjonsplikt', description: 'Brukere skal informeres når de interagerer med AI. Innhold generert av AI (deepfakes, syntetisk tekst) skal merkes.' },
      { title: 'AI-register', description: 'Virksomheter som bruker høyrisiko-AI må føre register over AI-systemer med formål, risikokategori og tiltak for menneskelig tilsyn.' },
    ],
    mynderHelp_no: [
      { title: 'AI-systemregister', description: 'Registrer og klassifiser alle AI-systemer', route: '/ai-registry' },
      { title: 'AI Act-rapport', description: 'Generer compliance-rapport for AI-bruk', route: '/reports' },
      { title: 'AI-bruk i systemer', description: 'Kartlegg AI-funksjonalitet i leverandører', route: '/assets' },
    ],
  },
];
