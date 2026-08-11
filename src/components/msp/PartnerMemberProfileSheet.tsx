import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  PARTNER_ACCESS_LABEL,
  PARTNER_SCOPE_LABEL,
  DEFAULT_ROLE_ACCESS,
  DEFAULT_ROLE_SCOPE,
  type PartnerRole,
  type PartnerTeamMember,
} from "@/lib/partnerTeam";

interface CustomerOption {
  id: string;
  name: string;
}

interface Props {
  member: PartnerTeamMember | null;
  customers: CustomerOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Demo-aktivitet. Erstattes med reell aktivitetslogg når hendelser lagres i backend.
const DEMO_ACTIVITY: Record<
  string,
  { icon: typeof FileText; text: string; when: string }[]
> = {
  u1: [
    { icon: FileText, text: "Sendte tilbud til Bergen Energi AS", when: "I dag, 09:41" },
    { icon: MessageSquare, text: "Svarte på melding fra Nordvik Helse", when: "I går" },
    { icon: Sparkles, text: "Kjørte behovsanalyse på 4 kunder", when: "3 dager siden" },
  ],
  u2: [
    { icon: ShieldCheck, text: "Oppdaterte modenhet på Styring hos Fjord Logistikk", when: "I dag, 11:02" },
    { icon: FileText, text: "Lastet opp databehandleravtale for Nordvik Helse", when: "2 dager siden" },
    { icon: Building2, text: "Aktiverte Mynder Core for Bergen Energi AS", when: "5 dager siden" },
  ],
  u3: [
    { icon: ShieldCheck, text: "Dokumenterte 6 krav i NIS2 hos Fjord Logistikk", when: "I går" },
    { icon: FileText, text: "Registrerte avvik på leverandør Telenor", when: "4 dager siden" },
  ],
};

export function PartnerMemberProfileSheet({ member, customers, open, onOpenChange }: Props) {
  if (!member) return null;

  const roleInfo = (role: PartnerRole) => {
    const scope = member.roleScope?.[role] ?? DEFAULT_ROLE_SCOPE[role];
    const access = member.roleAccess?.[role] ?? DEFAULT_ROLE_ACCESS[role];
    const ids = member.roleCustomerIds?.[role] ?? [];
    const list = scope === "all" ? customers : customers.filter((c) => ids.includes(c.id));
    return { scope, access, list };
  };

  // Unike kunder brukeren jobber med på tvers av rollene sine.
  const uniqueCustomerIds = new Set<string>();
  member.roles.forEach((r) => roleInfo(r).list.forEach((c) => uniqueCustomerIds.add(c.id)));
  const customerCount = uniqueCustomerIds.size;
  const activity = DEMO_ACTIVITY[member.id] ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-base font-medium text-primary shrink-0">
              {member.initials}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{member.name}</SheetTitle>
              <SheetDescription className="truncate">{member.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wider">Kunder</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">{customerCount}</p>
            <p className="text-xs text-muted-foreground">jobber med i dag</p>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wider">Roller</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">{member.roles.length}</p>
            <p className="text-xs text-muted-foreground">
              {member.roles.length === 0 ? "kun medlem" : member.roles.join(" + ").toLowerCase()}
            </p>
          </div>
        </div>

        <Separator className="my-5" />

        <h3 className="text-sm font-semibold text-foreground mb-2">Roller og omfang</h3>
        {member.roles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Kun medlem — ser partnerdelen, men jobber ikke hos kundene.
          </p>
        )}
        <div className="space-y-2.5">
          {member.roles.map((role) => {
            const { scope, access, list } = roleInfo(role);
            return (
              <div key={role} className="rounded-lg border border-border px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{role}</span>
                  <Badge variant="secondary" className="text-xs">
                    {PARTNER_ACCESS_LABEL[access]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {PARTNER_SCOPE_LABEL[scope]} · {list.length} {list.length === 1 ? "kunde" : "kunder"}
                </p>
                {list.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.slice(0, 8).map((c) => (
                      <span
                        key={c.id}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80"
                      >
                        {c.name}
                      </span>
                    ))}
                    {list.length > 8 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{list.length - 8} til
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="my-5" />

        <h3 className="text-sm font-semibold text-foreground mb-2">Siste aktivitet</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen registrert aktivitet ennå.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
