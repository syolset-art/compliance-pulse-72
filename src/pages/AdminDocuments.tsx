import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDocuments() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const isNb = i18n.language === "nb";

  const content = (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isNb ? "Dokumenter" : "Documents"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNb
            ? "Administrer policyer, prosedyrer og styringsdokumenter for organisasjonen"
            : "Manage policies, procedures and governance documents for the organization"}
        </p>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isNb ? "Dokumentbiblioteket kommer snart" : "Document library coming soon"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isNb
              ? "Her vil du kunne laste opp, organisere og dele policyer, prosedyrer og andre styringsdokumenter."
              : "Here you'll be able to upload, organize and share policies, procedures and other governance documents."}
          </p>
          <Button variant="outline" className="mt-6 gap-2" disabled>
            <Upload className="h-4 w-4" />
            {isNb ? "Last opp dokument" : "Upload document"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto md:pt-11">{content}</main>
    </div>
  );
}
