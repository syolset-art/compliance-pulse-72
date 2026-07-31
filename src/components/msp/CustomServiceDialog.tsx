import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,

} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Link2, Plus, Trash2, ListChecks, ChevronDown } from "lucide-react";
import {
  suggestControlPoints,
  type ControlSuggestion,
  type MatchConfidence,
} from "@/lib/serviceMappingSuggester";
import { lookupServiceDescription } from "@/lib/serviceDescriptionLookup";
import { AiMappingDisclosure } from "@/components/msp/AiMappingDisclosure";
import { cn } from "@/lib/utils";

export interface ServiceMapping {
  frameworkId: string;
  frameworkShortName: string;
  controlId: string;
  controlLabel: string;
  /**
   * True når mennesket aktivt har bekreftet koblingen. Eldre lagrede mappinger
   * mangler feltet og behandles som bekreftet (bakoverkompatibelt).
   */
  confirmed?: boolean;
}

export interface ServiceActivity {
  label: string;
  hours: number;
}

export interface CustomServiceDraft {
  name: string;
  description?: string;
  /** Sum av aktivitetstimer. Pris = hours × partnerens timepris. */
  hours: number;
  activities: ServiceActivity[];
  mappings: ServiceMapping[];
  /** Overstyrt totalpris. Hvis satt, brukes denne i stedet for hours × timepris. */
  priceOverride?: number;
  /** Beskrivelsen kom fra KI-forslag (f.eks. ServiceCoverageSearch). */
  descriptionFromAi?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CustomServiceDraft) => void;
  defaultHourlyRate: number;
  /** Hvis satt: redigeringsmodus med forhåndsutfylte verdier. */
  initial?: CustomServiceDraft;
  /** Tittel-override for redigeringsmodus. */
  mode?: "create" | "edit";
}

function suggestionKey(s: { frameworkId: string; controlId: string }): string {
  return `${s.frameworkId}::${s.controlId}`;
}

function mappingKey(m: ServiceMapping): string {
  return `${m.frameworkId}::${m.controlId}`;
}

