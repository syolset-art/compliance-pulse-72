import { useState } from "react";
import { ThumbsUp, Users, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CommunityRequest {
  id: string;
  country: string;
  flag: string;
  frameworks: string[];
  votes: number;
  status: "planlagt" | "under-vurdering" | "etterspurt";
  eta?: string;
  requestedAt: string;
}

// Mock community-requested countries / frameworks. Replace with backend data later.
const SEED: CommunityRequest[] = [
  { id: "de", country: "Tyskland", flag: "🇩🇪", frameworks: ["BDSG", "IT-Sicherheitsgesetz", "DSGVO-DE"], votes: 47, status: "planlagt", eta: "Q3 2026", requestedAt: "2026-05-10" },
  { id: "us", country: "USA", flag: "🇺🇸", frameworks: ["HIPAA", "CCPA", "SOC 2"], votes: 38, status: "under-vurdering", requestedAt: "2026-05-12" },
  { id: "dk", country: "Danmark", flag: "🇩🇰", frameworks: ["Databeskyttelsesloven"], votes: 24, status: "planlagt", eta: "Q2 2026", requestedAt: "2026-05-14" },
];

const STATUS_META: Record<CommunityRequest["status"], { label: string; className: string }> = {
  planlagt: { label: "Planlagt", className: "bg-success/15 text-success border-success/30" },
  "under-vurdering": { label: "Under vurdering", className: "bg-warning/15 text-warning border-warning/30" },
  etterspurt: { label: "Etterspurt", className: "bg-muted text-muted-foreground border-border" },
};

export function CommunityRequests() {
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [bumps, setBumps] = useState<Record<string, number>>({});

  const toggle = (id: string) => {
    setVoted((v) => ({ ...v, [id]: !v[id] }));
    setBumps((b) => ({ ...b, [id]: (b[id] ?? 0) + (voted[id] ? -1 : 1) }));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-3 w-3" aria-hidden /> Etterspurt av fellesskapet
        </div>
        <span className="text-[11px] text-muted-foreground">Stem opp – vi prioriterer det mest etterspurte</span>
      </div>
      <ul className="divide-y divide-border rounded-lg border bg-muted/20">
        {SEED.map((r) => {
          const isVoted = !!voted[r.id];
          const total = r.votes + (bumps[r.id] ?? 0);
          const meta = STATUS_META[r.status];
          return (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
              <span aria-hidden className="text-lg leading-none">{r.flag}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{r.country}</span>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", meta.className)}>
                    {meta.label}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" aria-hidden /> Bestilt {r.requestedAt}
                  </span>
                  {r.eta && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden /> {r.eta}
                    </span>
                  )}
                </div>
                {r.frameworks.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.frameworks.map((f) => (
                      <span key={f} className="inline-flex items-center rounded-full bg-background border px-1.5 py-0 text-[10px] text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggle(r.id)}
                aria-pressed={isVoted}
                aria-label={`Stem opp ${r.country}. Nåværende stemmer: ${total}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isVoted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <ThumbsUp className={cn("h-3.5 w-3.5", isVoted && "fill-current")} aria-hidden />
                {total}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
