import { Fragment, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OPPORTUNITY_CUSTOMERS,
  SCOPE_LABEL,
  allFrameworks,
  allIndustries,
  servicesForCustomer,
  sortedTasks,
  type OpportunityCustomer,
} from "@/lib/partnerOpportunities";
import { MSPCreateOfferDialog } from "@/components/msp/MSPCreateOfferDialog";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export default function MSPOpportunities() {
  const [industry, setIndustry] = useState<string>(ALL);
  const [framework, setFramework] = useState<string>(ALL);
  const [takeover, setTakeover] = useState<string>(ALL);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [offerFor, setOfferFor] = useState<OpportunityCustomer | null>(null);

  const rows = useMemo(
    () =>
      OPPORTUNITY_CUSTOMERS.filter((c) => {
        if (industry !== ALL && c.industry !== industry) return false;
        if (framework !== ALL) {
          const has =
            c.suggestedFrameworks.includes(framework) ||
            c.tasks.some((t) => t.frameworks.includes(framework));
          if (!has) return false;
        }
        if (takeover === "yes" && !c.profileTakenOver) return false;
        if (takeover === "no" && c.profileTakenOver) return false;
        return true;
      }),
    [industry, framework, takeover],
  );

  const selectedTasks = (c: OpportunityCustomer) => {
    const ids = selected[c.id];
    const tasks = sortedTasks(c);
    if (!ids || ids.length === 0) return tasks;
    return tasks.filter((t) => ids.includes(t.id));
  };

  const toggleTask = (customerId: string, taskId: string, allIds: string[]) => {
    setSelected((prev) => {
      const current = prev[customerId] ?? allIds;
      const next = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId];
      return { ...prev, [customerId]: next };
    });
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <main className="flex-1 pt-16">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-foreground">Muligheter</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Oversikt over arbeid du kan tilby kundene dine. Foreslåtte regelverk er forslag
              basert på opplysninger fra offentlig register — kunden bekrefter selv hva som gjelder.
            </p>
          </header>

          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[180px]">
                <label htmlFor="filter-industry" className="block text-xs font-medium text-foreground mb-1">
                  Bransje
                </label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="filter-industry"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Alle bransjer</SelectItem>
                    {allIndustries().map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <label htmlFor="filter-framework" className="block text-xs font-medium text-foreground mb-1">
                  Regelverk
                </label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger id="filter-framework"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Alle regelverk</SelectItem>
                    {allFrameworks().map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[220px]">
                <label htmlFor="filter-takeover" className="block text-xs font-medium text-foreground mb-1">
                  Profil overtatt av kunden
                </label>
                <Select value={takeover} onValueChange={setTakeover}>
                  <SelectTrigger id="filter-takeover"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Alle kunder</SelectItem>
                    <SelectItem value="yes">Overtatt av kunden</SelectItem>
                    <SelectItem value="no">Forvaltes av deg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Kunder med mulige oppgaver, foreslåtte regelverk og tjenester som dekker oppgavene
              </caption>
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th scope="col" className="p-3 font-semibold text-foreground">Kunde</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Bransje</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Foreslått regelverk</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Aktiverte produkter</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Mulige oppgaver</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Tjenester som dekker</th>
                  <th scope="col" className="p-3 font-semibold text-foreground">Handling</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const isOpen = expanded === c.id;
                  const tasks = sortedTasks(c);
                  const allIds = tasks.map((t) => t.id);
                  const chosen = selected[c.id] ?? allIds;
                  return (
                    <Fragment key={c.id}>
                      <tr className="border-t border-border align-top">
                        <th scope="row" className="p-3 text-left font-medium text-foreground">
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : c.id)}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1.5 hover:underline"
                          >
                            <ChevronDown
                              aria-hidden="true"
                              className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                            />
                            {c.name}
                          </button>
                          <span className="block mt-1 text-xs font-normal text-muted-foreground">
                            {c.profileTakenOver ? "Profil overtatt av kunden" : "Profil forvaltes av deg"}
                          </span>
                        </th>
                        <td className="p-3 text-muted-foreground">{c.industry}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {c.suggestedFrameworks.map((f) => (
                              <Badge key={f} variant="secondary" className="font-normal">
                                {f} (forslag)
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {c.activatedProducts.length > 0 ? c.activatedProducts.join(", ") : "Ingen aktivert"}
                        </td>
                        <td className="p-3 text-foreground tabular-nums">{c.tasks.length}</td>
                        <td className="p-3 text-muted-foreground">{servicesForCustomer(c).join(", ")}</td>
                        <td className="p-3">
                          <Button size="sm" onClick={() => setOfferFor(c)}>
                            Opprett tilbud
                          </Button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-border bg-muted/30">
                          <td colSpan={7} className="p-4">
                            <h2 className="text-sm font-semibold text-foreground">
                              Dette kan gjøres hos {c.name}, i anbefalt rekkefølge
                            </h2>
                            <ol className="mt-3 space-y-3">
                              {tasks.map((t, i) => (
                                <li key={t.id} className="flex gap-3">
                                  <Checkbox
                                    id={`task-${t.id}`}
                                    checked={chosen.includes(t.id)}
                                    onCheckedChange={() => toggleTask(c.id, t.id, allIds)}
                                    className="mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <label htmlFor={`task-${t.id}`} className="text-sm font-medium text-foreground">
                                      {i + 1}. {t.name}
                                    </label>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      <Badge variant="outline" className="font-normal">{SCOPE_LABEL[t.scope]}</Badge>
                                      {t.aiSuggested && (
                                        <Badge variant="secondary" className="font-normal">Forslag fra Lara (KI)</Badge>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                      Løfter: {t.requirements.join(", ")} ({t.frameworks.join(", ")}).
                                      Dekkes av tjenesten «{t.service}».
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {rows.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                      Ingen kunder passer med filtrene. Nullstill et filter for å se flere muligheter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </main>

      {offerFor && (
        <MSPCreateOfferDialog
          open={!!offerFor}
          onOpenChange={(o) => !o && setOfferFor(null)}
          customerId={offerFor.id}
          customerName={offerFor.name}
          customerContactName={offerFor.name}
          serviceTitle={`Mulige oppgaver hos ${offerFor.name}`}
          offeredServiceNames={Array.from(new Set(selectedTasks(offerFor).map((t) => t.service)))}
          defaultTasks={selectedTasks(offerFor).map((t) => ({
            label: t.name,
            hours: t.estimateHours,
            owner: "Partner" as const,
            note: `${t.frameworks.join(", ")} · ${t.requirements.join(", ")}`,
          }))}
        />
      )}
    </div>
  );
}
