import { useCallback, useEffect, useMemo, useState } from "react";

const storageKey = (customerId: string) => `msp.customer.baselineDocs.${customerId}`;

export interface BaselineDocument {
  id: string;
  areaId: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  /** Questions (activities) this document documents. */
  questionIds: string[];
  /** Question ids Lara suggested but the partner has not confirmed. */
  suggestedQuestionIds?: string[];
}

export function useBaselineDocuments(customerId: string | undefined) {
  const [documents, setDocuments] = useState<BaselineDocument[]>([]);

  useEffect(() => {
    if (!customerId) {
      setDocuments([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(customerId));
      setDocuments(raw ? (JSON.parse(raw) as BaselineDocument[]) : []);
    } catch {
      setDocuments([]);
    }
  }, [customerId]);

  const persist = useCallback(
    (next: BaselineDocument[]) => {
      setDocuments(next);
      if (!customerId) return;
      try {
        localStorage.setItem(storageKey(customerId), JSON.stringify(next));
      } catch {}
    },
    [customerId],
  );

  const addDocument = useCallback(
    (doc: Omit<BaselineDocument, "id" | "uploadedAt">) => {
      const entry: BaselineDocument = {
        ...doc,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uploadedAt: new Date().toISOString(),
      };
      persist([...documents, entry]);
      return entry;
    },
    [documents, persist],
  );

  const linkDocument = useCallback(
    (docId: string, questionIds: string[]) => {
      persist(
        documents.map((d) =>
          d.id === docId ? { ...d, questionIds, suggestedQuestionIds: [] } : d,
        ),
      );
    },
    [documents, persist],
  );

  const removeDocument = useCallback(
    (docId: string) => persist(documents.filter((d) => d.id !== docId)),
    [documents, persist],
  );

  const byArea = useMemo(() => {
    const map: Record<string, BaselineDocument[]> = {};
    documents.forEach((d) => {
      (map[d.areaId] ||= []).push(d);
    });
    return map;
  }, [documents]);

  const docsForArea = useCallback((areaId: string) => byArea[areaId] ?? [], [byArea]);

  const docsForQuestion = useCallback(
    (questionId: string) => documents.filter((d) => d.questionIds.includes(questionId)),
    [documents],
  );

  return { documents, docsForArea, docsForQuestion, addDocument, linkDocument, removeDocument };
}

/** Enkel nøkkelord-matching: foreslår hvilke spørsmål et dokument sannsynligvis dekker. */
export function suggestQuestionsForFile(
  fileName: string,
  questions: { id: string; text: string }[],
): string[] {
  const name = fileName.toLowerCase().replace(/[_\-.]+/g, " ");
  const tokens = name.split(/\s+/).filter((t) => t.length > 3);
  if (tokens.length === 0) return [];
  const scored = questions
    .map((q) => {
      const text = q.text.toLowerCase();
      const hits = tokens.filter((t) => text.includes(t.slice(0, Math.max(4, t.length - 2)))).length;
      return { id: q.id, hits };
    })
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return scored.slice(0, 2).map((s) => s.id);
}
