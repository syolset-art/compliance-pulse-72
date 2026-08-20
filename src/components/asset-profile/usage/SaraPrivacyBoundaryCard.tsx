import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, X } from "lucide-react";

interface Props {
  isNb: boolean;
}

/** Rolig kort som viser hva den lokale agenten aldri sender ut av huset. */
export const SaraPrivacyBoundaryCard = ({ isNb }: Props) => {
  const never = isNb
    ? ["Dokumentinnhold", "Personopplysninger", "Kunde- og forretningsdata", "Nøkler og hemmeligheter"]
    : ["Document content", "Personal data", "Customer and business data", "Keys and secrets"];

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-[13px] font-medium text-foreground">
            {isNb ? "Personverngrense" : "Privacy boundary"}
          </span>
        </div>
        <p className="text-[12px] leading-snug text-muted-foreground">
          {isNb
            ? "Alt innhold prosesseres lokalt i din egen infrastruktur. Kun metadataene under er sendt til Mynder."
            : "All content is processed locally in your own infrastructure. Only the metadata below is sent to Mynder."}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {never.map((n) => (
            <li
              key={n}
              className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[12px] text-muted-foreground"
            >
              <X className="h-3 w-3 text-destructive" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
