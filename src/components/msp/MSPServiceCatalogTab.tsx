import { MSPFrameworkHoursTab } from "./MSPFrameworkHoursTab";

export function MSPServiceCatalogTab({
  onOpenSecondary,
  onRegisterActions,
}: {
  onOpenSecondary?: (view: "settings" | "how-it-works") => void;
  onRegisterActions?: (actions: { openWizard: () => void }) => void;
} = {}) {
  // Props beholdes for kompatibilitet med vertskomponenten; arkfanene Mine/Alle og
  // tjenestekatalog-innholdet er fjernet fullstendig etter TCK-opprydding.
  void onOpenSecondary;
  void onRegisterActions;

  return (
    <div className="space-y-6">
      <MSPFrameworkHoursTab />
    </div>
  );
}
