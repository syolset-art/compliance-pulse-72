import { EmailLanguage } from "@/components/email/EmailLayout";

export type EmailTemplateType = "offer" | "vendor_trust_profile" | "customer_profile" | "customer_profile_invitation";

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
  customer_profile_invitation: {
    titleNo: "Kunde Profile – invitasjon",
    titleEn: "Customer Profile – invitation",
    descNo: "Invitér en kunde til å overta og verifisere sin Trust Profile.",
    descEn: "Invite a customer to claim and verify their Trust Profile.",
  },
};

export const DEFAULT_TEMPLATES: DefaultEmailTemplate[] = [
  {
    type: "offer",
    language: "no",
    title: TEMPLATE_META.offer.titleNo,
    description: TEMPLATE_META.offer.descNo,
    subject: "Tilbud fra {{avsender_selskap}} – klart for godkjenning",
    body: `Hei {{kontaktnavn}},

Vedlagt finner du tilbudet vi har utarbeidet for {{kunde_selskap}}. PDF-en beskriver leveranse, omfang, tidslinje og pris.

Du godkjenner enkelt ved å svare «OK» på denne e-posten – så setter vi i gang leveransen umiddelbart. Har du spørsmål eller ønsker justeringer, svarer du bare her.`,
    cta_text: "Godkjenn tilbud →",
    cta_url: "https://mynder.no/godkjenn-tilbud",
  },
  {
    type: "offer",
    language: "en",
    title: TEMPLATE_META.offer.titleEn,
    description: TEMPLATE_META.offer.descEn,
    subject: "Your proposal from {{avsender_selskap}} – ready for approval",
    body: `Hi {{kontaktnavn}},

Please find attached the proposal we've prepared for {{kunde_selskap}}. The PDF covers the scope of delivery, timeline and pricing.

To approve, simply reply "OK" to this email and we'll begin delivery right away. If you have any questions or would like adjustments, just reply here.`,
    cta_text: "Approve proposal →",
    cta_url: "https://mynder.no/approve-proposal",
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
  {
    type: "customer_profile_invitation",
    language: "no",
    title: TEMPLATE_META.customer_profile_invitation.titleNo,
    description: TEMPLATE_META.customer_profile_invitation.descNo,
    subject: "{{avsender_selskap}} har opprettet en Trust Profile for {{mottaker_selskap}}",
    body: `Hei {{kontaktnavn}},

Din leverandør {{avsender_selskap}} har opprettet en Trust Profile for {{mottaker_selskap}} i Mynder.

Bakgrunnen er å kartlegge din personvernpraksis og dokumentere sikkerhetsnivået i samarbeidet vårt.

Profilen viser i dag en compliance-modenhet basert på offentlig tilgjengelig informasjon. Ved å overta profilen kan dere verifisere opplysningene selv og øke scoren – og samtidig dokumentere kontroll overfor kunder, bank og revisor med én delt, verifisert status.`,
    cta_text: "Overta profilen →",
    cta_url: "https://mynder.no/profil",
  },
  {
    type: "customer_profile_invitation",
    language: "en",
    title: TEMPLATE_META.customer_profile_invitation.titleEn,
    description: TEMPLATE_META.customer_profile_invitation.descEn,
    subject: "{{avsender_selskap}} has created a Trust Profile for {{mottaker_selskap}}",
    body: `Hi {{kontaktnavn}},

Your supplier {{avsender_selskap}} has created a Trust Profile for {{mottaker_selskap}} in Mynder.

The purpose is to map your privacy practices and document the security posture of our collaboration.

The profile currently shows a compliance maturity score based on publicly available information. By claiming the profile, you can verify the details yourself and raise the score – and document control toward customers, banks and auditors with one shared, verified status.`,
    cta_text: "Claim the profile →",
    cta_url: "https://mynder.no/profile",
  },
];

export function getDefaultTemplate(type: EmailTemplateType, language: EmailLanguage): DefaultEmailTemplate {
  return (
    DEFAULT_TEMPLATES.find((t) => t.type === type && t.language === language) ??
    DEFAULT_TEMPLATES.find((t) => t.type === type)!
  );
}
