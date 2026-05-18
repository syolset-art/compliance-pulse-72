// Demo-etiketter for kontrollpunkter pr regelverk. Brukes i tjenestelista
// for å gi hvert kontrollpunkt et menneskelig navn (i tillegg til ID-en).
// Fallback: ID-en + "Kontrollpunkt".

const LABELS: Record<string, Record<string, string>> = {
  nis2: {
    "Art.20": "Styring og opplæring",
    "Art.21": "Sikkerhetstiltak",
    "Art.23": "Hendelseshåndtering",
  },
  iso27001: {
    "A.5.1": "Informasjonssikkerhetspolicy",
    "A.5.4": "Ledelsens ansvar",
    "A.5.10": "Akseptabel bruk",
    "A.5.15": "Tilgangskontroll",
    "A.5.24": "Hendelsesplanlegging",
    "A.5.26": "Respons på hendelser",
    "A.5.29": "Kontinuitet ved avbrudd",
    "A.6.1": "Screening av personell",
    "A.6.3": "Awareness og opplæring",
    "A.8.2": "Privilegerte tilganger",
    "A.8.3": "Tilgangsbegrensning",
    "A.8.7": "Beskyttelse mot skadevare",
    "A.8.8": "Sårbarhetshåndtering",
    "A.8.13": "Sikkerhetskopiering",
    "A.8.15": "Logging",
    "A.8.16": "Overvåking av aktiviteter",
    "A.5.7": "Trusselovervåking",
    "A.8.29": "Sikkerhetstesting",
  },
  gdpr: {
    "Art.28": "Databehandleravtaler",
    "Art.35": "DPIA",
    "Art.37": "Utnevnelse av DPO",
    "Art.39": "DPO-oppgaver",
  },
  aiact: {
    "Art.4": "AI-litteracy",
    "Art.9": "Risikohåndtering",
    "Art.10": "Datakvalitet",
    "Art.26": "Bruker-ansvar",
  },
  dora: {
    "Art.5": "IKT-rammeverk",
    "Art.17": "Hendelseshåndtering",
    "Art.28": "Tredjepartsrisiko",
  },
  transparency: {
    "§4": "Aktsomhetsvurdering",
    "§5": "Redegjørelse",
  },
};

export function getControlLabel(frameworkId: string, controlId: string): string {
  return LABELS[frameworkId?.toLowerCase()]?.[controlId] ?? "Kontrollpunkt";
}
