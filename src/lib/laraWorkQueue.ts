// Laras arbeidskø — prototypedata for det agentiske partner-dashbordet.
// Enheten for arbeid er et ferdig utkast fra Lara som mennesket godkjenner,
// ikke en oppgave mennesket må starte selv.

export type LaraQueueState = "pending" | "auto-done" | "blocked";

export type LaraAutonomy = "automatic" | "assisted" | "manual";

export type LaraQueueItem = {
  id: string;
  customer: string;
  /** Hva Lara har gjort / foreslår — formulert som utført arbeid. */
  action: string;
  /** Kort begrunnelse: hvorfor Lara laget dette utkastet. */
  rationale: string;
  /** Datakilde begrunnelsen bygger på. */
  source: string;
  /** Verdi i kroner der forslaget er et tilbud. */
  value?: number;
  state: LaraQueueState;
  autonomy: LaraAutonomy;
  /** Vises for auto-done: når Lara utførte det. */
  doneAt?: string;
  /** Vises for blocked: hva som mangler for at Lara kan fortsette. */
  blocker?: string;
};

export const LARA_AUTONOMY_LABELS: Record<LaraAutonomy, { nb: string; en: string; hint: string }> = {
  automatic: {
    nb: "Automatisk",
    en: "Automatic",
    hint: "Lara utfører rutinearbeid selv og logger det.",
  },
  assisted: {
    nb: "Assistert",
    en: "Assisted",
    hint: "Lara gjør jobben ferdig, du godkjenner før noe sendes.",
  },
  manual: {
    nb: "Manuell",
    en: "Manual",
    hint: "Lara foreslår kun — du utfører selv.",
  },
};

export const LARA_WORK_QUEUE: LaraQueueItem[] = [
  {
    id: "q-bergen-offer",
    customer: "Bergen Energi AS",
    action: "Tilbud på risikovurdering er skrevet ferdig",
    rationale:
      "NIS2 ble aktivert for 3 dager siden, men risikovurderingen mangler. Dette er neste krav som må lukkes.",
    source: "Aktivitetslogg · NIS2 art. 21",
    value: 18900,
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-nordvik-reminder",
    customer: "Nordvik Helse",
    action: "Purring om 4 manglende leverandører er formulert",
    rationale:
      "Leverandørmodulen ble tatt i bruk for 6 dager siden, men ingen leverandører er registrert ennå.",
    source: "Aktivitetslogg · Leverandørmodul",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-fjord-meeting",
    customer: "Fjord Logistikk",
    action: "Møteinnkalling for oppfølging er klargjort",
    rationale:
      "ISO 27001 ble aktivert for 2 uker siden uten aktivitet siden. Modenheten står stille på 34 %.",
    source: "Aktivitetslogg · Modenhetsmåling",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-auto-maturity",
    customer: "12 kunder",
    action: "Modenhetsscorer oppdatert",
    rationale: "Nye dokumenter og svar er vurdert mot kontrollområdene.",
    source: "Nattlig kjøring",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
  },
  {
    id: "q-auto-privacy",
    customer: "4 kunder",
    action: "Personvernerklæringer hentet og analysert",
    rationale: "Offentlige kilder ble kartlagt for nye kunder uten grunnlag.",
    source: "Offentlig kartlegging",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
  },
  {
    id: "q-blocked-vestland",
    customer: "Vestland Kraft",
    action: "Kartlegging av systemer er satt på vent",
    rationale: "Lara kommer ikke videre uten tilgang til kundens systemoversikt.",
    source: "Systemkartlegging",
    state: "blocked",
    autonomy: "assisted",
    blocker: "Mangler tilgang til Microsoft-integrasjonen",
  },
];

export function formatNok(value: number): string {
  return `${value.toLocaleString("nb-NO")} kr`;
}
