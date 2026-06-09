import { useCallback, useEffect, useMemo, useState } from "react";
import { MATURITY_AREAS, ALL_MATURITY_QUESTIONS, migrateLegacyAnswers, type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";

const storageKey = (customerId: string) => `msp.customer.baselineAnswers.${customerId}`;

export interface BaselineAreaProgress {
  id: string;
  title: string;
  answered: number;
  total: number;
}

export function useCustomerBaseline(customerId: string | undefined) {
  const [answers, setAnswers] = useState<MaturityAnswers>({});

  useEffect(() => {
    if (!customerId) return;
    try {
      const raw = localStorage.getItem(storageKey(customerId));
      if (raw) setAnswers(migrateLegacyAnswers(JSON.parse(raw)));
      else setAnswers({});
    } catch {
      setAnswers({});
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

  const setAnswer = useCallback(
    (questionId: string, value: MaturityAnswer) => {
      persist({ ...answers, [questionId]: value });
    },
    [answers, persist],
  );

  const isAnswered = (a: MaturityAnswer | undefined) => a === "yes" || a === "no" || a === "n_a";

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

  return { answers, setAnswer, areaProgress, totalAnswered, totalQuestions, completeness };
}
