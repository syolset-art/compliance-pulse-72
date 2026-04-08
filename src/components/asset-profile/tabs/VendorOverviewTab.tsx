import { ValidationTab } from "./ValidationTab";
import { ControlsTab } from "./ControlsTab";
import { RelationsTab } from "./RelationsTab";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface VendorOverviewTabProps {
  assetId: string;
}

export const VendorOverviewTab = ({ assetId }: VendorOverviewTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isNb ? "Validering fra Mynder" : "Validation from Mynder"}
        </h3>
        <ValidationTab assetId={assetId} />
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isNb ? "Kontroller" : "Controls"}
        </h3>
        <ControlsTab assetId={assetId} />
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isNb ? "Relasjoner" : "Relations"}
        </h3>
        <RelationsTab assetId={assetId} />
      </section>
    </div>
  );
};
