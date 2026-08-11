import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VENDOR_ARCHETYPES,
  archetypeByKey,
  type VendorArchetype,
} from "@/lib/vendorSourcingMethod";

interface Props {
  vendorName: string;
  archetype: VendorArchetype;
  onSelectArchetype: (a: VendorArchetype) => void;
  /** Åpner dialogen med innhentingsmetoder. */
  onRequestBaseline: () => void;
  /** Registrer bevis som allerede er mottatt (f.eks. på e-post). */
  onRegisterExisting: () => void;
}

/**
 * Tom-tilstand for en nylig opprettet leverandør: ingenting er etterspurt ennå,
 * så første steg er å be om grunnlag. Alt annet (oppgaveplan, tiltak) er støy
 * inntil det finnes bevis å vurdere.
 */
export function RequestBaselineCard({
  vendorName,
  archetype,
  onSelectArchetype,
  onRequestBaseline,
  onRegisterExisting,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const meta = archetypeByKey(archetype);

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
          {isNb ? "Lara · neste steg" : "Lara · next step"}
        </span>
      </div>

      <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-foreground">
        {isNb ? `Vi mangler grunnlag fra ${vendorName}` : `We are missing evidence from ${vendorName}`}
      </h3>

      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
        {isNb ? (
          <>
            Gap-analyse og modenhetsvurdering krever bevis. Vi har ikke bedt leverandøren om det
            ennå — så det finnes ingenting å vurdere mot rammeverk enda.{" "}
            <span className="font-medium text-foreground">Start med å be om grunnlag.</span> Lara
            forbereder utkast til vurdering automatisk når svaret kommer inn — du beslutter.
          </>
        ) : (
          <>
            Gap analysis and maturity assessment require evidence. We haven't asked the vendor yet —
            so there is nothing to assess against frameworks.{" "}
            <span className="font-medium text-foreground">Start by requesting evidence.</span> Lara
            drafts the assessment automatically once the response arrives — you decide.
          </>
        )}
      </p>

      {/* Leverandørtype — styrer signalene Laras anbefaling bygger på (prototype) */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground mr-0.5">
          {isNb ? "Leverandørtype:" : "Vendor type:"}
        </span>
        {VENDOR_ARCHETYPES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onSelectArchetype(a.key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
              a.key === archetype
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {a.name}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground">
          · {isNb ? meta.hint.nb : meta.hint.en}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button size="lg" className="rounded-full gap-2" onClick={onRequestBaseline}>
          {isNb ? "Be om grunnlag" : "Request evidence"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-[13px] text-muted-foreground">
          {isNb ? "Eller " : "Or "}
          <button
            type="button"
            onClick={onRegisterExisting}
            className="text-primary underline-offset-2 hover:underline"
          >
            {isNb
              ? "registrer bevis du allerede har fått på e-post"
              : "register evidence you already received by email"}
          </button>
        </p>
      </div>
    </div>
  );
}
