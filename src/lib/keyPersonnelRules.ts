export type RoleStatus = "required" | "recommended" | "optional" | "hidden";

export interface KeyRole {
  id: "compliance" | "dpo" | "ciso";
  label: string;
  nameField: string;
  emailField: string;
  status: RoleStatus;
  reason?: string;
}

const parseEmployeeCount = (employees: string): number => {
  if (!employees) return 0;
  const match = employees.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  // For ranges like "201-500", use the lower bound
  if (employees === "1000+") return 1000;
  return num;
};

export function getRequiredRoles(industry: string, employees: string): KeyRole[] {
  const count = parseEmployeeCount(employees);
  const ind = industry.toLowerCase();
  const roles: KeyRole[] = [];

  // Compliance officer — always required
  roles.push({
    id: "compliance",
    label: "Compliance-ansvarlig",
    nameField: "compliance_officer",
    emailField: "compliance_officer_email",
    status: "required",
  });

  // DPO logic
  let dpoStatus: RoleStatus = "optional";
  let dpoReason: string | undefined;

  if (["helse", "offentlig"].includes(ind) && count >= 50) {
    dpoStatus = "required";
    dpoReason =
      ind === "helse"
        ? "Helseforetak som behandler helseopplysninger er pålagt å ha personvernombud"
        : "Offentlige virksomheter med over 50 ansatte er pålagt å ha personvernombud";
  } else if (ind === "finans" && count >= 50) {
    dpoStatus = "recommended";
    dpoReason = "Anbefalt for finansvirksomheter med over 50 ansatte";
  } else if (count >= 200) {
    dpoStatus = "recommended";
    dpoReason = "Anbefalt for virksomheter med over 200 ansatte";
  }

  roles.push({
    id: "dpo",
    label: "Personvernombud (DPO)",
    nameField: "dpo_name",
    emailField: "dpo_email",
    status: dpoStatus,
    reason: dpoReason,
  });

  // CISO logic
  let cisoStatus: RoleStatus = "hidden";
  let cisoReason: string | undefined;

  if (count >= 200 || ["helse", "finans", "offentlig"].includes(ind)) {
    cisoStatus = "recommended";
    cisoReason = "Anbefalt for virksomheter i denne bransjen eller med over 200 ansatte";
  } else if (count >= 50) {
    cisoStatus = "optional";
  }

  roles.push({
    id: "ciso",
    label: "Sikkerhetsansvarlig (CISO)",
    nameField: "ciso_name",
    emailField: "ciso_email",
    status: cisoStatus,
    reason: cisoReason,
  });

  return roles;
}
