import { useMemo, useState } from "react";
import { Sparkles, Plus, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENDOR_CATALOG } from "@/lib/vendorCatalog";
import {
  matchVendorByName,
  SUBPROCESSOR_COUNTRIES,
  type AnalyzedSubprocessor,
} from "@/lib/demoSubprocessorAnalysis";

interface Props {
  existingNames: string[];
  onAdd: (vendor: AnalyzedSubprocessor) => void;
  isNb?: boolean;
}

export function AddSubprocessorCombobox({ existingNames, onAdd, isNb = true }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualCountry, setManualCountry] = useState<string>("NO");

  const taken = useMemo(() => new Set(existingNames.map((n) => n.toLowerCase())), [existingNames]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VENDOR_CATALOG.filter((v) => !taken.has(v.name.toLowerCase()))
      .filter((v) => !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, taken]);

  const reset = () => {
    setQuery("");
    setManualMode(false);
    setManualName("");
    setManualCategory("");
    setManualCountry("NO");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handlePick = (vendorName: string) => {
    const matched = matchVendorByName(vendorName);
    onAdd(matched);
    close();
  };

  const handleManualSave = () => {
    const name = manualName.trim();
    if (!name) return;
    onAdd({
      name,
      category: manualCategory.trim() || (isNb ? "Ukjent" : "Unknown"),
      country: manualCountry || undefined,
      hasTrustProfile: false,
      dpaType: "unknown",
      source: "unmatched",
    });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {isNb ? "Legg til" : "Add"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{isNb ? "Legg til underbehandler" : "Add subprocessor"}</DialogTitle>
          <DialogDescription>
            {isNb
              ? "Søk etter leverandør eller legg til manuelt."
              : "Search for a vendor or add manually."}
          </DialogDescription>
        </DialogHeader>
        {!manualMode ? (
          <Command shouldFilter={false} className="rounded-none border-t">
            <CommandInput
              placeholder={isNb ? "Søk etter leverandør…" : "Search vendor…"}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[360px]">
              <CommandEmpty>
                <div className="px-3 py-3 text-left space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isNb ? "Ingen treff i katalogen." : "No matches in the catalogue."}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start gap-1.5"
                    onClick={() => {
                      setManualName(query);
                      setManualMode(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isNb ? `Legg til "${query || "..."}" manuelt` : `Add "${query || "..."}" manually`}
                  </Button>
                </div>
              </CommandEmpty>
              {suggestions.length > 0 && (
                <CommandGroup heading={isNb ? "Foreslått av Lara" : "Suggested by Lara"}>
                  {suggestions.map((v) => (
                    <CommandItem
                      key={v.name}
                      value={v.name}
                      onSelect={() => handlePick(v.name)}
                      className="flex items-start gap-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.category}</p>
                      </div>
                      <Check className="h-3.5 w-3.5 opacity-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {query.trim() && (
                <CommandGroup>
                  <CommandItem
                    value={`__manual__${query}`}
                    onSelect={() => {
                      setManualName(query);
                      setManualMode(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    {isNb ? `Legg til "${query}" manuelt` : `Add "${query}" manually`}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        ) : (
          <div className="p-5 space-y-3 border-t">
            <div className="space-y-1">
              <Label htmlFor="sp-name" className="text-xs">{isNb ? "Navn" : "Name"}</Label>
              <Input
                id="sp-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={isNb ? "Leverandørnavn" : "Vendor name"}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sp-purpose" className="text-xs">{isNb ? "Formål / kategori" : "Purpose / category"}</Label>
              <Input
                id="sp-purpose"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                placeholder={isNb ? "F.eks. E-post, Regnskap" : "E.g. Email, Accounting"}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isNb ? "Land" : "Country"}</Label>
              <Select value={manualCountry} onValueChange={setManualCountry}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBPROCESSOR_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-1.5">{c.flag}</span>{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setManualMode(false)}>
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button size="sm" onClick={handleManualSave} disabled={!manualName.trim()}>
                {isNb ? "Legg til" : "Add"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
