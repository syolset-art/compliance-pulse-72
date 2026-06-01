import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFrameworkQuestionnaire,
  scoreQuestionnaire,
  type GapAnswer,
} from "@/lib/frameworkQuestionnaires";

const STORAGE_PREFIX = "mynder-framework-questionnaire-";

interface StoredState {
  answers: Record<string, GapAnswer>;
  comments: Record<string, string>;
  updatedAt: string;
  completedAt?: string;
}

function read(frameworkId: string): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + frameworkId);
    if (!raw) return { answers: {}, comments: {}, updatedAt: "" };
    return JSON.parse(raw) as StoredState;
  } catch {
    return { answers: {}, comments: {}, updatedAt: "" };
  }
}

export function useFrameworkQuestionnaire(frameworkId: string | undefined) {
  const definition = useMemo(
    () => (frameworkId ? getFrameworkQuestionnaire(frameworkId) : null),
    [frameworkId],
  );

  const [state, setState] = useState<StoredState>(() =>
    frameworkId ? read(frameworkId) : { answers: {}, comments: {}, updatedAt: "" },
  );

  useEffect(() => {
    if (frameworkId) setState(read(frameworkId));
  }, [frameworkId]);

  const persist = useCallback(
    (next: StoredState) => {
      if (!frameworkId) return;
      localStorage.setItem(STORAGE_PREFIX + frameworkId, JSON.stringify(next));
      setState(next);
    },
    [frameworkId],
  );

  const setAnswer = useCallback(
    (questionId: string, answer: GapAnswer) => {
      persist({
        ...state,
        answers: { ...state.answers, [questionId]: answer },
        updatedAt: new Date().toISOString(),
      });
    },
    [persist, state],
  );

  const setComment = useCallback(
    (questionId: string, comment: string) => {
      persist({
        ...state,
        comments: { ...state.comments, [questionId]: comment },
        updatedAt: new Date().toISOString(),
      });
    },
    [persist, state],
  );

  const markCompleted = useCallback(() => {
    persist({ ...state, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }, [persist, state]);

  const reset = useCallback(() => {
    persist({ answers: {}, comments: {}, updatedAt: new Date().toISOString() });
  }, [persist]);

  const score = useMemo(
    () => (definition ? scoreQuestionnaire(definition, state.answers) : null),
    [definition, state.answers],
  );

  return {
    definition,
    answers: state.answers,
    comments: state.comments,
    updatedAt: state.updatedAt,
    completedAt: state.completedAt,
    setAnswer,
    setComment,
    markCompleted,
    reset,
    score,
  };
}
