import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, UserPlus, Check, Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPlatformUsers, type PlatformUser } from "@/lib/platformUsers";
import type { PlanProposal } from "./LaraPlanProposal";

export type ClarifyAnswer = string;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isNb: boolean;
  proposals: PlanProposal[];
  onSubmit: (answers: Record<string, ClarifyAnswer>) => void;
}

export function LaraPlanClarifyDialog({ open, onOpenChange, isNb, proposals, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [users, setUsers] = useState<PlatformUser[]>(() => getPlatformUsers());
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
      setSearch("");
      setInviting(false);
      setInviteName("");
      setInviteEmail("");
    }
  }, [open]);

  if (proposals.length === 0) return null;

  const current = proposals[step];
  const isLast = step === proposals.length - 1;
  const requiresUser = !!current.needsClarification?.requiresUser;
  const canNext = (answers[current.id] ?? "").trim().length > 0;

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const selectUser = (u: PlatformUser) => {
    setAnswers((a) => ({ ...a, [current.id]: u.name }));
  };

  const handleInvite = () => {
    const name = inviteName.trim();
    const email = inviteEmail.trim();
    if (!name || !email || !email.includes("@")) {
      toast.error(isNb ? "Fyll inn navn og gyldig e-post" : "Enter name and a valid email");
      return;
    }
    const newUser: PlatformUser = {
      id: `invited-${Date.now()}`,
      name,
      email,
      role: "member",
      roleLabelNb: "Invitert",
      roleLabelEn: "Invited",
    };
    setUsers((prev) => [newUser, ...prev]);
    setAnswers((a) => ({ ...a, [current.id]: name }));
    setInviting(false);
    setInviteName("");
    setInviteEmail("");
    toast.success(isNb ? `Invitasjon sendt til ${email}` : `Invite sent to ${email}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isNb ? "Lara trenger litt mer info" : "Lara needs a bit more info"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Spørsmål ${step + 1} av ${proposals.length}`
              : `Question ${step + 1} of ${proposals.length}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md bg-muted/40 p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              {isNb ? "Tiltak" : "Action"}
            </p>
            <p className="text-sm font-medium text-foreground">
              {isNb ? current.titleNb : current.titleEn}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">
              {isNb ? current.needsClarification?.questionNb : current.needsClarification?.questionEn}
            </Label>

            {requiresUser ? (
              <div className="space-y-2">
                {!inviting && (
                  <>
                    <Input
                      autoFocus
                      placeholder={isNb ? "Søk etter bruker…" : "Search users…"}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
                      {filtered.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          {isNb ? "Ingen brukere funnet" : "No users found"}
                        </div>
                      )}
                      {filtered.map((u) => {
                        const selected = answers[current.id] === u.name;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectUser(u)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors",
                              selected && "bg-primary/5"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {u.email}
                                {(isNb ? u.roleLabelNb : u.roleLabelEn) && (
                                  <> · {isNb ? u.roleLabelNb : u.roleLabelEn}</>
                                )}
                              </p>
                            </div>
                            {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInviting(true);
                        if (search.includes("@")) setInviteEmail(search);
                        else if (search) setInviteName(search);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {isNb ? "Finner du ikke personen? Inviter en ny bruker" : "Can't find them? Invite a new user"}
                    </button>
                  </>
                )}

                {inviting && (
                  <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        {isNb ? "Inviter ny bruker til plattformen" : "Invite a new user to the platform"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setInviting(false);
                          setInviteName("");
                          setInviteEmail("");
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        {isNb ? "Tilbake" : "Back"}
                      </button>
                    </div>
                    <Input
                      autoFocus
                      placeholder={isNb ? "Navn" : "Name"}
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder={isNb ? "E-post" : "Email"}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" onClick={handleInvite} className="gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {isNb ? "Send invitasjon" : "Send invite"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setInviting(false);
                          setInviteName("");
                          setInviteEmail("");
                        }}
                      >
                        {isNb ? "Avbryt" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {current.needsClarification?.suggestedAnswers && current.needsClarification.suggestedAnswers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {current.needsClarification.suggestedAnswers.map((s, i) => {
                      const label = isNb ? s.nb : s.en;
                      const selected = answers[current.id] === label;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [current.id]: label }))}
                          className={cn(
                            "px-2.5 py-1 rounded-full border text-xs transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-foreground hover:bg-muted/40"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Input
                  id="clarify-input"
                  autoFocus
                  value={answers[current.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
                  placeholder={current.needsClarification?.placeholder ?? (isNb ? "Eller skriv eget svar…" : "Or write your own answer…")}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              {isNb ? "Tilbake" : "Back"}
            </Button>
          )}
          <Button
            onClick={() => {
              if (isLast) {
                onSubmit(answers);
              } else {
                setStep((s) => s + 1);
              }
            }}
            disabled={!canNext}
          >
            {isLast ? (isNb ? "Godkjenn plan" : "Approve plan") : isNb ? "Neste" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
