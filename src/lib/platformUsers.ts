/**
 * Platform users — sentralt register over personer som er brukere i plattformen.
 * Brukes f.eks. når Lara må vite hvem hos oss som skal eie en oppfølging.
 *
 * Demo-data inntil vi henter fra `auth.users` / team-medlemmer i backend.
 */

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabelNb?: string;
  roleLabelEn?: string;
}

export const PLATFORM_USERS: PlatformUser[] = [
  { id: "1", name: "Kari Nordmann", email: "kari@acme.no", role: "admin", roleLabelNb: "Administrator", roleLabelEn: "Administrator" },
  { id: "2", name: "Synne Olsetten", email: "synne@acme.no", role: "compliance_officer", roleLabelNb: "Compliance-ansvarlig", roleLabelEn: "Compliance Officer" },
  { id: "3", name: "Sebastian Hernandez", email: "sebastian@acme.no", role: "ciso", roleLabelNb: "CISO", roleLabelEn: "CISO" },
  { id: "4", name: "Samti Ahmed", email: "samti@acme.no", role: "dpo", roleLabelNb: "DPO", roleLabelEn: "DPO" },
  { id: "5", name: "Truls Kristoffersen", email: "truls@acme.no", role: "data_controller", roleLabelNb: "Behandlingsansvarlig", roleLabelEn: "Data Controller" },
  { id: "6", name: "Synnøve Olset", email: "synnove@acme.no", role: "it_manager", roleLabelNb: "IT-ansvarlig", roleLabelEn: "IT Manager" },
];

export function getPlatformUsers(): PlatformUser[] {
  return PLATFORM_USERS;
}
