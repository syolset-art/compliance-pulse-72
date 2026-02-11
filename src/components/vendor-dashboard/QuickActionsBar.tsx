import { Plus, Sparkles, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface QuickActionsBarProps {
  onAddVendor: () => void;
  onDiscoverAI: () => void;
  pendingReviewCount?: number;
}

export function QuickActionsBar({ onAddVendor, onDiscoverAI, pendingReviewCount = 0 }: QuickActionsBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onAddVendor} className="gap-2">
        <Plus className="h-4 w-4" />
        {t("vendorDashboard.addVendor", "Add Vendor")}
      </Button>
      <Button variant="outline" onClick={onDiscoverAI} className="gap-2">
        <Sparkles className="h-4 w-4" />
        {t("vendorDashboard.discoverAI", "Discover with AI")}
      </Button>
      {pendingReviewCount > 0 && (
        <Button variant="outline" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          {t("vendorDashboard.reviewPending", "Review Pending")}
          <span className="ml-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
            {pendingReviewCount}
          </span>
        </Button>
      )}
    </div>
  );
}
