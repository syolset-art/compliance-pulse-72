import { Sparkles } from "lucide-react";

interface LaraAutoFillBannerProps {
  /** Short description of what Lara is mapping in this section */
  description: string;
}

/**
 * Visual banner that signals: "Lara fills this out automatically — you only correct."
 * Used across Datalagring, Personvern and Sikkerhetstiltak sections in Trust Profile edit.
 */
export function LaraAutoFillBanner({ description }: LaraAutoFillBannerProps) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          Lara kartlegger dette automatisk
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description} Du trenger ikke fylle ut selv — bare korriger forslagene under hvis noe ikke stemmer.
        </p>
      </div>
    </div>
  );
}
