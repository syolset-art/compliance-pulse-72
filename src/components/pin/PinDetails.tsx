import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CircleHelp,
  FileSearch,
  Gauge,
  Link2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  AUTHORITY_DESCRIPTION,
  AUTHORITY_LABEL,
  FETCH_METHOD_LABEL,
  FRESHNESS_LABEL,
  PIN_TONE_CLASS,
  SOURCE_CLASS_LABEL,
  UNKNOWN_TEXT,
  attestationTone,
  authorityTone,
  formatPinDate,
  freshnessTone,
  sourceTone,
  type Pin,
  type PinTone,
} from "@/lib/pin";

function Dimension({
  icon: Icon,
  title,
  tone,
  headline,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  tone: PinTone;
  headline: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="space-y-1.5">
      <header className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </header>
      <p
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
          PIN_TONE_CLASS[tone],
        )}
      >
        {tone === "poor" ? (
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        ) : tone === "caution" ? (
          <CircleHelp className="h-3 w-3" aria-hidden="true" />
        ) : tone === "good" ? (
          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        ) : (
          <CircleHelp className="h-3 w-3" aria-hidden="true" />
        )}
        {headline}
      </p>
      <dl className="space-y-0.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2 text-[11px]">
            <dt className="shrink-0 text-muted-foreground">{r.label}</dt>
            <dd
              className={cn(
                "min-w-0 flex-1 truncate text-foreground",
                r.value === UNKNOWN_TEXT && "italic text-muted-foreground",
              )}
              title={r.value}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Full visning av Pinens fire dimensjoner — vist rått, uten samlet score.
 * Kun intern Canvas-visning (ikke synlig i connectoren i v1).
 */
export function PinDetails({ pin, className }: { pin: Pin; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <header className="space-y-1 border-b border-border pb-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Pin {pin.pin_id}
        </p>
        {pin.fallen && (
          <p className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive">
            <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
            Pin falt — innholdet er endret etter pinning. Merket er ikke gyldig og må
            fornyes mot ny innholdsversjon.
          </p>
        )}
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          {pin.content_hash} · {pin.unit_version} · pinnet {formatPinDate(pin.pinned_at)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Pin er knyttet til innholdsversjonen, ikke til enheten.
        </p>
      </header>

      <Dimension
        icon={Link2}
        title="1. Kilde"
        tone={sourceTone(pin.source)}
        headline={SOURCE_CLASS_LABEL[pin.source.sourceClass]}
        rows={[
          { label: "Referanse", value: pin.source.sourceRef || UNKNOWN_TEXT },
          { label: "Konsolidert", value: formatPinDate(pin.source.consolidatedAt) },
          {
            label: "Hentemetode",
            value: FETCH_METHOD_LABEL[pin.source.fetchMethod ?? "unknown"],
          },
          { label: "Hentet", value: formatPinDate(pin.source.fetchedAt) },
        ]}
      />

      <Dimension
        icon={UserCheck}
        title="2. Attestering"
        tone={attestationTone(pin.attestation)}
        headline={ATTESTATION_LABEL[pin.attestation.level]}
        rows={[
          { label: "Attestert av", value: pin.attestation.attestedBy || UNKNOWN_TEXT },
          { label: "Dato", value: formatPinDate(pin.attestation.attestedAt) },
          { label: "Regel", value: "Kun mennesker kan attestere — aldri agenter." },
        ]}
      />

      <Dimension
        icon={CalendarClock}
        title="3. Ferskhet"
        tone={freshnessTone(pin.freshness)}
        headline={
          pin.freshness.drifting
            ? "Drift oppdaget"
            : FRESHNESS_LABEL[pin.freshness.flag]
        }
        rows={[
          { label: "Sist sjekket", value: formatPinDate(pin.freshness.checkedAt) },
          { label: "Flagg", value: FRESHNESS_LABEL[pin.freshness.flag] },
          { label: "Drift", value: pin.freshness.drifting ? "Ja — innholdet driver fra kilden" : "Nei" },
        ]}
      />

      <Dimension
        icon={Gauge}
        title="4. Bruksgrense"
        tone={authorityTone(pin.authority)}
        headline={`Agenten kan: ${AUTHORITY_LABEL[pin.authority.level]}`}
        rows={[
          { label: "Betyr", value: AUTHORITY_DESCRIPTION[pin.authority.level] },
          { label: "Begrunnelse", value: pin.authority.rationale || UNKNOWN_TEXT },
        ]}
      />

      <p className="flex items-start gap-1.5 border-t border-border pt-2 text-[10px] text-muted-foreground">
        <FileSearch className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
        Pin er en deklarasjon, ikke en port. Alt innhold kan aktiveres — kvaliteten
        avgjør hva en agent får lov til å gjøre.
      </p>
    </div>
  );
}
