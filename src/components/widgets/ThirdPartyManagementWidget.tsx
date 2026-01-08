import { HelpCircle, Globe, Building2, AlertTriangle, FileX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThirdPartyManagementWidget() {
  const outsideEU = 3;
  const total = 7;
  const highRisk = 1;
  const missingDPA = 2;
  const critical = 5;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Tredjepartsstyring
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Data utenfor EU/EØS</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Alert */}
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-4xl font-bold text-warning mb-1">{outsideEU}</p>
          <p className="text-sm text-muted-foreground">
            Leverandører med data utenfor EU/EØS
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Totalt</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
          
          {/* High Risk */}
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Høy risiko</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{highRisk}</p>
          </div>
          
          {/* Missing DPA */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <FileX className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Mangler DPA</span>
            </div>
            <p className="text-2xl font-bold text-warning">{missingDPA}</p>
          </div>
          
          {/* Critical */}
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Kritiske</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{critical}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
