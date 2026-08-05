import { useCallback, useEffect, useMemo, useState } from "react";
import { MATURITY_AREAS, ALL_MATURITY_QUESTIONS, migrateLegacyAnswers, type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";

const storageKey = (customerId: string) => `msp.customer.baselineAnswers.${customerId}`;
const rationaleKey = (customerId: string) => `msp.customer.laraRationales.${customerId}`;

export interface BaselineAreaProgress {
  id: string;
  title: string;
  answered: number;
  total: number;
}

export type LaraRationales = Record<string, string>;

export function useCustomerBaseline(customerId: string | undefined) {
  const [answers, setAnswers] = useState<MaturityAnswers>({});
  const [laraRationales, setLaraRationalesState] = useState<LaraRationales>({});

  useEffect(() => {
    if (!customerId) return;
    try {
      const raw = localStorage.getItem(storageKey(customerId));
      if (raw) setAnswers(migrateLegacyAnswers(JSON.parse(raw)));
      else setAnswers({});
    } catch {
      setAnswers({});
    }
    try {
      const raw = localStorage.getItem(rationaleKey(customerId));
      setLaraRationalesState(raw ? JSON.parse(raw) : {});
    } catch {
      setLaraRationalesState({});
    }
  }, [customerId]);

  const persist = useCallback(
    (next: MaturityAnswers) => {
      setAnswers(next);
      if (!customerId) return;
      try {
        localStorage.setItem(storageKey(customerId), JSON.stringify(next));
      } catch {}
    },
    [customerId],
  );

  const persistRationales = useCallback(
    (next: LaraRationales) => {
      setLaraRationalesState(next);
      if (!customerId) return;
      try {
        localStorage.setItem(rationaleKey(customerId), JSON.stringify(next));
      } catch {}
    },
    [customerId],
  );

  const setAnswer = useCallback(
    (questionId: string, value: MaturityAnswer) => {
      persist({ ...answers, [questionId]: value });
      // Når partneren overstyrer manuelt, fjern Laras begrunnelse for det spørsmålet
      if (laraRationales[questionId]) {
        const { [questionId]: _drop, ...rest } = laraRationales;
        persistRationales(rest);
      }
    },
    [answers, persist, laraRationales, persistRationales],
  );

  const setAllAnswers = useCallback(
    (next: MaturityAnswers) => {
      persist({ ...answers, ...next });
    },
    [answers, persist],
  );

  const setLaraRationales = useCallback(
    (next: LaraRationales) => {
      persistRationales({ ...laraRationales, ...next });
    },
    [laraRationales, persistRationales],
  );

  const isAnswered = (a: MaturityAnswer | undefined) => a === "done" || a === "in_progress" || a === "not_relevant";

  const areaProgress: BaselineAreaProgress[] = useMemo(
    () =>
      MATURITY_AREAS.map((area) => ({
        id: area.id,
        title: area.title,
        total: area.questions.length,
        answered: area.questions.filter((q) => isAnswered(answers[q.id])).length,
      })),
    [answers],
  );

  const totalAnswered = areaProgress.reduce((s, a) => s + a.answered, 0);
  const totalQuestions = ALL_MATURITY_QUESTIONS.length;
  const completeness = totalQuestions === 0 ? 0 : totalAnswered / totalQuestions;
  const hasAnyAnswer = totalAnswered > 0;

  return {
    answers,
    setAnswer,
    setAllAnswers,
    laraRationales,
    setLaraRationales,
    areaProgress,
    totalAnswered,
    totalQuestions,
    completeness,
    hasAnyAnswer,
  };
}
