import { Building2 } from "lucide-react";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useTranslation } from "react-i18next";

export function OrganizationContextBanner() {
  const { activeOrg } = useActiveOrganization();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  if (!activeOrg) return null;

  const formattedOrg = activeOrg.orgNumber
    ? activeOrg.orgNumber.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")
    : null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Building2 className="h-4 w-4 shrink-0" />
      <span>
        {isNb ? "Innstillinger for" : "Settings for"}{" "}
        <span className="font-semibold text-foreground">{activeOrg.name}</span>
        {formattedOrg && (
          <span className="ml-1 text-muted-foreground/70">
            (org. {formattedOrg})
          </span>
        )}
      </span>
    </div>
  );
}
