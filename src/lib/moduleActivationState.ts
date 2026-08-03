// Lokal persistering av modulstatus og valgt nivå.
// Mynder Core er basismodulen og regnes som aktiv med mindre den er
// eksplisitt deaktivert i Produkter (Innstillinger).

const KEY = "mynder_module_state";
const LEGACY_KEY = "mynder_deactivated_modules";

export type ModuleLifecycle = "active" | "pending_cancellation" | "inactive";

export interface ModuleState {
  status: ModuleLifecycle;
  /** ISO-dato for når oppsigelsen trer i kraft. */
  cancelAt?: string;
  /** Valgt nivå (tier) for moduler som har nivåer. */
  tierId?: string;
}

export type ModuleStateMap = Record<string, ModuleState>;

function emit() {
  window.dispatchEvent(new CustomEvent("modules:changed"));
}

/** Siste dag i inneværende måned — når en oppsigelse trer i kraft. */
export function getPeriodEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

export function formatPeriodEnd(iso?: string): string {
  const d = iso ? new Date(iso) : getPeriodEnd();
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function getModuleStates(): ModuleStateMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ModuleStateMap;
      }
    }
    // Bakoverkompatibel lesing av gammel liste over deaktiverte moduler
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr)) {
        const map: ModuleStateMap = {};
        arr.forEach((id: string) => {
          map[id] = { status: "inactive" };
        });
        return map;
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}

function save(map: ModuleStateMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  emit();
}

export function getModuleState(id: string): ModuleState {
  return getModuleStates()[id] ?? { status: "active" };
}

export function getModuleStatus(id: string): ModuleLifecycle {
  return getModuleState(id).status;
}

function patch(id: string, next: Partial<ModuleState>) {
  const map = getModuleStates();
  map[id] = { ...(map[id] ?? { status: "active" }), ...next };
  save(map);
  return map;
}

/** Sier opp modulen — den er aktiv til periodeslutt. */
export function cancelModule(id: string): string {
  const cancelAt = getPeriodEnd().toISOString();
  patch(id, { status: "pending_cancellation", cancelAt });
  return cancelAt;
}

/** Angrer en oppsigelse. */
export function resumeModule(id: string) {
  patch(id, { status: "active", cancelAt: undefined });
}

/** Aktiverer en inaktiv modul. */
export function activateModule(id: string) {
  patch(id, { status: "active", cancelAt: undefined });
}

/** Deaktiverer umiddelbart (brukes når perioden er passert). */
export function deactivateModule(id: string) {
  patch(id, { status: "inactive", cancelAt: undefined });
}

export function getModuleTier(id: string): string | undefined {
  return getModuleState(id).tierId;
}

export function setModuleTier(id: string, tierId: string) {
  patch(id, { tierId });
}

/** Moduler som ikke lenger er tilgjengelige (oppsigelsen har trådt i kraft). */
export function getDeactivatedModules(): Set<string> {
  const map = getModuleStates();
  const now = Date.now();
  const ids = new Set<string>();
  Object.entries(map).forEach(([id, state]) => {
    if (state.status === "inactive") ids.add(id);
    if (
      state.status === "pending_cancellation" &&
      state.cancelAt &&
      new Date(state.cancelAt).getTime() < now
    ) {
      ids.add(id);
    }
  });
  return ids;
}

export function isModuleDeactivated(id: string): boolean {
  return getDeactivatedModules().has(id);
}
