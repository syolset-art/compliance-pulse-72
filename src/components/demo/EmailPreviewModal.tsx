import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Shield, FileCheck, Link2 } from "lucide-react";

interface EmailPreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmailPreviewModal({ open, onClose }: EmailPreviewModalProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background">
        {/* Email client header (gray strip) */}
        <div className="bg-muted/50 border-b border-border px-5 py-3 text-[12px] space-y-0.5">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-12">{isNb ? "Fra:" : "From:"}</span>
            <span className="text-foreground font-medium">Mynder &lt;noreply@mynder.no&gt;</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-12">{isNb ? "Til:" : "To:"}</span>
            <span className="text-foreground">compliance@sparebankvest.no</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-12">{isNb ? "Emne:" : "Subject:"}</span>
            <span className="text-foreground font-semibold">
              {isNb ? "Forespørsel om leverandøroppdatering 2026 – fra Ola Normann, Sparebanken Vest" : "Vendor update request 2026 – from Ola Normann, Sparebanken Vest"}
            </span>
          </div>
        </div>

        {/* Email body (white) */}
        <div className="bg-white text-neutral-900 px-8 py-8 max-h-[60vh] overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Mynder</span>
          </div>

          <h1 className="text-[22px] font-semibold mb-4 leading-tight">
            {isNb ? "Hei Anders," : "Hi Anders,"}
          </h1>

          <p className="text-[14px] leading-relaxed text-neutral-700 mb-4">
            {isNb
              ? "Ola Normann i Sparebanken Vest har bedt om en oppdatert leverandørstatus fra deres organisasjon som ledd i sin årlige risikovurdering av leverandører for 2026."
              : "Ola Normann at Sparebanken Vest has requested an updated vendor status from your organization as part of their annual vendor risk review for 2026."}
          </p>

          <p className="text-[14px] leading-relaxed text-neutral-700 mb-3">
            {isNb ? "De ønsker følgende dokumentasjon:" : "They request the following documentation:"}
          </p>

          <ul className="space-y-2 mb-6 text-[14px] text-neutral-700">
            <li className="flex items-start gap-2">
              <FileCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{isNb ? "Oppdatert ISO 27001-sertifikat" : "Updated ISO 27001 certificate"}</span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{isNb ? "Gjeldende databehandleravtale (DPA)" : "Current Data Processing Agreement (DPA)"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Link2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{isNb ? "Lenke til Trust Profile" : "Link to Trust Profile"}</span>
            </li>
          </ul>

          {/* CTA */}
          <div className="text-center my-8">
            <a
              href="https://mynder-trust-engine.lovable.app/leverandor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-7 py-3 rounded-lg text-white font-semibold text-[14px] shadow-sm"
              style={{ backgroundColor: "#5A3184" }}
            >
              {isNb ? "Åpne forespørselen i Mynder" : "Open request in Mynder"}
            </a>
          </div>

          <p className="text-[13px] text-neutral-500 leading-relaxed mb-2">
            {isNb
              ? "Mynder har allerede analysert forespørselen og utarbeidet et utkast til svar basert på din eksisterende dokumentasjon. Du trenger bare å gjennomgå og godkjenne."
              : "Mynder has already analyzed the request and prepared a draft response based on your existing documentation. You just need to review and approve."}
          </p>

          {/* Footer */}
          <div className="border-t border-neutral-200 mt-8 pt-4 text-[11px] text-neutral-400 text-center space-x-2">
            <span>© 2026 Mynder AS</span>
            <span>·</span>
            <span>{isNb ? "Org.nr" : "Org. no."} 925 478 123</span>
            <span>·</span>
            <a href="https://mynder.no" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">mynder.no</a>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30">
          <Button onClick={onClose} className="w-full sm:w-auto">
            {isNb ? "Lukk og fortsett demo" : "Close and continue demo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
