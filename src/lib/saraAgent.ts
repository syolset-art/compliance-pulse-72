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
  /** Dokumentidentifikator hos kunden (ikke selve dokumentet) */
  documentId: string;
  /** Kort hash av dokumentet – bekrefter at det finnes og er uendret */
  hash: string;
  /** Versjon av den lokale agenten som produserte funnet */
  agentVersion: string;
};

/** Demofunn Sara har levert etter installasjon (bekreftes av bruker). */
export const SARA_RECENT_FINDINGS: SaraFinding[] = [
  {
    id: "f1",
    requirement: "Art. 32 – Sikkerhet ved behandlingen",
    source: "Notion / Sikkerhet / Informasjonssikkerhetspolicy",
    at: "I dag 09:12",
    confirmed: false,
    documentId: "ntn-4f21c8",
    hash: "sha256:9c1a…7e04",
    agentVersion: "0.9.2",
  },
  {
    id: "f2",
    requirement: "Art. 30 – Protokoll over behandlingsaktiviteter",
    source: "Notion / Compliance / ROPA",
    at: "I dag 09:12",
    confirmed: false,
    documentId: "ntn-8b03da",
    hash: "sha256:41f7…b2a9",
    agentVersion: "0.9.2",
  },
  {
    id: "f3",
    requirement: "A.5.10 – Akseptabel bruk av informasjon",
    source: "Notion / HR / Retningslinjer",
    at: "I går 16:40",
    confirmed: true,
    documentId: "ntn-1e77aa",
    hash: "sha256:d38c…5510",
    agentVersion: "0.9.1",
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
