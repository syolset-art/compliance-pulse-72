import { ReactNode } from "react";

interface EmailPreviewFrameProps {
  fromName?: string;
  fromEmail?: string;
  subject: string;
  children: ReactNode;
}

/**
 * "Inbox preview" chrome around an EmailLayout — mimics how the email looks
 * in a typical mail client.
 */
export function EmailPreviewFrame({
  fromName = "Mynder",
  fromEmail = "no-reply@mynder.no",
  subject,
  children,
}: EmailPreviewFrameProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="border-b border-border bg-background px-5 py-3 space-y-1">
        <div className="text-sm font-semibold text-foreground">{subject}</div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{fromName}</span> &lt;{fromEmail}&gt;
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto">{children}</div>
    </div>
  );
}
