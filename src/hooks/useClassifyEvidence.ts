import { useState, useCallback } from "react";
import type { ControlAreaKey } from "@/lib/controlAreas";
import type { QualityFinding, SharingLevel } from "@/lib/evidenceStatus";

export interface EvidenceClassification {
  documentType: string;
  documentTypeLabel: string;
  controlAreas: ControlAreaKey[];
  supportedControls: string[];
  confidence: number;
  summary: string;
  qualityFindings: QualityFinding[];
  suggestedSharingLevel: SharingLevel;
  extractedMetadata: {
    owner?: string;
    version?: string;
    lastUpdated?: string;
    approvalDate?: string;
    approvedBy?: string;
    nextReviewDate?: string;
    expiryDate?: string;
  };
}

const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Calls the classify-evidence-document edge function.
 * Falls back to manual mode on error, timeout, or low confidence.
 */
export function useClassifyEvidence() {
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "analyzing"; fileName: string }
    | { phase: "review"; classification: EvidenceClassification }
    | { phase: "manual"; reason: "error" | "low_confidence" | "timeout" }
  >({ phase: "idle" });

  const classify = useCallback(async (file: File) => {
    setState({ phase: "analyzing", fileName: file.name });

    // Read text content (best effort for text/PDF-like files)
    const text = await readFileTextSafe(file);
    const documentText = text.length > 100
      ? text
      : `[Binary file: ${file.name}, size: ${file.size} bytes, type: ${file.type}]`;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 25000),
      );
      const invokePromise = supabase.functions.invoke("classify-evidence-document", {
        body: { documentText, fileName: file.name },
      });

      const result = (await Promise.race([invokePromise, timeoutPromise])) as Awaited<typeof invokePromise>;
      if (result.error) throw result.error;

      const cls = result.data?.classification as EvidenceClassification | undefined;
      if (!cls) throw new Error("no_classification");

      if (cls.confidence < CONFIDENCE_THRESHOLD) {
        setState({ phase: "manual", reason: "low_confidence" });
        return { fallback: true as const, classification: cls };
      }

      setState({ phase: "review", classification: cls });
      return { fallback: false as const, classification: cls };
    } catch (err) {
      const reason = err instanceof Error && err.message === "timeout" ? "timeout" : "error";
      setState({ phase: "manual", reason });
      return { fallback: true as const, classification: null };
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, classify, reset };
}

function readFileTextSafe(f: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsText(f);
  });
}
