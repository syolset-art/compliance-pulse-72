/**
 * Prototypelagring for dokumentstyring: brukerens overstyring av dokumentklasse,
 * eier/ansvarlig og neste gjennomgang. Lagres i localStorage inntil dette
 * eventuelt flyttes til databasen.
 */

import type { HubDocClass } from "@/lib/documentHub";

const KEY = "mynder.documentHub.governance";

export interface DocGovernance {
  docClass?: HubDocClass;
  owner?: string;
  nextReview?: string;
}

type Store = Record<string, DocGovernance>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

export function readDocGovernance(): Store {
  return readStore();
}

export function getDocGovernance(docId: string): DocGovernance {
  return readStore()[docId] ?? {};
}

export function setDocGovernance(docId: string, patch: DocGovernance): Store {
  const store = readStore();
  store[docId] = { ...store[docId], ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* prototypelagring — stille feil er greit */
  }
  return { ...store };
}
