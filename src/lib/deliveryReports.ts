// Lightweight in-memory + localStorage store for delivery reports sent to customer.
// Used by the MSP "Pågående oppdrag" tab (partner generates+sends) and the
// "Meldinger"-tab (partner sees approvals coming back from customer).
// NOTE: This is presentation/demo state only. Replace with Supabase persistence later.

export type DeliveryReportStatus = "sent" | "approved" | "declined";

export interface DeliveryReport {
  id: string;
  deliveryId: string;
  deliveryTitle: string;
  frameworkLabel?: string;
  fileName: string;
  message?: string;
  customerName: string;
  customerEmail?: string;
  sentAt: string;
  status: DeliveryReportStatus;
  approvedAt?: string;
  approvedBy?: string;
  controlIds: string[];
  activitiesCount: number;
  evidenceCount: number;
  maturityDeltaPercent?: number;
}

const STORAGE_KEY = "msp.delivery-reports.v1";
const EVENT_NAME = "msp:delivery-reports-changed";

function load(): DeliveryReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeliveryReport[]) : [];
  } catch {
    return [];
  }
}

function save(reports: DeliveryReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getDeliveryReports(): DeliveryReport[] {
  return load();
}

export function addDeliveryReport(report: DeliveryReport) {
  const all = load();
  save([report, ...all.filter((r) => r.id !== report.id)]);
}

export function updateDeliveryReport(
  id: string,
  patch: Partial<DeliveryReport>,
) {
  const all = load().map((r) => (r.id === id ? { ...r, ...patch } : r));
  save(all);
}

export function subscribeDeliveryReports(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
