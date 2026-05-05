import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronRight } from "lucide-react";
import {
  TRUST_CONTENT_MATRIX,
  type FieldVisibility,
  type MatrixRow,
} from "@/lib/trustContentMatrixDefinitions";
import { cn } from "@/lib/utils";

interface TrustContentMatrixProps {
  /** Optional: override row status (filled/missing/auto) for the right-hand pill. */
  getRowStatus?: (rowId: string) => "filled" | "missing" | "auto" | undefined;
}

const visibilityDot = (v: FieldVisibility) => {
  if (v === "profile") return "bg-primary";
  if (v === "center") return "bg-accent";
  return "bg-muted-foreground/30";
};

const visibilityText = (v: FieldVisibility) => {
  if (v === "hidden") return "italic text-muted-foreground/70";
  if (v === "profile") return "text-foreground";
  return "text-foreground";
};

export function TrustContentMatrix({ getRowStatus }: TrustContentMatrixProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();

  const handleEdit = (row: MatrixRow) => {
    if (!row.editTarget) return;
    if (row.editTarget.kind === "section") {
      document
        .querySelector(row.editTarget.anchor)
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(row.editTarget.href);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header explainer */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <p className="text-sm text-foreground font-medium mb-1">
          {isNb ? "Innholdsmatrise" : "Content matrix"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isNb
            ? "Oversikt over alt innhold som kan vises i din Trust Profile (one-pager) og Trust Center (full visning). Klikk på en rad for å redigere."
            : "Overview of all content that can be shown in your Trust Profile (one-pager) and Trust Center (full view). Click a row to edit."}
        </p>
      </Card>

      {/* Column legend */}
      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>{isNb ? "Felt" : "Field"}</div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", "bg-primary")} />
          {isNb ? "Trust Profile" : "Trust Profile"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", "bg-accent")} />
          {isNb ? "Trust Center" : "Trust Center"}
        </div>
        <div className="w-16 text-right">{isNb ? "Handling" : "Action"}</div>
      </div>

      {/* Groups */}
      {TRUST_CONTENT_MATRIX.map((group) => (
        <section key={group.id} id={`matrix-${group.id}`} className="space-y-2">
          <div className="rounded-lg bg-muted/40 px-4 py-2 border border-border">
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? group.labelNb : group.labelEn}
            </h3>
          </div>

          <Card className="divide-y divide-border overflow-hidden">
            {group.rows.map((row) => {
              const status = getRowStatus?.(row.id);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Field */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {isNb ? row.labelNb : row.labelEn}
                      </p>
                      {status && (
                        <Badge
                          variant={
                            status === "filled"
                              ? "action"
                              : status === "auto"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] h-4 px-1.5"
                        >
                          {status === "filled"
                            ? isNb
                              ? "Utfylt"
                              : "Filled"
                            : status === "auto"
                            ? isNb
                              ? "Auto"
                              : "Auto"
                            : isNb
                            ? "Mangler"
                            : "Missing"}
                        </Badge>
                      )}
                    </div>
                    {(row.helpNb || row.helpEn) && (
                      <p className="text-xs text-muted-foreground">
                        {isNb ? row.helpNb : row.helpEn}
                      </p>
                    )}
                  </div>

                  {/* Profile column */}
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                        visibilityDot(row.profileVisibility)
                      )}
                    />
                    <p
                      className={cn(
                        "text-xs leading-snug",
                        visibilityText(row.profileVisibility)
                      )}
                    >
                      {isNb ? row.profileNb : row.profileEn}
                    </p>
                  </div>

                  {/* Center column */}
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                        visibilityDot(row.centerVisibility)
                      )}
                    />
                    <p
                      className={cn(
                        "text-xs leading-snug",
                        visibilityText(row.centerVisibility)
                      )}
                    >
                      {isNb ? row.centerNb : row.centerEn}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-start justify-end">
                    {row.editTarget ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleEdit(row)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {isNb ? "Rediger" : "Edit"}
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic px-2">
                        {isNb ? "Auto" : "Auto"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      ))}

      {/* Legend footer */}
      <Card className="p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {isNb ? "Vises på Trust Profile" : "Shown on Trust Profile"}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {isNb ? "Vises i Trust Center" : "Shown in Trust Center"}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          {isNb ? "Ikke synlig på flaten" : "Not visible on this surface"}
        </div>
      </Card>
    </div>
  );
}
