import { useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  ATTESTATION_SUMMARY_TEXT,
  QUALITY_PROCESS_DISCLAIMER,
  QUALITY_PROCESS_STEPS,
  SOURCE_CHANGE_TEXT,
  SOURCE_POLICY_TEXT,
  formatPinDate,
  sourceRefDisplay,
  sourceRefHref,
  type Pin,
} from "@/lib/pin";
import { PinRosette } from "./PinRosette";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-xs">
      <dt className="w-[92px] shrink-0 pt-px text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

function SourceLink({ label, refId }: { label: string; refId?: string }) {
  const href = sourceRefHref(refId);
  if (!href) return <span>{label}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {label}
    </a>
  );
}

/** Hovedvisning: hvem som står bak, kilde, gjennomgang og krav. */
export function PinSummary({ pin }: { pin: Pin }) {
  const level = pin.attestation.level;
  const primary = pin.sources?.[0];
  const req = pin.requirements;

  return (
    <dl className="space-y-2.5">
      <Row label="Kilde">
        <div>
          <SourceLink
            label={primary ? primary.label : sourceRefDisplay(pin.source.sourceRef)}
            refId={primary?.ref ?? pin.source.sourceRef}
          />
          {primary?.note && (
            <div className="text-muted-foreground">{primary.note}</div>
          )}
        </div>
      </Row>

      {level === "human_verified" ? (
        <Row label="Verifisert">
          <div>
            <div className="font-medium">{formatPinDate(pin.attestation.attestedAt)}</div>
            {pin.attestationExpiresAt && (
              <div className="text-muted-foreground">
                forfaller {formatPinDate(pin.attestationExpiresAt)}
              </div>
            )}
          </div>
        </Row>
      ) : (
        <Row label="Gjennomgått">
          <div>
            <div className="font-medium">
              {formatPinDate(pin.freshness.checkedAt ?? pin.attestation.attestedAt)}
              {pin.attestation.agentAlias ? ` av ${pin.attestation.agentAlias}` : ""}
            </div>
            {pin.sourceCheckCadence && (
              <div className="text-muted-foreground">{pin.sourceCheckCadence}</div>
            )}
          </div>
        </Row>
      )}

      {req && (
        <Row label="Krav">
          <div>
            <div className="font-medium">
              {req.total}, hvorav {req.requiringDocs} krever dokumentasjon
            </div>
            <div className="text-muted-foreground">{req.missing} mangler</div>
          </div>
        </Row>
      )}
    </dl>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-2 hover:underline"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Tilbake
    </button>
  );
}

/**
 * Proveniensvisning med tre nivåer: oppsummering, kilder og kvalitetsprosess.
 * Pin sier ingenting om samsvar.
 */
export function PinDetails({ pin, className }: { pin: Pin; className?: string }) {
  const [view, setView] = useState<"main" | "sources" | "quality">("main");
  const level = pin.attestation.level;
  const subject = pin.subject?.label ?? "regelverket";

  if (view === "sources") {
    return (
      <div className={cn("space-y-3", className)}>
        <BackLink onClick={() => setView("main")} />
        <h3 className="text-sm font-semibold text-foreground">Kilder for {subject}</h3>
        <dl className="space-y-2.5">
          <Row label="Grunnlaget">
            <div className="space-y-1">
              {pin.sources?.map((s) => (
                <div key={s.label}>
                  <SourceLink label={s.label} refId={s.ref} />{" "}
                  <span className="text-muted-foreground">{s.note}</span>
                </div>
              ))}
            </div>
          </Row>
          {pin.lastSourceCheck && (
            <Row label="Sist sjekket mot kilden">
              <span className="font-medium">{pin.lastSourceCheck}</span>
            </Row>
          )}
          {pin.alsoFollows && (
            <Row label="Følger også">
              <span>{pin.alsoFollows}</span>
            </Row>
          )}
        </dl>
        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          {SOURCE_POLICY_TEXT}
        </p>
        <div className="flex gap-2 rounded-md bg-muted/60 p-3">
          <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {SOURCE_CHANGE_TEXT}
          </p>
        </div>
      </div>
    );
  }

  if (view === "quality") {
    return (
      <div className={cn("space-y-3", className)}>
        <BackLink onClick={() => setView("main")} />
        <h3 className="text-sm font-semibold text-foreground">
          Slik kvalitetssikrer vi regelverk
        </h3>
        <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-foreground">
          {QUALITY_PROCESS_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          {QUALITY_PROCESS_DISCLAIMER}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <PinRosette level={level} className="h-4 w-4" />
          <span className="text-sm font-semibold text-foreground">
            {ATTESTATION_LABEL[level]}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {ATTESTATION_SUMMARY_TEXT[level]}
        </p>
      </header>

      <PinSummary pin={pin} />

      <div className="flex flex-wrap gap-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setView("sources")}
          className="text-xs text-primary underline underline-offset-2"
        >
          Kilder for {subject}
        </button>
        <button
          type="button"
          onClick={() => setView("quality")}
          className="text-xs text-primary underline underline-offset-2"
        >
          Slik kvalitetssikrer vi
        </button>
      </div>
    </div>
  );
}
