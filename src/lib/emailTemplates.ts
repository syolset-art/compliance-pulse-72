import { EmailLanguage } from "@/components/email/EmailLayout";

export type EmailTemplateType = "offer" | "vendor_trust_profile" | "customer_profile";

export interface DefaultEmailTemplate {
  type: EmailTemplateType;
  language: EmailLanguage;
  title: string;
  description: string;
  subject: string;
  body: string;
  cta_text: string;
  cta_url: string;
}

export const TEMPLATE_META: Record<EmailTemplateType, { titleNo: string; titleEn: string; descNo: string; descEn: string }> = {
  offer: {
    titleNo: "Tilbud",
    titleEn: "Offer",
    descNo: "Send tilbud om aktivering av Trust Profile til en ny kunde.",
    descEn: "Send an activation offer for Trust Profile to a new customer.",
  },
  vendor_trust_profile: {
    titleNo: "Trust Profile (leverandør)",
    titleEn: "Trust Profile (vendor)",
    descNo: "Invitér en leverandør til å fylle ut sin Trust Profile.",
    descEn: "Invite a vendor to complete their Trust Profile.",
  },
  customer_profile: {
    titleNo: "Kunde Profile",
    titleEn: "Customer Profile",
    descNo: "Del kundens Trust Profile og status med en interessent.",
    descEn: "Share the customer's Trust Profile and status with a stakeholder.",
  },
};

export const DEFAULT_TEMPLATES: DefaultEmailTemplate[] = [
  {
    type: "offer",
    language: "no",
    title: TEMPLATE_META.offer.titleNo,
    description: TEMPLATE_META.offer.descNo,
    subject: "Aktivér Trust Profile for {{organisasjon}}",
    body: `Hei {{navn}},

Vi har satt opp en Trust Profile for {{organisasjon}} i Mynder. Profilen samler dokumentasjon, sikkerhetsstatus og leverandøroversikt på ett sted — slik at dere enkelt kan dele den med kunder, revisorer og partnere.

Trykk på knappen under for å se forslaget og aktivere profilen.`,
    cta_text: "Se tilbudet",
    cta_url: "https://mynder.no/aktiver",
  },
  {
    type: "offer",
    language: "en",
    title: TEMPLATE_META.offer.titleEn,
    description: TEMPLATE_META.offer.descEn,
    subject: "Activate Trust Profile for {{organization}}",
    body: `Hi {{name}},

We've prepared a Trust Profile for {{organization}} in Mynder. It gathers documentation, security status and vendor overview in one place — so you can easily share it with customers, auditors and partners.

Click the button below to review the proposal and activate the profile.`,
    cta_text: "Review offer",
    cta_url: "https://mynder.no/activate",
  },
  {
    type: "vendor_trust_profile",
    language: "no",
    title: TEMPLATE_META.vendor_trust_profile.titleNo,
    description: TEMPLATE_META.vendor_trust_profile.descNo,
    subject: "{{kunde}} ber om å se Trust Profile for {{organisasjon}}",
    body: `Hei {{navn}},

{{kunde}} bruker Mynder for å holde oversikt over sine leverandører og samarbeidspartnere. For å fullføre vurderingen av {{organisasjon}} trenger de innsyn i deres Trust Profile.

Det tar ca. 10 minutter å fylle ut profilen. Du kan gjenbruke svarene mot alle dine kunder.`,
    cta_text: "Fyll ut Trust Profile",
    cta_url: "https://mynder.no/leverandor",
  },
  {
    type: "vendor_trust_profile",
    language: "en",
    title: TEMPLATE_META.vendor_trust_profile.titleEn,
    description: TEMPLATE_META.vendor_trust_profile.descEn,
    subject: "{{customer}} requests your Trust Profile for {{organization}}",
    body: `Hi {{name}},

{{customer}} uses Mynder to keep track of vendors and partners. To complete the assessment of {{organization}} they need access to your Trust Profile.

It takes about 10 minutes to complete. You can reuse your answers across all your customers.`,
    cta_text: "Complete Trust Profile",
    cta_url: "https://mynder.no/vendor",
  },
  {
    type: "customer_profile",
    language: "no",
    title: TEMPLATE_META.customer_profile.titleNo,
    description: TEMPLATE_META.customer_profile.descNo,
    subject: "Trust Profile delt: {{organisasjon}}",
    body: `Hei {{navn}},

{{avsender}} har delt Trust Profile for {{organisasjon}} med deg. Profilen inneholder oppdatert dokumentasjon, sertifiseringer og status på sentrale kontroller.

Lenken er gyldig så lenge profilen er aktiv hos {{organisasjon}}.`,
    cta_text: "Åpne Trust Profile",
    cta_url: "https://mynder.no/profil",
  },
  {
    type: "customer_profile",
    language: "en",
    title: TEMPLATE_META.customer_profile.titleEn,
    description: TEMPLATE_META.customer_profile.descEn,
    subject: "Trust Profile shared: {{organization}}",
    body: `Hi {{name}},

{{sender}} has shared the Trust Profile for {{organization}} with you. It contains up-to-date documentation, certifications and the status of key controls.

The link remains valid as long as the profile is active at {{organization}}.`,
    cta_text: "Open Trust Profile",
    cta_url: "https://mynder.no/profile",
  },
];

export function getDefaultTemplate(type: EmailTemplateType, language: EmailLanguage): DefaultEmailTemplate {
  return (
    DEFAULT_TEMPLATES.find((t) => t.type === type && t.language === language) ??
    DEFAULT_TEMPLATES.find((t) => t.type === type)!
  );
}
