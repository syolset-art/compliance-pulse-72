import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, BarChart3, FileCheck, Archive, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface RegulationsSubPageProps {
  variant: "gap-analysis" | "measurements" | "evidence" | "archive";
}

const META = {
  "gap-analysis": {
    icon: GitCompare,
    titleNb: "Gapanalyse",
    titleEn: "Gap analysis",
    descNb:
      "Sammenlign organisasjonens nåværende modenhet med kravene i hvert aktive regelverk og finn de største mangelene.",
    descEn:
      "Compare your current maturity with the requirements of each active framework and find the largest gaps.",
  },
  measurements: {
    icon: BarChart3,
    titleNb: "Målinger",
    titleEn: "Measurements",
    descNb:
      "Kvantitative måltall per regelverk: oppfyllelsesgrad, automatiseringsgrad og endring over tid.",
    descEn:
      "Quantitative metrics per framework: fulfilment rate, automation rate and change over time.",
  },
  evidence: {
    icon: FileCheck,
    titleNb: "Evidens",
    titleEn: "Evidence",
    descNb:
      "Samlet visning av all dokumentasjon og bevis som er knyttet til kravene i de aktive regelverkene.",
    descEn:
      "Aggregated view of all documentation and evidence linked to requirements across active frameworks.",
  },
  archive: {
    icon: Archive,
    titleNb: "Arkiv",
    titleEn: "Archive",
    descNb:
      "Historiske vurderinger, utgåtte rammeverk og arkiverte kravsett. Bevares for revisjonsformål.",
    descEn:
      "Historical assessments, retired frameworks and archived requirement sets. Retained for audit purposes.",
  },
} as const;

const RegulationsSubPage = ({ variant }: RegulationsSubPageProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const meta = META[variant];
  const Icon = meta.icon;

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/regulations")}
        className="mb-4 gap-1.5 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {isNb ? "Tilbake til Regelverk" : "Back to Regulations"}
      </Button>

      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            {isNb ? meta.titleNb : meta.titleEn}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {isNb ? meta.descNb : meta.descEn}
          </p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">
            {isNb ? "Kommer snart" : "Coming soon"}
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            {isNb
              ? "Denne visningen er under utvikling. Du finner aktive regelverk og krav i hovedvisningen for Regelverk."
              : "This view is under construction. You can find active frameworks and requirements in the main Regulations view."}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">
          {content}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
        {content}
      </main>
    </div>
  );
};

export default RegulationsSubPage;
