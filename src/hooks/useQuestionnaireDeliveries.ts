import { useCallback, useSyncExternalStore } from "react";
import type { QuestionnaireId } from "@/lib/serviceCatalog";

/**
 * Lett, klient-side lagring av spørreskjema-oppdrag mellom partner og kunde.
 * Gjenbruker mønsteret fra useActivatedServices — localStorage, demo-grade.
 * Vil flyttes til backend i fase 2.
 */

export type DeliveryStatus = "sent" | "in_progress" | "completed";
export type AnswerValue = "yes" | "no" | "unsure";

export interface QuestionnaireDelivery {
  id: string;                       // unik id
  serviceId: string;                // PartnerService.id
  questionnaireId: QuestionnaireId;
  customerId: string;               // msp_customer.id
  customerName: string;
  partnerName: string;
  intro?: string;
  dueDate?: string;                 // ISO
  sentAt: string;                   // ISO
  completedAt?: string;             // ISO
  status: DeliveryStatus;
  answers: Record<string, AnswerValue>;
}

const STORAGE_KEY = "mynder-questionnaire-deliveries";

let listeners: Array<() => void> = [];
let cached: QuestionnaireDelivery[] = read();

function read(): QuestionnaireDelivery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuestionnaireDelivery[]) : [];
  } catch {
    return [];
  }
}

function write(next: QuestionnaireDelivery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cached = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function getSnapshot() {
  return cached;
}

export function useQuestionnaireDeliveries() {
  const deliveries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const sendDelivery = useCallback(
    (input: Omit<QuestionnaireDelivery, "id" | "sentAt" | "status" | "answers">) => {
      const next: QuestionnaireDelivery = {
        ...input,
        id: `qd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sentAt: new Date().toISOString(),
        status: "sent",
        answers: {},
      };
      write([next, ...cached]);
      return next;
    },
    [],
  );

  const saveAnswers = useCallback(
    (deliveryId: string, answers: Record<string, AnswerValue>, completed: boolean) => {
      write(
        cached.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                answers: { ...d.answers, ...answers },
                status: completed ? "completed" : "in_progress",
                completedAt: completed ? new Date().toISOString() : d.completedAt,
              }
            : d,
        ),
      );
    },
    [],
  );

  const removeDelivery = useCallback((deliveryId: string) => {
    write(cached.filter((d) => d.id !== deliveryId));
  }, []);

  return { deliveries, sendDelivery, saveAnswers, removeDelivery };
}

/** Score = % "ja"-svar av totalt antall spørsmål. */
export function scoreDelivery(d: QuestionnaireDelivery, total: number): number {
  if (total === 0) return 0;
  const yes = Object.values(d.answers).filter((a) => a === "yes").length;
  return Math.round((yes / total) * 100);
}
