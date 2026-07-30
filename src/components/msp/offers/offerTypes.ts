export type OfferLifecycle = "draft" | "sent" | "accepted" | "declined";

export interface OfferApproval {
  approvedBy: string;
  approverRole?: string;
  method: "E-post" | "E-signatur" | "Muntlig" | "Portal";
  date: string; // ISO or yyyy-mm-dd
  reference?: string;
}

export interface OfferTaskLine {
  label: string;
  hours: number;
}

export interface PartnerOffer {
  id: string;
  offerNumber: string;
  serviceTitle: string;
  frameworkLabel?: string;
  createdAt: string; // ISO
  createdBy: string;
  taskCount: number;
  totalHours: number;
  totalPrice: number;
  hourlyRate?: number;
  /** Livssyklus for tilbudet. */
  offerState: OfferLifecycle;
  sentAt?: string;
  respondedAt?: string;
  approval?: OfferApproval;
  declineReason?: string;
  tasks?: OfferTaskLine[];
  attachmentLabel?: string;
}

export function formatOfferDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}
