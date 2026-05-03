import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, CalendarPlus, ClipboardList, Sparkles } from "lucide-react";
import { LaraAvatar } from "./LaraAvatar";
import type { NextActionDraft } from "@/utils/vendorGuidanceData";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: NextActionDraft | null;
  isNb?: boolean;
  onSend: (final: { recipient?: string; subject: string; body: string }) => void;
}

export function LaraActionPreviewDialog({ open, onOpenChange, draft, isNb = true, onSend }: Props) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!draft) return;
    setRecipient(draft.recipient ?? "");
    setSubject((isNb ? draft.subjectNb : draft.subjectEn) ?? "");
    setBody((isNb ? draft.bodyNb : draft.bodyEn) ?? "");
  }, [draft, isNb]);

  if (!draft) return null;

  const Icon = draft.type === "email" ? Send : draft.type === "meeting" ? CalendarPlus : ClipboardList;
  const titleNb = draft.type === "email" ? "Forhåndsvis e-post" : draft.type === "meeting" ? "Forhåndsvis møteinvitasjon" : "Forhåndsvis oppgave";
  const titleEn = draft.type === "email" ? "Preview email"        : draft.type === "meeting" ? "Preview meeting invitation" : "Preview task";

  const ctaNb = draft.type === "email" ? "Send nå" : draft.type === "meeting" ? "Send invitasjon" : "Opprett oppgave";
  const ctaEn = draft.type === "email" ? "Send now" : draft.type === "meeting" ? "Send invitation" : "Create task";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {isNb ? titleNb : titleEn}
            <Badge variant="outline" className="ml-1 gap-1 rounded-pill border-primary/30 text-primary">
              <Sparkles className="h-3 w-3" />
              {isNb ? "Utkast fra Lara" : "Draft from Lara"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl bg-purple-100 p-3 flex items-start gap-2">
          <LaraAvatar size={22} />
          <p className="text-[12px] text-purple-900 leading-relaxed">
            {isNb ? draft.proposalNb : draft.proposalEn}
          </p>
        </div>

        <div className="space-y-3">
          {(draft.type === "email" || draft.type === "meeting") && (
            <div className="space-y-1">
              <Label htmlFor="lara-recipient" className="text-xs">{isNb ? "Til" : "To"}</Label>
              <Input id="lara-recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="h-9" />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="lara-subject" className="text-xs">
              {isNb ? (draft.type === "task" ? "Oppgavetittel" : "Emne") : (draft.type === "task" ? "Task title" : "Subject")}
            </Label>
            <Input id="lara-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lara-body" className="text-xs">
              {isNb ? (draft.type === "task" ? "Beskrivelse" : "Innhold") : (draft.type === "task" ? "Description" : "Body")}
            </Label>
            <Textarea id="lara-body" value={body} onChange={(e) => setBody(e.target.value)} rows={9} className="text-sm" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-pill" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button
            className="rounded-pill gap-1.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            onClick={() => onSend({ recipient: recipient || undefined, subject, body })}
          >
            <Icon className="h-3.5 w-3.5" />
            {isNb ? ctaNb : ctaEn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
