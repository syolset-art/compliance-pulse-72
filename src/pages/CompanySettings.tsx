import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MaturityProgressCard } from "@/components/company/MaturityProgressCard";
import { MilestoneTimeline } from "@/components/company/MilestoneTimeline";
import { CompanyInfoForm } from "@/components/company/CompanyInfoForm";
import { Sidebar } from "@/components/Sidebar";

export default function CompanySettings() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-11">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Selskapsinformasjon</h1>
              <p className="text-muted-foreground text-sm">Basisinformasjon og kontaktperson for din organisasjon</p>
            </div>
          </div>

          {/* Maturity Progress Card */}
          <MaturityProgressCard />

          {/* Company Info — shared component */}
          <CompanyInfoForm showEditControls />

          {/* Milestones Timeline */}
          <MilestoneTimeline />

          {/* Info Section */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tips:</strong> Selskapsinformasjonen brukes til å tilpasse Mynder til din organisasjon.
                Jo mer nøyaktig informasjon, desto bedre kan vi hjelpe deg med compliance-arbeidet. Denne informasjonen brukes også i din Trust Profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
