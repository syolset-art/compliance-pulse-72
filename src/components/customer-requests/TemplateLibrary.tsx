import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getSavedTemplates, removeTemplate, type SavedTemplate } from "./SendRequestWizard";

const REQUEST_TYPE_LABELS: Record<string, { nb: string; en: string }> = {
  vendor_assessment: { nb: "Leverandørvurdering", en: "Vendor Assessment" },
  dpa: { nb: "DPA", en: "DPA" },
  iso_documentation: { nb: "ISO 27001", en: "ISO 27001" },
  soc2: { nb: "SOC 2", en: "SOC 2" },
  gdpr_report: { nb: "GDPR", en: "GDPR" },
  hms_documentation: { nb: "HMS", en: "HSE" },
  quality_certification: { nb: "Kvalitet", en: "Quality" },
  audit_report: { nb: "Revisjon", en: "Audit" },
};

export function TemplateLibrary() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [templates, setTemplates] = useState<SavedTemplate[]>(getSavedTemplates);

  const handleDelete = (id: string) => {
    removeTemplate(id);
    setTemplates(getSavedTemplates());
    toast.success(isNb ? "Mal slettet" : "Template deleted");
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-sm font-medium">
          {isNb ? "Ingen maler lagret ennå" : "No templates saved yet"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {isNb
            ? "Når du laster opp et dokument i «Send melding»-wizarden, kan du velge å lagre det som en mal for gjenbruk."
            : "When you upload a document in the Send message wizard, you can choose to save it as a reusable template."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isNb
          ? "Dokumentmaler som kan gjenbrukes når du sender forespørsler til leverandører."
          : "Document templates that can be reused when sending requests to vendors."}
      </p>
      <div className="space-y-2">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{tpl.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] text-muted-foreground">{tpl.fileName} · {(tpl.fileSize / 1024).toFixed(0)} KB</span>
                {tpl.requestTypes.map((rt) => {
                  const label = REQUEST_TYPE_LABELS[rt];
                  return label ? (
                    <Badge key={rt} variant="outline" className="text-[13px]">
                      {isNb ? label.nb : label.en}
                    </Badge>
                  ) : null;
                })}
              </div>
              <span className="text-[13px] text-muted-foreground">
                {isNb ? "Opprettet" : "Created"}: {new Date(tpl.createdAt).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(tpl.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
