import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, FileCheck, FileClock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_DOCS = [
  { label: "Process descriptions generated", value: 3, icon: FileText },
  { label: "ROPA drafts created", value: 2, icon: FileCheck },
  { label: "DPIA draft prepared", value: 1, icon: FileClock },
];

export function AIGeneratedDocsWidget() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI-generated documents
          </CardTitle>
          <Badge variant="secondary" className="text-xs">This month</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {DEMO_DOCS.map((doc) => {
          const Icon = doc.icon;
          return (
            <div key={doc.label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{doc.label}</p>
              </div>
              <span className="text-lg font-bold text-foreground">{doc.value}</span>
            </div>
          );
        })}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-warning/30 text-warning dark:text-warning">
                Pending review: 3 documents
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 p-0 h-auto"
              onClick={() => navigate("/reports")}
            >
              Review <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
