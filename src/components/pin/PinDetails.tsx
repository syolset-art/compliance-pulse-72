import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  PIN_ROW_LABEL,
  ATTESTATION_VERIFIER_TEXT,
  CONTENT_CREATED_BY_TEXT,
  FETCH_METHOD_LABEL,
  PIN_LEVEL_CLASS,
  SOURCE_CLASS_LABEL,
  UNKNOWN_TEXT,
  formatPinDate,
  type Pin,
} from "@/lib/pin";
import { PinRosette } from "./PinRosette";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[11px]">
      <dt className="w-[104px] shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 truncate text-foreground",
          value === UNKNOWN_TEXT && "italic text-muted-foreground",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function TraceCodeRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <dt className="w-[104px] shrink-0 text-muted-foreground">{PIN_ROW_LABEL.traceCode}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate font-mono text-foreground">{value}</span>
        <button
          type="button"
          aria-label="Kopier sporingskode"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </dd>
    </div>
  );
}

/**
 * Proveniensvisning: hvem verifiserte, kilde, referanse, sist kontrollert og
 * innholdsversjon. Pin sier ingenting om samsvar.
 */
export function PinDetails({ pin, className }: { pin: Pin; className?: string }) {
  const level = pin.attestation.level;
  const prev = pin.previousAttestation;

  return (
    <div className={cn("space-y-3", className)}>
      <header className="flex items-center gap-2 border-b border-border pb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-medium",
            PIN_LEVEL_CLASS[level],
          )}
        >
          <PinRosette level={level} className="h-3.5 w-3.5" />
          {ATTESTATION_LABEL[level]}
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">{pin.pin_id}</span>
      </header>

      <dl className="space-y-1">
        <Row label="Verifisert av" value={ATTESTATION_VERIFIER_TEXT[level]} />
        {level === "agent_verified" && pin.attestation.agentAlias && (
          <Row label={PIN_ROW_LABEL.agent} value={`Regelverksagent · ${pin.attestation.agentAlias}`} />
        )}
        {level === "agent_verified" && pin.attestation.agentId && (
          <Row label={PIN_ROW_LABEL.agentId} value={pin.attestation.agentId} />
        )}
        {pin.attestation.routineRef && (
          <Row label={PIN_ROW_LABEL.routine} value={pin.attestation.routineRef} />
        )}
        <Row label="Kilde" value={SOURCE_CLASS_LABEL[pin.source.sourceClass]} />
        <Row label="Referanse" value={pin.source.sourceRef || UNKNOWN_TEXT} />
        <Row label="Innhold laget av" value={CONTENT_CREATED_BY_TEXT[level]} />
        <Row
          label="Hentemetode"
          value={FETCH_METHOD_LABEL[pin.source.fetchMethod ?? "unknown"]}
        />
        <Row
          label="Sist kontrollert"
          value={formatPinDate(pin.freshness.checkedAt ?? pin.attestation.attestedAt)}
        />
        <Row label="Innholdsversjon" value={pin.unit_version} />
        {pin.attestation.traceCode && <TraceCodeRow value={pin.attestation.traceCode} />}
        {prev && (
          <Row
            label="Tidligere"
            value={`${ATTESTATION_LABEL[prev.level]} ${formatPinDate(prev.at)}, gjaldt ${prev.unitVersion}`}
          />
        )}
      </dl>

      {pin.attestation.traceCode && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">{AGENT_IDENTITY_NOTE}</p>
      )}
    </div>
  );
}
