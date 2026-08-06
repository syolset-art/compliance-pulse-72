// Lokal persistering av modulstatus og valgt nivå.
// Mynder Core er basismodulen og regnes som aktiv med mindre den er
// eksplisitt deaktivert i Produkter (Innstillinger).

const KEY = "mynder_module_state";
const LEGACY_KEY = "mynder_deactivated_modules";

export type ModuleLifecycle = "active" | "pending_cancellation" | "inactive";

export type CancellationDataChoice = "download" | "transfer" | "retain";

export interface CancellationMeta {
  reason: string;
  reasonNote?: string;
  competitor?: string;
  dataChoice: CancellationDataChoice;
  transferEmail?: string;
  /** ISO-dato for når data slettes permanent. */
  retentionUntil?: string;
}

export interface ModuleState {
  status: ModuleLifecycle;
  /** ISO-dato for når oppsigelsen trer i kraft. */
  cancelAt?: string;
  /** Valgt nivå (tier) for moduler som har nivåer. */
  tierId?: string;
  /** Planlagt nedgradering til dette nivået. */
  scheduledTierId?: string;
  /** ISO-dato for når den planlagte nedgraderingen trer i kraft. */
  scheduledAt?: string;
  /** Detaljer registrert ved oppsigelse. */
  cancellation?: CancellationMeta;
}

/** Standard oppbevaringstid etter at oppsigelsen trer i kraft. */
export const RETENTION_DAYS = 90;

export function getRetentionUntil(effectiveAt?: string | Date): Date {
  const base = effectiveAt ? new Date(effectiveAt) : getPeriodEnd();
  return new Date(base.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export function formatDateLong(iso?: string | Date): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
export function cancelModule(id: string, meta?: CancellationMeta): string {
  const cancelAt = getPeriodEnd().toISOString();
  patch(id, {
    status: "pending_cancellation",
    cancelAt,
    cancellation: meta
      ? { ...meta, retentionUntil: meta.retentionUntil ?? getRetentionUntil(cancelAt).toISOString() }
      : undefined,
  });
  return cancelAt;
}

/** Angrer en oppsigelse. */
export function resumeModule(id: string) {
  patch(id, { status: "active", cancelAt: undefined, cancellation: undefined });
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
  patch(id, { tierId, scheduledTierId: undefined, scheduledAt: undefined });
}

/** Planlegger en nedgradering fra neste fakturaperiode. */
export function scheduleModuleTier(id: string, tierId: string, effectiveAt?: string): string {
  const scheduledAt = effectiveAt ?? getPeriodEnd().toISOString();
  patch(id, { scheduledTierId: tierId, scheduledAt });
  return scheduledAt;
}

/** Angrer en planlagt nedgradering. */
export function clearScheduledTier(id: string) {
  patch(id, { scheduledTierId: undefined, scheduledAt: undefined });
}

export function getScheduledTier(id: string): { tierId: string; at: string } | null {
  const state = getModuleState(id);
  if (!state.scheduledTierId || !state.scheduledAt) return null;
  return { tierId: state.scheduledTierId, at: state.scheduledAt };
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
