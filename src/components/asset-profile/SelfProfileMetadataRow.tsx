import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Pencil, Check, X } from "lucide-react";

const CATEGORIES = [
  { value: "saas", label: "SaaS" },
  { value: "software", label: "Programvare" },
  { value: "consulting", label: "Konsulenttjenester" },
  { value: "manufacturing", label: "Produksjon" },
  { value: "finance", label: "Finans" },
  { value: "health", label: "Helse" },
  { value: "public", label: "Offentlig" },
  { value: "other", label: "Annet" },
];

const COUNTRIES = [
  "Norge", "Sverige", "Danmark", "Finland", "Island",
  "Tyskland", "Storbritannia", "USA", "Annet",
];

interface SelfProfileMetadataRowProps {
  asset: Record<string, any>;
  companyProfile: Record<string, any> | null | undefined;
  updateAsset: { mutate: (updates: Record<string, any>) => void; isPending: boolean };
  updateCompanyProfile: { mutate: (updates: Record<string, any>) => void };
  isNb: boolean;
}

export function SelfProfileMetadataRow({
  asset,
  companyProfile,
  updateAsset,
  updateCompanyProfile,
  isNb,
}: SelfProfileMetadataRowProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = (field: string) => {
    if (field === "industry") {
      updateCompanyProfile.mutate({ industry: editValue });
      updateAsset.mutate({ category: asset.category }); // trigger refresh
    } else if (field === "org_number") {
      updateAsset.mutate({ org_number: editValue });
    } else if (field === "url") {
      const raw = editValue.replace(/^https?:\/\//, "");
      const val = raw ? `https://${raw}` : "";
      updateAsset.mutate({ url: val });
    }
    setEditingField(null);
  };

  const handleCountryChange = (value: string) => {
    updateAsset.mutate({ country: value });
  };

  const handleCategoryChange = (value: string) => {
    updateAsset.mutate({ vendor_category: value });
  };

  const getShortUrl = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  // Demo fallback values when fields are empty (Dintero AS demo data)
  const demoOrgNumber = "916 132 088";
  const demoCountry = "Norge";
  const demoUrl = "https://dintero.com";
  const demoIndustry = "Betalingsløsninger / Fintech";
  const demoCategory = "saas";

  const industry = companyProfile?.industry || "";
  const categoryLabel = CATEGORIES.find(c => c.value === (asset.vendor_category || demoCategory))?.label || asset.vendor_category;

  const fields = [
    {
      key: "org_number",
      label: isNb ? "ORG.NR" : "ORG.NO",
      value: asset.org_number || demoOrgNumber,
      editable: true,
    },
    {
      key: "country",
      label: isNb ? "LAND" : "COUNTRY",
      value: asset.country || demoCountry,
      type: "select",
    },
    {
      key: "industry",
      label: isNb ? "BRANSJE" : "INDUSTRY",
      value: industry || demoIndustry,
      editable: true,
    },
    {
      key: "url",
      label: isNb ? "NETTSIDE" : "WEBSITE",
      value: asset.url || demoUrl,
      type: "url",
      editable: true,
    },
  ];

  return (
    <>
      <div className="border-t border-border my-4" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {f.label}
            </p>

            {editingField === f.key ? (
              <div className={`flex items-center gap-1.5 ${f.type === "url" ? "max-w-xs" : ""}`}>
                {f.type === "url" && (
                  <span className="text-[13px] text-muted-foreground bg-muted px-2 py-1.5 rounded-l-md border border-r-0 border-input shrink-0">
                    https://
                  </span>
                )}
                <Input
                  value={f.type === "url" ? editValue.replace(/^https?:\/\//, "") : editValue}
                  onChange={(e) => setEditValue(f.type === "url" ? e.target.value : e.target.value)}
                  placeholder={f.type === "url" ? "www.example.com" : ""}
                  className={`h-8 text-xs bg-background ${f.type === "url" ? "rounded-l-none min-w-[180px]" : ""}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveField(f.key);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => saveField(f.key)}>
                  <Check className="h-3.5 w-3.5 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : f.type === "select" ? (
              <Select value={asset.country || demoCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-7 text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded w-fit min-w-[80px]">
                  <SelectValue placeholder={demoCountry} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.type === "url" ? (
              <div className="flex items-center gap-1 group">
                <a
                  href={asset.url || demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {getShortUrl(asset.url || demoUrl)}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={() => startEdit("url", asset.url || demoUrl)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit(f.key, f.value === "–" ? "" : f.value)}
                className="flex items-center gap-1 group text-left"
              >
                <span className="text-xs font-medium text-foreground">{f.value}</span>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        ))}

        {/* Category / Classification */}
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {isNb ? "KATEGORI" : "CATEGORY"}
          </p>
          <Select value={asset.vendor_category || demoCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-7 text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded w-fit min-w-[80px]">
              <SelectValue placeholder={categoryLabel || "SaaS"} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
