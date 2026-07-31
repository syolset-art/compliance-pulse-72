// Lokal persistering av hvilke moduler brukeren har deaktivert.
// Mynder Core er basismodulen og regnes som aktiv med mindre den er
// eksplisitt deaktivert i Produkter (Innstillinger).

const KEY = "mynder_deactivated_modules";

export function getDeactivatedModules(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveDeactivatedModules(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("modules:changed"));
}

export function isModuleDeactivated(id: string): boolean {
  return getDeactivatedModules().has(id);
}
