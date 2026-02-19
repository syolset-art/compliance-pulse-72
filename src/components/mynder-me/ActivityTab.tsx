import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileSignature, Clock, Building2, User, ShieldCheck, TrendingUp } from "lucide-react";

const sentAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

function timeAgo(date: Date) {
  const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Akkurat nå";
  if (hours === 1) return "for 1 time siden";
  if (hours < 24) return `for ${hours} timer siden`;
  const days = Math.round(hours / 24);
  return days === 1 ? "for 1 dag siden" : `for ${days} dager siden`;
}

export function EmployeeActivitySection() {
  return (
    <div className="space-y-4">
      {/* Personvernerklæring */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">Personvernerklæring godkjent</h3>
                <Badge variant="action" className="text-xs">100% fullført</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Oppdatert personvernerklæring ble sendt ut til alle ansatte {timeAgo(sentAt)}.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Godkjent av ansatte</span>
              <span className="font-medium text-foreground">12 / 12</span>
            </div>
            <Progress value={100} className="h-2.5" />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              <span className="font-semibold">Spart ca. 4 timer</span> sammenlignet med manuell prosess (12 ansatte × 20 min manuelt → 5 min med Mynder Me)
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Sendt ut {timeAgo(sentAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Arbeidskontrakt */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <FileSignature className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">Arbeidskontrakt signert</h3>
                <Badge variant="action" className="text-xs">Signert</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Arbeidskontrakt ble sendt ut og signert av ansatt via Mynder Me.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeAgo(new Date(Date.now() - 18 * 60 * 60 * 1000))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CustomerActivitySection() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">Godkjenning fra Helsereiser AS</h3>
                  <Badge variant="action" className="text-xs">Godkjent</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground font-medium">Lars Hansen</span>
                  <Badge variant="outline" className="text-xs">CEO</Badge>
                  <span className="text-sm text-muted-foreground">— Helsereiser AS</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">Terms & Conditions godkjent</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">Personvernerklæring godkjent</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeAgo(new Date(Date.now() - 6 * 60 * 60 * 1000))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
