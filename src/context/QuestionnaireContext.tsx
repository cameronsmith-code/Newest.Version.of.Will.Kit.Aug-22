import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { STEPS, migrateLegacyAnswers, QuestionnaireSectionId } from '../lib/steps';
import { cleanStaleAdvisorReferences, cleanStaleTrustReferences, cleanStaleLegacyIntentReferences, cleanStaleCorporateConnections, cleanStaleCurrentWillReferences } from '../lib/referentialIntegrity';

type Answer = Record<string, unknown>;

type Questionnaire = {
  id: string;
  session_id?: string;
  current_step: number;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

type QuestionnaireContextType = {
  questionnaire: Questionnaire | null;
  answers: Map<string, Answer>;
  currentStep: number;
  loading: boolean;
  error: string | null;
  initQuestionnaire: (questionnaireId?: string) => Promise<void>;
  updateAnswer: (sectionId: string, key: string, value: unknown) => void;
  saveAnswers: (sectionId: string) => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  goToStep: (targetStep: number) => void;
  completeQuestionnaire: () => Promise<void>;
  clearAllAnswers: () => Promise<void>;
  clearCurrentStepAnswers: (sectionId: string, stepNumber: number) => Promise<void>;
};

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

const STORAGE_KEY = 'willprep_questionnaire';
const ANSWERS_KEY = 'willprep_answers';
const SESSION_KEY = 'willprep_session_id';

function serializeAnswers(map: Map<string, Answer>): Record<string, Answer> {
  const obj: Record<string, Answer> = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function isLegacyNumericKey(key: string): boolean {
  const n = Number(key);
  return !isNaN(n) && n >= 1 && n <= 19 && Number.isInteger(n);
}

function loadAnswersFromStorage(): Map<string, Answer> {
  const stored = localStorage.getItem(ANSWERS_KEY);
  if (!stored) return new Map();
  const parsed = JSON.parse(stored);
  const hasNumericKeys = Object.keys(parsed).some(isLegacyNumericKey);
  if (hasNumericKeys) {
    return migrateLegacyAnswers(parsed as Record<number, Record<string, unknown>>);
  }
  const map = new Map<string, Answer>();
  Object.entries(parsed).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      map.set(key, value as Answer);
    }
  });
  return map;
}

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initQuestionnaire = useCallback(async (_questionnaireId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sessionId);
      }

      const stored = localStorage.getItem(STORAGE_KEY);

      let loadedQuestionnaire: Questionnaire | null = null;
      let loadedAnswers: Map<string, Answer> = new Map();

      if (stored) {
        loadedQuestionnaire = JSON.parse(stored);
        loadedAnswers = cleanStaleCurrentWillReferences(cleanStaleCorporateConnections(cleanStaleLegacyIntentReferences(cleanStaleTrustReferences(cleanStaleAdvisorReferences(loadAnswersFromStorage())))));

        setQuestionnaire(loadedQuestionnaire);
        setCurrentStep(loadedQuestionnaire.current_step);
        setAnswers(loadedAnswers);
        setLoading(false);

        const migratedObj = serializeAnswers(loadedAnswers);
        if (JSON.stringify(migratedObj) !== localStorage.getItem(ANSWERS_KEY)) {
          localStorage.setItem(ANSWERS_KEY, JSON.stringify(migratedObj));
        }

        if (supabase) {
          Promise.race([
            supabase
              .from('questionnaires')
              .select('*')
              .eq('session_id', sessionId)
              .maybeSingle()
              .then(async ({ data: dbQuestionnaire }) => {
                if (dbQuestionnaire) {
                  const { data: dbAnswers } = await supabase
                    .from('questionnaire_answers')
                    .select('*')
                    .eq('questionnaire_id', dbQuestionnaire.id);

                  const syncedAnswers: Map<string, Answer> = new Map();
                  if (dbAnswers && dbAnswers.length > 0) {
                    dbAnswers.forEach((ans) => {
                      const sectionId = ans.section_id as string;
                      if (!syncedAnswers.has(sectionId)) {
                        syncedAnswers.set(sectionId, {});
                      }
                      syncedAnswers.get(sectionId)![ans.question_key] = ans.answer;
                    });
                  }

                  const cleanedSynced = cleanStaleCurrentWillReferences(cleanStaleCorporateConnections(cleanStaleLegacyIntentReferences(cleanStaleTrustReferences(cleanStaleAdvisorReferences(syncedAnswers)))));
                  setAnswers(cleanedSynced);
                  setQuestionnaire(dbQuestionnaire as Questionnaire);
                  setCurrentStep(dbQuestionnaire.current_step);
                }
              }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
          ]).catch((err) => {
            console.warn('Background sync failed:', err);
          });
        }
      } else {
        const newQuestionnaire: Questionnaire = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          current_step: 1,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuestionnaire));
        setQuestionnaire(newQuestionnaire);
        setCurrentStep(1);
        setLoading(false);

        if (supabase) {
          supabase.from('questionnaires').insert([{
            id: newQuestionnaire.id,
            session_id: sessionId,
            current_step: 1,
            status: 'in_progress',
          }]).then(
            () => {},
            (err) => {
              console.warn('Failed to save to database:', err);
            }
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, []);

  const updateAnswer = useCallback((sectionId: string, key: string, value: unknown) => {
    setAnswers((prev) => {
      const updated = new Map(prev);
      if (!updated.has(sectionId)) {
        updated.set(sectionId, {});
      }
      const sectionData = { ...updated.get(sectionId)! };
      if (value === undefined) {
        delete sectionData[key];
      } else {
        sectionData[key] = value;
      }
      updated.set(sectionId, sectionData);
      return updated;
    });
  }, []);

  const saveAnswers = useCallback(
    async (sectionId: string) => {
      if (!questionnaire) return;

      setLoading(true);
      setError(null);
      try {
        localStorage.setItem(ANSWERS_KEY, JSON.stringify(serializeAnswers(answers)));

        if (supabase) {
          try {
            const sectionAnswers = answers.get(sectionId);

            const { data: existingAnswers } = await supabase
              .from('questionnaire_answers')
              .select('id, question_key')
              .eq('questionnaire_id', questionnaire.id)
              .eq('section_id', sectionId);

            const existingMap = new Map(
              (existingAnswers || []).map(a => [a.question_key, a.id])
            );

            const toInsert: Array<{ questionnaire_id: string; section_id: string; question_key: string; answer: unknown }> = [];
            const toUpdate: Array<{ id: string; answer: unknown; updated_at: string }> = [];
            const toDelete: string[] = [];

            if (sectionAnswers && Object.keys(sectionAnswers).length > 0) {
              for (const [key, value] of Object.entries(sectionAnswers)) {
                const existingId = existingMap.get(key);
                if (existingId) {
                  toUpdate.push({
                    id: existingId,
                    answer: value,
                    updated_at: new Date().toISOString()
                  });
                  existingMap.delete(key);
                } else {
                  toInsert.push({
                    questionnaire_id: questionnaire.id,
                    section_id: sectionId,
                    question_key: key,
                    answer: value,
                  });
                }
              }
            }

            for (const [, id] of existingMap.entries()) {
              toDelete.push(id);
            }

            if (toInsert.length > 0) {
              await supabase.from('questionnaire_answers').insert(toInsert);
            }

            for (const update of toUpdate) {
              await supabase
                .from('questionnaire_answers')
                .update({ answer: update.answer, updated_at: update.updated_at })
                .eq('id', update.id);
            }

            if (toDelete.length > 0) {
              await supabase
                .from('questionnaire_answers')
                .delete()
                .in('id', toDelete);
            }
          } catch (dbErr) {
            console.warn('Failed to save answers to database:', dbErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save answers');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [questionnaire, answers]
  );

  const nextStep = useCallback(async () => {
    if (!questionnaire) return;

    localStorage.setItem(ANSWERS_KEY, JSON.stringify(serializeAnswers(answers)));

    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    const updated = {
      ...questionnaire,
      current_step: newStep,
      updated_at: new Date().toISOString(),
    };
    setQuestionnaire(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const currentStepData = STEPS.find(s => s.id === currentStep);
    if (currentStepData) {
      saveAnswers(currentStepData.sectionId).catch((err) => {
        console.warn('Background save failed:', err);
      });
    }

    if (supabase) {
      supabase
        .from('questionnaires')
        .update({ current_step: newStep, updated_at: new Date().toISOString() })
        .eq('id', questionnaire.id)
        .then(
          () => {},
          (err) => {
            console.warn('Failed to update questionnaire step in database:', err);
          }
        );
    }
  }, [questionnaire, currentStep, answers, saveAnswers]);

  const previousStep = useCallback(() => {
    if (!questionnaire) return;

    const newStep = Math.max(1, currentStep - 1);
    setCurrentStep(newStep);

    const updated = {
      ...questionnaire,
      current_step: newStep,
      updated_at: new Date().toISOString(),
    };
    setQuestionnaire(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      supabase
        .from('questionnaires')
        .update({ current_step: newStep, updated_at: new Date().toISOString() })
        .eq('id', questionnaire.id)
        .then(
          () => {},
          (err) => {
            console.warn('Failed to update questionnaire step in database:', err);
          }
        );
    }
  }, [questionnaire, currentStep]);

  const goToStep = useCallback((targetStep: number) => {
    if (!questionnaire) return;

    const clamped = Math.min(Math.max(1, targetStep), STEPS.length);
    setCurrentStep(clamped);

    const updated = {
      ...questionnaire,
      current_step: clamped,
      updated_at: new Date().toISOString(),
    };
    setQuestionnaire(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      supabase
        .from('questionnaires')
        .update({ current_step: clamped, updated_at: new Date().toISOString() })
        .eq('id', questionnaire.id)
        .then(
          () => {},
          (err) => {
            console.warn('Failed to update questionnaire step in database:', err);
          }
        );
    }
  }, [questionnaire]);

  const completeQuestionnaire = useCallback(async () => {
    if (!questionnaire) return;

    localStorage.setItem(ANSWERS_KEY, JSON.stringify(serializeAnswers(answers)));

    const updated = {
      ...questionnaire,
      status: 'completed' as const,
      current_step: currentStep,
      updated_at: new Date().toISOString(),
    };
    setQuestionnaire(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const currentStepData = STEPS.find(s => s.id === currentStep);
    if (currentStepData) {
      saveAnswers(currentStepData.sectionId).catch((err) => {
        console.warn('Background save failed:', err);
      });
    }

    if (supabase) {
      supabase
        .from('questionnaires')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', questionnaire.id)
        .then(
          () => {},
          (err) => {
            console.warn('Failed to mark questionnaire complete in database:', err);
          }
        );
    }
  }, [questionnaire, currentStep, answers, saveAnswers]);

  const clearAllAnswers = useCallback(async () => {
    if (!questionnaire) return;

    setAnswers(new Map());
    setCurrentStep(1);

    const updated = {
      ...questionnaire,
      current_step: 1,
      updated_at: new Date().toISOString(),
    };
    setQuestionnaire(updated);

    localStorage.removeItem(ANSWERS_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    localStorage.removeItem('willprep_entities');
    localStorage.removeItem('willprep_entity_relationships');
    localStorage.removeItem('willprep_people');
    localStorage.removeItem('willprep_professional_advisors');
    localStorage.removeItem('willprep_document_locations');

    if (supabase) {
      Promise.all([
        supabase
          .from('questionnaire_answers')
          .delete()
          .eq('questionnaire_id', questionnaire.id),
        supabase
          .from('questionnaires')
          .update({ current_step: 1, updated_at: new Date().toISOString() })
          .eq('id', questionnaire.id),
        supabase
          .from('entities')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('questionnaire_id', questionnaire.id)
          .eq('active', true),
        supabase
          .from('entity_relationships')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('questionnaire_id', questionnaire.id)
          .eq('active', true),
        supabase
          .from('people')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('questionnaire_id', questionnaire.id)
          .eq('active', true),
        supabase
          .from('professional_advisors')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('questionnaire_id', questionnaire.id)
          .eq('active', true),
        supabase
          .from('document_locations')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('questionnaire_id', questionnaire.id)
          .eq('active', true),
      ]).then(
        () => {},
        (err) => {
          console.warn('Failed to clear answers in database:', err);
        }
      );
    }
  }, [questionnaire]);

  const clearCurrentStepAnswers = useCallback(async (sectionId: string, stepNumber: number) => {
    if (!questionnaire) return;

    const sectionsToClear = STEPS
      .filter(s => s.id >= stepNumber)
      .map(s => s.sectionId);

    setAnswers((prev) => {
      const updated = new Map(prev);
      for (const sid of sectionsToClear) {
        updated.delete(sid);
      }
      return updated;
    });

    const answersObj = serializeAnswers(answers);
    for (const sid of sectionsToClear) {
      delete answersObj[sid];
    }
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answersObj));

    if (supabase) {
      try {
        for (const sid of sectionsToClear) {
          await supabase
            .from('questionnaire_answers')
            .delete()
            .eq('questionnaire_id', questionnaire.id)
            .eq('section_id', sid);
        }
      } catch (dbErr) {
        console.warn('Failed to clear step answers in database:', dbErr);
      }
    }
  }, [questionnaire, answers]);

  return (
    <QuestionnaireContext.Provider
      value={{
        questionnaire,
        answers,
        currentStep,
        loading,
        error,
        initQuestionnaire,
        updateAnswer,
        saveAnswers,
        nextStep,
        previousStep,
        goToStep,
        completeQuestionnaire,
        clearAllAnswers,
        clearCurrentStepAnswers,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
  }
  return context;
}
