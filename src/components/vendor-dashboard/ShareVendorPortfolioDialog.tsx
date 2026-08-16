import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Send, Link2, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getMaturityLevel } from "@/lib/maturityLevel";
import { MaturityIndicator } from "@/components/shared/MaturityIndicator";

interface ShareVendorPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: any[];
}

function riskBucket(score: number): "low" | "medium" | "high" {
  const level = getMaturityLevel(score);
  return level === "high" ? "low" : level === "medium" ? "medium" : "high";
}

export function ShareVendorPortfolioDialog({ open, onOpenChange, vendors }: ShareVendorPortfolioDialogProps) {
  const [email, setEmail] = useState("");
  const [period, setPeriod] = useState("30");
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const total = vendors.length;
    const scores = vendors.map((v) => v.compliance_score ?? 0);
    const avg = total > 0 ? Math.round(scores.reduce((s, n) => s + n, 0) / total) : 0;
    const prioritized = vendors.filter((v) => v.priority === "critical" || v.priority === "high").length;
    const buckets = { low: 0, medium: 0, high: 0 };
    scores.forEach((s) => buckets[riskBucket(s)]++);
    const highRisk = buckets.high;
    return { total, avg, prioritized, buckets, highRisk };
  }, [vendors]);

  const sorted = useMemo(
    () => [...vendors].sort((a, b) => (a.compliance_score ?? 0) - (b.compliance_score ?? 0)),
    [vendors]
  );

  const totalForBar = stats.buckets.low + stats.buckets.medium + stats.buckets.high || 1;
  const today = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  const handleSend = () => {
    if (!email) {
      toast.error("Skriv inn en e-postadresse");
      return;
    }
    toast.success(`Etterlevelsesrapport delt med ${email} (${period} dager tilgang)`);
    onOpenChange(false);
    setEmail("");
    setMessage("");
    setShowMessage(false);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/shared/vendor-portfolio/${Date.now().toString(36)}`;
    navigator.clipboard.writeText(link);
    toast.success("Delingslenke kopiert");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header / form */}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Del etterlevelsesrapport</DialogTitle>
            <DialogDescription>
              Send en lesetilgang til rapporten under. Mottakeren trenger ingen Mynder-konto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="share-email" className="text-xs">E-postadresse</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="kunde@firma.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-period" className="text-xs">Tilgangsperiode</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="share-period" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dager</SelectItem>
                  <SelectItem value="30">30 dager</SelectItem>
                  <SelectItem value="90">90 dager</SelectItem>
                  <SelectItem value="365">1 år</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSend} className="gap-2 sm:self-end">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {!showMessage ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowMessage(true)}>
                <Plus className="h-4 w-4" />
                Legg til personlig melding
              </Button>
            ) : (
              <div className="w-full space-y-1.5">
                <Label htmlFor="share-msg" className="text-xs">Personlig melding</Label>
                <Textarea
                  id="share-msg"
                  rows={2}
                  placeholder="Skriv en kort melding til mottakeren …"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLink}>
              <Link2 className="h-4 w-4" />
              Kopier delingslenke i stedet
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t bg-muted/40 p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Slik ser rapporten ut for mottakeren
          </div>

          <Card className="p-5 space-y-5 bg-background">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Etterlevelsesrapport</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Mynder AS · Generert {today}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Org.nr 831377372</p>
                <p className="text-primary font-medium">{stats.total} leverandører</p>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card variant="flat" className="p-2.5">
                <p className="text-[12px] text-muted-foreground">Leverandører</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{stats.total}</p>
              </Card>
              <Card variant="flat" className="p-2.5">
                <p className="text-[12px] text-muted-foreground">Modenhet</p>
                <div className="mt-1"><MaturityIndicator score={stats.avg} showInfo /></div>
              </Card>
              <Card variant="flat" className="p-2.5">
                <p className="text-[12px] text-muted-foreground">Prioritet</p>
                <p className={cn("text-lg font-bold tabular-nums", stats.prioritized > 0 ? "text-destructive" : "text-foreground")}>{stats.prioritized}</p>
              </Card>
              <Card variant="flat" className="p-2.5">
                <p className="text-[12px] text-muted-foreground">Høy risiko</p>
                <p className={cn("text-lg font-bold tabular-nums", stats.highRisk > 0 ? "text-destructive" : "text-foreground")}>{stats.highRisk}</p>
              </Card>
            </div>

            {/* Risk distribution bar */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Risikofordeling</p>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {stats.buckets.low > 0 && <div className="bg-success" style={{ width: `${(stats.buckets.low / totalForBar) * 100}%` }} />}
                {stats.buckets.medium > 0 && <div className="bg-warning" style={{ width: `${(stats.buckets.medium / totalForBar) * 100}%` }} />}
                {stats.buckets.high > 0 && <div className="bg-destructive" style={{ width: `${(stats.buckets.high / totalForBar) * 100}%` }} />}
              </div>
              <div className="flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Lav ({stats.buckets.low})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />Middels ({stats.buckets.medium})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />Høy ({stats.buckets.high})</span>
              </div>
            </div>

            {/* Vendor list */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Leverandører</p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Navn</th>
                      <th className="text-left font-medium px-3 py-2">Bransje</th>
                      <th className="text-right font-medium px-3 py-2">Modenhet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.slice(0, 8).map((v) => {
                      const score = v.compliance_score ?? 0;
                      return (
                        <tr key={v.id} className="border-t">
                          <td className="px-3 py-2 font-medium text-foreground">{v.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{v.category || v.vendor_category || "—"}</td>
                          <td className="px-3 py-2 text-right"><MaturityIndicator score={score} className="justify-end" /></td>
                        </tr>
                      );
                    })}
                    {sorted.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-xs text-muted-foreground">Ingen leverandører å vise</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sorted.length > 8 && (
                <p className="text-[12px] text-muted-foreground">+ {sorted.length - 8} flere leverandører i rapporten</p>
              )}
            </div>

            <p className="text-[12px] text-muted-foreground italic">
              Underliggende dokumenter, kommentarer og intern kommunikasjon deles ikke.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
