import { ReactNode } from "react";

export type EmailLanguage = "no" | "en";

interface EmailLayoutProps {
  subject: string;
  body: ReactNode;
  cta?: { text: string; url: string } | null;
  senderOrganization?: string;
  language?: EmailLanguage;
}

const FOOTER_COPY: Record<EmailLanguage, { tagline: string; privacy: string; unsubscribe: string }> = {
  no: {
    tagline: "Sendt via Mynder – infrastrukturen for tillit mellom virksomheter.",
    privacy: "Personvern",
    unsubscribe: "Avmelding",
  },
  en: {
    tagline: "Sent via Mynder – the infrastructure for trust between organizations.",
    privacy: "Privacy",
    unsubscribe: "Unsubscribe",
  },
};

/**
 * Shared transactional email layout (max width 600px, responsive).
 * Used both for preview and for HTML generation in the send-email edge function.
 */
export function EmailLayout({
  subject,
  body,
  cta,
  senderOrganization,
  language = "no",
}: EmailLayoutProps) {
  const footer = FOOTER_COPY[language];

  return (
    <div className="w-full bg-muted/40 py-8 px-4">
      <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-8 py-5">
          <img src="/mynder-logo.svg" alt="Mynder" className="h-7 w-auto" />
        </div>

        {/* Body */}
        <div className="px-8 py-10 space-y-5">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground tracking-tight">
            {subject}
          </h1>
          <div className="text-[15px] leading-relaxed text-foreground/85 space-y-4 whitespace-pre-line">
            {body}
          </div>

          {cta && cta.text && cta.url && (
            <div className="pt-3">
              <a
                href={cta.url}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition hover:bg-primary/90"
              >
                {cta.text}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-8 py-6 space-y-2">
          <p className="text-xs leading-relaxed text-muted-foreground">{footer.tagline}</p>
          <p className="text-xs text-muted-foreground">
            <a href="https://mynder.no/personvern" className="text-muted-foreground hover:text-foreground">
              {footer.privacy}
            </a>
            <span className="mx-1.5">·</span>
            <a href="https://mynder.no/avmelding" className="text-muted-foreground hover:text-foreground">
              {footer.unsubscribe}
            </a>
            <span className="mx-1.5">·</span>
            <a href="https://mynder.no" className="text-muted-foreground hover:text-foreground">
              mynder.no
            </a>
          </p>
          {senderOrganization && (
            <p className="text-xs text-muted-foreground">{senderOrganization}</p>
          )}
        </div>
      </div>
    </div>
  );
}
