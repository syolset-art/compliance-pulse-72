import { Sidebar } from "@/components/Sidebar";
import { ComplianceCalendarSection } from "@/components/widgets/ComplianceCalendarSection";
import { useTranslation } from "react-i18next";

const ComplianceCalendar = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("nav.complianceCalendar", "Årshjul")}
            </h1>
            <p className="text-muted-foreground mt-1">
              Planlegg og følg opp compliance-aktiviteter gjennom året
            </p>
          </div>
          <ComplianceCalendarSection />
        </div>
      </main>
    </div>
  );
};

export default ComplianceCalendar;
