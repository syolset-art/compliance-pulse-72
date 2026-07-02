import { useRef, useState } from "react";
import { ImageIcon, Upload, X, Check, Sparkles, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { COVER_PRESETS, getCoverPreset, DEFAULT_COVER_OVERLAY, COVER_COLORS, getCoverColor } from "@/lib/coverPresets";

interface Props {
  asset: { id: string; metadata?: any } | null | undefined;
}

export function BrandingSection({ asset }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const meta = (asset?.metadata || {}) as Record<string, any>;
  const coverUrl: string | undefined = meta.cover_image_url;
  const presetId: string | undefined = meta.cover_preset_id;
  const colorId: string | undefined = meta.cover_color_id;
  const activeColor = getCoverColor(colorId);
  const overlay: number =
    typeof meta.cover_overlay === "number"
      ? meta.cover_overlay
      : activeColor?.overlay ?? getCoverPreset(presetId)?.overlay ?? DEFAULT_COVER_OVERLAY;

  const persist = async (patch: Record<string, any>) => {
    if (!asset?.id) return;
    const nextMeta = { ...meta, ...patch, last_edited_at: new Date().toISOString() };
    const { error } = await supabase.from("assets").update({ metadata: nextMeta as any }).eq("id", asset.id);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
    queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
    queryClient.invalidateQueries({ queryKey: ["self-asset-shared"] });
  };

  const handlePickPreset = async (id: string) => {
    const p = getCoverPreset(id);
    if (!p) return;
    await persist({ cover_image_url: p.url, cover_preset_id: id, cover_overlay: p.overlay, cover_color_id: null });
  };

  const handlePickColor = async (id: string) => {
    const c = getCoverColor(id);
    if (!c) return;
    await persist({ cover_image_url: null, cover_preset_id: null, cover_color_id: id, cover_overlay: c.overlay });
  };

  const handleRemove = async () => {
    await persist({ cover_image_url: null, cover_preset_id: null, cover_overlay: null, cover_color_id: null });
    toast.success(isNb ? "Bakgrunn fjernet" : "Cover removed");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset?.id) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isNb ? "Må være en bildefil" : "Must be an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(isNb ? "Maks 4 MB" : "Max 4 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${asset.id}/cover.${ext}`;
      await supabase.storage.from("company-logos").remove([filePath]);
      const { error: upErr } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      const url = `${urlData.publicUrl}?v=${Date.now()}`;
      await persist({ cover_image_url: url, cover_preset_id: null, cover_color_id: null, cover_overlay: DEFAULT_COVER_OVERLAY });
      toast.success(isNb ? "Bakgrunn lastet opp" : "Cover uploaded");
    } catch (err) {
      console.error(err);
      toast.error(isNb ? "Kunne ikke laste opp" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section id="branding" className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          {isNb ? "Profilbanner" : "Profile cover"}
        </h2>
        {(coverUrl || activeColor) && (
          <Badge variant="secondary" className="text-xs ml-auto gap-1">
            <Check className="h-3 w-3" /> {isNb ? "Valgt" : "Selected"}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {isNb
          ? "Velg hvordan toppen av Trust-profilen skal se ut: en ferdig stil, en farge, eller last opp ditt eget bilde."
          : "Pick how the top of your Trust profile looks: a preset, a color, or upload your own image."}
      </p>

      {/* Live preview */}
      <Card className="overflow-hidden">
        <div
          className="relative w-full"
          style={{ aspectRatio: "16 / 3.5" }}
        >
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(8,8,16,${overlay}) 0%, rgba(8,8,16,${overlay * 0.4}) 70%, rgba(8,8,16,${overlay * 0.6}) 100%)`,
                }}
              />
            </>
          ) : activeColor ? (
            <div className="absolute inset-0" style={{ background: activeColor.background }} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
          )}
          <div className="absolute inset-0 flex items-end p-4">
            <div className="text-background text-sm font-medium drop-shadow">
              {isNb ? "Forhåndsvisning" : "Preview"}
            </div>
          </div>
        </div>
      </Card>

      {/* Preset grid */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {isNb ? "Stiler" : "Presets"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {COVER_PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePickPreset(p.id)}
                className={`relative aspect-[16/9] overflow-hidden rounded-lg border-2 transition-all ${
                  active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                }`}
              >
                <img src={p.url} alt={p.name[isNb ? "nb" : "en"]} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                  <p className="text-xs font-medium text-white">{p.name[isNb ? "nb" : "en"]}</p>
                </div>
                {active && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color grid */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-primary" />
          {isNb ? "Farger" : "Colors"}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {COVER_COLORS.map((c) => {
            const active = colorId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handlePickColor(c.id)}
                title={c.name[isNb ? "nb" : "en"]}
                aria-label={c.name[isNb ? "nb" : "en"]}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                  active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                }`}
                style={{ background: c.background }}
              >
                {active && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload + remove */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading
            ? isNb ? "Laster opp…" : "Uploading…"
            : isNb ? "Last opp eget bilde" : "Upload your own"}
        </Button>
        {coverUrl && (
          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={handleRemove}>
            <X className="h-3.5 w-3.5" />
            {isNb ? "Fjern" : "Remove"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {isNb ? "Anbefalt 1920×600, maks 4 MB" : "Recommended 1920×600, max 4 MB"}
        </span>
      </div>

    </section>
  );
}
