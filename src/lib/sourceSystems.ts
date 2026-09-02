/**
 * Katalog over kildesystemer Mynder kan koble seg til.
 * Tilkoblingsstatus lagres lokalt inntil ekte OAuth per leverandør er på plass.
 */

export type SourceCategory = "documents" | "identity" | "collaboration" | "cloud";

export interface SourceSystem {
  id: string;
  name: string;
  category: SourceCategory;
  descriptionNb: string;
  descriptionEn: string;
}

export const SOURCE_SYSTEMS: SourceSystem[] = [
  {
    id: "microsoft365",
    name: "Microsoft 365",
    category: "identity",
    descriptionNb: "Kartlegger brukere, apper og tjenester i Entra ID og Microsoft 365.",
    descriptionEn: "Maps users, apps and services in Entra ID and Microsoft 365.",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "identity",
    descriptionNb: "Finner tilknyttede apper, delte enheter og tredjepartstilganger.",
    descriptionEn: "Finds connected apps, shared drives and third-party access.",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    category: "documents",
    descriptionNb: "Leser policyer, avtaler og rutiner fra dokumentbiblioteker.",
    descriptionEn: "Reads policies, agreements and routines from document libraries.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "documents",
    descriptionNb: "Henter dokumentasjon fra mapper du gir Mynder tilgang til.",
    descriptionEn: "Retrieves documentation from folders you grant access to.",
  },
  {
    id: "notion",
    name: "Notion",
    category: "collaboration",
    descriptionNb: "Leser interne rutiner og styrende dokumenter i arbeidsområdet.",
    descriptionEn: "Reads internal routines and governing documents in the workspace.",
  },
  {
    id: "confluence",
    name: "Confluence",
    category: "collaboration",
    descriptionNb: "Henter prosessbeskrivelser og styringsdokumenter fra spaces.",
    descriptionEn: "Retrieves process descriptions and governance docs from spaces.",
  },
  {
    id: "aws",
    name: "AWS",
    category: "cloud",
    descriptionNb: "Kartlegger driftsmiljøer og tjenester som behandler data.",
    descriptionEn: "Maps environments and services that process data.",
  },
  {
    id: "azure",
    name: "Azure",
    category: "cloud",
    descriptionNb: "Kartlegger abonnementer, ressurser og datalokasjon.",
    descriptionEn: "Maps subscriptions, resources and data location.",
  },
];

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, { nb: string; en: string }> = {
  documents: { nb: "Dokumenter", en: "Documents" },
  identity: { nb: "Identitet og brukere", en: "Identity and users" },
  collaboration: { nb: "Samarbeid", en: "Collaboration" },
  cloud: { nb: "Sky og drift", en: "Cloud and operations" },
};

export interface SourceConnection {
  sourceId: string;
  connectedAt: string;
  lastSyncedAt: string;
}

const STORAGE_KEY = "mynder.sourceConnections";
export const SOURCE_CONNECTIONS_EVENT = "mynder:source-connections";

export function listSourceConnections(): SourceConnection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SourceConnection[]) : [];
  } catch {
    return [];
  }
}

function persist(rows: SourceConnection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(SOURCE_CONNECTIONS_EVENT));
}

export function connectSource(sourceId: string) {
  const now = new Date().toISOString();
  const rows = listSourceConnections().filter((r) => r.sourceId !== sourceId);
  rows.push({ sourceId, connectedAt: now, lastSyncedAt: now });
  persist(rows);
}

export function syncSource(sourceId: string) {
  const rows = listSourceConnections().map((r) =>
    r.sourceId === sourceId ? { ...r, lastSyncedAt: new Date().toISOString() } : r
  );
  persist(rows);
}

export function disconnectSource(sourceId: string) {
  persist(listSourceConnections().filter((r) => r.sourceId !== sourceId));
}

export function formatRelative(iso: string, isNb: boolean): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return isNb ? "nå nettopp" : "just now";
  if (diffMin < 60) return isNb ? `for ${diffMin} min siden` : `${diffMin} min ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return isNb ? `for ${h} t siden` : `${h} h ago`;
  const d = Math.round(h / 24);
  return isNb ? `for ${d} d siden` : `${d} d ago`;
}
