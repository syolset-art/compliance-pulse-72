import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, MinusCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DeliveryFormField,
  DeliveryFormState,
  DeliveryFormTemplate,
  DeliveryFieldValue,
} from "@/lib/deliveryFormTemplates";

interface Props {
  template: DeliveryFormTemplate;
  state: DeliveryFormState;
  onChange: (next: DeliveryFormState) => void;
}

function hasValue(v: DeliveryFieldValue | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

export function DeliveryFormStepper({ template, state, onChange }: Props) {
  const setValue = useCallback(
    (fieldId: string, value: DeliveryFieldValue) => {
      onChange({
        ...state,
        values: { ...state.values, [fieldId]: value },
        updatedAt: new Date().toISOString(),
      });
    },
    [state, onChange],
  );

  const toggleSkip = useCallback(
    (stepId: string) => {
      onChange({
        ...state,
        skipped: { ...state.skipped, [stepId]: !state.skipped[stepId] },
        updatedAt: new Date().toISOString(),
      });
    },
    [state, onChange],
  );

  return (
    <div className="space-y-3">
      {template.steps.map((step, i) => {
        const skipped = !!state.skipped[step.id];
        const required = step.fields.filter((f) => f.required);
        const checkAgainst = required.length > 0 ? required : step.fields;
        const done =
          !skipped &&
          checkAgainst.some((f) => hasValue(state.values[f.id])) &&
          required.every((f) => hasValue(state.values[f.id]));

        return (
          <section
            key={step.id}
            className={cn(
              "rounded-lg border p-4 transition-colors",
              skipped
                ? "border-border/50 bg-muted/30"
                : done
                  ? "border-success/30 bg-success/[0.04]"
                  : "border-border/60 bg-card",
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5 min-w-0">
                {skipped ? (
                  <MinusCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">
                    {i + 1}. {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground shrink-0"
                onClick={() => toggleSkip(step.id)}
              >
                {skipped ? "Ta med igjen" : "Ikke aktuelt"}
              </Button>
            </div>

            {!skipped && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6.5">
                {step.fields.map((f) => (
                  <FieldControl
                    key={f.id}
                    field={f}
                    value={state.values[f.id]}
                    onChange={(v) => setValue(f.id, v)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: DeliveryFormField;
  value: DeliveryFieldValue | undefined;
  onChange: (v: DeliveryFieldValue) => void;
}) {
  const wide = field.kind === "textarea" || field.kind === "checklist";
  const str = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];

  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <label className="text-xs font-medium text-foreground/80">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {field.kind === "textarea" && (
        <Textarea
          rows={2}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        />
      )}

      {(field.kind === "text" || field.kind === "number" || field.kind === "date") && (
        <Input
          type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      )}

      {field.kind === "select" && (
        <Select value={str} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Velg…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.kind === "checklist" && (
        <div className="flex flex-wrap gap-1.5">
          {(field.items ?? []).map((item) => {
            const checked = arr.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  onChange(checked ? arr.filter((x) => x !== item) : [...arr, item])
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  checked
                    ? "border-primary/40 bg-primary/10 text-primary font-medium"
                    : "border-border/70 text-muted-foreground hover:bg-muted/50",
                )}
              >
                <Checkbox checked={checked} className="h-3 w-3 pointer-events-none" />
                {item}
              </button>
            );
          })}
        </div>
      )}

      {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
    </div>
  );
}
