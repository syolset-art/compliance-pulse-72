import { useCallback, useEffect, useState } from "react";

/**
 * Enkel klientstatus for den lokale agenten Sara.
 * Brukes til å avgjøre om "Installer Sara" skal vises, eller om brukeren
 * i stedet skal se en notifikasjon om nye bevis fra Sara.
 */
const STORAGE_KEY = "mynder.sara.installed";
const EVENT = "mynder-sara-state";

export type SaraFinding = {
  id: string;
  requirement: string;
  source: string;
  at: string;
  confirmed: boolean;
};

/** Demofunn Sara har levert etter installasjon (bekreftes av bruker). */
export const SARA_RECENT_FINDINGS: SaraFinding[] = [
  {
    id: "f1",
    requirement: "Art. 32 – Sikkerhet ved behandlingen",
    source: "SharePoint / Policies/Informasjonssikkerhet.docx",
    at: "I dag 09:12",
    confirmed: false,
  },
  {
    id: "f2",
    requirement: "Art. 30 – Protokoll over behandlingsaktiviteter",
    source: "Notion / Compliance / ROPA",
    at: "I dag 09:12",
    confirmed: false,
  },
  {
    id: "f3",
    requirement: "A.5.10 – Akseptabel bruk av informasjon",
    source: "Google Drive / HR/Retningslinjer.pdf",
    at: "I går 16:40",
    confirmed: true,
  },
];

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function setSaraInstalled(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event(EVENT));
}

export function useSaraAgent() {
  const [installed, setInstalled] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setInstalled(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markInstalled = useCallback(() => setSaraInstalled(true), []);

  const newFindings = installed
    ? SARA_RECENT_FINDINGS.filter((f) => !f.confirmed).length
    : 0;

  return { installed, markInstalled, findings: SARA_RECENT_FINDINGS, newFindings };
}
