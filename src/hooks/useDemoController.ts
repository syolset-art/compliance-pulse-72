import { useState, useCallback, useRef } from "react";
import { useDemoSyncOptional, AssetData } from "@/contexts/DemoSyncContext";

interface DemoStep {
  action: "open_dialog" | "fill_field" | "select_option" | "click_button" | "wait" | "narrate";
  target?: string;
  value?: string;
  delay?: number;
  narration?: string;
}

interface DemoSequence {
  id: string;
  steps: DemoStep[];
}

// Predefined demo sequences
const DEMO_SEQUENCES: Record<string, DemoSequence> = {
  "add-asset": {
    id: "add-asset",
    steps: [
      { action: "narrate", narration: "Jeg viser deg hvordan du legger til en eiendel" },
      { action: "open_dialog", target: "add-asset-dialog", delay: 500 },
      { action: "narrate", narration: "Først velger vi type eiendel - la oss velge 'System'" },
      { action: "click_button", target: "asset-type-system", delay: 800 },
      { action: "narrate", narration: "Nå velger vi å bruke AI-forslag for rask utfylling" },
      { action: "click_button", target: "ai-suggestions", delay: 1000 },
      { action: "wait", delay: 2000 },
      { action: "narrate", narration: "AI har funnet relevante systemer basert på din bransje!" },
      { action: "click_button", target: "suggestion-0", delay: 500 },
      { action: "narrate", narration: "Velg systemene du vil legge til og klikk 'Legg til'" },
    ]
  }
};

export interface DemoController {
  // State
  isDemoRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentNarration: string | null;
  
  // Actions
  startDemo: (sequenceId: string) => Promise<void>;
  stopDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  nextStep: () => Promise<void>;
  
  // UI control (for conversational mode)
  openDialog: (dialogId: string) => void;
  fillField: (fieldId: string, value: string, typewriter?: boolean) => Promise<void>;
  selectOption: (fieldId: string, value: string) => void;
  clickButton: (buttonId: string) => void;
  setStep: (stepId: string) => void;
}

export function useDemoController(): DemoController {
  const demoSync = useDemoSyncOptional();
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentNarration, setCurrentNarration] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const currentSequence = useRef<DemoSequence | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const typewriterEffect = async (text: string, onChar: (partial: string) => void) => {
    let current = "";
    for (const char of text) {
      if (abortController.current?.signal.aborted) return;
      current += char;
      onChar(current);
      await delay(50 + Math.random() * 30); // Variable speed for natural feel
    }
  };

  const executeStep = async (step: DemoStep) => {
    if (abortController.current?.signal.aborted) return;
    
    switch (step.action) {
      case "narrate":
        setCurrentNarration(step.narration || null);
        break;
        
      case "open_dialog":
        if (step.target && demoSync) {
          demoSync.setActiveDialog(step.target);
          demoSync.setDemoMode("auto-demo");
        }
        break;
        
      case "fill_field":
        if (step.target && step.value && demoSync) {
          demoSync.setAnimatingField(step.target);
          await typewriterEffect(step.value, (partial) => {
            demoSync.setFieldValue(step.target as keyof AssetData, partial);
          });
          demoSync.setAnimatingField(null);
        }
        break;
        
      case "select_option":
        if (step.target && step.value && demoSync) {
          demoSync.setFieldValue(step.target as keyof AssetData, step.value);
        }
        break;
        
      case "click_button":
        // Trigger click on element with data-demo attribute
        if (step.target) {
          const element = document.querySelector(`[data-demo="${step.target}"]`);
          if (element instanceof HTMLElement) {
            element.click();
          }
        }
        break;
        
      case "wait":
        // Just wait, delay handled below
        break;
    }
    
    if (step.delay) {
      await delay(step.delay);
    }
  };

  const startDemo = useCallback(async (sequenceId: string) => {
    const sequence = DEMO_SEQUENCES[sequenceId];
    if (!sequence) {
      console.error(`Demo sequence not found: ${sequenceId}`);
      return;
    }
    
    abortController.current = new AbortController();
    currentSequence.current = sequence;
    setIsDemoRunning(true);
    setTotalSteps(sequence.steps.length);
    setCurrentStep(0);
    setIsPaused(false);
    
    if (demoSync) {
      demoSync.setDemoMode("auto-demo");
      demoSync.resetAssetData();
    }
    
    for (let i = 0; i < sequence.steps.length; i++) {
      if (abortController.current.signal.aborted) break;
      
      // Wait if paused
      while (isPaused && !abortController.current.signal.aborted) {
        await delay(100);
      }
      
      setCurrentStep(i);
      await executeStep(sequence.steps[i]);
    }
    
    setIsDemoRunning(false);
    setCurrentNarration(null);
  }, [demoSync, isPaused]);

  const stopDemo = useCallback(() => {
    abortController.current?.abort();
    setIsDemoRunning(false);
    setCurrentStep(0);
    setCurrentNarration(null);
    if (demoSync) {
      demoSync.setDemoMode(null);
      demoSync.setActiveDialog(null);
      demoSync.resetAssetData();
    }
  }, [demoSync]);

  const pauseDemo = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeDemo = useCallback(() => {
    setIsPaused(false);
  }, []);

  const nextStep = useCallback(async () => {
    const sequence = currentSequence.current;
    if (!sequence || currentStep >= sequence.steps.length - 1) return;
    
    const nextIdx = currentStep + 1;
    setCurrentStep(nextIdx);
    await executeStep(sequence.steps[nextIdx]);
  }, [currentStep]);

  // Manual control methods for conversational mode
  const openDialog = useCallback((dialogId: string) => {
    if (demoSync) {
      demoSync.setActiveDialog(dialogId);
    }
  }, [demoSync]);

  const fillField = useCallback(async (fieldId: string, value: string, typewriter = true) => {
    if (!demoSync) return;
    
    if (typewriter) {
      demoSync.setAnimatingField(fieldId);
      await typewriterEffect(value, (partial) => {
        demoSync.setFieldValue(fieldId as keyof AssetData, partial);
      });
      demoSync.setAnimatingField(null);
    } else {
      demoSync.setFieldValue(fieldId as keyof AssetData, value);
    }
  }, [demoSync]);

  const selectOption = useCallback((fieldId: string, value: string) => {
    if (demoSync) {
      demoSync.setFieldValue(fieldId as keyof AssetData, value);
    }
  }, [demoSync]);

  const clickButton = useCallback((buttonId: string) => {
    const element = document.querySelector(`[data-demo="${buttonId}"]`);
    if (element instanceof HTMLElement) {
      element.click();
    }
  }, []);

  const setStepFn = useCallback((stepId: string) => {
    if (demoSync) {
      demoSync.setCurrentStep(stepId);
    }
  }, [demoSync]);

  return {
    isDemoRunning,
    currentStep,
    totalSteps,
    currentNarration,
    startDemo,
    stopDemo,
    pauseDemo,
    resumeDemo,
    nextStep,
    openDialog,
    fillField,
    selectOption,
    clickButton,
    setStep: setStepFn,
  };
}
