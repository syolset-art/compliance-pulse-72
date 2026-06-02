// Lett localStorage-basert aktivitetslogg for partner-handlinger (demo).
// Skal flyttes til database-tabell `partner_activities` når MSP-flowen modnes.

export type PartnerActivityKind =
  | "evidence_uploaded"
  | "document_requested"
  | "gap_analysis_started"
  | "assessment_started"
  | "lara_recommendation_requested"
  | "offer_created"
  | "message_sent"
  | "followup_scheduled";

export interface PartnerActivity {
  id: string;
  customerId: string;
  kind: PartnerActivityKind;
  title: string;
  note?: string;
  createdAt: string;
}

const KEY = (customerId: string) => `msp.partnerActivityLog.${customerId}`;

export function getPartnerActivities(customerId: string): PartnerActivity[] {
  try {
    const raw = localStorage.getItem(KEY(customerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logPartnerActivity(
  customerId: string,
  kind: PartnerActivityKind,
  title: string,
  note?: string,
): PartnerActivity {
  const item: PartnerActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    customerId,
    kind,
    title,
    note,
    createdAt: new Date().toISOString(),
  };
  try {
    const list = getPartnerActivities(customerId);
    list.unshift(item);
    localStorage.setItem(KEY(customerId), JSON.stringify(list.slice(0, 50)));
  } catch {}
  return item;
}
