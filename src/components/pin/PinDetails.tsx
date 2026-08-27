import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CircleHelp,
  FileSearch,
  Link2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  FETCH_METHOD_LABEL,
  FRESHNESS_LABEL,
  PIN_TONE_CLASS,
  SOURCE_CLASS_LABEL,
  UNKNOWN_TEXT,
  attestationTone,
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
        {tone === "good" ? (
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
 * Full proveniensvisning: kilde, verifikasjon og sist kontrollert.
 * Pin sier ingenting om brukbarhet, compliance eller hva en agent får gjøre.
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
          <p className="flex items-start gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1.5 text-[11px] font-medium text-warning">
            <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
            Pin falt — innholdsversjonen er endret etter verifikasjon. Merket gjelder
            ikke denne versjonen, men innholdet kan fortsatt brukes.
          </p>
        )}
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          {pin.content_hash} · {pin.unit_version} · pinnet {formatPinDate(pin.pinned_at)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Merket gjelder denne innholdsversjonen, ikke enheten.
        </p>
      </header>

      <Dimension
        icon={UserCheck}
        title="Status"
        tone={attestationTone(pin.attestation)}
        headline={ATTESTATION_LABEL[pin.attestation.level]}
        rows={[
          { label: "Verifisert av", value: pin.attestation.attestedBy || UNKNOWN_TEXT },
          { label: "Dato", value: formatPinDate(pin.attestation.attestedAt) },
        ]}
      />

      <Dimension
        icon={Link2}
        title="Kilde"
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
        icon={CalendarClock}
        title="Sist kontrollert"
        tone={freshnessTone(pin.freshness)}
        headline={FRESHNESS_LABEL[pin.freshness.flag]}
        rows={[
          { label: "Sist kontrollert", value: formatPinDate(pin.freshness.checkedAt) },
          {
            label: "Kildeavvik",
            value: pin.freshness.drifting ? "Innholdet avviker fra kilden" : "Ingen avvik registrert",
          },
        ]}
      />

      <p className="flex items-start gap-1.5 border-t border-border pt-2 text-[10px] text-muted-foreground">
        <FileSearch className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
        Pin viser kun hvor innholdet kommer fra og om et menneske har verifisert det.
        Pin begrenser ikke bruk og sier ingenting om samsvar.
      </p>
    </div>
  );
}
