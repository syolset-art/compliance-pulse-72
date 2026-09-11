import { MessageSquare, FileCheck, TrendingDown, Clock, Shield, BadgeCheck } from "lucide-react";

/**
 * Varselhendelser for partnerbrukere. Kategoriene speiler aktivitetene vi
 * allerede logger på kunder (se MSPMynderSignalsFeed), slik at varsler og
 * aktivitetslogg holdes i takt.
 */
export interface PartnerNotificationEvent {
  /** Lagres som notification_type i notification_preferences */
  key: string;
  label: string;
  description: string;
  Icon: React.ComponentType<any>;
}

export const PARTNER_NOTIFICATION_EVENTS: PartnerNotificationEvent[] = [
  {
    key: "partner.customer_message",
    label: "Ny melding eller svar fra kunde",
    description: "Kunden svarer på en henvendelse eller sender en ny melding.",
    Icon: MessageSquare,
  },
  {
    key: "partner.offer_accepted",
    label: "Tilbud akseptert eller avslått",
    description: "Kunden tar stilling til et tilbud du har sendt.",
    Icon: BadgeCheck,
  },
  {
    key: "partner.risk_change",
    label: "Risiko- eller modenhetsendring",
    description: "Modenhet faller eller ny risiko oppdages hos kunden.",
    Icon: TrendingDown,
  },
  {
    key: "partner.document",
    label: "Ny eller utløpt dokumentasjon",
    description: "Kunden laster opp dokumentasjon, eller dokumentasjon går ut på dato.",
    Icon: FileCheck,
  },
  {
    key: "partner.deadline",
    label: "Frist nærmer seg eller er oversittet",
    description: "Frister på oppgaver, krav eller leveranser hos kunden.",
    Icon: Clock,
  },
  {
    key: "partner.control_status",
    label: "Kontroll eller krav endrer status",
    description: "Et krav blir dokumentert, avvist eller endrer samsvarsstatus.",
    Icon: Shield,
  },
];

/** Hovedbryter: alle varsler av/på */
export const PARTNER_NOTIFICATIONS_MASTER_KEY = "partner.notifications";
/** Leveringsform: på = daglig oppsummering, av = straks */
export const PARTNER_NOTIFICATIONS_DIGEST_KEY = "partner.digest";
