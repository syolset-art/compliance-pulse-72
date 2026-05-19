import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Sparkles, AlertCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceMapping, ServiceActivity } from "./CustomServiceDialog";

export interface CustomerVisibleService {
  id: string;
  name: string;
  description?: string;
  activities: ServiceActivity[];
  mappings: ServiceMapping[];
  templateCode?: string;
  source: "library" | "manual";
}

interface Props {
  services: CustomerVisibleService[];
  /** Når true vises preview som e-post-utkast (header, intro, footer). */
  asEmail?: boolean;
  /** Navn på kunden (vises i intro hvis asEmail). */
  customerName?: string;
  /** Partnerens egen organisasjon (vises i avsender hvis asEmail). */
  partnerName?: string;
}

/**
 * Renderer hvordan tjenestene fremstår fra kundens perspektiv.
 * Skjuler alltid: timepris, interne timer, marginer, fastpris.
 * Viser: navn, beskrivelse, aktiviteter (uten timer), regelverk-dekning,
 * og Lara-flagg på tjenester som mangler innhold.
 *
 * Alle tekstfelt kjøres gjennom `toCustomerVoice()` slik at "kundens X"
 * blir til "din X" — kunden leser teksten selv.
 */
export function CustomerCatalogPreview({
  services,
  asEmail = false,
  customerName,
  partnerName,
}: Props) {
  if (services.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ingen tjenester i katalogen ennå — det er ingenting å vise kunden.
      </Card>
    );
  }

  const grid = (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => {
        const issues = detectIssues(s);
        const name = toCustomerVoice(s.name);
        const description = s.description ? toCustomerVoice(s.description) : undefined;
        return (
          <div
            key={s.id}
            className={cn(
              "rounded-lg border border-border bg-card p-3 flex flex-col gap-2",
              issues.length > 0 && "border-warning/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground leading-tight">{name}</h4>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success text-success-foreground px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Aktiv
              </span>
            </div>

            {/* Aktiviteter (uten timer) */}
            {s.activities.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hva inngår
                </p>
                <ul className="space-y-0.5">
                  {s.activities.slice(0, 5).map((a, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <span className="text-success mt-0.5">·</span>
                      <span>{toCustomerVoice(a.label)}</span>
                    </li>
                  ))}
                  {s.activities.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-3">
                      +{s.activities.length - 5} til
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Regelverk-dekning */}
            {s.mappings.length > 0 && (
              <div className="mt-auto pt-2 border-t border-border">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Dekker krav i
                </p>
                <div className="flex flex-wrap gap-1">
                  {dedupeFrameworks(s.mappings).slice(0, 4).map((fw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lara-advarsel hvis tjenesten ser tom ut */}
            {issues.length > 0 && (
              <div
                role="status"
                className="rounded-md bg-warning/15 border border-warning px-2 py-1.5 flex items-start gap-1.5"
              >
                <AlertCircle className="h-4 w-4 text-warning-foreground mt-0.5 shrink-0" aria-hidden="true" />
                <div className="text-xs text-foreground">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" /> Lara
                  </span>
                  <span className="ml-1">{issues[0]}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (asEmail) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* E-post-header */}
        <div className="px-4 py-3 border-b border-border bg-muted/40 space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              E-post til kunde — utkast
            </span>
          </div>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Fra:</span>{" "}
            {partnerName ?? "Din organisasjon"}{" "}
            <span className="text-muted-foreground">· Til:</span>{" "}
            {customerName ?? "Kunde"}
          </p>
          <p className="text-sm font-semibold text-foreground">
            Emne: Compliance-tjenestene vi leverer for{" "}
            {customerName ?? "deg"}
          </p>
        </div>

        {/* E-post-body */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Hei{customerName ? ` ${customerName}` : ""},
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Her er en oversikt over compliance-tjenestene{" "}
            {partnerName ?? "vi"} leverer for deg. Du finner alle aktive
            tjenester nedenfor, med hva som inngår og hvilke regelverk de
            dekker.
          </p>
          {grid}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Send oss gjerne en melding hvis du ønsker å justere omfanget
            eller har spørsmål til leveransen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 border-dashed border-primary/30 bg-primary/[0.02]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Shield className="h-3 w-3 text-primary" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Slik fremstår tjenestene for kunden</p>
          <p className="text-xs text-muted-foreground">
            Pris, timer og interne marginer er skjult. Aktiviteter vises som leveranseinnhold.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">Forhåndsvisning</Badge>
      </div>
      {grid}
    </Card>
  );
}

function dedupeFrameworks(mappings: ServiceMapping[]): string[] {
  return Array.from(new Set(mappings.map((m) => m.frameworkShortName)));
}

function detectIssues(s: CustomerVisibleService): string[] {
  const out: string[] = [];
  if (!s.description) out.push("Mangler beskrivelse — kunden ser ikke hva tjenesten handler om.");
  if (s.activities.length === 0) out.push("Ingen aktiviteter — kunden ser ikke hva som leveres.");
  if (s.mappings.length === 0) out.push("Ingen kobling til regelverk — vanskelig å vise verdi.");
  return out;
}

/**
 * Reskriver partner-intern tekst ("kundens X", "send til kunden") til
 * kunde-vendt tekst ("din X", "send til deg"). Kunden leser dette selv,
 * så referanser i tredje person må fjernes. Bevisst konservativ — bare
 * ord/uttrykk vi vet er trygge å bytte. Andre forekomster (f.eks. "for
 * australske kunder") forblir uendret.
 */
export function toCustomerVoice(input: string): string {
  if (!input) return input;
  const rules: Array<[RegExp, string]> = [
    [/\bkundens\b/gi, "din"],
    [/\btil kunden\b/gi, "til deg"],
    [/\bfor kunden\b/gi, "for deg"],
    [/\bmed kunden\b/gi, "med deg"],
    [/\bhos kunden\b/gi, "hos deg"],
    [/\bav kunden\b/gi, "av deg"],
    [/\bom kunden\b/gi, "om deg"],
    [/\bkunden er\b/gi, "du er"],
    [/\bkunden\b/gi, "du"],
  ];
  let out = input;
  for (const [re, replacement] of rules) {
    out = out.replace(re, (match) => preserveCase(match, replacement));
  }
  // Fjern doble mellomrom og rydd punktum.
  return out.replace(/\s{2,}/g, " ").trim();
}

function preserveCase(match: string, replacement: string): string {
  if (!match) return replacement;
  const firstChar = match[0];
  if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}
