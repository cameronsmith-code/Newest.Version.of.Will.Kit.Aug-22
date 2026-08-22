import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { useDocumentLocations } from '../context/DocumentLocationContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { STEPS, Step } from '../lib/steps';
import StepForm from '../components/StepForm';
import ProgressBar from '../components/ProgressBar';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { hasClientShareOwnership } from '../lib/corporateOwnership';

export default function Wizard() {
  const navigate = useNavigate();

  const {
    questionnaire,
    answers,
    currentStep,
    loading,
    error,
    initQuestionnaire,
    updateAnswer,
    saveAnswers,
    goToStep,
    completeQuestionnaire,
    clearCurrentStepAnswers,
  } = useQuestionnaire();

  const isStepVisible = (step: Step) => {
    const basicAnswers = answers.get('aboutYou') || {};
    const client1HasPreviousRelationship = basicAnswers['client1HasPreviousRelationship'];
    const client2HasPreviousRelationship = basicAnswers['client2HasPreviousRelationship'];
    const hasChildren = basicAnswers['hasChildren'];

    if (step.sectionId === 'previousRelationships') {
      return client1HasPreviousRelationship === 'yes' || client2HasPreviousRelationship === 'yes';
    }
    if (step.sectionId === 'children') {
      return hasChildren === 'yes';
    }
    if (step.sectionId === 'corporateFinancialConnections') {
      return hasClientShareOwnership(answers);
    }
    return true;
  };

  useEffect(() => {
    initQuestionnaire();
  }, [initQuestionnaire]);

  const { initLocations } = useDocumentLocations();
  const { initPeople } = usePeopleRepository();
  const { initRegistry } = useEntityRegistry();
  useEffect(() => {
    if (questionnaire?.id) {
      initLocations(questionnaire.id);
      initPeople(questionnaire.id);
      initRegistry(questionnaire.id);
    }
  }, [questionnaire?.id, initLocations, initPeople, initRegistry]);

  useEffect(() => {
    if (!loading && currentStep > 1) {
      const stepData = STEPS.find(s => s.id === currentStep);
      if (stepData && !isStepVisible(stepData)) {
        const prevVisible = getPreviousVisibleStep(currentStep);
        const nextVisible = getNextVisibleStep(currentStep);
        if (prevVisible !== null) {
          goToStep(prevVisible);
        } else if (nextVisible !== null) {
          goToStep(nextVisible);
        }
      }
    }
  }, [currentStep, loading, goToStep]);

  if (!STEPS || STEPS.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Configuration Error</h2>
          <p className="text-red-200">The questionnaire steps could not be loaded. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const getNextVisibleStep = (fromStep: number): number | null => {
    for (let i = fromStep + 1; i <= STEPS.length; i++) {
      const step = STEPS.find(s => s.id === i);
      if (step && isStepVisible(step)) {
        return i;
      }
    }
    return null;
  };

  const getPreviousVisibleStep = (fromStep: number): number | null => {
    for (let i = fromStep - 1; i >= 1; i--) {
      const step = STEPS.find(s => s.id === i);
      if (step && isStepVisible(step)) {
        return i;
      }
    }
    return null;
  };

  const validCurrentStep = Math.min(Math.max(1, currentStep), STEPS.length);
  const currentStepData = STEPS.find((s) => s.id === validCurrentStep);
  const currentAnswers = currentStepData ? answers.get(currentStepData.sectionId) || {} : {};

  const handleNext = async () => {
    const nextVisible = getNextVisibleStep(validCurrentStep);

    if (nextVisible === null) {
      await completeQuestionnaire();
      navigate('/completion');
    } else {
      const currentStepData = STEPS.find(s => s.id === validCurrentStep);
      if (currentStepData) {
        await saveAnswers(currentStepData.sectionId);
      }
      goToStep(nextVisible);
    }
  };

  const handlePrevious = () => {
    const prevVisible = getPreviousVisibleStep(validCurrentStep);
    if (prevVisible !== null) {
      goToStep(prevVisible);
    }
  };

  // Disabled during Baseline V2 stabilization.
  // const handleClearAll = async () => {
  //   await clearAllAnswers();
  //   setShowClearConfirm(false);
  // };

  const handleTabClick = async (targetStepId: number) => {
    if (targetStepId === validCurrentStep) return;

    if (targetStepId > validCurrentStep) {
      const currentStepData = STEPS.find(s => s.id === validCurrentStep);
      if (currentStepData) {
        await saveAnswers(currentStepData.sectionId);
      }
    }
    goToStep(targetStepId);
  };

  if (loading && !questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Error</h2>
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => initQuestionnaire()}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
          <p className="text-yellow-200">Step not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Estate Planning Questionnaire</h1>
          </div>
          {/* Disabled during Baseline V2 stabilization */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
            title="Disabled during Baseline V2 stabilization"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Answers
          </button>
        </div>
        <p className="text-gray-400">
          Answer a few quick questions to generate your personalized fillable PDF.
        </p>
      </div>

      <ProgressBar
        currentStep={STEPS.filter(s => s.id <= validCurrentStep && isStepVisible(s)).length}
        totalSteps={STEPS.filter(s => isStepVisible(s)).length}
      />

      <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto">
          {STEPS.filter(step => isStepVisible(step)).map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleTabClick(step.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                step.id === validCurrentStep
                  ? 'bg-gray-700 text-white border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                <span className="whitespace-nowrap">{step.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <StepForm
        step={currentStepData}
        answers={currentAnswers}
        allAnswers={answers}
        isFirstStep={getPreviousVisibleStep(validCurrentStep) === null}
        isLastStep={getNextVisibleStep(validCurrentStep) === null}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAnswerChange={(key, value) => updateAnswer(currentStepData.sectionId, key, value)}
        onUpdateFootprint={(key, value) => updateAnswer('financialFootprint', key, value)}
        onClearCurrentStep={() => clearCurrentStepAnswers(currentStepData.sectionId, validCurrentStep)}
        currentStepNumber={validCurrentStep}
      />

      {questionnaire?.status === 'completed' && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-6">
          <p className="text-green-300 font-medium">
            Questionnaire completed! All your answers have been saved.
          </p>
        </div>
      )}


    </div>
  );
}