export function CustomServiceDialog({
  open,
  onOpenChange,
  onSave,
  defaultHourlyRate,
  initial,
  mode = "create",
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activities, setActivities] = useState<ServiceActivity[]>([]);

  const [selectedMappings, setSelectedMappings] = useState<Set<string>>(new Set());
  /** Mappings som ikke finnes blant Lara-forslag (f.eks. fra adopterte maler) — beholdes som-er. */
  const [extraMappings, setExtraMappings] = useState<ServiceMapping[]>([]);
  const [userTouchedMappings, setUserTouchedMappings] = useState(false);
  const [usePriceOverride, setUsePriceOverride] = useState(false);
  const [priceOverride, setPriceOverride] = useState<number>(0);
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggestDescription = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSuggesting(true);
    window.setTimeout(() => {
      const found = lookupServiceDescription(trimmed);
      setDescription(
        found ??
          `${trimmed} leveres som en tilbakevendende tjeneste med kartlegging, gjennomføring og dokumentert oppfølging, slik at kunden kan vise etterlevelse av relevante krav.`,
      );
      setSuggesting(false);
    }, 600);
  };



  // Prefill ved åpning
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDescription(initial.description ?? "");
      setActivities(
        initial.activities.length > 0
          ? initial.activities
          : [{ label: "", hours: Math.max(0, initial.hours) }],
      );
      setSelectedMappings(new Set(initial.mappings.map(mappingKey)));
      setExtraMappings(initial.mappings);
      setUserTouchedMappings(true);
      const hasOverride = typeof initial.priceOverride === "number" && initial.priceOverride > 0;
      setUsePriceOverride(hasOverride);
      setPriceOverride(hasOverride ? initial.priceOverride : 0);
    } else {
      setName("");
      setDescription("");
      setActivities([{ label: "", hours: 1 }]);

      setSelectedMappings(new Set());
      setExtraMappings([]);
      setUserTouchedMappings(false);
      setUsePriceOverride(false);
      setPriceOverride(0);
    }
  }, [open, initial]);

  const suggestions: ControlSuggestion[] = useMemo(
    () => suggestControlPoints({ name, description }),
    [name, description],
  );

  // Auto-velg kun forslag med høy/middels konfidens når brukeren ikke har overstyrt
  useEffect(() => {
    if (userTouchedMappings) return;
    const strong = suggestions
      .filter((s) => s.confidence !== "low")
      .slice(0, 3)
      .map(suggestionKey);
    setSelectedMappings(new Set(strong));
  }, [suggestions, userTouchedMappings]);

  const totalHours = useMemo(
    () => activities.reduce((sum, a) => sum + (Number.isFinite(a.hours) ? a.hours : 0), 0),
    [activities],
  );

  const estimate = totalHours * defaultHourlyRate;

  const toggleSuggestion = (s: ControlSuggestion) => {
    setUserTouchedMappings(true);
    const key = suggestionKey(s);
    setSelectedMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removeExtraMapping = (m: ServiceMapping) => {
    setUserTouchedMappings(true);
    setExtraMappings((prev) => prev.filter((x) => mappingKey(x) !== mappingKey(m)));
    setSelectedMappings((prev) => {
      const next = new Set(prev);
      next.delete(mappingKey(m));
      return next;
    });
  };

  const addActivity = () => setActivities((prev) => [...prev, { label: "", hours: 1 }]);
  const removeActivity = (i: number) =>
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  const updateActivity = (i: number, patch: Partial<ServiceActivity>) =>
    setActivities((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const submit = () => {
    if (!name.trim()) return;
    // Behold mappings fra både Lara-forslag og pre-eksisterende (initial / adopterte)
    const fromSuggestions: ServiceMapping[] = suggestions
      .filter((s) => selectedMappings.has(suggestionKey(s)))
      .map((s) => ({
        frameworkId: s.frameworkId,
        frameworkShortName: s.frameworkShortName,
        controlId: s.controlId,
        controlLabel: s.controlLabel,
        // Avhuket av mennesket = bekreftet kobling
        confirmed: true,
      }));
    const keptExtras = extraMappings
      .filter(
        (m) =>
          selectedMappings.has(mappingKey(m)) &&
          !fromSuggestions.some((s) => mappingKey(s) === mappingKey(m)),
      )
      .map((m) => ({ ...m, confirmed: true }));
    const cleanedActivities = activities
      .map((a) => ({ label: a.label.trim(), hours: Math.max(0, a.hours || 0) }))
      .filter((a) => a.label.length > 0 || a.hours > 0);
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      hours: cleanedActivities.reduce((s, a) => s + a.hours, 0),
      activities: cleanedActivities,
      mappings: [...fromSuggestions, ...keptExtras],
      priceOverride: usePriceOverride && priceOverride > 0 ? Math.round(priceOverride) : undefined,
    });
    onOpenChange(false);
  };

  const selectedCount = selectedMappings.size;
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Rediger tjeneste" : "Legg til egen tjeneste"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Navn på tjenesten</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. kurs av ansatte, phishing-simulering, backup-overvåking"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cs-desc">Beskrivelse</Label>
              <Button

                type="button"
                variant="ghost"
                size="sm"
                disabled={!name.trim() || suggesting}
                onClick={handleSuggestDescription}
                className="h-7 px-2 text-[11px] text-primary hover:text-primary"
              >
                <Sparkles className={cn("h-3 w-3 mr-1", suggesting && "animate-pulse")} />
                {suggesting
                  ? "Lara skriver …"
                  : description.trim()
                    ? "Foreslå på nytt"
                    : "Foreslå med Lara"}
              </Button>
            </div>
            <Textarea
              id="cs-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Legg til detaljer for bedre forslag — eller la Lara foreslå"

              rows={2}
            />
          </div>


          {/* Aktiviteter */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                Aktiviteter
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                Sum: {totalHours} t
              </span>
            </div>
            <ul className="space-y-1.5">
              {activities.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input
                    value={a.label}
                    onChange={(e) => updateActivity(i, { label: e.target.value })}
                    placeholder={`Aktivitet ${i + 1} — f.eks. "Gjennomgang med kunden"`}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={a.hours}
                    onChange={(e) =>
                      updateActivity(i, { hours: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="h-8 w-20 text-xs tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground w-3">t</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(i)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Fjern aktivitet"
                    disabled={activities.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addActivity}
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Legg til aktivitet
            </Button>
          </div>

          {/* Lara-forslag for kontrollområder */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Foreslåtte kontrollområder
                <AiMappingDisclosure variant="icon" className="text-primary/70" />
              </span>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {selectedCount} bekreftet
                {pendingCount > 0 && ` · ${pendingCount} til vurdering`}
              </span>
            </div>

            {/* Allerede koblede (fra adopsjon e.l.) som ikke er blant Lara-forslag */}
            {extraMappings
              .filter(
                (m) =>
                  !suggestions.some(
                    (s) => s.frameworkId === m.frameworkId && s.controlId === m.controlId,
                  ),
              )
              .map((m) => {
                const key = mappingKey(m);
                const checked = selectedMappings.has(key);
                return (
                  <label
                    key={`extra-${key}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 cursor-pointer transition-colors",
                      checked ? "border-primary/40" : "border-border hover:border-foreground/30",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setUserTouchedMappings(true);
                        setSelectedMappings((prev) => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        });
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs flex-wrap">
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
                          {m.frameworkShortName}
                        </span>
                        <span className="text-muted-foreground">›</span>
                        <span className="font-medium text-foreground">{m.controlId}</span>
                        <span className="text-muted-foreground">›</span>
                        <span className="text-foreground/80">{m.controlLabel}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(ev) => {
                        ev.preventDefault();
                        removeExtraMapping(m);
                      }}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      aria-label="Fjern kobling"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </label>
                );
              })}

            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Skriv navn på tjenesten — forslag vises automatisk.
              </p>
            ) : (
              <>
                <ul className="space-y-1">
                  {strongSuggestions.map((s) => (
                    <SuggestionRow
                      key={suggestionKey(s)}
                      suggestion={s}
                      checked={selectedMappings.has(suggestionKey(s))}
                      onToggle={() => toggleSuggestion(s)}
                    />
                  ))}
                </ul>

                {weakSuggestions.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowWeak((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={cn("h-3 w-3 transition-transform", showWeak && "rotate-180")}
                      />
                      {showWeak
                        ? "Skjul svakere forslag"
                        : `Vis ${weakSuggestions.length} svakere forslag`}
                    </button>
                    {showWeak && (
                      <ul className="space-y-1 mt-1.5">
                        {weakSuggestions.map((s) => (
                          <SuggestionRow
                            key={suggestionKey(s)}
                            suggestion={s}
                            checked={selectedMappings.has(suggestionKey(s))}
                            onToggle={() => toggleSuggestion(s)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>


          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 space-y-2">
            <div className="text-sm flex items-center justify-between">
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Estimert pris ({totalHours} t × {defaultHourlyRate.toLocaleString("nb-NO")} kr/t)
              </span>
              <span className="font-semibold tabular-nums">
                {new Intl.NumberFormat("nb-NO").format(Math.round(estimate))} kr
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Switch
                  id="price-override"
                  checked={usePriceOverride}
                  onCheckedChange={setUsePriceOverride}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="price-override" className="text-sm cursor-pointer">
                  Sett egen pris
                </Label>
              </div>
              {usePriceOverride && (
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(Math.max(0, Number(e.target.value) || 0))}
                    className="h-8 w-28 text-sm tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground">kr</span>
                </div>
              )}
            </div>
            {usePriceOverride && (
              <div className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Endelig pris</span>
                <span className="font-semibold tabular-nums">
                  {new Intl.NumberFormat("nb-NO").format(Math.round(priceOverride))} kr
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={submit} disabled={!name.trim() || totalHours <= 0}>
            {isEdit ? "Lagre endringer" : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
